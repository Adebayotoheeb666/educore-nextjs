import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne, query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

const FEE_PAYMENT_ROLES = [
  "principal",
  "bursar",
  "school_owner",
  "vp_admin",
  "vp_academics",
  "admin_staff",
  "super_admin",
];

export const GET = withAuth(
  requireService("fees", async (_req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const payments = await query(
        `SELECT fp.id, u.name AS student_name, f.name AS fee_title,
                fp.amount_paid, fp.payment_method, fp.reference, fp.payment_date
         FROM fee_payments fp
         JOIN users u ON u.id = fp.student_id
         JOIN fees f ON f.id = fp.fee_id
         WHERE fp.school_id = ? AND fp.status = 'completed'
         ORDER BY fp.payment_date DESC, fp.created_at DESC`,
        [school.id]
      );
      const totalRow = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(amount_paid),0) as total FROM fee_payments WHERE school_id = ? AND status = 'completed'`,
        [school.id]
      );
      return ok({ payments, totalCollected: totalRow?.total ?? 0 });
    } catch (err) {
      return serverError(err);
    }
  }),
  FEE_PAYMENT_ROLES
);

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
  FEE_PAYMENT_ROLES
);
