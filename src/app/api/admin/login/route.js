import { createSession, destroySessionCookie } from "@/lib/session.js";
import { applySecurityHeaders } from "@/lib/security.js";
import { logSecurityEvent } from "@/lib/logger.js";

export async function POST(request) {
  try {
    const headers = new Headers();
    applySecurityHeaders(headers);

    const { password } = await request.json();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!password || password !== ADMIN_PASSWORD) {
      logSecurityEvent("failed_admin_login", { ip: request.headers.get("x-forwarded-for") || "local" });
      return new Response(JSON.stringify({ success: false, message: "كلمة السر غير صحيحة" }), { status: 401, headers });
    }

    const { cookie, session } = createSession({ role: "admin" });
    headers.set("Set-Cookie", cookie);

    return new Response(JSON.stringify({ success: true, csrfToken: session.csrfToken }), { status: 200, headers });
  } catch (err) {
    console.error("Error in admin login:", err);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function DELETE(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) {
      const sid = match[1];
      import("@/lib/session.js").then(mod => mod.SESSIONS.delete(sid)).catch(()=>{});
    }
    const headers = new Headers();
    headers.set("Set-Cookie", destroySessionCookie());
    applySecurityHeaders(headers);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
