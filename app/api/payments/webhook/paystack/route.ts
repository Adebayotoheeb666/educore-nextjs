import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execute, queryOne } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";

// POST /api/payments/webhook/paystack
// Paystack sends HMAC-SHA512 signature in x-paystack-signature header
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const expected = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expected) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const { event, data } = JSON.parse(rawBody);

    if (event === "charge.success") {
      const { reference, amount, metadata, paid_at, channel } = data as {
        reference: string;
        amount: number;
        metadata?: Record<string, unknown>;
        paid_at: string;
        channel: string;
      };

      const feeId = metadata?.fee_id as string | undefined;
      const studentId = metadata?.student_id as string | undefined;
      const schoolId = metadata?.school_id as string | undefined;

      // Idempotent: skip if already recorded
      const existing = await queryOne(
        "SELECT id FROM fee_payments WHERE reference = ?",
        [reference]
      );

      if (!existing && feeId && studentId && schoolId) {
        await execute(
          `INSERT INTO fee_payments
             (id, school_id, fee_id, student_id, amount_paid, payment_date, payment_method, reference, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, date(?), ?, ?, 'completed', datetime('now'), datetime('now'))`,
          [
            generateId(),
            schoolId,
            feeId,
            studentId,
            amount / 100,
            paid_at,
            channel ?? "online",
            reference,
          ]
        );
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
