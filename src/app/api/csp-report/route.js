export async function POST(req) {
  try {
    const report = await req.json();
    console.log("🛡️ CSP Report:", report);
    return Response.json({ success: true });
  } catch (error) {
    console.error("CSP report error:", error);
    return Response.json({ success: false });
  }
}
