import { destroySessionCookie } from "@/lib/session.js";
import { applySecurityHeaders, checkRateLimit } from "@/lib/security.js";

export const runtime = "edge"; // ✅ لتشغيله على Cloudflare Workers

export async function POST(req) {
  const headers = new Headers();
  applySecurityHeaders(headers);

  try {
    // 🛡️ حماية من السبام / الدوس
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip).limited) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

    // ✅ مسح كوكي السيشن
    headers.set("Set-Cookie", destroySessionCookie());

    return new Response(
      JSON.stringify({ success: true, message: "Logged out" }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("❌ Error in logout POST:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500, headers }
    );
  }
}
