// src/workers/manhwas.js
import { MongoClient, ObjectId } from "mongodb";
import { requireAdminAuth } from "@/lib/auth";
import { checkRateLimit, sanitizeInput, applySecurityHeaders } from "@/lib/security";
export const runtime = "nodejs";

// 🟣 إعداد MongoDB للـ Cloudflare Workers
let client;
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db(process.env.MONGODB_DB || "Manhwa-domain");
}

// 🔒 دالة لتطبيق رؤوس الأمان
function secureResponse(body, status = 200) {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

// --- GET ---
export async function handleGET(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const db = await getDB();

    if (id) {
      if (!ObjectId.isValid(id)) return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

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
    console.error("GET Error:", error);
    return secureResponse({ error: "حدث خطأ في جلب المانهوا" }, 500);
  }
}

// --- POST ---
export async function handlePOST(req) {
  const ip = req.headers.get("cf-connecting-ip") || "local";
  if (checkRateLimit(ip).limited) return secureResponse({ error: "عدد الطلبات كبير جدًا" }, 429);

  try {
    const authRes = await requireAdminAuth(req);
    if (authRes) return authRes;

    const body = sanitizeInput(await req.json());

    const db = await getDB();
    const result = await db.collection("Manhwas").insertOne(body);

    return secureResponse({ message: "تم إضافة المانهوا بنجاح", id: result.insertedId });
  } catch (error) {
    console.error("POST Error:", error);
    return secureResponse({ error: "حدث خطأ في إضافة المانهوا" }, 500);
  }
}

// --- PUT ---
export async function handlePUT(req) {
  const ip = req.headers.get("cf-connecting-ip") || "local";
  if (checkRateLimit(ip).limited) return secureResponse({ error: "عدد الطلبات كبير جدًا" }, 429);

  try {
    const authRes = await requireAdminAuth(req);
    if (authRes) return authRes;

    const body = sanitizeInput(await req.json());
    const { id, ...updateData } = body;

    if (!id || !ObjectId.isValid(id)) return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

    const db = await getDB();
    const result = await db
      .collection("Manhwas")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) return secureResponse({ error: "لم يتم العثور على المانهوا" }, 404);

    return secureResponse({ message: "تم تعديل المانهوا بنجاح" });
  } catch (error) {
    console.error("PUT Error:", error);
    return secureResponse({ error: "حدث خطأ في تعديل المانهوا" }, 500);
  }
}

// --- DELETE ---
export async function handleDELETE(req) {
  const ip = req.headers.get("cf-connecting-ip") || "local";
  if (checkRateLimit(ip).limited) return secureResponse({ error: "عدد الطلبات كبير جدًا" }, 429);

  try {
    const authRes = await requireAdminAuth(req);
    if (authRes) return authRes;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) return secureResponse({ error: "معرف المانهوا غير صالح" }, 400);

    const db = await getDB();
    const result = await db.collection("Manhwas").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return secureResponse({ error: "لم يتم العثور على المانهوا" }, 404);

    await db.collection("chapters").deleteMany({ manhwaId: new ObjectId(id) });

    return secureResponse({ message: "تم حذف المانهوا والفصول المرتبطة" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return secureResponse({ error: "حدث خطأ في الخادم" }, 500);
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(req) {
    const method = req.method.toUpperCase();
    switch (method) {
      case "GET":
        return handleGET(req);
      case "POST":
        return handlePOST(req);
      case "PUT":
        return handlePUT(req);
      case "DELETE":
        return handleDELETE(req);
      default:
        return secureResponse({ error: "الطريقة غير مدعومة" }, 405);
    }
  },
};
