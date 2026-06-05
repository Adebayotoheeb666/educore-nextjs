// Minimal valid proxy for Next.js 16+ migration
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	try {
		const { pathname } = request.nextUrl;
		if (pathname === "/undefined") {
			console.log("[proxy] /undefined request detected", {
				referer: request.headers.get("referer"),
				"user-agent": request.headers.get("user-agent"),
				accept: request.headers.get("accept"),
			});
			return new NextResponse("Not Found", { status: 404 });
		}
	} catch (err) {
		// ignore
	}

	// Default behavior: forward to next
	return NextResponse.next();
}
