import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

// POST /api/fees/payment — record a cash/manual payment
export const POST = withAuth(
  requireService("fees", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { feeId, studentId, amountPaid, paymentMethod, reference } = await req.json();
      if (!feeId || !studentId || !amountPaid) return badRequest("feeId, studentId, and amountPaid are required");

      const fee = await queryOne("SELECT id FROM fees WHERE id = ? AND school_id = ?", [feeId, school.id]);
      if (!fee) return notFound("Fee schedule not found");

      const id = generateId();
      await execute(
        `INSERT INTO fee_payments (id, school_id, fee_id, student_id, amount_paid, payment_date, payment_method, reference, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, date('now'), ?, ?, 'completed', datetime('now'), datetime('now'))`,
        [id, school.id, feeId, studentId, amountPaid, paymentMethod || "cash", reference || null]
      );

      return ok({ id, message: "Payment recorded", amountPaid });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["bursar", "parent"]
);
