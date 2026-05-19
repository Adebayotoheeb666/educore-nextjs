import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// GET /api/school/stats
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");

    const [studentCount, teacherCount, classCount, parentCount] = await Promise.all([
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student' AND is_active = 1",
        [school.id]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role IN ('class_teacher','subject_teacher') AND is_active = 1",
        [school.id]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM classes WHERE school_id = ?",
        [school.id]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'parent' AND is_active = 1",
        [school.id]
      ),
    ]);

    return ok({
      studentCount: studentCount?.count ?? 0,
      teacherCount: teacherCount?.count ?? 0,
      classCount: classCount?.count ?? 0,
      parentCount: parentCount?.count ?? 0,
    });
  } catch (err) {
    return serverError(err);
  }
});
