import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const sid = school.id;
    console.log("Dashboard stats fetch for school:", sid);

    const [
      students, teachers, parents, classes, subjects,
      attendanceRate, feeCollected, feePending, feeDefaulters,
      pendingPlans, overdueLibrary, upcomingExams, staffCount,
      recentPayments, recentAnnouncements,
    ] = await Promise.all([
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role='student' AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role IN ('class_teacher','subject_teacher') AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role='parent' AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM classes WHERE school_id=?", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM subjects WHERE school_id=?", [sid]),
      queryOne<{ rate: number }>(
        "SELECT COALESCE(ROUND(100.0*SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1),0) rate FROM attendance WHERE school_id=?",
        [sid]
      ),
      queryOne<{ total: number }>("SELECT COALESCE(SUM(amount_paid),0) total FROM fee_payments WHERE school_id=? AND status='completed'", [sid]),
      queryOne<{ total: number }>("SELECT COALESCE(SUM(f.amount - COALESCE(p.paid,0)),0) total FROM fees f LEFT JOIN (SELECT fee_id, SUM(amount_paid) paid FROM fee_payments WHERE school_id=? GROUP BY fee_id) p ON p.fee_id=f.id WHERE f.school_id=?", [sid, sid]),
      queryOne<{ c: number }>("SELECT COUNT(DISTINCT fp.student_id) c FROM fees f LEFT JOIN (SELECT fee_id,student_id,SUM(amount_paid) paid FROM fee_payments WHERE school_id=? GROUP BY fee_id,student_id) fp ON fp.fee_id=f.id WHERE f.school_id=? AND (fp.paid IS NULL OR fp.paid < f.amount)", [sid, sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM lesson_plans WHERE school_id=? AND status='pending'", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM book_borrows WHERE school_id=? AND returned_at IS NULL AND due_date < date('now')", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM exams WHERE school_id=? AND date BETWEEN date('now') AND date('now','+30 days')", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role NOT IN ('student','parent') AND is_active=1", [sid]),
      query<{ id: string; student_name: string; amount: number; time: string }>(
        `SELECT fp.id, u.name as student_name, fp.amount_paid as amount,
         strftime('%d %b',fp.created_at) as time
         FROM fee_payments fp JOIN users u ON fp.student_id=u.id
         WHERE fp.school_id=? ORDER BY fp.created_at DESC LIMIT 5`, [sid]
      ),
      query<{ id: string; title: string; created_at: string }>(
        "SELECT id,title,created_at FROM announcements WHERE school_id=? ORDER BY is_pinned DESC,created_at DESC LIMIT 5", [sid]
      ),
    ]);

    const collected = feeCollected?.total ?? 0;
    const pending = feePending?.total ?? 0;
    const total = collected + pending;
    const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;

    const response = {
      totalStudents: students?.c ?? 0,
      totalTeachers: teachers?.c ?? 0,
      totalParents: parents?.c ?? 0,
      totalClasses: classes?.c ?? 0,
      totalSubjects: subjects?.c ?? 0,
      avgAttendance: attendanceRate?.rate ?? 0,
      feeCollected: collected,
      feePending: pending,
      collectionRate,
      feeDefaulters: feeDefaulters?.c ?? 0,
      pendingLessonPlans: pendingPlans?.c ?? 0,
      overdueLibrary: overdueLibrary?.c ?? 0,
      upcomingExams: upcomingExams?.c ?? 0,
      staffCount: staffCount?.c ?? 0,
      recentPayments,
      recentAnnouncements,
    };
    console.log("Dashboard stats response:", response);
    return ok(response);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return serverError(err);
  }
});
