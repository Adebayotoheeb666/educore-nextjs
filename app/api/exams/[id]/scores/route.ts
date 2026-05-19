import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

interface ScoreRow { student: string; caScore?: number; examScore?: number; }

export const POST = withAuth(
  requireService("exams", async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const examId = params?.id ?? "";
      const { scores } = await req.json();
      if (!Array.isArray(scores)) return badRequest("scores array required");

      const exam = await queryOne<{ subject_id: string | null; class_id: string | null; term: string; academic_session: string }>(
        "SELECT subject_id, class_id, term, academic_session FROM exams WHERE id = ? AND school_id = ?",
        [examId, school.id]
      );
      if (!exam) return notFound("Exam not found");

      let count = 0;
      for (const row of scores as ScoreRow[]) {
        if (!row.student) continue;
        const total = (row.caScore ?? 0) + (row.examScore ?? 0);
        const existing = await queryOne(
          "SELECT id FROM results WHERE exam_id = ? AND student_id = ? AND school_id = ?",
          [examId, row.student, school.id]
        );
        if (existing) {
          await execute(
            "UPDATE results SET ca_score = ?, exam_score = ?, total_score = ?, updated_at = datetime('now') WHERE id = ?",
            [row.caScore ?? null, row.examScore ?? null, total, (existing as { id: string }).id]
          );
        } else {
          await execute(
            `INSERT INTO results (id, school_id, student_id, class_id, subject_id, exam_id, term, academic_session, ca_score, exam_score, total_score, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [generateId(), school.id, row.student, exam.class_id, exam.subject_id, examId,
             exam.term, exam.academic_session, row.caScore ?? null, row.examScore ?? null, total]
          );
        }
        count++;
      }

      return ok({ message: `Scores entered for ${count} student(s)`, count });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["subject_teacher", "class_teacher"]
);
