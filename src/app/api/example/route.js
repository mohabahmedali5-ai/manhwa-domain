import { checkRateLimit, applySecurityHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(req) {
  // 🧱 إعداد الهيدرز الأمنية
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  applySecurityHeaders(headers);

  try {
    // 🛡️ حماية من السبام / الدوس
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { limited } = checkRateLimit(ip);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "عدد الطلبات كبير جدًا، حاول لاحقًا." }),
        { status: 429, headers }
      );
    }

    // ✅ إضافة سياسات أمان شاملة (Helmet-style)
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://api.trusted.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; upgrade-insecure-requests;"
    );
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-DNS-Prefetch-Control", "off");
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set("Expect-CT", "max-age=86400, enforce");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

    return new Response(
      JSON.stringify({ message: "Helmet-style security fully active ✅" }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("❌ خطأ في /api/security:", error);
    return new Response(
      JSON.stringify({ error: "فشل في تطبيق السياسات الأمنية" }),
      { status: 500, headers }
    );
  }
}
