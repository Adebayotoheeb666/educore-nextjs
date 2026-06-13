import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, created, notFound, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const VALID_TERMS = ["First Term", "Second Term", "Third Term"];

function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 5);
}

function validateSlotFields(data: any) {
  return (
    data.classId &&
    data.subjectId &&
    data.day && VALID_DAYS.includes(data.day) &&
    data.startTime &&
    data.endTime &&
    data.term && VALID_TERMS.includes(data.term)
  );
}

async function readJsonBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// GET /api/timetable?classId=&term=
export const GET = withAuth(requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const term = searchParams.get("term");

    const args: (string | number | boolean | null)[] = [school.id];
    let filters = "";
    if (classId) { filters += " AND t.class_id = ?"; args.push(classId); }
    if (term)    { filters += " AND t.term = ?"; args.push(term); }

    const slots = await query(
      `SELECT t.*, c.name as class_name, c.section, s.name as subject_name, u.name as teacher_name
       FROM timetable t
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN users u ON t.teacher_id = u.id
       WHERE t.school_id = ? ${filters}
       ORDER BY t.day, t.start_time`,
      args
    );

    return ok(slots.length ? slots : null);
  } catch (err) {
    return serverError(err);
  }
}));

export const POST = withAuth(
  requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const body = await req.json();
      const classId = body.classId?.toString();
      const subjectId = body.subjectId?.toString();
      const teacherId = body.teacherId ? body.teacherId.toString() : null;
      const day = body.day?.toString();
      const startTime = normalizeTime(body.startTime);
      const endTime = normalizeTime(body.endTime);
      const term = body.term?.toString();

      if (!validateSlotFields({ classId, subjectId, day, startTime, endTime, term })) {
        return badRequest("Missing or invalid timetable slot fields");
      }

      const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
      if (!classDoc) return notFound("Class not found");

      const subjectDoc = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subjectDoc) return notFound("Subject not found");

      if (teacherId) {
        const teacherDoc = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ?", [teacherId, school.id]);
        if (!teacherDoc) return notFound("Teacher not found");
      }

      const id = generateId();
      await execute(
        `INSERT INTO timetable (id, school_id, class_id, subject_id, teacher_id, day, start_time, end_time, term, academic_session, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, school.id, classId, subjectId, teacherId, day, startTime, endTime, term, school.academic_session]
      );

      return created({ id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics", "school_owner"]
);

export const PUT = withAuth(
  requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const body = await req.json();
      const id = body.id?.toString();
      const subjectId = body.subjectId?.toString();
      const teacherId = body.teacherId ? body.teacherId.toString() : null;
      const day = body.day?.toString();
      const startTime = normalizeTime(body.startTime);
      const endTime = normalizeTime(body.endTime);
      const term = body.term?.toString();

      if (!id || !validateSlotFields({ classId: body.classId, subjectId, day, startTime, endTime, term })) {
        return badRequest("Missing or invalid timetable slot fields");
      }

      const existingSlot = await queryOne("SELECT id FROM timetable WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existingSlot) return notFound("Timetable slot not found");

      const subjectDoc = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subjectDoc) return notFound("Subject not found");

      if (teacherId) {
        const teacherDoc = await queryOne("SELECT id FROM users WHERE id = ? AND school_id = ?", [teacherId, school.id]);
        if (!teacherDoc) return notFound("Teacher not found");
      }

      await execute(
        `UPDATE timetable SET subject_id = ?, teacher_id = ?, day = ?, start_time = ?, end_time = ?, term = ?, updated_at = datetime('now')
         WHERE id = ? AND school_id = ?`,
        [subjectId, teacherId, day, startTime, endTime, term, id, school.id]
      );

      return ok({ id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics", "school_owner"]
);

export const DELETE = withAuth(
  requireService("timetable", async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const body = await readJsonBody(req);
      const id = body.id?.toString() || new URL(req.url).searchParams.get("id")?.toString();
      if (!id) return badRequest("timetable slot id is required");

      const existingSlot = await queryOne("SELECT id FROM timetable WHERE id = ? AND school_id = ?", [id, school.id]);
      if (!existingSlot) return notFound("Timetable slot not found");

      await execute("DELETE FROM timetable WHERE id = ? AND school_id = ?", [id, school.id]);
      return ok({ id });
    } catch (err) {
      return serverError(err);
    }
  }),
  ["principal", "vp_academics", "school_owner"]
);
