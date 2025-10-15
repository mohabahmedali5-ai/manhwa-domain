import { getSessionFromRequest } from "@/lib/session.js";
import { applySecurityHeaders } from "@/lib/security.js";

export async function GET(req) {
  const headers = new Headers();
  applySecurityHeaders(headers);

  const session = getSessionFromRequest(req);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers });
  }

  if (session._renewedCookie) {
    headers.set("Set-Cookie", session._renewedCookie);
  }

  return new Response(JSON.stringify({ authenticated: true, csrfToken: session.csrfToken }), { status: 200, headers });
}
