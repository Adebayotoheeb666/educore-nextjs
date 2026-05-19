import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/school/admin/schools — super admin: list all schools
export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const schools = await query("SELECT * FROM schools ORDER BY created_at DESC");
    return ok(schools);
  } catch (err) {
    return serverError(err);
  }
}, ["super_admin"]);
