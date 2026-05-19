import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { hashPassword } from "@/lib/utils/password";
import { generateToken } from "@/lib/utils/jwt";
import { setAuthCookie } from "@/lib/utils/cookies";
import { generateId } from "@/lib/utils/id";
import { badRequest, conflict, serverError } from "@/lib/utils/response";
import { seedServices, activateCompulsoryServices } from "@/lib/services/seedServices";
import { getServiceBySlug, validateDependencies } from "@/config/services/catalog";
import { withRateLimit } from "@/lib/middleware/rateLimit";

// 5 registrations per hour per IP
export const POST = withRateLimit(
  { prefix: "register", limit: 5, windowSecs: 3600 },
  async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
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
    } = body;

    const finalName = name || `${firstName || ""} ${lastName || ""}`.trim();
    const finalPhone = phone || phoneNumber;
    const finalSubDomain =
      schoolSubDomain ||
      schoolName?.toLowerCase().replace(/\s+/g, "-") ||
      null;

    if (!schoolName || !finalName || !email || !password) {
      return badRequest("Please fill in all required fields");
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check email uniqueness
    const [existing] = await query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );
    if (existing) return conflict("Email has already been registered");

    // Create school
    const schoolId = generateId();
    await execute(
      `INSERT INTO schools (id, name, sub_domain, subscription_status, subscription_plan, ai_token_budget, used_ai_tokens, academic_session, current_term, created_at, updated_at)
       VALUES (?, ?, ?, 'trial', 'basic', 100000, 0, '2024/2025', 'first', datetime('now'), datetime('now'))`,
      [schoolId, schoolName, finalSubDomain]
    );

    // Create school_owner user
    const userId = generateId();
    const hashedPassword = await hashPassword(password);
    await execute(
      `INSERT INTO users (id, name, first_name, last_name, email, password, role, school_id, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'school_owner', ?, ?, 1, datetime('now'), datetime('now'))`,
      [userId, finalName, firstName || null, lastName || null, normalizedEmail, hashedPassword, schoolId, finalPhone || null]
    );

    // Link school owner
    await execute("UPDATE schools SET owner_id = ? WHERE id = ?", [userId, schoolId]);

    // Seed global service catalog (idempotent) then activate compulsory services
    await seedServices();
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
