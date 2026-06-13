import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
}

// POST /api/attendance — mark/update attendance for a class on a date
export const POST = withAuth(
  requireService("attendance", async (req: NextRequest, { school, user }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { classId, date, term, session, records } = await req.json();

      if (!classId || !date || !Array.isArray(records)) {
        return badRequest("classId, date, and records are required");
      }

      const academicSession = session || school.academic_session;
      const currentTerm = term || school.current_term;

      for (const rec of records as AttendanceRecord[]) {
        const existing = await queryOne(
          "SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND term = ? AND academic_session = ?",
          [rec.studentId, classId, date, currentTerm, academicSession]
        );

        if (existing) {
          await execute(
            "UPDATE attendance SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
            [rec.status, rec.notes || null, (existing as { id: string }).id]
          );
        } else {
          await execute(
            `INSERT INTO attendance (id, school_id, class_id, student_id, date, status, term, academic_session, recorded_by, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [generateId(), school.id, classId, rec.studentId, date, rec.status,
             currentTerm, academicSession, user.id, rec.notes || null]
          );
        }
      }

      return ok({ message: `Attendance marked for ${records.length} students`, date, classId });
    } catch (err) {
      return serverError(err);
    }
  })
);
