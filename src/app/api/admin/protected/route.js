import { requireAdminAuth } from "@/lib/auth";

export async function GET(req) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  return new Response(JSON.stringify({ message: "Protected data" }), { status: 200 });
}
