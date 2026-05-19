import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
];

function getAllowedOrigins(): Set<string> {
  const env = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...env]);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
  };
}

export function middleware(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    if (!origin || allowedOrigins.has(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin || "*"),
      });
    }
    return new NextResponse("Not allowed by CORS", { status: 403 });
  }

  const response = NextResponse.next();

  // Apply CORS headers for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!origin || allowedOrigins.has(origin)) {
      Object.entries(corsHeaders(origin || "*")).forEach(([k, v]) => {
        response.headers.set(k, v);
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
