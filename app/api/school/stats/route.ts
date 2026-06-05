import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// GET /api/school/stats
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");

    const [studentCount, teacherCount, classCount, subjectCount, activeServicesCount] = await Promise.all([
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
        "SELECT COUNT(*) as count FROM subjects WHERE school_id = ?",
        [school.id]
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM services s
         LEFT JOIN school_services ss ON s.id = ss.service_id AND ss.school_id = ?
         WHERE s.is_active = 1 AND (s.is_compulsory = 1 OR ss.status = 'active')`,
        [school.id]
      ),
    ]);

    return ok({
      classes: classCount?.count ?? 0,
      teachers: teacherCount?.count ?? 0,
      students: studentCount?.count ?? 0,
      subjects: subjectCount?.count ?? 0,
      activeServices: activeServicesCount?.count ?? 0,
    });
  } catch (err) {
    return serverError(err);
  }
});
