import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

async function ensureExamStatusColumn(): Promise<void> {
  const column = await queryOne<{ name: string }>(
    "SELECT name FROM pragma_table_info('exams') WHERE name = ?",
    ["status"]
  );

  if (!column) {
    await execute(
      "ALTER TABLE exams ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'"
    );
  }
}

export const GET = withAuth(requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const exam = await queryOne(
      `SELECT e.*, s.name as subject_name, s.code as subject_code, c.name as class_name
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN classes c ON e.class_id = c.id
       WHERE e.id = ? AND e.school_id = ?`,
      [params?.id ?? "", school.id]
    );
    if (!exam) return notFound("Exam not found");
    return ok(exam);
  } catch (err) {
    return serverError(err);
  }
}));

export const PATCH = withAuth(
  requireService("exams", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const { title, classId, subjectId, type, term, session, date, durationMinutes, totalMarks, instructions, status } = await req.json();

      const exam = await queryOne("SELECT id FROM exams WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!exam) return notFound("Exam not found");

      const updates: string[] = [];
      const args: (string | number | boolean | null)[] = [];

      if (title !== undefined) {
        updates.push("title = ?");
        args.push(title);
      }
      if (classId !== undefined) {
        updates.push("class_id = ?");
        args.push(classId || null);
      }
      if (subjectId !== undefined) {
        updates.push("subject_id = ?");
        args.push(subjectId || null);
      }
      if (type !== undefined) {
        updates.push("type = ?");
        args.push(type || null);
      }
      if (term !== undefined) {
        updates.push("term = ?");
        args.push(term || school.current_term);
      }
      if (session !== undefined) {
        updates.push("academic_session = ?");
        args.push(session || school.academic_session);
      }
      if (date !== undefined) {
        updates.push("date = ?");
        args.push(date || null);
      }
      if (durationMinutes !== undefined) {
        updates.push("duration_minutes = ?");
        args.push(durationMinutes || null);
      }
      if (totalMarks !== undefined) {
        updates.push("total_marks = ?");
        args.push(totalMarks || null);
      }
      if (instructions !== undefined) {
        updates.push("instructions = ?");
        args.push(instructions || null);
      }
      if (status !== undefined) {
        updates.push("status = ?");
        args.push(status);
      }

      if (updates.length === 0) return badRequest("No fields to update");
      if (status !== undefined) {
        await ensureExamStatusColumn();
      }

      updates.push("updated_at = datetime('now')");
      args.push(id);

      await execute(
        `UPDATE exams SET ${updates.join(", ")} WHERE id = ?`,
        args
      );

      return ok({ message: "Exam updated", id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_admin", "vp_academics", "school_owner", "admin_staff", "subject_teacher", "class_teacher"]
);

export const DELETE = withAuth(
  requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";

      const exam = await queryOne("SELECT id FROM exams WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!exam) return notFound("Exam not found");

      await execute("DELETE FROM exams WHERE id = ?", [id]);
      return ok({ message: "Exam deleted", id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_admin", "vp_academics", "school_owner"]
);
