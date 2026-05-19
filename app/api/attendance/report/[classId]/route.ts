import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

// GET /api/attendance/report/[classId]
export const GET = withAuth(requireService("attendance", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.classId ?? "";

    const classDoc = await queryOne<{ name: string }>("SELECT name FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
    if (!classDoc) return notFound("Class not found");

    const rows = await query<{
      student_id: string; student_name: string;
      present: number; absent: number; late: number; total: number;
    }>(
      `SELECT a.student_id, u.name as student_name,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
              SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
              SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
              COUNT(*) as total
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.class_id = ? AND a.school_id = ?
       GROUP BY a.student_id, u.name
       ORDER BY u.name`,
      [classId, school.id]
    );

    const studentBreakdown = rows.map((r) => ({
      ...r,
      attendanceRate: r.total > 0 ? ((r.present / r.total) * 100).toFixed(1) : "0",
    }));

    const totalSchoolDays = studentBreakdown.length > 0
      ? Math.max(...studentBreakdown.map((s) => s.total))
      : 0;
    const averageAttendanceRate =
      studentBreakdown.length > 0
        ? (studentBreakdown.reduce((s, r) => s + parseFloat(r.attendanceRate), 0) / studentBreakdown.length).toFixed(1)
        : "0";

    return ok({ className: classDoc.name, totalSchoolDays, averageAttendanceRate, studentBreakdown });
  } catch (err) {
    return serverError(err);
  }
}));
