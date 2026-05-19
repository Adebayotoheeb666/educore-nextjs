import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

// POST /api/subjects/[id]/unassign — remove a teacher from a subject
export const POST = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { teacherId } = await req.json();
    if (!teacherId) return badRequest("teacherId is required");

    const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
    if (!subject) return notFound("Subject not found");

    await execute(
      "DELETE FROM subject_teachers WHERE subject_id = ? AND teacher_id = ?",
      [params?.id ?? "", teacherId]
    );
    return ok({ message: "Teacher unassigned from subject" });
  } catch (err) {
    return serverError(err);
  }
});
