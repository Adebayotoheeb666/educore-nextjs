import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { verifyTransaction } from "@/lib/services/payments/paystack";
import { generateId } from "@/lib/utils/id";

// GET /api/services/verify-payment?reference=SVC-...
export const GET = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const reference = new URL(req.url).searchParams.get("reference");
      if (!reference) return badRequest("reference is required");

      // Verify transaction with Paystack
      const result = await verifyTransaction(reference);

      if (!result.status || !result.data) {
        return badRequest(result.message ?? "Verification failed");
      }

      const { status, amount, metadata, paid_at, channel } = result.data;

      if (status !== "success") {
        return ok({ verified: false, status, reference });
      }

      const meta = metadata as Record<string, unknown> | undefined;
      const serviceId = meta?.service_id as string | undefined;
      const serviceSlug = meta?.service_slug as string | undefined;
      const schoolId = meta?.school_id as string | undefined;

      if (schoolId !== school.id) {
        return badRequest("School ID mismatch - payment does not belong to this school");
      }

      // Idempotent: skip if already recorded
      const existing = await queryOne(
        "SELECT id, status FROM billing_history WHERE reference = ?",
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

        // Update school_services to activate the service
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

      return ok({
        verified: true,
        status,
        reference,
        amount: amount / 100,
        channel,
        serviceSlug,
        alreadyRecorded: !!existing,
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["school_owner", "principal", "super_admin"]
);
