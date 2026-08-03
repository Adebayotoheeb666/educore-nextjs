// Edge-compatible proxy for Next.js 16+ with Cloudflare
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	try {
		const { pathname } = request.nextUrl;
		if (pathname === "/undefined") {
			return new NextResponse("Not Found", { status: 404 });
		}
	} catch (err) {
		// ignore
	}

	// Default behavior: forward to next
	return NextResponse.next();
}

// Configuration for Edge runtime
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
