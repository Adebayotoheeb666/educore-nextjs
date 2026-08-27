import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError, created } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/students/[id]/enrollments — Get student's enrollment history
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const studentId = params?.id ?? "";
    const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
    if (!student) return notFound("Student not found");

    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");

    let sql = `SELECT sc.*, c.name as class_name, c.level as class_level, c.section as class_section
               FROM students_classes sc
               LEFT JOIN classes c ON sc.class_id = c.id
               WHERE sc.student_id = ?`;
    const params_arr: any[] = [studentId];

    if (session) {
      sql += ` AND sc.academic_session = ?`;
      params_arr.push(session);
    }

    sql += ` ORDER BY sc.academic_session DESC, sc.term DESC`;

    const enrollments = await query(sql, params_arr);
    return ok(enrollments);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/students/[id]/enrollments — Enroll student in a class for a session
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { classId, academicSession, term, status } = await req.json();
      const studentId = params?.id ?? "";

      if (!classId || !academicSession) {
        return badRequest("classId and academicSession are required");
      }

      const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
      if (!student) return notFound("Student not found");

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const finalStatus = status || "active";

      // Enforce single active enrollment per session
      if (finalStatus === "active") {
        const existingActive = await queryOne(
          "SELECT class_id FROM students_classes WHERE student_id = ? AND academic_session = ? AND status = 'active'",
          [studentId, academicSession]
        );
        if (existingActive) {
          const existingClassId = (existingActive as any).class_id;
          if (existingClassId === classId) {
            return badRequest(`Student is already actively enrolled in this class for ${academicSession}`);
          }
          return badRequest(`Student is already actively enrolled in another class for ${academicSession}. Unenroll first before enrolling in a new class.`);
        }

        // If there's a previous non-active row for same class+session, reactivate it instead of inserting duplicate
        const previous = await queryOne(
          "SELECT id FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ?",
          [studentId, classId, academicSession]
        );
        if (previous) {
          await execute(
            `UPDATE students_classes SET status = 'active', term = ?, left_date = NULL, updated_at = datetime('now'), enrolled_date = datetime('now') WHERE id = ?`,
            [term || null, (previous as any).id]
          );
          await execute("UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?", [classId, studentId]);
          const compulsorySubjects = await query(
            "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
            [classId, academicSession]
          );
          for (const subject of compulsorySubjects || []) {
            try {
              const subjectId = (subject as any).subject_id;
              const subjectEnrollmentId = generateId();
              await execute(
                `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, source, enrolled_date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
                [subjectEnrollmentId, studentId, subjectId, classId, academicSession, term || null]
              );
            } catch (err) {
              await execute(
                `UPDATE student_subjects SET status = 'active', updated_at = datetime('now') WHERE student_id = ? AND subject_id = ? AND class_id = ? AND academic_session = ?`,
                [studentId, (subject as any).subject_id, classId, academicSession]
              );
            }
          }
          return created({ id: (previous as any).id, studentId, classId, academicSession, status: finalStatus, reactivated: true });
        }
      }

      const id = generateId();
      try {
        await execute(
          `INSERT INTO students_classes (id, student_id, class_id, academic_session, term, status, enrolled_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
          [id, studentId, classId, academicSession, term || null, finalStatus]
        );
      } catch (e) {
        const msg = (e as Error).message || "";
        if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
          return badRequest(`Student is already actively enrolled in another class for ${academicSession}. Unenroll first.`);
        }
        throw e;
      }

      // Keep users.class_id and compulsory subject enrollments in sync
      if (finalStatus === "active") {
        await execute(
          "UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?",
          [classId, studentId]
        );

        // Auto-enroll in all compulsory subjects in this class
        const compulsorySubjects = await query(
          "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
          [classId, academicSession]
        );

        for (const subject of compulsorySubjects || []) {
          try {
            const subjectId = (subject as any).subject_id;
            const subjectEnrollmentId = generateId();
            await execute(
              `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, source, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
              [subjectEnrollmentId, studentId, subjectId, classId, academicSession, term || null]
            );
          } catch (err) {
            // Silently skip if already enrolled
          }
        }
      }

      return created({ id, studentId, classId, academicSession, status: finalStatus });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// PUT /api/students/[id]/enrollments — Update enrollment status
export const PUT = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { enrollmentId, status, leftDate } = await req.json();
      const studentId = params?.id ?? "";

      if (!enrollmentId || !status) {
        return badRequest("enrollmentId and status are required");
      }

      const enrollment = await queryOne(
        `SELECT sc.* FROM students_classes sc
         JOIN users u ON sc.student_id = u.id
         WHERE sc.id = ? AND sc.student_id = ? AND u.school_id = ?`,
        [enrollmentId, studentId, school.id]
      );

      if (!enrollment) return notFound("Enrollment not found");

      // If trying to activate, enforce single-active per session
      if (status === "active" && (enrollment as any).status !== "active") {
        const conflict = await queryOne(
          "SELECT id FROM students_classes WHERE student_id = ? AND academic_session = ? AND status = 'active' AND id != ?",
          [studentId, (enrollment as any).academic_session, enrollmentId]
        );
        if (conflict) {
          return badRequest(`Student is already actively enrolled in another class for ${(enrollment as any).academic_session}. Unenroll from the other class first.`);
        }
      }

      try {
        await execute(
          `UPDATE students_classes SET status = ?, left_date = ?, updated_at = datetime('now') WHERE id = ?`,
          [status, status === "active" ? null : leftDate || new Date().toISOString(), enrollmentId]
        );
      } catch (e) {
        const msg = (e as Error).message || "";
        if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
          return badRequest(`Student is already actively enrolled in another class for ${(enrollment as any).academic_session}.`);
        }
        throw e;
      }

      // Keep users.class_id and subjects in sync
      if (status === "withdrawn" || status === "transferred") {
        await execute(
          `UPDATE users SET class_id = CASE WHEN class_id = ? THEN NULL ELSE class_id END, updated_at = datetime('now') WHERE id = ?`,
          [(enrollment as any).class_id, studentId]
        );
        await execute(
          `UPDATE student_subjects SET status = 'dropped', updated_at = datetime('now') WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
          [studentId, (enrollment as any).class_id, (enrollment as any).academic_session]
        );
      } else if (status === "active") {
        await execute("UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?", [(enrollment as any).class_id, studentId]);
      }

      return ok({ message: "Enrollment updated", enrollmentId, status });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// DELETE /api/students/[id]/enrollments — Unenroll (withdraw) from a class for a session
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const studentId = params?.id ?? "";
      const { classId, academicSession, enrollmentId } = await req.json().catch(() => ({}));

      let enrollment: any = null;
      if (enrollmentId) {
        enrollment = await queryOne(
          `SELECT sc.* FROM students_classes sc JOIN users u ON sc.student_id = u.id WHERE sc.id = ? AND sc.student_id = ? AND u.school_id = ?`,
          [enrollmentId, studentId, school.id]
        );
      } else if (classId && academicSession) {
        enrollment = await queryOne(
          `SELECT sc.* FROM students_classes sc JOIN users u ON sc.student_id = u.id WHERE sc.student_id = ? AND sc.class_id = ? AND sc.academic_session = ? AND u.school_id = ?`,
          [studentId, classId, academicSession, school.id]
        );
      } else if (classId) {
        enrollment = await queryOne(
          `SELECT sc.* FROM students_classes sc JOIN users u ON sc.student_id = u.id WHERE sc.student_id = ? AND sc.class_id = ? AND sc.status = 'active' AND u.school_id = ?`,
          [studentId, classId, school.id]
        );
      }

      if (!enrollment) return notFound("Active enrollment not found");
      if (enrollment.status !== "active") return badRequest("Enrollment is not active");

      await execute(
        `UPDATE students_classes SET status = 'withdrawn', left_date = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [enrollment.id]
      );
      await execute(
        `UPDATE student_subjects SET status = 'dropped', updated_at = datetime('now') WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
        [studentId, enrollment.class_id, enrollment.academic_session]
      );
      await execute(
        `UPDATE users SET class_id = CASE WHEN class_id = ? THEN NULL ELSE class_id END, updated_at = datetime('now') WHERE id = ?`,
        [enrollment.class_id, studentId]
      );

      return ok({ message: "Student unenrolled successfully", enrollmentId: enrollment.id, status: "withdrawn" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);
