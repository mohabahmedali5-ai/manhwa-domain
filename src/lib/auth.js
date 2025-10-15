import { getSessionFromRequest } from "./session.js";
import { logSecurityEvent } from "./logger.js";

/**
 * requireAdminAuth(req)
 * - لو مش أدمين يرجع Response 401
 * - لو صح يرجع null
 */
export async function requireAdminAuth(req) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    logSecurityEvent("unauthorized_admin_access", {
      ip: req.headers.get("x-forwarded-for") || "local",
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/**
 * verifyCsrf(req, token)
 * - يشيك إن التوكن اللي جاي من الفورم نفس اللي في السيشن
 */
export function verifyCsrf(req, token) {
  const session = getSessionFromRequest(req);
  if (!session) return false;
  return !!token && token === session.csrfToken;
}
