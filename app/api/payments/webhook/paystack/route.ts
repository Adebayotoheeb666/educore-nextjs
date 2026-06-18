import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execute, queryOne, query } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";
import { seedServices, activateCompulsoryServices } from "@/lib/services/seedServices";
import { getServiceBySlug, validateDependencies } from "@/config/services/catalog";


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

      // If this was a registration payment (metadata.type === 'registration'), create the school and user
      const registrationId = metadata?.registration_id as string | undefined;
      const metaType = metadata?.type as string | undefined;

      if (metaType === "registration" && registrationId) {
        // Fetch pending registration
        const pending = await query(`SELECT * FROM pending_registrations WHERE id = ?`, [registrationId]);
        const row = pending[0];
        if (row) {
          const alreadyUser = await queryOne("SELECT id FROM users WHERE email = ?", [row.email]);
          if (!alreadyUser) {
            const schoolIdNew = generateId();
            await execute(
              `INSERT INTO schools (id, name, sub_domain, subscription_status, subscription_plan, ai_token_budget, used_ai_tokens, academic_session, current_term, created_at, updated_at)
               VALUES (?, ?, ?, 'trial', 'basic', 100000, 0, '2024/2025', 'first', datetime('now'), datetime('now'))`,
              [schoolIdNew, row.school_name, null]
            );

            const userId = generateId();
            await execute(
              `INSERT INTO users (id, name, first_name, last_name, email, password, role, school_id, phone, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'school_owner', ?, ?, 1, datetime('now'), datetime('now'))`,
              [userId, row.name, row.first_name, row.last_name, row.email, row.password_hash, schoolIdNew, row.phone]
            );

            await execute("UPDATE schools SET owner_id = ? WHERE id = ?", [userId, schoolIdNew]);

            // Seed and activate services
            await seedServices();
            await activateCompulsoryServices(schoolIdNew, userId);

            // Activate optional services stored in pending selected_services
            let selected = [] as string[];
            try {
              selected = JSON.parse(row.selected_services || "[]");
            } catch (e) {
              selected = [];
            }
            const missingDeps = validateDependencies(selected);
            const toActivate = [...new Set([...(selected || []), ...missingDeps])];
            for (const slug of toActivate) {
              const catalogEntry = getServiceBySlug(slug);
              if (!catalogEntry || catalogEntry.is_compulsory) continue;

              const svcRow = await query<{ id: string }>(
                "SELECT id FROM services WHERE slug = ? AND is_active = 1",
                [slug]
              );
              if (!svcRow[0]) continue;

              const ssId = generateId();
              await execute(
                `INSERT OR IGNORE INTO school_services (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
                 VALUES (?, ?, ?, 'active', datetime('now'), ?, 'monthly', ?, datetime('now'), datetime('now'))`,
                [ssId, schoolIdNew, svcRow[0].id, catalogEntry.base_price, userId]
              );
            }

            // remove pending registration
            await execute("DELETE FROM pending_registrations WHERE id = ?", [registrationId]);
          }
        }
        return NextResponse.json({ status: "ok" });
      }

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
