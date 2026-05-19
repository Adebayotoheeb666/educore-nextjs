import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { type AuthContext } from "./auth";

// Wraps a handler with service access check.
// Usage: withAuth(requireService("library", handler))
export function requireService(
  serviceSlug: string,
  handler: (
    req: NextRequest,
    ctx: AuthContext,
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    ctx: AuthContext,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    if (!ctx.school) {
      return NextResponse.json({ message: "School context required" }, { status: 403 });
    }

    const active = await queryOne(
      `SELECT ss.id FROM school_services ss
       JOIN services s ON ss.service_id = s.id
       WHERE ss.school_id = ? AND s.slug = ? AND ss.status = 'active'`,
      [ctx.school.id, serviceSlug]
    );

    if (!active) {
      return NextResponse.json(
        { message: `Service '${serviceSlug}' is not active for your school` },
        { status: 403 }
      );
    }

    return handler(req, ctx, params);
  };
}
