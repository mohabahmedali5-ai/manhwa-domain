// 📂 src/app/api/latestChapters/[id]/route.js
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    // ✅ استخراج الـID من URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // آخر جزء من المسار

    if (!id || !ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: "معرّف المانهوا غير صالح" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db("mohab");

    const chapters = await db
      .collection("chapters")
      .find({ manhwaId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify(chapters), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("خطأ في latestChapters:", error);
    return new Response(
      JSON.stringify({ error: "فشل في جلب الفصول" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
