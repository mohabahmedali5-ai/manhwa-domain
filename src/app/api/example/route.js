import helmet from "helmet";

export default async function handler(req, res) {
  // إعداد Helmet بكامل الحمايات
  await new Promise((resolve) => {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // السماح فقط بالمصادر من نفس الدومين
          scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-scripts.com"], // السماح بسكربتات محددة
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.trusted.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"], // منع أي ميديا خارجية مثل Flash
          upgradeInsecureRequests: [], // ترقية الروابط http إلى https تلقائيًا
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // التحكم في إرسال Referrer
      frameguard: { action: "deny" }, // منع Clickjacking
      xssFilter: true, // فلترة XSS (مدعوم للمتصفحات القديمة)
      noSniff: true, // منع MIME sniffing
      dnsPrefetchControl: { allow: false }, // تعطيل DNS prefetch
      hsts: {
        maxAge: 31536000, // سنة كاملة
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      hidePoweredBy: true, // إخفاء X-Powered-By
      expectCt: {
        maxAge: 86400,
        enforce: true,
      },
    })(req, res, resolve);
  });

  res.status(200).json({ message: "Helmet security fully active ✅" });
}
