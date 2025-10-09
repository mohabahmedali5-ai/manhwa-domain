// src/lib/auth.js
import { getSessionFromRequest } from "./session.js";
import { logSecurityEvent } from "./logger.js";

/**
 * requireAdminAuth(req)
 * - يتحقق إن المستخدم أدمين
 * - يرجع Response 401 لو غير ذلك
 */
export async function requireAdminAuth(req) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session || session.role !== "admin") {
      logSecurityEvent("unauthorized_admin_access", {
        ip: req.headers.get("x-forwarded-for") || "local",
      });

      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return null;
  } catch (err) {
    console.error("Auth error:", err);
    return new Response(
      JSON.stringify({ error: "Auth processing failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * verifyCsrf(req, token)
 * - يتحقق إن التوكن المرسل يطابق الموجود في السيشن
 */
export function verifyCsrf(req, token) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return false;
    return !!token && token === session.csrfToken;
  } catch {
    return false;
  }
}
