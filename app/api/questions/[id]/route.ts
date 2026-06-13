import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const question = await queryOne(
        `SELECT q.*, s.name as subject_name, c.name as class_name
         FROM questions q
         LEFT JOIN subjects s ON q.subject_id = s.id
         LEFT JOIN classes c ON q.class_id = c.id
         WHERE q.id = ? AND q.school_id = ?`,
        [params?.id ?? "", school.id]
      );
      if (!question) return notFound("Question not found");
      return ok(question);
    } catch (err) {
      return serverError(err);
    }
  })
);

export const PATCH = withAuth(
  requireService("exams", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const { subjectId, classId, type, difficulty, questionText, instructions, options, correctAnswer, explanation, marks, bloomLevel, tags } = await req.json();

      const question = await queryOne("SELECT id FROM questions WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!question) return notFound("Question not found");

      const updates: string[] = [];
      const args: (string | number | boolean | null)[] = [];

      if (subjectId !== undefined) {
        updates.push("subject_id = ?");
        args.push(subjectId);
      }
      if (classId !== undefined) {
        updates.push("class_id = ?");
        args.push(classId || null);
      }
      if (type !== undefined) {
        updates.push("type = ?");
        args.push(type);
      }
      if (difficulty !== undefined) {
        updates.push("difficulty = ?");
        args.push(difficulty);
      }
      if (questionText !== undefined) {
        updates.push("question_text = ?");
        args.push(questionText);
      }
      if (instructions !== undefined) {
        updates.push("instructions = ?");
        args.push(instructions || null);
      }
      if (options !== undefined) {
        updates.push("options = ?");
        args.push(options ? JSON.stringify(options) : null);
      }
      if (correctAnswer !== undefined) {
        updates.push("correct_answer = ?");
        args.push(correctAnswer || null);
      }
      if (explanation !== undefined) {
        updates.push("explanation = ?");
        args.push(explanation || null);
      }
      if (marks !== undefined) {
        updates.push("marks = ?");
        args.push(marks || 1);
      }
      if (bloomLevel !== undefined) {
        updates.push("bloom_level = ?");
        args.push(bloomLevel || null);
      }
      if (tags !== undefined) {
        updates.push("tags = ?");
        args.push(tags || null);
      }

      if (updates.length === 0) return badRequest("No fields to update");

      updates.push("updated_at = datetime('now')");
      args.push(id);

      await execute(
        `UPDATE questions SET ${updates.join(", ")} WHERE id = ?`,
        args
      );

      return ok({ message: "Question updated", id });
    } catch (err) {
      return serverError(err);
    }
  })
);

export const DELETE = withAuth(
  requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";

      const question = await queryOne("SELECT id FROM questions WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!question) return notFound("Question not found");

      await execute("DELETE FROM questions WHERE id = ?", [id]);
      return ok({ message: "Question deleted", id });
    } catch (err) {
      return serverError(err);
    }
  })
);
