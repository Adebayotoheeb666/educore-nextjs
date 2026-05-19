import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

// POST /api/timetable/generate — basic auto-generate (AI version deferred to /api/ai)
export const POST = withAuth(
  requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { classId, term } = await req.json();
      if (!classId || !term) return badRequest("classId and term are required");

      const classDoc = await queryOne("SELECT id, name FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const subjects = await query<{ id: string; teacher_id: string | null }>(
        "SELECT s.id, st.teacher_id FROM subjects s LEFT JOIN subject_teachers st ON st.subject_id = s.id WHERE s.school_id = ? AND (s.class_id = ? OR s.class_id IS NULL) LIMIT 35",
        [school.id, classId]
      );

      // Delete existing timetable for this class/term
      await execute(
        "DELETE FROM timetable WHERE school_id = ? AND class_id = ? AND term = ?",
        [school.id, classId, term]
      );

      // Basic round-robin assignment
      let subIdx = 0;
      const inserted: unknown[] = [];
      for (const day of DAYS) {
        for (const startTime of PERIODS.slice(0, 7)) {
          const sub = subjects[subIdx % subjects.length];
          if (!sub) continue;
          const endHour = parseInt(startTime.split(":")[0]) + 1;
          const endTime = `${String(endHour).padStart(2, "0")}:00`;
          const id = generateId();
          await execute(
            `INSERT INTO timetable (id, school_id, class_id, subject_id, teacher_id, day, start_time, end_time, term, academic_session, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [id, school.id, classId, sub.id, sub.teacher_id, day, startTime, endTime, term, school.academic_session]
          );
          inserted.push({ day, startTime, subjectId: sub.id });
          subIdx++;
        }
      }

      return ok({ message: `Timetable generated with ${inserted.length} slots`, classId, term });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics", "school_owner"]
);
