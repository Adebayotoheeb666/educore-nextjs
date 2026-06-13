import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { requireService } from "@/lib/middleware/requireService";
import { ok, serverError, badRequest } from "@/lib/utils/response";
import { query, queryOne } from "@/lib/db/turso";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9-_\.]/g, "-");

export const GET = withAuth(requireService("analytics", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const sid = school.id;
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("term")?.trim() ?? "";
    const session = searchParams.get("session")?.trim() ?? "";

    const termFilter = term ? " AND term = ?" : "";
    const sessionFilter = session ? " AND academic_session = ?" : "";
    const termSessionArgs = [] as (string | number)[];
    if (term) termSessionArgs.push(term);
    if (session) termSessionArgs.push(session);

    const schoolInfo = await queryOne<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      state?: string;
      type?: string;
      address?: string;
      academic_session?: string;
      current_term?: string;
      subscription_plan?: string;
      owner_name?: string;
    }>(
      `SELECT s.*, u.name as owner_name
       FROM schools s
       LEFT JOIN users u ON s.owner_id = u.id
       WHERE s.id = ?`,
      [sid]
    );

    const [studentCount, teacherCount, parentCount, classCount, subjectCount, attendanceRate, feeCollected, feePending, feeDefaulters] = await Promise.all([
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role='student' AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role IN ('class_teacher','subject_teacher') AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM users WHERE school_id=? AND role='parent' AND is_active=1", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM classes WHERE school_id=?", [sid]),
      queryOne<{ c: number }>("SELECT COUNT(*) c FROM subjects WHERE school_id=?", [sid]),
      queryOne<{ rate: number }>(
        `SELECT COALESCE(ROUND(100.0 * SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1), 0) rate
         FROM attendance
         WHERE school_id = ?${termFilter}${sessionFilter}`,
        [sid, ...termSessionArgs]
      ),
      queryOne<{ total: number }>("SELECT COALESCE(SUM(amount_paid),0) total FROM fee_payments WHERE school_id=? AND status='completed'", [sid]),
      queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(f.amount - COALESCE(p.paid,0)),0) total
         FROM fees f
         LEFT JOIN (
           SELECT fee_id, SUM(amount_paid) paid
           FROM fee_payments
           WHERE school_id=?
           GROUP BY fee_id
         ) p ON p.fee_id = f.id
         WHERE f.school_id = ?`,
        [sid, sid]
      ),
      queryOne<{ c: number }>(
        `SELECT COUNT(DISTINCT fp.student_id) c
         FROM fees f
         LEFT JOIN (
           SELECT fee_id, student_id, SUM(amount_paid) paid
           FROM fee_payments
           WHERE school_id=?
           GROUP BY fee_id, student_id
         ) fp ON fp.fee_id = f.id
         WHERE f.school_id = ? AND (fp.paid IS NULL OR fp.paid < f.amount)`,
        [sid, sid]
      ),
    ]);

    const students = await query<{
      id: string;
      name: string;
      email: string;
      admission_no?: string;
      gender?: string;
      dob?: string;
      phone?: string;
      address?: string;
      class_name?: string;
      class_level?: string;
      class_section?: string;
      parent_phone?: string;
      academic_session?: string;
      term?: string;
    }>(
      `SELECT u.id, u.name, u.email, u.admission_no, u.gender, u.dob, u.phone, u.address, u.parent_phone,
              c.name as class_name, c.level as class_level, c.section as class_section,
              sc.academic_session, sc.term
       FROM users u
       LEFT JOIN classes c ON u.class_id = c.id
       LEFT JOIN students_classes sc ON u.id = sc.student_id${session ? " AND sc.academic_session = ?" : ""}${term ? " AND sc.term = ?" : ""}
       WHERE u.school_id = ? AND u.role = 'student'
       ORDER BY u.name`,
      [...(session ? [session] : []), ...(term ? [term] : []), sid]
    );

    const parents = await query<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
      children?: string;
    }>(
      `SELECT u.id, u.name, u.email, u.phone, u.address,
              GROUP_CONCAT(child.name, '; ') as children
       FROM users u
       LEFT JOIN user_relationships ur ON u.id = ur.parent_id
       LEFT JOIN users child ON ur.child_id = child.id
       WHERE u.school_id = ? AND u.role = 'parent'
       GROUP BY u.id
       ORDER BY u.name`,
      [sid]
    );

    const teachers = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      phone?: string;
      address?: string;
      class_name?: string;
    }>(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.address, c.name as class_name
       FROM users u
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.school_id = ? AND u.role IN ('class_teacher','subject_teacher','vp_academics','principal','vp_admin','admin_staff','school_owner','super_admin')
       ORDER BY u.name`,
      [sid]
    );

    const classesData = await query<{
      id: string;
      name: string;
      level?: string;
      section?: string;
      capacity?: number;
      academic_session?: string;
      current_term?: string;
      class_teacher?: string;
    }>(
      `SELECT c.id, c.name, c.level, c.section, c.capacity, c.academic_session, c.current_term,
              ct.name as class_teacher
       FROM classes c
       LEFT JOIN users ct ON c.class_teacher_id = ct.id
       WHERE c.school_id = ?
       ORDER BY c.name`,
      [sid]
    );

    const subjects = await query<{
      id: string;
      name: string;
      code?: string;
      class_name?: string;
      teacher_name?: string;
      description?: string;
      is_compulsory?: number;
    }>(
      `SELECT s.id, s.name, s.code, c.name as class_name, t.name as teacher_name, s.description, s.is_compulsory
       FROM subjects s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN users t ON s.teacher_id = t.id
       WHERE s.school_id = ?
       ORDER BY s.name`,
      [sid]
    );

    const exams = await query<{
      id: string;
      title: string;
      class_name?: string;
      subject_name?: string;
      type?: string;
      term: string;
      academic_session: string;
      date?: string;
      duration_minutes?: number;
      total_marks?: number;
      status: string;
      created_by?: string;
    }>(
      `SELECT e.id, e.title, c.name as class_name, s.name as subject_name, e.type, e.term, e.academic_session,
              e.date, e.duration_minutes, e.total_marks, e.status, u.name as created_by
       FROM exams e
       LEFT JOIN classes c ON e.class_id = c.id
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.school_id = ?${termFilter}${sessionFilter}
       ORDER BY e.date ASC`,
      [sid, ...termSessionArgs]
    );

    const attendanceRecords = await query<{
      id: string;
      date: string;
      term: string;
      academic_session: string;
      class_name?: string;
      student_name?: string;
      status: string;
      recorded_by?: string;
      notes?: string;
    }>(
      `SELECT a.id, a.date, a.term, a.academic_session, c.name as class_name, u.name as student_name,
              a.status, recorder.name as recorded_by, a.notes
       FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN users u ON a.student_id = u.id
       LEFT JOIN users recorder ON a.recorded_by = recorder.id
       WHERE a.school_id = ?${termFilter}${sessionFilter}
       ORDER BY a.date DESC, c.name, u.name`,
      [sid, ...termSessionArgs]
    );

    const attendanceSummary = await query<{
      class_name?: string;
      status: string;
      count: number;
    }>(
      `SELECT c.name as class_name, a.status, COUNT(*) as count
       FROM attendance a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.school_id = ?${termFilter}${sessionFilter}
       GROUP BY c.name, a.status
       ORDER BY c.name, a.status`,
      [sid, ...termSessionArgs]
    );

    const fees = await query<{
      id: string;
      name?: string;
      description?: string;
      amount?: number;
      term?: string;
      academic_session?: string;
      created_by?: string;
      paid?: number;
      balance?: number;
    }>(
      `SELECT f.id, f.name, f.description, f.amount, f.term, f.academic_session, u.name as created_by,
              COALESCE(SUM(fp.amount_paid),0) as paid,
              f.amount - COALESCE(SUM(fp.amount_paid),0) as balance
       FROM fees f
       LEFT JOIN users u ON f.created_by = u.id
       LEFT JOIN fee_payments fp ON f.id = fp.fee_id
       WHERE f.school_id = ?
       GROUP BY f.id
       ORDER BY f.term, f.academic_session, f.name`,
      [sid]
    );

    const feePayments = await query<{
      id: string;
      student_name?: string;
      amount_paid?: number;
      status?: string;
      created_at?: string;
      fee_id?: string;
    }>(
      `SELECT fp.id, u.name as student_name, fp.amount_paid, fp.status,
              strftime('%Y-%m-%d', fp.created_at) as created_at, fp.fee_id
       FROM fee_payments fp
       LEFT JOIN users u ON fp.student_id = u.id
       WHERE fp.school_id = ?
       ORDER BY fp.created_at DESC`,
      [sid]
    );

    const lessonPlans = await query<{
      id: string;
      title: string;
      term: string;
      week?: number;
      status: string;
      teacher_name?: string;
      class_name?: string;
      subject_name?: string;
      topic?: string;
      created_at?: string;
    }>(
      `SELECT lp.id, lp.title, lp.term, lp.week, lp.status,
              u.name as teacher_name, c.name as class_name, s.name as subject_name,
              lp.topic, lp.created_at
       FROM lesson_plans lp
       LEFT JOIN users u ON lp.teacher_id = u.id
       LEFT JOIN classes c ON lp.class_id = c.id
       LEFT JOIN subjects s ON lp.subject_id = s.id
       WHERE lp.school_id = ?${termFilter}${sessionFilter}
       ORDER BY lp.created_at DESC`,
      [sid, ...termSessionArgs]
    );

    const studentEnrollments = await query<{
      student_name?: string;
      class_name?: string;
      academic_session?: string;
      term?: string;
      status?: string;
      enrolled_date?: string;
      left_date?: string;
    }>(
      `SELECT u.name as student_name, c.name as class_name, sc.academic_session, sc.term, sc.status,
              strftime('%Y-%m-%d', sc.enrolled_date) as enrolled_date,
              strftime('%Y-%m-%d', sc.left_date) as left_date
       FROM students_classes sc
       LEFT JOIN users u ON sc.student_id = u.id
       LEFT JOIN classes c ON sc.class_id = c.id
       WHERE u.school_id = ?${term ? " AND sc.term = ?" : ""}${session ? " AND sc.academic_session = ?" : ""}
       ORDER BY u.name`,
      [sid, ...(term ? [term] : []), ...(session ? [session] : [])]
    );

    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ["Report", "EMIS Report"],
      ["School ID", sid],
      ["School Name", schoolInfo?.name ?? ""],
      ["School Email", schoolInfo?.email ?? ""],
      ["School Phone", schoolInfo?.phone ?? ""],
      ["School State", schoolInfo?.state ?? ""],
      ["School Type", schoolInfo?.type ?? ""],
      ["School Address", schoolInfo?.address ?? ""],
      ["Owner", schoolInfo?.owner_name ?? ""],
      ["Report Term", term || "All"],
      ["Report Session", session || "All"],
      ["Generated At", new Date().toISOString()],
      [],
      ["Metric", "Value"],
      ["Total Students", studentCount?.c ?? 0],
      ["Total Teachers", teacherCount?.c ?? 0],
      ["Total Parents", parentCount?.c ?? 0],
      ["Total Classes", classCount?.c ?? 0],
      ["Total Subjects", subjectCount?.c ?? 0],
      ["Avg Attendance (%)", attendanceRate?.rate ?? 0],
      ["Fee Collected", feeCollected?.total ?? 0],
      ["Fee Pending", feePending?.total ?? 0],
      ["Fee Defaulters", feeDefaulters?.c ?? 0],
      ["Students with Parents", parents.length],
      ["Teachers Included", teachers.length],
      ["Exams Included", exams.length],
      ["Lesson Plans Included", lessonPlans.length],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const wsSchool = XLSX.utils.json_to_sheet([
      {
        id: schoolInfo?.id,
        name: schoolInfo?.name,
        email: schoolInfo?.email,
        phone: schoolInfo?.phone,
        state: schoolInfo?.state,
        type: schoolInfo?.type,
        address: schoolInfo?.address,
        academic_session: schoolInfo?.academic_session,
        current_term: schoolInfo?.current_term,
        subscription_plan: schoolInfo?.subscription_plan,
        owner_name: schoolInfo?.owner_name,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, wsSchool, "School");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students, {
      header: ["id", "name", "email", "admission_no", "gender", "dob", "phone", "address", "parent_phone", "class_name", "class_level", "class_section", "academic_session", "term"],
    }), "Students");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parents, {
      header: ["id", "name", "email", "phone", "address", "children"],
    }), "Parents");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teachers, {
      header: ["id", "name", "email", "role", "phone", "address", "class_name"],
    }), "Teachers");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classesData, {
      header: ["id", "name", "level", "section", "capacity", "academic_session", "current_term", "class_teacher"],
    }), "Classes");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subjects, {
      header: ["id", "name", "code", "class_name", "teacher_name", "description", "is_compulsory"],
    }), "Subjects");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exams, {
      header: ["id", "title", "class_name", "subject_name", "type", "term", "academic_session", "date", "duration_minutes", "total_marks", "status", "created_by"],
    }), "Exams");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceRecords, {
      header: ["id", "date", "term", "academic_session", "class_name", "student_name", "status", "recorded_by", "notes"],
    }), "AttendanceRecords");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceSummary, {
      header: ["class_name", "status", "count"],
    }), "AttendanceSummary");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fees, {
      header: ["id", "name", "description", "amount", "term", "academic_session", "created_by", "paid", "balance"],
    }), "Fees");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feePayments, {
      header: ["id", "student_name", "amount_paid", "status", "created_at", "fee_id"],
    }), "FeePayments");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lessonPlans, {
      header: ["id", "title", "term", "week", "status", "teacher_name", "class_name", "subject_name", "topic", "created_at"],
    }), "LessonPlans");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentEnrollments, {
      header: ["student_name", "class_name", "academic_session", "term", "status", "enrolled_date", "left_date"],
    }), "Enrollments");

    const filename = `emis-report-${sid}-${sanitizeFilename(term || "all")}-${sanitizeFilename(session || "all")}.xlsx`;
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    }) as unknown as NextResponse;
  } catch (err) {
    return serverError(err);
  }
}));
