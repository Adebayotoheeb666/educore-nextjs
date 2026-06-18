import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { hashPassword } from "@/lib/utils/password";
import { generateToken } from "@/lib/utils/jwt";
import { setAuthCookie } from "@/lib/utils/cookies";
import { generateId } from "@/lib/utils/id";
import { badRequest, conflict, serverError } from "@/lib/utils/response";
import { normalizePhone } from "@/lib/utils/string";
import { seedServices, activateCompulsoryServices } from "@/lib/services/seedServices";
import { initializeTransaction } from "@/lib/services/payments/paystack";
import { getServiceBySlug, validateDependencies } from "@/config/services/catalog";
import { withRateLimit } from "@/lib/middleware/rateLimit";

export const dynamic = "force-dynamic";

// 5 registrations per hour per IP
export const POST = withRateLimit(
  { prefix: "register", limit: 5, windowSecs: 3600 },
  async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const {
      schoolName,
      schoolSubDomain,
      name,
      firstName,
      lastName,
      email,
      password,
      phone,
      phoneNumber,
      selectedServices = [], // optional service slugs chosen at signup
    } = body ?? {};

    const finalName = name || `${firstName || ""} ${lastName || ""}`.trim();
    const finalPhone = phone || phoneNumber;
    const finalSubDomain =
      schoolSubDomain ||
      schoolName?.toLowerCase().replace(/\s+/g, "-") ||
      null;

    if (!schoolName || !finalName || !password) {
      return badRequest("Please fill in all required fields");
    }

    const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
    const normalizedPhone = finalPhone ? normalizePhone(finalPhone) : null;

    if (!normalizedEmail && !normalizedPhone) {
      return badRequest("Please provide either an email or phone number to register");
    }

    // Check uniqueness for provided contact
    if (normalizedEmail) {
      const [existing] = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
      if (existing) return conflict("Email has already been registered");
    }
    if (normalizedPhone) {
      const [existingPhone] = await query("SELECT id FROM users WHERE phone = ?", [normalizedPhone]);
      if (existingPhone) return conflict("Phone number has already been registered");
    }

    // Determine optional services to activate (and their cost)
    const missingDeps = Array.isArray(selectedServices) ? validateDependencies(selectedServices) : [];
    const toActivate = Array.isArray(selectedServices) ? [...new Set([...selectedServices, ...missingDeps])] : [];

    // Calculate total cost (monthly) for selected optional services
    let totalCost = 0;
    for (const slug of toActivate) {
      const catalogEntry = getServiceBySlug(slug);
      if (catalogEntry && !catalogEntry.is_compulsory) totalCost += catalogEntry.base_price;
    }

    // If there are paid services, create a pending registration and initialize a transaction
    if (totalCost > 0) {
      // ensure pending_registrations table exists
      await execute(`CREATE TABLE IF NOT EXISTS pending_registrations (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        name TEXT,
        school_name TEXT,
        email TEXT,
        phone TEXT,
        password_hash TEXT,
        selected_services TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`, []);

      const registrationId = generateId();
      const hashed = await hashPassword(password);
      await execute(
        `INSERT INTO pending_registrations (id, first_name, last_name, name, school_name, email, phone, password_hash, selected_services)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [registrationId, firstName || null, lastName || null, finalName, schoolName, normalizedEmail, normalizedPhone || null, hashed, JSON.stringify(toActivate)]
      );

      // Initialize Paystack transaction with metadata pointing to registrationId
      const reference = `REG-${generateId()}`;
      const init = await initializeTransaction({
        email: normalizedEmail || "no-reply@educore.ng",
        amount: totalCost,
        reference,
        metadata: { registration_id: registrationId, type: "registration" },
        // callback_url can point to a frontend page which checks registration status
      });

      if (!init || !init.data?.authorization_url) {
        return serverError(new Error("Failed to initialize payment"));
      }

      return NextResponse.json({
        requiresPayment: true,
        authorizationUrl: init.data.authorization_url,
        reference: init.data.reference,
        registrationId,
      }, { status: 200 });
    }

    // Seed global service catalog (idempotent)
    await seedServices();

    const schoolId = generateId();
    const userId = generateId();
    const userEmail = normalizedEmail || `${generateId()}@no-reply.educore`;

    const hashedPassword = await hashPassword(password);

    await execute(
      `INSERT INTO schools (id, name, email, phone, owner_id, sub_domain, subscription_status, subscription_plan, ai_token_budget, used_ai_tokens, academic_session, current_term, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'trial', 'basic', 100000, 0, '2024/2025', 'first', datetime('now'), datetime('now'))`,
      [schoolId, schoolName, normalizedEmail || null, normalizedPhone || null, userId, finalSubDomain]
    );

    await execute(
      `INSERT INTO users (id, name, first_name, last_name, email, password, role, school_id, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'school_owner', ?, ?, 1, datetime('now'), datetime('now'))`,
      [userId, finalName, firstName || null, lastName || null, userEmail, hashedPassword, schoolId, normalizedPhone || null]
    );

    // Activate compulsory services for the new school
    await activateCompulsoryServices(schoolId, userId);

    // Activate any optional services the school selected at signup
    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      // Validate all dependencies are satisfied within the selection
      const missingDeps = validateDependencies(selectedServices);
      // Auto-include any missing dependencies silently
      const toActivate = [...new Set([...selectedServices, ...missingDeps])];

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
          [ssId, schoolId, svcRow[0].id, catalogEntry.base_price, userId]
        );
      }
    }

    const token = generateToken(userId);
    const response = NextResponse.json(
      {
        _id: userId,
        name: finalName,
        firstName: firstName || null,
        lastName: lastName || null,
        email: normalizedEmail,
        role: "school_owner",
        avatar: null,
        token,
      },
      { status: 201 }
    );

    return setAuthCookie(response, token);
  } catch (err) {
    return serverError(err);
  }
});
