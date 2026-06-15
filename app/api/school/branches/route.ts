import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { ok, created, badRequest, notFound, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    const branches = await query(
      `SELECT id, name, email, phone, state, type, address, subscription_status, subscription_plan, academic_session, current_term, created_at, updated_at
       FROM schools WHERE owner_id = ? ORDER BY created_at DESC`,
      [user.id]
    );
    return ok(branches);
  } catch (err) {
    return serverError(err);
  }
}, ["school_owner"]);

export const POST = withAuth(async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const state = body.state ? String(body.state).trim() : null;
    const type = body.type ? String(body.type).trim() : null;
    const address = body.address ? String(body.address).trim() : null;

    if (!name) {
      return badRequest("Branch name is required");
    }

    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO schools (id, name, email, phone, state, type, address, owner_id, subscription_status, subscription_plan, academic_session, current_term, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', 'basic', '2024/2025', 'first', datetime('now'), datetime('now'))`,
      [id, name, email, phone, state, type, address, user.id]
    );

    const createdBranch = await queryOne(
      `SELECT id, name, email, phone, state, type, address, subscription_status, subscription_plan, academic_session, current_term, created_at, updated_at
       FROM schools WHERE id = ?`,
      [id]
    );

    return created(createdBranch);
  } catch (err) {
    return serverError(err);
  }
}, ["school_owner"]);

export const PATCH = withAuth(async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const branchId = String(body.branchId || "").trim();
    if (!branchId) {
      return badRequest("branchId is required");
    }

    const branch = await queryOne(`SELECT id FROM schools WHERE id = ? AND owner_id = ?`, [branchId, user.id]);
    if (!branch) {
      return notFound("Branch not found");
    }

    await execute(`UPDATE users SET school_id = ? WHERE id = ?`, [branchId, user.id]);
    return ok({ branchId });
  } catch (err) {
    return serverError(err);
  }
}, ["school_owner"]);
