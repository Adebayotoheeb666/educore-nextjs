import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Check cookie first, then Authorization header
  let token = req.cookies.get("token")?.value;

  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return NextResponse.json({ data: false });

  try {
    const payload = verifyToken(token);
    if (payload) return NextResponse.json({ data: true });
  } catch {
    return NextResponse.json({ data: false });
  }

  return NextResponse.json({ data: false });
}
