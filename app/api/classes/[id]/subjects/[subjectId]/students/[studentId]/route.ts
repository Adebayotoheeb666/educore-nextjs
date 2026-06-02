import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// DELETE /api/classes/[id]/subjects/[subjectId]/students/[studentId] — remove student from subject
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const studentId = params?.studentId ?? "";
      const { searchParams } = new URL(req.url);
      const session = searchParams.get("session") || school.academic_session;

      const enrollment = await queryOne(
        "SELECT id FROM student_subjects WHERE student_id = ? AND subject_id = ? AND class_id = ? AND academic_session = ?",
        [studentId, subjectId, classId, session]
      );

      if (!enrollment) {
        return notFound("Student not enrolled in this subject");
      }

      await execute(
        "DELETE FROM student_subjects WHERE id = ?",
        [(enrollment as any).id]
      );

      return ok({ message: "Student removed from subject" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "vp_admin", "school_owner", "class_teacher"]
);
