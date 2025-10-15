import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ✅ GET: جلب فصل معين من مانهوا معينة
export async function GET(request, context) {
  try {
    // ✅ await لأن params بقت Promise في Next.js 15
    const { id, chapterNumber } = await context.params;

    // ✅ التحقق من صحة معرف المانهوا
    if (!id || !ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: "معرف المانهوا غير صالح" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ التحقق من صحة رقم الفصل
    const chapterNum = parseInt(chapterNumber, 10);
    if (isNaN(chapterNum) || chapterNum <= 0) {
      return new Response(
        JSON.stringify({ error: "رقم الفصل غير صالح" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ الاتصال بقاعدة البيانات
    const client = await clientPromise;
    const db = client.db("Manhwa-domain");
    const chaptersCollection = db.collection("chapters");

    // ✅ البحث عن الفصل المطلوب
    const chapter = await chaptersCollection.findOne(
      { manhwaId: new ObjectId(id), number: chapterNum },
      {
        projection: {
          _id: 1,
          manhwaId: 1,
          number: 1,
          title: 1,
          pages: 1,
          createdAt: 1,
        },
      }
    );

    // ✅ لو الفصل مش موجود
    if (!chapter) {
      return new Response(
        JSON.stringify({ error: "الفصل غير موجود" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ تجهيز البيانات للعرض
    const chapterData = {
      _id: chapter._id.toString(),
      manhwaId: chapter.manhwaId.toString(),
      number: chapter.number,
      title: chapter.title || `الفصل ${chapter.number}`,
      pages: Array.isArray(chapter.pages) ? chapter.pages : [],
      createdAt: chapter.createdAt || null,
    };

    // ✅ الإرجاع النهائي
    return new Response(JSON.stringify(chapterData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ خطأ في GET /api/manhwas/[id]/chapter/[chapterNumber]:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ في الخادم" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
