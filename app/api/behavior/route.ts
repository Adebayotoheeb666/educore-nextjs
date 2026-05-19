import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const GET = withAuth(requireService("behavior", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student");
    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (studentId) { filters += " AND b.student_id = ?"; args.push(studentId); }

    const logs = await query(
      `SELECT b.*, u.name as student_name, r.name as recorded_by_name
       FROM behavior_logs b
       JOIN users u ON b.student_id = u.id
       LEFT JOIN users r ON b.recorded_by = r.id
       WHERE b.school_id = ? ${filters}
       ORDER BY b.date DESC`,
      args
    );
    return ok(logs);
  } catch (err) { return serverError(err); }
}));

export const POST = withAuth(requireService("behavior", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { studentId, type, category, description, actionTaken, date } = await req.json();
    if (!studentId || !type || !description) return badRequest("studentId, type, and description are required");

    const id = generateId();
    await execute(
      `INSERT INTO behavior_logs (id, school_id, student_id, recorded_by, type, category, description, action_taken, date, term, academic_session, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, school.id, studentId, user.id, type, category || null, description, actionTaken || null,
       date || new Date().toISOString().split("T")[0], school.current_term, school.academic_session]
    );
    return created({ id, message: "Behavior log recorded" });
  } catch (err) { return serverError(err); }
}));
