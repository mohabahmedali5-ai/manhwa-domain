import { getSessionFromRequest } from "@/lib/session.js";
import { applySecurityHeaders, checkRateLimit } from "@/lib/security.js";

export const runtime = "edge"; // ✅ لتشغيله على Cloudflare Workers

export async function GET(req) {
  const headers = new Headers();
  applySecurityHeaders(headers);

  try {
    // 🛡️ حماية من السبام / الدوس
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip).limited) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

    // 🛡️ جلب السيشن من الريكوست
    const session = await getSessionFromRequest(req);

    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers });
    }

    // ✅ تجديد الكوكي إذا موجود
    if (session._renewedCookie) {
      headers.set("Set-Cookie", session._renewedCookie);
    }

    // ✅ إعادة بيانات المصادقة والسي اس ار إف
    return new Response(
      JSON.stringify({ authenticated: true, csrfToken: session.csrfToken }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("❌ Error in auth session GET:", err);
    return new Response(
      JSON.stringify({ authenticated: false, error: "Server error" }),
      { status: 500, headers }
    );
  }
}
