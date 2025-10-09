// src/workers/csp-report.js
import { checkRateLimit, applySecurityHeaders } from "@/lib/security";
export const runtime = "edge";

// 🔒 دالة لتطبيق رؤوس الأمان
function secureResponse(body, status = 200) {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

// --- POST: استقبال تقارير CSP ---
export async function handlePOST(req) {
  try {
    // 🛑 Rate Limiting
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return secureResponse({ success: false, error: "عدد الطلبات كبير جدًا" }, 429);
    }

    // ✅ قراءة التقرير
    const report = await req.json();
    console.log("🛡️ CSP Report:", report);

    return secureResponse({ success: true });
  } catch (error) {
    console.error("❌ CSP report error:", error);
    return secureResponse({ success: false }, 500);
  }
}

// --- Cloudflare Workers Entry ---
export default {
  async fetch(req) {
    if (req.method.toUpperCase() === "POST") {
      return handlePOST(req);
    }
    return secureResponse({ error: "الطريقة غير مدعومة" }, 405);
  },
};
