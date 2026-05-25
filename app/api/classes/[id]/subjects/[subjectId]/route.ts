import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

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

      return ok({ message: "Subject removed from class curriculum" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "vp_admin", "school_owner"]
);
