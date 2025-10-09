import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { applySecurityHeaders } from "@/lib/security";
export const runtime = "nodejs";


// دالة مساعدة لإضافة رؤوس الأمان وتهيئة Response
function secureResponse(body, status = 200) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  applySecurityHeaders(headers);
  return new Response(JSON.stringify(body), { status, headers });
}

// ===== GET =====
export async function GET(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip)) return secureResponse({ error: "Too many requests" }, 429);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    if (id) {
      if (!ObjectId.isValid(id))
        return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

      const manhwa = await db.collection("Manhwas").findOne({ _id: new ObjectId(id) });
      if (!manhwa) return secureResponse({ error: "لم يتم العثور على المانهوا" }, 404);

      const chapters = await db
        .collection("chapters")
        .find({ manhwaId: new ObjectId(id) })
        .sort({ number: -1 })
        .limit(2)
        .toArray();

      return secureResponse({ ...manhwa, chapters });
    }

    const manhwas = await db.collection("Manhwas").find({}).toArray();
    const manhwasWithChapters = await Promise.all(
      manhwas.map(async (m) => {
        const chapters = await db
          .collection("chapters")
          .find({ manhwaId: new ObjectId(m._id) })
          .sort({ number: -1 })
          .limit(2)
          .toArray();
        return { ...m, chapters };
      })
    );

    return secureResponse(manhwasWithChapters);
  } catch (error) {
    console.error("Error fetching manhwas:", error);
    return secureResponse({ error: "حدث خطأ في جلب المانهوا" }, 500);
  }
}

// ===== POST =====
export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip)) return secureResponse({ error: "Too many requests" }, 429);

    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const body = await req.json();
    if (!body.title) return secureResponse({ error: "يجب إدخال عنوان المانهوا" }, 400);

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    const result = await db.collection("Manhwas").insertOne(body);
    return secureResponse({ message: "تم إضافة المانهوا بنجاح", id: result.insertedId });
  } catch (error) {
    console.error("Error adding manhwa:", error);
    return secureResponse({ error: "حدث خطأ في إضافة المانهوا" }, 500);
  }
}

// ===== PUT =====
export async function PUT(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip)) return secureResponse({ error: "Too many requests" }, 429);

    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id || !ObjectId.isValid(id)) return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    const result = await db
      .collection("Manhwas")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) return secureResponse({ error: "لم يتم العثور على المانهوا" }, 404);

    return secureResponse({ message: "تم تعديل المانهوا بنجاح" });
  } catch (error) {
    console.error("Error updating manhwa:", error);
    return secureResponse({ error: "حدث خطأ في تعديل المانهوا" }, 500);
  }
}

// ===== DELETE =====
export async function DELETE(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip)) return secureResponse({ error: "Too many requests" }, 429);

    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

    const client = await clientPromise;
    const db = client.db("Manhwa-domain");

    const result = await db.collection("Manhwas").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return secureResponse({ error: "لم يتم العثور على المانهوا" }, 404);

    await db.collection("chapters").deleteMany({ manhwaId: new ObjectId(id) });

    return secureResponse({ message: "تم حذف المانهوا والفصول المرتبطة" });
  } catch (error) {
    console.error("Error deleting manhwa:", error);
    return secureResponse({ error: "حدث خطأ في الخادم" }, 500);
  }
}
