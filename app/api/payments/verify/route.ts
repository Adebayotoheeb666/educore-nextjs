import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { verifyTransaction } from "@/lib/services/payments/paystack";
import { generateId } from "@/lib/utils/id";

// GET /api/payments/verify?reference=EDU-...
export const GET = withAuth(
  requireService("payments", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const reference = new URL(req.url).searchParams.get("reference");
      if (!reference) return badRequest("reference is required");

      const result = await verifyTransaction(reference);

      if (!result.status || !result.data) {
        return badRequest(result.message ?? "Verification failed");
      }

      const { status, amount, metadata, paid_at, channel } = result.data;

      if (status !== "success") {
        return ok({ verified: false, status, reference });
      }

      const meta = metadata as Record<string, unknown> | undefined;
      const feeId = meta?.fee_id as string | undefined;
      const studentId = meta?.student_id as string | undefined;

      // Idempotent: skip if already recorded
      const existing = await queryOne(
        "SELECT id FROM fee_payments WHERE reference = ?",
        [reference]
      );

      if (!existing && feeId && studentId) {
        await execute(
          `INSERT INTO fee_payments
             (id, school_id, fee_id, student_id, amount_paid, payment_date, payment_method, reference, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, date(?), 'online', ?, 'completed', datetime('now'), datetime('now'))`,
          [
            generateId(),
            school.id,
            feeId,
            studentId,
            amount / 100, // kobo → naira
            paid_at,
            reference,
          ]
        );
      }

      return ok({
        verified: true,
        status,
        reference,
        amount: amount / 100,
        channel,
        alreadyRecorded: !!existing,
      });
    } catch (err) {
      return serverError(err);
    }
  })
);
