import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  requireService("exams", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { searchParams } = new URL(req.url);
      const subjectId = searchParams.get("subject");
      const classId = searchParams.get("class");
      const difficulty = searchParams.get("difficulty");
      const type = searchParams.get("type");

      let sql = `
        SELECT q.*, s.name as subject_name, c.name as class_name
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN classes c ON q.class_id = c.id
        WHERE q.school_id = ?
      `;
      const args: (string | number | boolean | null)[] = [school.id];

      if (subjectId) {
        sql += " AND q.subject_id = ?";
        args.push(subjectId);
      }
      if (classId) {
        sql += " AND q.class_id = ?";
        args.push(classId);
      }
      if (difficulty) {
        sql += " AND q.difficulty = ?";
        args.push(difficulty);
      }
      if (type) {
        sql += " AND q.type = ?";
        args.push(type);
      }

      sql += " ORDER BY q.created_at DESC";
      const questions = await query(sql, args);
      return ok(questions);
    } catch (err) {
      return serverError(err);
    }
  })
);

export const POST = withAuth(
  requireService("exams", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { subjectId, classId, type, difficulty, questionText, instructions, options, correctAnswer, explanation, marks, bloomLevel, tags } = await req.json();

      if (!subjectId || !type || !difficulty || !questionText) {
        return badRequest("subjectId, type, difficulty, and questionText are required");
      }

      const id = generateId();
      await execute(
        `INSERT INTO questions (id, school_id, subject_id, class_id, type, difficulty, question_text, instructions, options, correct_answer, explanation, marks, bloom_level, tags, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          id, school.id, subjectId, classId || null, type, difficulty, questionText, instructions || null,
          options ? JSON.stringify(options) : null, correctAnswer || null, explanation || null, marks || 1,
          bloomLevel || null, tags || null, user.id
        ]
      );

      return created({ id, questionText });
    } catch (err) {
      return serverError(err);
    }
  })
);
