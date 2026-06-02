import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/utils/cookies";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ message: "Successfully Logged Out" });
  return clearAuthCookie(response);
}
