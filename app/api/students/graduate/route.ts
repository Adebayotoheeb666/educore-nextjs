import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// POST /api/students/graduate — Mark students as graduated from a class
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { classId, studentIds, academicSession } = await req.json();

      if (!classId || !Array.isArray(studentIds) || !studentIds.length) {
        return badRequest("classId and studentIds are required");
      }

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const session = academicSession || school.academic_session;

      const results = { graduated: [] as string[], skipped: [] as string[], failed: [] as string[] };

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
            [studentId, classId, session]
          );

          if (!activeEnrollment) {
            results.skipped.push(studentId);
            continue;
          }

          // Mark the enrollment as graduated
          await execute(
            `UPDATE students_classes SET status = 'graduated', left_date = datetime('now'), updated_at = datetime('now')
             WHERE id = ?`,
            [(activeEnrollment as any).id]
          );

          // Mark active subjects in this class as transferred
          await execute(
            `UPDATE student_subjects SET status = 'transferred', updated_at = datetime('now')
             WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
            [studentId, classId, session]
          );

          // Clear the student's current class since they are no longer enrolled
          await execute(
            `UPDATE users SET class_id = NULL, updated_at = datetime('now')
             WHERE id = ? AND class_id = ?`,
            [studentId, classId]
          );

          results.graduated.push(studentId);
        } catch (err) {
          results.failed.push(studentId);
        }
      }

      return ok({
        message: `Graduated ${results.graduated.length} student(s)`,
        count: results.graduated.length,
        ...results,
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);