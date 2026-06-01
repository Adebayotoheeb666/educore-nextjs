import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execute, queryOne } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";

// POST /api/services/webhook/paystack
// Paystack sends HMAC-SHA512 signature in x-paystack-signature header
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify HMAC signature
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

      const serviceId = metadata?.service_id as string | undefined;
      const serviceSlug = metadata?.service_slug as string | undefined;
      const schoolId = metadata?.school_id as string | undefined;

      // Idempotent: skip if already recorded
      const existing = await queryOne(
        "SELECT id FROM billing_history WHERE reference = ?",
        [reference]
      );

      if (!existing && serviceId && serviceSlug && schoolId) {
        // Record payment in billing history
        const billingId = generateId();
        await execute(
          `INSERT INTO billing_history
             (id, school_id, service_id, amount, currency, status, reference, description, paid_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'NGN', 'paid', ?, ?, date(?), datetime('now'), datetime('now'))`,
          [
            billingId,
            schoolId,
            serviceId,
            amount / 100, // kobo → naira
            reference,
            `Service activation payment for ${serviceSlug}`,
            paid_at,
          ]
        );

        // Check if school_services record exists
        const schoolService = await queryOne(
          "SELECT id FROM school_services WHERE school_id = ? AND service_id = ?",
          [schoolId, serviceId]
        );

        if (schoolService) {
          // Reactivate existing subscription
          await execute(
            `UPDATE school_services 
             SET status = 'active', subscribed_at = datetime('now'), price_paid = ?, updated_at = datetime('now')
             WHERE school_id = ? AND service_id = ?`,
            [amount / 100, schoolId, serviceId]
          );
        } else {
          // Create new subscription
          const schoolServiceId = generateId();
          await execute(
            `INSERT INTO school_services 
             (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, created_at, updated_at)
             VALUES (?, ?, ?, 'active', datetime('now'), ?, 'monthly', datetime('now'), datetime('now'))`,
            [schoolServiceId, schoolId, serviceId, amount / 100]
          );
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
