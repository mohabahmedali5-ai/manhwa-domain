// src/workers/admin-login.js
export const runtime = "nodejs";
import { createSession, destroySessionCookie, SESSIONS } from "@/lib/session.js";
import { checkRateLimit, applySecurityHeaders } from "@/lib/security.js";
import { logSecurityEvent } from "@/lib/logger.js";

// 🔒 دالة لتطبيق رؤوس الأمان
function secureResponse(body, status = 200, extraHeaders = {}) {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");
  for (const key in extraHeaders) {
    headers.set(key, extraHeaders[key]);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

// --- POST: Admin Login ---
export async function handlePOST(req) {
  try {
    // 🛑 Rate Limiting
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return secureResponse({ success: false, message: "عدد الطلبات كبير جدًا" }, 429);
    }

    const { password } = await req.json();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!password || password !== ADMIN_PASSWORD) {
      logSecurityEvent("failed_admin_login", { ip });
      return secureResponse({ success: false, message: "كلمة السر غير صحيحة" }, 401);
    }

    // 🟢 إنشاء جلسة جديدة للأدمن
    const { cookie, session } = createSession({ role: "admin" });
    return secureResponse({ success: true, csrfToken: session.csrfToken }, 200, {
      "Set-Cookie": cookie,
    });
  } catch (err) {
    console.error("❌ Error in admin login:", err);
    return secureResponse({ success: false, message: "Server error" }, 500);
  }
}

// --- DELETE: Admin Logout ---
export async function handleDELETE(req) {
  try {
    // 🛑 Rate Limiting
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return secureResponse({ success: false, message: "عدد الطلبات كبير جدًا" }, 429);
    }

    // 🧹 حذف الكوكي الخاص بالجلسة
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) {
      const sid = match[1];
      SESSIONS.delete(sid);
    }

    return secureResponse({ success: true }, 200, {
      "Set-Cookie": destroySessionCookie(),
    });
  } catch (err) {
    console.error("❌ Error in admin logout:", err);
    return secureResponse({ success: false }, 500);
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(req) {
    const method = req.method.toUpperCase();
    if (method === "POST") return handlePOST(req);
    if (method === "DELETE") return handleDELETE(req);
    return secureResponse({ error: "الطريقة غير مدعومة" }, 405);
  },
};
