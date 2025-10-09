// src/workers/images.js
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
function secureHeaders(headers) {
  applySecurityHeaders(headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGINS || "http://localhost:3000"
  );
}

// --- GET: جلب صورة حسب ID ---
export async function handleGET(request, params) {
  try {
    const headers = new Headers();
    secureHeaders(headers);

    // 🛑 Rate Limiting
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return new Response("Too many requests, slow down.", { status: 429, headers });
    }

    // 🧹 تنظيف معرف الصورة
    const id = sanitizeInput(params.id);
    if (!id || !ObjectId.isValid(id)) {
      return new Response("Invalid image ID", { status: 400, headers });
    }

    // 🗄️ الاتصال بقاعدة البيانات
    const db = await getDB();
    const image = await db.collection("Images").findOne({ _id: new ObjectId(id) });

    if (!image || !image.data) {
      return new Response("Image not found", { status: 404, headers });
    }

    // 🧾 إعداد الهيدرز النهائية
    headers.set("Content-Type", image.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // ✅ إرسال الصورة بشكل آمن
    return new Response(image.data.buffer, { status: 200, headers });
  } catch (error) {
    console.error("❌ GET Image Error:", error);
    const headers = new Headers();
    secureHeaders(headers);
    return new Response("Internal Server Error", { status: 500, headers });
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // توقع: /images/:id
    if (pathParts.length === 2 && pathParts[0] === "images") {
      const params = { id: pathParts[1] };
      if (request.method.toUpperCase() === "GET") return handleGET(request, params);
    }

    return new Response("Method or path not supported", { status: 405 });
  },
};
