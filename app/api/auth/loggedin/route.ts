import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json(false);

  try {
    const payload = verifyToken(token);
    if (payload) return NextResponse.json(true);
  } catch {
    return NextResponse.json(false);
  }

  return NextResponse.json(false);
}
