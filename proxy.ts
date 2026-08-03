// Edge-compatible proxy for Next.js 16+ with Cloudflare
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	// Default behavior: forward to next
	return NextResponse.next();
}
