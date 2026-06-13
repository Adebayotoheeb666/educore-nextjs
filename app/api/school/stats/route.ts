import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { SERVICE_CATALOG } from "@/config/services/catalog";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// GET /api/school/stats
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");

    const [studentCount, teacherCount, classCount, subjectCount, serviceCount] = await Promise.all([
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
      queryOne<{ active: number; inactive: number }>(
        `SELECT
           COALESCE(SUM(CASE WHEN s.is_compulsory = 1 OR ss.status = 'active' THEN 1 ELSE 0 END),0) as active,
           COALESCE(SUM(CASE WHEN s.is_compulsory = 0 AND (ss.status != 'active' OR ss.status IS NULL) THEN 1 ELSE 0 END),0) as inactive
         FROM services s
         LEFT JOIN school_services ss ON s.id = ss.service_id AND ss.school_id = ?
         WHERE s.is_active = 1 AND s.slug != 'admin'`,
        [school.id]
      ),    ]);

    const visibleServicesCount = SERVICE_CATALOG.filter((svc) => svc.slug !== "admin").length;
    const activeServices = serviceCount?.active ?? 0;
    const inactiveServices = Math.max(0, visibleServicesCount - activeServices);

    return ok({
      classes: classCount?.count ?? 0,
      teachers: teacherCount?.count ?? 0,
      students: studentCount?.count ?? 0,
      subjects: subjectCount?.count ?? 0,
      activeServices,
      inactiveServices,
    });
  } catch (err) {
    return serverError(err);
  }
});
