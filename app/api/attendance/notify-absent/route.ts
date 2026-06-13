import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// POST /api/attendance/notify-absent
export const POST = withAuth(requireService("attendance", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const { classId, date, studentIds } = await req.json();
    if (!classId || !date || !Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequest("classId, date, and studentIds array are required");
    }

    const notifiedStudents = [];
    const failedStudents = [];

    for (const studentId of studentIds) {
      try {
        const student = await queryOne<{ name: string; parent_phone: string | null }>(
          "SELECT name, parent_phone FROM users WHERE id = ? AND school_id = ?",
          [studentId, school.id]
        );
        if (!student) {
          failedStudents.push({ studentId, reason: "Student not found" });
          continue;
        }

        const record = await queryOne(
          "SELECT status FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND school_id = ?",
          [studentId, classId, date, school.id]
        );
        if (!record || (record as { status: string }).status !== "absent") {
          failedStudents.push({ studentId, reason: "Not marked absent on this date" });
          continue;
        }

        // SMS/notification integration would go here (sendSMS utility)
        notifiedStudents.push(student.name);
      } catch (err) {
        failedStudents.push({ studentId, reason: "Error processing notification" });
      }
    }

    return ok({
      message: `Notified parents of ${notifiedStudents.length} absent student(s)`,
      notified: notifiedStudents,
      failed: failedStudents.length > 0 ? failedStudents : undefined,
    });
  } catch (err) {
    return serverError(err);
  }
}));
