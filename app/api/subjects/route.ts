import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const subjects = await query(
      `SELECT s.*, GROUP_CONCAT(u.name) as teacher_names, GROUP_CONCAT(u.id) as teacher_ids
       FROM subjects s
       LEFT JOIN subject_teachers st ON st.subject_id = s.id
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE s.school_id = ?
       GROUP BY s.id
       ORDER BY s.name`,
      [school.id]
    );
    return ok(subjects);
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { name, code, category, classId, isCompulsory } = await req.json();
    if (!name) return badRequest("Subject name is required");

    const id = generateId();
    await execute(
      `INSERT INTO subjects (id, name, code, school_id, class_id, is_compulsory, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, code || null, school.id, classId || null, isCompulsory !== false ? 1 : 0]
    );
    return created({ id, name, code: code || null });
  } catch (err) {
    return serverError(err);
  }
});
