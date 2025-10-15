// app/images/[id]/route.js
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const LIMIT = 100;
const WINDOW = 60 * 1000;
const requestCounts = new Map();

export async function GET(req, { params }) {
  try {
    // 🛡️ Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    if (!requestCounts.has(ip)) requestCounts.set(ip, []);
    const timestamps = requestCounts.get(ip).filter((ts) => now - ts < WINDOW);
    timestamps.push(now);
    requestCounts.set(ip, timestamps);
    if (timestamps.length > LIMIT) {
      return new Response("Too many requests, slow down.", { status: 429 });
    }

    // 🗄️ الاتصال بقاعدة البيانات
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 📥 استرجاع الصورة من MongoDB كـ Binary
    const image = await db
      .collection("Images")
      .findOne({ _id: new ObjectId(params.id) });

    if (!image || !image.data) {
      return new Response("Image not found", { status: 404 });
    }

    return new Response(image.data.buffer, {
      status: 200,
      headers: {
        "Content-Type": image.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Access-Control-Allow-Origin":
          process.env.ALLOWED_ORIGINS || "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("❌ Error in binary image route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
