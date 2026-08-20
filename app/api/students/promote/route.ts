import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

// POST /api/students/promote — Promote students from one class to the next
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { fromClassId, toClassId, studentIds, academicSession, term } = await req.json();

      if (!fromClassId || !toClassId || !Array.isArray(studentIds) || !studentIds.length) {
        return badRequest("fromClassId, toClassId, and studentIds are required");
      }
      if (fromClassId === toClassId) {
        return badRequest("fromClassId and toClassId must be different");
      }

      const [fromClass, toClass] = await Promise.all([
        queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [fromClassId, school.id]),
        queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [toClassId, school.id]),
      ]);

      if (!fromClass || !toClass) return notFound("One or both classes not found");

      const session = academicSession || school.academic_session;

      const results = { promoted: [] as string[], skipped: [] as string[], failed: [] as string[] };

      for (const studentId of studentIds) {
        try {
          const student = await queryOne(
            "SELECT id, class_id FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
            [studentId, school.id]
          );
          if (!student) {
            results.failed.push(studentId);
            continue;
          }

          const activeEnrollment = await queryOne(
            "SELECT id FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'",
            [studentId, fromClassId, session]
          );

          if (!activeEnrollment) {
            results.skipped.push(studentId);
            continue;
          }

          // Mark the old enrollment as promoted
          await execute(
            `UPDATE students_classes SET status = 'promoted', left_date = datetime('now'), updated_at = datetime('now')
             WHERE id = ?`,
            [(activeEnrollment as any).id]
          );

          // Mark old subjects in the previous class as transferred
          await execute(
            `UPDATE student_subjects SET status = 'transferred', updated_at = datetime('now')
             WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
            [studentId, fromClassId, session]
          );

          // Activate an enrollment in the new class (reuse existing row if present)
          const newEnrollment = await queryOne(
            "SELECT id FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ?",
            [studentId, toClassId, session]
          );

          if (newEnrollment) {
            await execute(
              `UPDATE students_classes SET status = 'active', left_date = null, updated_at = datetime('now')
               WHERE id = ?`,
              [(newEnrollment as any).id]
            );
          } else {
            await execute(
              `INSERT INTO students_classes (id, student_id, class_id, academic_session, term, status, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
              [generateId(), studentId, toClassId, session, term || null]
            );
          }

          // Auto-enroll in all compulsory subjects in the new class
          const compulsorySubjects = await query(
            "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
            [toClassId, session]
          );

          for (const subject of compulsorySubjects || []) {
            try {
              const subjectId = (subject as any).subject_id;
              await execute(
                `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, source, enrolled_date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
                [generateId(), studentId, subjectId, toClassId, session, term || null]
              );
            } catch (err) {
              // Silently skip if already enrolled
            }
          }

          // Keep users.class_id in sync
          await execute(
            "UPDATE users SET class_id = ?, updated_at = datetime('now') WHERE id = ?",
            [toClassId, studentId]
          );

          results.promoted.push(studentId);
        } catch (err) {
          results.failed.push(studentId);
        }
      }

      return ok({
        message: `Promoted ${results.promoted.length} student(s)`,
        count: results.promoted.length,
        ...results,
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);