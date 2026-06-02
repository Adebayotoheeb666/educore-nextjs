import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/analytics — school-wide dashboard stats
export const GET = withAuth(requireService("analytics", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");

    const [students, teachers, parents, classes, subjects, announcements, attendanceRate, feeRevenue] =
      await Promise.all([
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student' AND is_active = 1", [school.id]),
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role IN ('class_teacher','subject_teacher') AND is_active = 1", [school.id]),
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'parent' AND is_active = 1", [school.id]),
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM classes WHERE school_id = ?", [school.id]),
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM subjects WHERE school_id = ?", [school.id]),
        queryOne<{ count: number }>("SELECT COUNT(*) as count FROM announcements WHERE school_id = ?", [school.id]),
        queryOne<{ rate: number }>(
          `SELECT COALESCE(ROUND(100.0 * SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1), 0) as rate
           FROM attendance WHERE school_id = ?`,
          [school.id]
        ),
        queryOne<{ total: number }>(
          "SELECT COALESCE(SUM(amount_paid), 0) as total FROM fee_payments WHERE school_id = ? AND status = 'completed'",
          [school.id]
        ),
      ]);

    return ok({
      students: students?.count ?? 0,
      teachers: teachers?.count ?? 0,
      parents: parents?.count ?? 0,
      classes: classes?.count ?? 0,
      subjects: subjects?.count ?? 0,
      announcements: announcements?.count ?? 0,
      attendanceRateThisMonth: attendanceRate?.rate ?? 0,
      totalFeeRevenue: feeRevenue?.total ?? 0,
    });
  } catch (err) {
    return serverError(err);
  }
}));
