import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

// POST /api/subjects/[id]/assign — assign a teacher to a subject + class combination
export const POST = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { teacherId, classId, academicSession, term } = await req.json();
    if (!teacherId) return badRequest("teacherId is required");

    const subjectId = params?.id ?? "";
    const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
    if (!subject) return notFound("Subject not found");

    const { generateId } = await import("@/lib/utils/id");
    const id = generateId();
    await execute(
      `INSERT OR IGNORE INTO subject_teachers
       (id, subject_id, teacher_id, class_id, academic_session, term, assigned_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [id, subjectId, teacherId, classId || null, academicSession || school.academic_session, term || null]
    );
    return ok({ message: "Teacher assigned to subject", assignmentId: id });
  } catch (err) {
    return serverError(err);
  }
});
