import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminAuth, verifyCsrf } from "@/lib/auth.js";
import { checkRateLimit, sanitizeInput, applySecurityHeaders } from "@/lib/security.js";

export const runtime = "edge"; // ✅ لتشغيله على Cloudflare Workers

// 🔒 دالة مساعدة لإضافة هيدرز الأمان لكل الردود
function secureHeaders() {
  const headers = new Headers();
  applySecurityHeaders(headers);
  return headers;
}

// --- GET ---
export async function GET(req) {
  const headers = secureHeaders();

  try {
    const url = new URL(req.url);
    const manhwaId = sanitizeInput(url.searchParams.get("manhwaId"));

    if (!manhwaId || !ObjectId.isValid(manhwaId)) {
      return new Response(JSON.stringify({ error: "Invalid manhwaId" }), {
        status: 400,
        headers,
      });
    }

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip).limited) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Manhwa-domain");

    const chapters = await db
      .collection("chapters")
      .find({ manhwaId: new ObjectId(manhwaId) })
      .sort({ number: 1 })
      .toArray();

    return new Response(JSON.stringify(chapters), { status: 200, headers });
  } catch (err) {
    console.error("❌ Error fetching chapters:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers });
  }
}

// --- POST ---
export async function POST(req) {
  const headers = secureHeaders();

  try {
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip).limited) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

    const authErr = await requireAdminAuth(req);
    if (authErr) return authErr;

    const token = req.headers.get("x-csrf-token");
    if (!verifyCsrf(req, token)) {
      return new Response(JSON.stringify({ error: "Invalid CSRF" }), { status: 403, headers });
    }

    const body = sanitizeInput(await req.json());
    const { manhwaId, number, title, pages } = body;

    if (!manhwaId || !number || !Array.isArray(pages) || pages.length === 0 || !ObjectId.isValid(manhwaId)) {
      return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400, headers });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Manhwa-domain");

    await db.collection("chapters").updateOne(
      { manhwaId: new ObjectId(manhwaId), number: Number(number) },
      { $set: { title: title || "", pages } },
      { upsert: true }
    );

    return new Response(JSON.stringify({ message: "saved" }), { status: 200, headers });
  } catch (err) {
    console.error("❌ Error saving chapter:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers });
  }
}

// --- DELETE ---
export async function DELETE(req) {
  const headers = secureHeaders();

  try {
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip).limited) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

    const authErr = await requireAdminAuth(req);
    if (authErr) return authErr;

    const token = req.headers.get("x-csrf-token");
    if (!verifyCsrf(req, token)) {
      return new Response(JSON.stringify({ error: "Invalid CSRF" }), { status: 403, headers });
    }

    const url = new URL(req.url);
    const manhwaId = sanitizeInput(url.searchParams.get("manhwaId"));
    const number = parseInt(url.searchParams.get("number"), 10);

    if (!manhwaId || !ObjectId.isValid(manhwaId) || isNaN(number)) {
      return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400, headers });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Manhwa-domain");

    const result = await db.collection("chapters").deleteOne({ manhwaId: new ObjectId(manhwaId), number });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ message: "deleted" }), { status: 200, headers });
  } catch (err) {
    console.error("❌ Error deleting chapter:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers });
  }
}
