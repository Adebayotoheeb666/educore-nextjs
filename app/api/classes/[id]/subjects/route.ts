import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/classes/[id]/subjects — get subjects taught in this class
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";

    const subjects = await query(
      `SELECT s.id, s.name, s.code, s.description, s.is_compulsory, cs.is_compulsory as class_is_compulsory, cs.sequence,
              GROUP_CONCAT(u.id) as teacher_ids, GROUP_CONCAT(u.name) as teacher_names
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id AND st.class_id = ?
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE cs.class_id = ? AND s.school_id = ?
       GROUP BY s.id
       ORDER BY cs.sequence ASC`,
      [classId, classId, school.id]
    );

    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/classes/[id]/subjects — add subject to class curriculum
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const { subjectId, isCompulsory, sequence } = await req.json();

      if (!subjectId) return badRequest("subjectId is required");

      const cls = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!cls) return notFound("Class not found");

      const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subject) return notFound("Subject not found");

      const id = generateId();
      await execute(
        `INSERT INTO class_subjects (id, class_id, subject_id, is_compulsory, sequence, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, classId, subjectId, isCompulsory !== false ? 1 : 0, sequence || null]
      );

      return ok({ id, classId, subjectId, isCompulsory: isCompulsory !== false });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "vp_admin", "school_owner"]
);
