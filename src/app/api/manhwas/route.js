import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminAuth } from "@/lib/auth";

// ======== GET: جلب كل المانهوا أو واحدة + آخر فصلين (مفتوح للجميع) ========
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    if (id || slug) {
      let query = {};
      if (id) {
        if (!ObjectId.isValid(id))
          return new Response(JSON.stringify({ error: "معرف المانهوا غير صالح" }), { status: 400, headers: { "Content-Type": "application/json" } });
        query._id = new ObjectId(id);
      } else if (slug) {
        query.slug = slug;
      }

      const manhwa = await db.collection("Manhwas").findOne(query);
      if (!manhwa)
        return new Response(JSON.stringify({ error: "لم يتم العثور على المانهوا" }), { status: 404, headers: { "Content-Type": "application/json" } });

      const chapters = await db.collection("chapters").find({ manhwaId: manhwa._id }).sort({ number: -1 }).limit(2).toArray();
      return new Response(JSON.stringify({ ...manhwa, chapters }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const manhwas = await db.collection("Manhwas").find({}).toArray();
    const manhwasWithChapters = await Promise.all(
      manhwas.map(async (m) => {
        const chapters = await db.collection("chapters").find({ manhwaId: new ObjectId(m._id) }).sort({ number: -1 }).limit(2).toArray();
        return { ...m, chapters };
      })
    );

    return new Response(JSON.stringify(manhwasWithChapters), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error fetching manhwas:", error);
    return new Response(JSON.stringify({ error: "حدث خطأ في جلب المانهوا" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// ======== POST: إضافة مانهوا جديدة (محمي) ========
export async function POST(req) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError?.error)
      return new Response(JSON.stringify(authError.error), { status: authError.error.status, headers: { "Content-Type": "application/json" } });

    const body = await req.json();
    if (!body.slug && body.title) body.slug = body.title.trim().toLowerCase().replace(/\s+/g, "-");

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");
    const result = await db.collection("Manhwas").insertOne(body);

    return new Response(JSON.stringify({ message: "تم إضافة المانهوا بنجاح", id: result.insertedId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error adding manhwa:", error);
    return new Response(JSON.stringify({ error: "حدث خطأ في إضافة المانهوا" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// ======== PUT: تعديل مانهوا (محمي) ========
export async function PUT(req) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError?.error)
      return new Response(JSON.stringify(authError.error), { status: authError.error.status, headers: { "Content-Type": "application/json" } });

    const body = await req.json();
    const { id, slug, ...updateData } = body;

    if (!id && !slug)
      return new Response(JSON.stringify({ error: "يجب تحديد _id أو slug للمانهوا" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    let query = {};
    if (id) {
      if (!ObjectId.isValid(id))
        return new Response(JSON.stringify({ error: "معرف المانهوا غير صالح" }), { status: 400, headers: { "Content-Type": "application/json" } });
      query._id = new ObjectId(id);
    } else {
      query.slug = slug;
    }

    if (!updateData.slug && updateData.title) updateData.slug = updateData.title.trim().toLowerCase().replace(/\s+/g, "-");

    const result = await db.collection("Manhwas").updateOne(query, { $set: updateData });
    if (result.matchedCount === 0)
      return new Response(JSON.stringify({ error: "لم يتم العثور على المانهوا" }), { status: 404, headers: { "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ message: "تم تعديل المانهوا بنجاح" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error updating manhwa:", error);
    return new Response(JSON.stringify({ error: "حدث خطأ في تعديل المانهوا" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// ======== DELETE: حذف مانهوا + فصولها (محمي) ========
export async function DELETE(req) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError?.error)
      return new Response(JSON.stringify(authError.error), { status: authError.error.status, headers: { "Content-Type": "application/json" } });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug)
      return new Response(JSON.stringify({ error: "يجب تحديد _id أو slug للمانهوا" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    let query = {};
    if (id) {
      if (!ObjectId.isValid(id))
        return new Response(JSON.stringify({ error: "معرف المانهوا غير صالح" }), { status: 400, headers: { "Content-Type": "application/json" } });
      query._id = new ObjectId(id);
    } else {
      query.slug = slug;
    }

    const manhwaToDelete = await db.collection("Manhwas").findOne(query);
    if (!manhwaToDelete)
      return new Response(JSON.stringify({ error: "لم يتم العثور على المانهوا" }), { status: 404, headers: { "Content-Type": "application/json" } });

    await db.collection("Manhwas").deleteOne({ _id: manhwaToDelete._id });
    await db.collection("chapters").deleteMany({ manhwaId: manhwaToDelete._id });

    return new Response(JSON.stringify({ message: "تم حذف المانهوا والفصول المرتبطة" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error deleting manhwa:", error);
    return new Response(JSON.stringify({ error: "حدث خطأ في الخادم" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
