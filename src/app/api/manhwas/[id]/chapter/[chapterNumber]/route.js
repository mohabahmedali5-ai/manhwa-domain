// src/workers/chapter.js
import { MongoClient, ObjectId } from "mongodb";
import { checkRateLimit, sanitizeInput, applySecurityHeaders } from "@/lib/security";
export const runtime = "edge";

// 🟣 إعداد MongoDB للـ Cloudflare Workers
let client;
async function getDB() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db(MONGODB_DB || "Manhwa-domain");
}

// 🔒 دالة لتطبيق رؤوس الأمان
function secureResponse(body, status = 200) {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

// --- GET: جلب فصل محدد ---
export async function handleGET(request, params) {
  try {
    const headers = new Headers();
    applySecurityHeaders(headers);
    headers.set("Content-Type", "application/json");

    const { id, chapterNumber } = params;

    // 🧹 تنظيف المدخلات
    const cleanId = sanitizeInput(id);
    const cleanChapter = sanitizeInput(chapterNumber);

    // 🛑 تحقق من معدل الطلبات
    const ip = request.headers.get("cf-connecting-ip") || "local";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return secureResponse({ error: "عدد الطلبات كبير جدًا، حاول لاحقًا." }, 429);
    }

    // ✅ تحقق من صحة معرف المانهوا
    if (!cleanId || !ObjectId.isValid(cleanId)) {
      return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);
    }

    // ✅ تحقق من رقم الفصل
    const chapterNum = parseInt(cleanChapter, 10);
    if (isNaN(chapterNum) || chapterNum <= 0) {
      return secureResponse({ error: "رقم الفصل غير صالح" }, 400);
    }

    // ✅ الاتصال بقاعدة البيانات
    const db = await getDB();
    const chaptersCollection = db.collection("chapters");

    // ✅ البحث عن الفصل المطلوب
    const chapter = await chaptersCollection.findOne(
      { manhwaId: new ObjectId(cleanId), number: chapterNum },
      { projection: { _id: 1, manhwaId: 1, number: 1, title: 1, pages: 1, createdAt: 1 } }
    );

    if (!chapter) return secureResponse({ error: "الفصل غير موجود" }, 404);

    // ✅ تجهيز البيانات للعرض
    const chapterData = {
      _id: chapter._id.toString(),
      manhwaId: chapter.manhwaId.toString(),
      number: chapter.number,
      title: chapter.title || `الفصل ${chapter.number}`,
      pages: Array.isArray(chapter.pages) ? chapter.pages : [],
      createdAt: chapter.createdAt || null,
    };

    return secureResponse(chapterData, 200);
  } catch (error) {
    console.error("❌ GET Chapter Error:", error);
    return secureResponse({ error: "حدث خطأ غير متوقع في الخادم." }, 500);
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // توقع: /manhwas/:id/chapter/:chapterNumber
    if (pathParts.length === 4 && pathParts[0] === "manhwas" && pathParts[2] === "chapter") {
      const params = { id: pathParts[1], chapterNumber: pathParts[3] };
      if (request.method.toUpperCase() === "GET") return handleGET(request, params);
    }

    return secureResponse({ error: "الطريقة أو الرابط غير مدعوم" }, 405);
  },
};
