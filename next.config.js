/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡️ ضغط الملفات تلقائيًا gzip + brotli
  compress: true,

  // ⚙️ تصغير الأكواد تلقائيًا
  swcMinify: true,

  // 🖼️ دعم صيغ الصور الحديثة + تحسين lazy loading + زيادة مدة الكاش
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    minimumCacheTTL: 60, // 🕒 تحسين سرعة الصور بالكاش التلقائي
  },

  experimental: {
    legacyBrowsers: false,
    browsersListForSwc: true,
    optimizeCss: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 🔹 منع sniffing نوع المحتوى
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // 🔹 منع الصفحة من الظهور داخل iframe
          { key: 'X-Frame-Options', value: 'DENY' },
          // 🔹 سياسة Referrer
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // 🔹 حماية ضد XSS
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // 🔹 سياسة Cache صارمة للملفات الحساسة
          { key: 'Cache-Control', value: 'no-store' },
          // ⚡️ تحسين الاتصال المبكر مع المصادر الخارجية (Preconnect)
          { key: 'Link', value: '<https://s.pemsrv.com>; rel=preconnect' },
          { key: 'Link', value: '<https://io.lekmanga.net>; rel=preconnect' },
          { key: 'Link', value: '<https://ep1.adtrafficquality.google>; rel=preconnect' },
        ],
      },

      // ⚙️ كاش قوي للملفات الثابتة
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // 🖼️ كاش للصور (أسبوع واحد)
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|gif|svg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
