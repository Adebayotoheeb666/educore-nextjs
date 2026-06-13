import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const classes = await query(
      `SELECT c.id, c.name, c.school_id, c.class_teacher_id, c.level, c.section, c.academic_session, c.current_term, c.capacity, c.created_at, c.updated_at,
              MAX(u.name) as teacher_name, MAX(u.email) as teacher_email,
              COUNT(DISTINCT sc.student_id) as student_count,
              COUNT(DISTINCT CASE WHEN s.school_id = ? THEN cs.subject_id END) as subject_count
       FROM classes c
       LEFT JOIN users u ON c.class_teacher_id = u.id
       LEFT JOIN students_classes sc ON c.id = sc.class_id AND sc.academic_session = ?
       LEFT JOIN class_subjects cs ON c.id = cs.class_id AND cs.academic_session = ?
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE c.school_id = ?
       GROUP BY c.id, c.name, c.school_id, c.class_teacher_id, c.level, c.section, c.academic_session, c.current_term, c.capacity, c.created_at, c.updated_at
       ORDER BY c.level, c.name`,
      [school.id, school.academic_session, school.academic_session, school.id]
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
