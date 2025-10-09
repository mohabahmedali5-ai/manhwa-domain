// app/api/admin/login/route.js
import { verifyAdminPassword } from "../../../../lib/auth.js";
import { setSessionHeader, readSessionFromRequest } from "../../../../lib/session.js";
import { issueCsrf } from "../../../../lib/csrf.js";
import { logSecurity } from "../../../../lib/logger.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const ok = await verifyAdminPassword(body.password || "");
    if (!ok) {
      logSecurity("admin_login_failed", { ip: request.headers.get("x-forwarded-for") || request.ip });
      return new Response(JSON.stringify({ success: false }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // set session cookie header
    const setCookieHeader = setSessionHeader({}, { role: "admin" }); // returns { "Set-Cookie": ... }
    const sess = readSessionFromRequest(request);
    const csrfToken = issueCsrf(String(sess?.iat || "sid"));

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.set("Set-Cookie", setCookieHeader["Set-Cookie"]);

    return new Response(JSON.stringify({ success: true, csrfToken }), { status: 200, headers });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "login_failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
