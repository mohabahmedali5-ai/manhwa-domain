/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'], // عدلها لو بتستخدم دومين تاني للصور
  },
  eslint: {
    ignoreDuringBuilds: true, // يمنع فشل الـ build بسبب ESLint
  },
  // 👇 خليها فاضية.. متضيفش output: "export"
};

export default nextConfig;
