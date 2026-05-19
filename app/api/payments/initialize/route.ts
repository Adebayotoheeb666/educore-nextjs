import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { initializeTransaction } from "@/lib/services/payments/paystack";
import { generateId } from "@/lib/utils/id";

// POST /api/payments/initialize
// Body: { studentId, feeId, amount?, callbackUrl? }
export const POST = withAuth(
  requireService("payments", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");

      const { studentId, feeId, callbackUrl } = await req.json();
      if (!studentId || !feeId) return badRequest("studentId and feeId are required");

      const student = await queryOne<{ id: string; name: string; email: string }>(
        "SELECT id, name, email FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
        [studentId, school.id]
      );
      if (!student) return notFound("Student not found");

      const fee = await queryOne<{ id: string; name: string; amount: number }>(
        "SELECT id, name, amount FROM fees WHERE id = ? AND school_id = ?",
        [feeId, school.id]
      );
      if (!fee) return notFound("Fee schedule not found");

      const reference = `EDU-${generateId().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const result = await initializeTransaction({
        email: student.email,
        amount: fee.amount,
        reference,
        callback_url: callbackUrl ?? `${appUrl}/fees/collection?ref=${reference}&status=success`,
        metadata: {
          school_id: school.id,
          fee_id: feeId,
          student_id: studentId,
          student_name: student.name,
          fee_name: fee.name,
          custom_fields: [
            { display_name: "Student", variable_name: "student_name", value: student.name },
            { display_name: "Fee", variable_name: "fee_name", value: fee.name },
          ],
        },
      });

      if (!result.status || !result.data) {
        return badRequest(result.message ?? "Paystack initialization failed");
      }

      return ok({
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
        amount: fee.amount,
        studentName: student.name,
        feeName: fee.name,
      });
    } catch (err) {
      return serverError(err);
    }
  })
);
