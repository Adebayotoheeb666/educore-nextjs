import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute, query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { syncSubjectEnrollment } from "@/lib/services/subjectEnrollmentSync";

export const dynamic = "force-dynamic";

// PATCH /api/classes/[id]/subjects/[subjectId] — mark a class curriculum subject as compulsory/optional.
// Toggling to compulsory retroactively assigns it to every active student in the class.
// Toggling to optional removes auto-assigned students but keeps explicitly assigned ones.
export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const { isCompulsory, academicSession } = await req.json();

      if (isCompulsory === undefined) {
        return badRequest("isCompulsory is required");
      }

      const classDoc = await queryOne<{ academic_session: string | null }>(
        "SELECT id, academic_session FROM classes WHERE id = ? AND school_id = ?",
        [classId, school.id]
      );
      if (!classDoc) return notFound("Class not found");

      const session = academicSession || classDoc?.academic_session || school.academic_session;
      if (!session || String(session).trim() === "") {
        return badRequest("Academic session is required");
      }

      const classSubject = await queryOne(
        "SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ? AND academic_session = ?",
        [classId, subjectId, session]
      );
      if (!classSubject) return notFound("Subject not assigned to this class");

      await execute(
        "UPDATE class_subjects SET is_compulsory = ?, updated_at = datetime('now') WHERE id = ?",
        [isCompulsory ? 1 : 0, (classSubject as any).id]
      );

      const assigned = await syncSubjectEnrollment(classId, subjectId, session, isCompulsory);

      const total = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM student_subjects WHERE subject_id = ? AND class_id = ? AND academic_session = ?",
        [subjectId, classId, session]
      );

      return ok({ isCompulsory: isCompulsory ? 1 : 0, affectedStudents: assigned, assignedStudents: total?.count ?? 0 });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// DELETE /api/classes/[id]/subjects/[subjectId] — remove subject from class curriculum
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const { searchParams } = new URL(req.url);
      const session = searchParams.get("session") || school.academic_session;

      const classSubject = await queryOne(
        "SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ? AND academic_session = ?",
        [classId, subjectId, session]
      );
      if (!classSubject) return notFound("Subject not assigned to this class");

      await execute(
        "DELETE FROM class_subjects WHERE id = ?",
        [(classSubject as any).id]
      );

      // Also remove the student enrollments for this subject in this class/session
      await execute(
        "DELETE FROM student_subjects WHERE subject_id = ? AND class_id = ? AND academic_session = ?",
        [subjectId, classId, session]
      );

      return ok({ message: "Subject removed from class curriculum" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);