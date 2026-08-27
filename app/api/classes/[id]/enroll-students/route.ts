import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

// POST /api/classes/[id]/enroll-students — Bulk enroll students in a class
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const { studentIds, academicSession, term } = await req.json();

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return badRequest("studentIds array is required");
      }

      const classDoc = await queryOne(
        "SELECT id, academic_session FROM classes WHERE id = ? AND school_id = ?",
        [classId, school.id]
      );
      if (!classDoc) return notFound("Class not found");

      const session = academicSession || (classDoc as any).academic_session || school.academic_session;

      const results = { enrolled: [] as string[], duplicates: [] as string[], failed: [] as string[], blocked: [] as { studentId: string; reason: string }[] };

      for (const studentId of studentIds) {
        try {
          const student = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'", [studentId, school.id]);
          if (!student) {
            results.failed.push(studentId);
            continue;
          }

          const existing = await queryOne(
            "SELECT id, status FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ?",
            [studentId, classId, session]
          );

          if (existing) {
            const st = (existing as any).status;
            if (st === "active") {
              results.duplicates.push(studentId);
              continue;
            }
            // If previously withdrawn/transferred/promoted etc., allow re-enrollment by reactivating
            // But first ensure no other active enrollment exists for this session
            const activeElsewhereCheck = await queryOne(
              "SELECT class_id FROM students_classes WHERE student_id = ? AND academic_session = ? AND status = 'active' AND class_id != ?",
              [studentId, session, classId]
            );
            if (activeElsewhereCheck) {
              results.blocked.push({ studentId, reason: `Already enrolled in another class (${(activeElsewhereCheck as any).class_id}) for ${session}` });
              results.failed.push(studentId);
              continue;
            }
            // Reactivate existing row instead of inserting duplicate
            try {
              await execute(
                `UPDATE students_classes SET status = 'active', left_date = null, updated_at = datetime('now'), term = COALESCE(?, term)
                 WHERE student_id = ? AND class_id = ? AND academic_session = ?`,
                [term || null, studentId, classId, session]
              );
            } catch (e) {
              // Unique active constraint violation means enrolled elsewhere at DB level
              const msg = (e as Error).message || "";
              if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
                results.blocked.push({ studentId, reason: `Already actively enrolled in another class for ${session}` });
                results.failed.push(studentId);
                continue;
              }
              throw e;
            }
            // Reactivate subject enrollments or auto-enroll compulsory
            const compulsorySubjects = await query(
              "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
              [classId, session]
            );
            for (const subject of compulsorySubjects || []) {
              try {
                const subjectId = (subject as any).subject_id;
                const subjectEnrollmentId = generateId();
                await execute(
                  `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, source, enrolled_date, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
                  [subjectEnrollmentId, studentId, subjectId, classId, session, term || null]
                );
              } catch (err) {
                await execute(
                  `UPDATE student_subjects SET status = 'active', updated_at = datetime('now') WHERE student_id = ? AND subject_id = ? AND class_id = ? AND academic_session = ?`,
                  [studentId, (subject as any).subject_id, classId, session]
                );
              }
            }
            await execute("UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?", [classId, studentId]);
            results.enrolled.push(studentId);
            continue;
          }

          // Prevent duplicate active enrollment across classes in same session
          const activeElsewhere = await queryOne(
            "SELECT class_id FROM students_classes WHERE student_id = ? AND academic_session = ? AND status = 'active'",
            [studentId, session]
          );
          if (activeElsewhere) {
            results.blocked.push({ studentId, reason: `Already enrolled in another class (${(activeElsewhere as any).class_id}) for ${session}` });
            results.failed.push(studentId);
            continue;
          }

          const id = generateId();
          try {
            await execute(
              `INSERT INTO students_classes (id, student_id, class_id, academic_session, term, status, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
              [id, studentId, classId, session, term || null]
            );
          } catch (e) {
            const msg = (e as Error).message || "";
            if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
              results.blocked.push({ studentId, reason: `Already actively enrolled in another class for ${session}` });
              results.failed.push(studentId);
              continue;
            }
            throw e;
          }

          // Auto-enroll student in all compulsory subjects in this class
          const compulsorySubjects = await query(
            "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
            [classId, session]
          );

          for (const subject of compulsorySubjects || []) {
            try {
              const subjectId = (subject as any).subject_id;
              const subjectEnrollmentId = generateId();
              await execute(
                `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, source, enrolled_date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
                [subjectEnrollmentId, studentId, subjectId, classId, session, term || null]
              );
            } catch (err) {
              // Silently skip if already enrolled
            }
          }

          // Keep users.class_id in sync
          await execute(
            "UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?",
            [classId, studentId]
          );

          results.enrolled.push(studentId);
        } catch (err) {
          results.failed.push(studentId);
        }
      }

      return ok(results);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// DELETE /api/classes/[id]/enroll-students — Unenroll students from a class (set status to withdrawn)
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const { studentIds, academicSession } = await req.json();

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return badRequest("studentIds array is required");
      }

      const classDoc = await queryOne("SELECT id, academic_session FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const session = academicSession || (classDoc as any).academic_session || school.academic_session;

      const results = { unenrolled: [] as string[], notEnrolled: [] as string[], failed: [] as string[] };

      for (const studentId of studentIds) {
        try {
          const enrollment = await queryOne(
            "SELECT id, status FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ?",
            [studentId, classId, session]
          );
          if (!enrollment || (enrollment as any).status !== "active") {
            results.notEnrolled.push(studentId);
            continue;
          }

          await execute(
            `UPDATE students_classes SET status = 'withdrawn', left_date = datetime('now'), updated_at = datetime('now') WHERE student_id = ? AND class_id = ? AND academic_session = ?`,
            [studentId, classId, session]
          );

          // Mark compulsory subject enrollments for this class/session as dropped
          await execute(
            `UPDATE student_subjects SET status = 'dropped', updated_at = datetime('now') WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
            [studentId, classId, session]
          );

          // Clear users.class_id if it points to this class (otherwise keep as is)
          await execute(
            `UPDATE users SET class_id = CASE WHEN class_id = ? THEN NULL ELSE class_id END, updated_at = datetime('now') WHERE id = ?`,
            [classId, studentId]
          );

          results.unenrolled.push(studentId);
        } catch (err) {
          results.failed.push(studentId);
        }
      }

      return ok(results);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// GET /api/classes/[id]/enroll-students — Check enrollment status for students
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") || school.academic_session;

    const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
    if (!classDoc) return notFound("Class not found");

    const enrolledCount = await queryOne(
      "SELECT COUNT(*) as count FROM students_classes WHERE class_id = ? AND academic_session = ? AND status = 'active'",
      [classId, session]
    );

    const enrollmentStats = await queryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'transferred' THEN 1 ELSE 0 END) as transferred,
        SUM(CASE WHEN status = 'promoted' THEN 1 ELSE 0 END) as promoted,
        SUM(CASE WHEN status = 'retained' THEN 1 ELSE 0 END) as retained,
        SUM(CASE WHEN status = 'graduated' THEN 1 ELSE 0 END) as graduated,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn
       FROM students_classes WHERE class_id = ? AND academic_session = ?`,
      [classId, session]
    );

    return ok({ session, classId, stats: enrollmentStats });
  } catch (err) {
    return serverError(err);
  }
});
