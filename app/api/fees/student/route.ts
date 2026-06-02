import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/fees/student?studentId=xxx — fee schedules with payment status for a student
export const GET = withAuth(
  requireService("fees", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const studentId = new URL(req.url).searchParams.get("studentId") ?? "";
      if (!studentId) return badRequest("studentId is required");

      const fees = await query<{
        id: string; name: string; amount: number; due_date: string | null;
        paid_amount: number | null; is_paid: number;
      }>(
        `SELECT f.id, f.name, f.amount, f.due_date,
                COALESCE(SUM(fp.amount_paid), 0) as paid_amount,
                CASE WHEN COALESCE(SUM(fp.amount_paid), 0) >= f.amount THEN 1 ELSE 0 END as is_paid
         FROM fees f
         LEFT JOIN fee_payments fp ON fp.fee_id = f.id AND fp.student_id = ? AND fp.status = 'completed'
         WHERE f.school_id = ?
           AND (f.class_id IS NULL OR f.class_id = (SELECT class_id FROM users WHERE id = ?))
         GROUP BY f.id
         ORDER BY f.due_date ASC, f.created_at DESC`,
        [studentId, school.id, studentId]
      );

      return ok(fees);
    } catch (err) {
      return serverError(err);
    }
  }),
  ["parent", "student", "admin", "school_owner", "bursar"]
);
