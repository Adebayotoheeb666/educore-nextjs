import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth } from "@/lib/middleware/auth";
import { ok, serverError } from "@/lib/utils/response";

// GET /api/admin — super admin overview
export const GET = withAuth(async (_req: NextRequest): Promise<NextResponse> => {
  try {
    const [schools, users, students, teachers, services, recentSchools] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM schools"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE is_active = 1"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND is_active = 1"),
      query("SELECT slug, name, is_compulsory, base_price, is_active FROM services ORDER BY category, name"),
      query("SELECT id, name, created_at, subscription_status FROM schools ORDER BY created_at DESC LIMIT 5"),
    ]);

    const totalSchools = schools?.count ?? 0;
    const totalUsers = users?.count ?? 0;
    const totalStudents = students?.count ?? 0;
    const totalTeachers = teachers?.count ?? 0;

    // Compute platform revenue from billing_history (paid)
    const revenueRow = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount),0) as total FROM billing_history WHERE status = 'paid'`
    );

    // School counts by subscription_status
    const activeSchoolsRow = await queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM schools WHERE subscription_status = 'active'`
    );
    const inactiveSchoolsRow = await queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM schools WHERE subscription_status = 'inactive'`
    );
    const trialSchoolsRow = await queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM schools WHERE subscription_status = 'trial'`
    );

    return ok({
      totals: {
        schools: totalSchools,
        users: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        revenue: revenueRow?.total ?? 0,
        activeSchools: activeSchoolsRow?.c ?? 0,
        inactiveSchools: inactiveSchoolsRow?.c ?? 0,
        trialSchools: trialSchoolsRow?.c ?? 0,
      },
      recentSchools,
      services,
    });
  } catch (err) {
    return serverError(err);
  }
}, ["super_admin"]);
