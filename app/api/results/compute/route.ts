import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

function gradeFromScore(score: number): { grade: string; remark: string } {
  if (score >= 70) return { grade: "A", remark: "Excellent" };
  if (score >= 60) return { grade: "B", remark: "Very Good" };
  if (score >= 50) return { grade: "C", remark: "Good" };
  if (score >= 45) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

// POST /api/results/compute
export const POST = withAuth(
  requireService("results", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { classId, term, session } = await req.json();
      if (!classId || !term || !session) return badRequest("classId, term, and session are required");

      // Assign grades to existing ungraded results
      const ungraded = await query<{ id: string; total_score: number }>(
        "SELECT id, total_score FROM results WHERE school_id = ? AND class_id = ? AND term = ? AND academic_session = ? AND grade IS NULL",
        [school.id, classId, term, session]
      );

      let count = 0;
      for (const r of ungraded) {
        const { grade, remark } = gradeFromScore(r.total_score ?? 0);
        await execute(
          "UPDATE results SET grade = ?, remark = ?, updated_at = datetime('now') WHERE id = ?",
          [grade, remark, r.id]
        );
        count++;
      }

      // Compute position per subject
      const subjects = await query<{ id: string }>(
        "SELECT DISTINCT subject_id as id FROM results WHERE school_id = ? AND class_id = ? AND term = ? AND academic_session = ?",
        [school.id, classId, term, session]
      );

      for (const sub of subjects) {
        const subResults = await query<{ id: string; total_score: number }>(
          "SELECT id, total_score FROM results WHERE school_id = ? AND class_id = ? AND subject_id = ? AND term = ? AND academic_session = ? ORDER BY total_score DESC",
          [school.id, classId, sub.id, term, session]
        );
        for (let i = 0; i < subResults.length; i++) {
          await execute("UPDATE results SET position = ? WHERE id = ?", [i + 1, subResults[i].id]);
        }
      }

      return ok({ message: `Results computed for ${count} records`, count });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["school_owner", "principal", "vp_academics", "vp_admin", "admin_staff"]
);
