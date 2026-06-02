import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

export const GET = withAuth(requireService("exams", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const exams = await query(
      `SELECT e.*, s.name as subject_name, s.code as subject_code, c.name as class_name, c.section as class_section
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN classes c ON e.class_id = c.id
       WHERE e.school_id = ?
       ORDER BY e.date DESC`,
      [school.id]
    );
    return ok(exams);
  } catch (err) {
    return serverError(err);
  }
}));

export const POST = withAuth(
  requireService("exams", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { title, classId, subjectId, type, term, session, date, durationMinutes, totalMarks, instructions } = await req.json();
      if (!title) return badRequest("Exam title is required");

      const id = generateId();
      await execute(
        `INSERT INTO exams (id, title, school_id, class_id, subject_id, type, term, academic_session, date, duration_minutes, total_marks, instructions, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, title, school.id, classId || null, subjectId || null, type || null,
         term || school.current_term, session || school.academic_session,
         date || null, durationMinutes || null, totalMarks || null, instructions || null, user.id]
      );
      return created({ id, title });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["subject_teacher", "class_teacher", "vp_academics"]
);
