import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, created, ok, notFound, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

const PAYROLL_MANAGERS = [
  "school_owner",
  "principal",
  "vp_admin",
  "vp_academics",
  "admin_staff",
  "bursar",
];

const TEACHER_ROLES = ["class_teacher", "subject_teacher"];

export const dynamic = "force-dynamic";

export const GET = withAuth(
  requireService("payroll", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const url = new URL(req.url);
      const teacherId = url.searchParams.get("teacherId");

      if (user?.role && TEACHER_ROLES.includes(user.role)) {
        const rows = await query(
          `SELECT pt.*, u.name as teacher_name, u.email as teacher_email
           FROM payroll_transactions pt
           LEFT JOIN users u ON u.id = pt.teacher_id
           WHERE pt.school_id = ? AND pt.teacher_id = ?
           ORDER BY pt.payment_date DESC, pt.created_at DESC`,
          [school.id, user.id]
        );
        const total = rows.reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
        return ok({ teacherId: user.id, teacherName: user.name, totalPaid: total, payments: rows });
      }

      if (!user?.role || !PAYROLL_MANAGERS.includes(user.role)) {
        return forbidden("Not authorized to view payroll records");
      }

      const params: any[] = [school.id];
      let sql = `SELECT pt.*, u.name as teacher_name, u.email as teacher_email
                 FROM payroll_transactions pt
                 LEFT JOIN users u ON u.id = pt.teacher_id
                 WHERE pt.school_id = ?`;

      if (teacherId) {
        sql += ` AND pt.teacher_id = ?`;
        params.push(teacherId);
      }

      sql += ` ORDER BY pt.payment_date DESC, pt.created_at DESC`;

      const rows = await query(sql, params);
      const total = rows.reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
      return ok({ totalPaid: total, payments: rows });
    } catch (err) {
      return serverError(err);
    }
  })
);

export const POST = withAuth(
  requireService("payroll", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      if (!user?.role || !PAYROLL_MANAGERS.includes(user.role)) {
        return forbidden("Not authorized to create payroll payments");
      }

      const payload = await req.json();
      const teacherId = String(payload.teacherId || "").trim();
      const amount = Number(payload.amount);
      const paymentMethod = String(payload.paymentMethod || "").trim();
      const note = String(payload.note || "").trim();
      const reference = String(payload.reference || "").trim() || null;
      const paymentDate = String(payload.paymentDate || new Date().toISOString().slice(0, 10)).trim();

      if (!teacherId || !amount || amount <= 0 || !paymentMethod) {
        return badRequest("teacherId, amount and paymentMethod are required");
      }

      const teacher = await queryOne<{ id: string; name: string }>(
        `SELECT id, name FROM users WHERE id = ? AND school_id = ? AND role IN ('class_teacher','subject_teacher')`,
        [teacherId, school.id]
      );
      if (!teacher) {
        return notFound("Teacher not found");
      }

      const id = generateId();
      await execute(
        `INSERT INTO payroll_transactions
           (id, school_id, teacher_id, amount, payment_date, payment_method, reference, note, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, date(?), ?, ?, ?, 'completed', datetime('now'), datetime('now'))`,
        [id, school.id, teacherId, amount, paymentDate, paymentMethod, reference, note]
      );

      return created({
        id,
        schoolId: school.id,
        teacherId,
        teacherName: teacher.name,
        amount,
        paymentDate,
        paymentMethod,
        reference,
        note,
        status: "completed",
      });
    } catch (err) {
      return serverError(err);
    }
  })
);
