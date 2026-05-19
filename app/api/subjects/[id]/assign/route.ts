import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

// POST /api/subjects/[id]/assign — assign a teacher to a subject
export const POST = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { teacherId, classId } = await req.json();
    if (!teacherId) return badRequest("teacherId is required");

    const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [params?.id ?? "", school.id]);
    if (!subject) return notFound("Subject not found");

    await execute(
      "INSERT OR IGNORE INTO subject_teachers (subject_id, teacher_id, class_id) VALUES (?, ?, ?)",
      [params?.id ?? "", teacherId, classId || null]
    );
    return ok({ message: "Teacher assigned to subject" });
  } catch (err) {
    return serverError(err);
  }
});
