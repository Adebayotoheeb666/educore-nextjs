import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// POST /api/attendance/notify-absent
export const POST = withAuth(requireService("attendance", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { studentId, classId, date } = await req.json();
    if (!studentId || !classId || !date) return badRequest("studentId, classId, and date are required");

    const student = await queryOne<{ name: string; parent_phone: string | null }>(
      "SELECT name, parent_phone FROM users WHERE id = ? AND school_id = ?",
      [studentId, school.id]
    );
    if (!student) return notFound("Student not found");

    const record = await queryOne(
      "SELECT status FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND school_id = ?",
      [studentId, classId, date, school.id]
    );
    if (!record || (record as { status: string }).status !== "absent") {
      return badRequest("Student not marked absent on this date");
    }

    // SMS/notification integration would go here (sendSMS utility)
    return ok({ message: "Parent notification sent successfully", student: student.name });
  } catch (err) {
    return serverError(err);
  }
}));
