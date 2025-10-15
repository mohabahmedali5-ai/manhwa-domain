import { rateLimit } from "@/lib/rateLimit";

export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
