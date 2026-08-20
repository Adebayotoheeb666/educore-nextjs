import { NextRequest, NextResponse } from "next/server";
import { queryOne, query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";
import { syncSubjectEnrollment } from "@/lib/services/subjectEnrollmentSync";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const subject = await queryOne(
      `SELECT s.*, GROUP_CONCAT(u.name) as teacher_names, GROUP_CONCAT(u.id) as teacher_ids
       FROM subjects s
       LEFT JOIN subject_teachers st ON st.subject_id = s.id
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE s.id = ? AND s.school_id = ?
       GROUP BY s.id`,
      [params?.id ?? "", school.id]
    );
    if (!subject) return notFound("Subject not found");
    return ok(subject);
  } catch (err) {
    return serverError(err);
  }
});

export const PATCH = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const id = params?.id ?? "";
    const existing = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [id, school.id]);
    if (!existing) return notFound("Subject not found");

    const { name, code, classId, isCompulsory, description } = await req.json();
    await execute(
      `UPDATE subjects SET
         name = COALESCE(?, name),
         code = COALESCE(?, code),
         class_id = COALESCE(?, class_id),
         is_compulsory = COALESCE(?, is_compulsory),
         description = COALESCE(?, description),
         updated_at = datetime('now')
       WHERE id = ?`,
      [name || null, code || null, classId || null,
       isCompulsory !== undefined ? (isCompulsory ? 1 : 0) : null,
       description || null, id]
    );

    // Propagate a compulsory/optional change to every class using this subject,
    // keeping class_subjects and student_subjects in sync.
    if (isCompulsory !== undefined) {
      const affectedClasses = await query<{ class_id: string }>(
        "SELECT DISTINCT class_id FROM class_subjects WHERE subject_id = ?",
        [id]
      );

      for (const row of affectedClasses || []) {
        const classDoc = await queryOne<{ academic_session: string | null }>(
          "SELECT academic_session FROM classes WHERE id = ? AND school_id = ?",
          [row.class_id, school.id]
        );
        const session = classDoc?.academic_session || school.academic_session || new Date().getFullYear().toString();

        await execute(
          "UPDATE class_subjects SET is_compulsory = ?, updated_at = datetime('now') WHERE subject_id = ? AND class_id = ?",
          [isCompulsory ? 1 : 0, id, row.class_id]
        );

        await syncSubjectEnrollment(row.class_id, id, session, isCompulsory);
      }
    }

    const updated = await queryOne("SELECT * FROM subjects WHERE id = ?", [id]);
    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
});

export const DELETE = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const id = params?.id ?? "";
    const existing = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [id, school.id]);
    if (!existing) return notFound("Subject not found");
    await execute("DELETE FROM subjects WHERE id = ?", [id]);
    return ok({ message: "Subject deleted" });
  } catch (err) {
    return serverError(err);
  }
});
