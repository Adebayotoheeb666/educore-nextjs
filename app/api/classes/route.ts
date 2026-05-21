import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const classes = await query(
      `SELECT c.*, u.name as teacher_name, u.email as teacher_email
       FROM classes c
       LEFT JOIN users u ON c.class_teacher_id = u.id
       WHERE c.school_id = ?
       ORDER BY c.level, c.name`,
      [school.id]
    );
    return ok(classes);
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { name, arm, level, classTeacher } = await req.json();
      if (!name || !level) return badRequest("Class name and level are required");

      const id = generateId();
      await execute(
        `INSERT INTO classes (id, name, section, level, class_teacher_id, school_id, academic_session, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, name, arm || null, level, classTeacher || null, school.id, school.academic_session]
      );

      return created({ id, name, section: arm || null, level, school_id: school.id });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);
