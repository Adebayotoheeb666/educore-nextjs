import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

const TEACHER_ROLES = ["subject_teacher", "class_teacher", "vp_academics", "principal"];

export const GET = withAuth(requireService("lesson-plans", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";

    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const status = searchParams.get("status");

    if (classId)   { filters += " AND lp.class_id = ?"; args.push(classId); }
    if (subjectId) { filters += " AND lp.subject_id = ?"; args.push(subjectId); }
    if (status)    { filters += " AND lp.status = ?"; args.push(status); }

    // Teachers only see their own plans; admin roles see all
    if (!["principal", "vp_academics", "school_owner"].includes(user.role)) {
      filters += " AND lp.teacher_id = ?";
      args.push(user.id);
    }

    const plans = await query(
      `SELECT lp.*, u.name as teacher_name, s.name as subject_name, c.name as class_name, c.section as class_section
       FROM lesson_plans lp
       LEFT JOIN users u ON lp.teacher_id = u.id
       LEFT JOIN subjects s ON lp.subject_id = s.id
       LEFT JOIN classes c ON lp.class_id = c.id
       WHERE lp.school_id = ? ${filters}
       ORDER BY lp.created_at DESC`,
      args
    );
    return ok(plans);
  } catch (err) {
    return serverError(err);
  }
}));

export const POST = withAuth(
  requireService("lesson-plans", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { title, classId, subjectId, term, week, topic, objectives, content, materials, activities, assessment } = await req.json();
      if (!title) return badRequest("Title is required");

      const id = generateId();
      await execute(
        `INSERT INTO lesson_plans (id, title, school_id, teacher_id, class_id, subject_id, term, week, topic, objectives, content, materials, activities, assessment, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))`,
        [id, title, school.id, user.id, classId || null, subjectId || null,
         term || school.current_term, week || null, topic || null,
         objectives || null, content || null, materials || null, activities || null, assessment || null]
      );
      return created({ id, title });
    } catch (err) {
      return serverError(err);
    }
  }),
  TEACHER_ROLES
);
