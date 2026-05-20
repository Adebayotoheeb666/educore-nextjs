// Minimal valid proxy for Next.js 16+ migration
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	// Example: allow all requests (customize as needed)
	return NextResponse.next();
}
