import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { user, school }: AuthContext): Promise<NextResponse> => {
  const fullUser = await queryOne(
    `SELECT id, name, first_name, last_name, email, role, school_id, phone, avatar, is_active, admission_no, created_at, updated_at
     FROM users WHERE id = ?`,
    [user.id]
  );

  return ok({ ...fullUser, schoolId: school });
});
