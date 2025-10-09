// src/workers/protected.js
import { requireAdminAuth } from "@/lib/auth.js";
import { checkRateLimit, applySecurityHeaders } from "@/lib/security.js";
export const runtime = "edge"; // ✅ لتشغيله على Cloudflare Workers

// 🔒 دالة لتطبيق رؤوس الأمان
function secureResponse(body, status = 200) {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

// --- GET: Protected data ---
export async function handleGET(req) {
  try {
    // 🛑 Rate Limiting
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return secureResponse({ error: "عدد الطلبات كبير جدًا" }, 429);
    }

    // 🛡️ حماية الأدمين
    const authError = await requireAdminAuth(req);
    if (authError) return authError; // Response جاهز من الدالة

    return secureResponse({ message: "Protected data" });
  } catch (err) {
    console.error("❌ Error in protected GET:", err);
    return secureResponse({ error: "Server error" }, 500);
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(req) {
    if (req.method.toUpperCase() === "GET") return handleGET(req);
    return secureResponse({ error: "الطريقة غير مدعومة" }, 405);
  },
};
