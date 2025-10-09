import { rateLimit } from "@/lib/rateLimit";
import { applySecurityHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // التحقق من الحد الأقصى للطلبات
  if (!rateLimit(ip)) {
    const headers = new Headers();
    applySecurityHeaders(headers);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers,
    });
  }

  // الرد الطبيعي
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
