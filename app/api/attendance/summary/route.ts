import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

// GET /api/attendance/summary?student=id&startDate=&endDate=
export const GET = withAuth(requireService("attendance", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student");

    const args: (string | number | boolean | null)[] = [school.id];
    let studentFilter = "";
    if (studentId) {
      studentFilter = "AND a.student_id = ?";
      args.push(studentId);
    }

    const summary = await queryOne<{
      total: number; present: number; absent: number; late: number;
    }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
       FROM attendance a
       WHERE a.school_id = ? ${studentFilter}`,
      args
    );

    const total = summary?.total ?? 0;
    return ok({
      totalDays: total,
      present: summary?.present ?? 0,
      absent: summary?.absent ?? 0,
      late: summary?.late ?? 0,
      attendanceRate: total > 0 ? (((summary?.present ?? 0) / total) * 100).toFixed(1) : "0",
    });
  } catch (err) {
    return serverError(err);
  }
}));
