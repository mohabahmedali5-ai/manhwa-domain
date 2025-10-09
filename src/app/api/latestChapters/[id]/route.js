import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { checkRateLimit, sanitizeInput, applySecurityHeaders } from "@/lib/security";
export const runtime = "edge";


function secureResponse(body, status = 200) {
  const headers = new Headers({ "Content-Type": "application/json" });
  applySecurityHeaders(headers);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function GET(req) {
  try {
    // 🧱 حماية من السبام / الدوس
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) return secureResponse({ error: "عدد الطلبات كبير جدًا، حاول لاحقًا." }, 429);

    // ✅ استخراج الـID من URL وتنظيفه
    const url = new URL(req.url);
    const rawId = url.pathname.split("/").pop();
    const id = sanitizeInput(rawId);

    // ✅ التحقق من المعرف
    if (!id || !ObjectId.isValid(id)) return secureResponse({ error: "معرّف المانهوا غير صالح" }, 400);

    // ✅ الاتصال بقاعدة البيانات
    const client = await clientPromise;
    const db = client.db("mohab");

    // ✅ جلب الفصول الأحدث
    const chapters = await db
      .collection("chapters")
      .find({ manhwaId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .project({
        _id: 1,
        manhwaId: 1,
        number: 1,
        title: 1,
        createdAt: 1,
      })
      .toArray();

    return secureResponse(chapters);
  } catch (error) {
    console.error("❌ خطأ في /api/latestChapters/[id]:", error);
    return secureResponse({ error: "فشل في جلب الفصول" }, 500);
  }
}
