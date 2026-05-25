import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError, created, conflict } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/subjects/[id]/teachers — Get teachers assigned to a subject
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const subjectId = params?.id ?? "";
    const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
    if (!subject) return notFound("Subject not found");

    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") || school.academic_session;
    const classId = searchParams.get("classId");

    let sql = `SELECT st.*, u.name as teacher_name, u.email, u.phone, c.name as class_name
               FROM subject_teachers st
               LEFT JOIN users u ON st.teacher_id = u.id
               LEFT JOIN classes c ON st.class_id = c.id
               WHERE st.subject_id = ? AND st.academic_session = ?`;
    const params_arr: any[] = [subjectId, session];

    if (classId) {
      sql += ` AND st.class_id = ?`;
      params_arr.push(classId);
    }

    sql += ` ORDER BY c.name, u.name`;

    const assignments = await query(sql, params_arr);
    return ok(assignments);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/subjects/[id]/teachers — Assign teacher to subject + class combination
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { teacherId, classId, academicSession, term } = await req.json();
      const subjectId = params?.id ?? "";

      if (!teacherId) return badRequest("teacherId is required");

      const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subject) return notFound("Subject not found");

      const teacher = await queryOne(
        "SELECT id FROM users WHERE id = ? AND school_id = ? AND role IN ('class_teacher', 'subject_teacher')",
        [teacherId, school.id]
      );
      if (!teacher) return notFound("Teacher not found");

      const session = academicSession || school.academic_session;

      if (classId) {
        const classDoc = await queryOne("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, school.id]);
        if (!classDoc) return notFound("Class not found");
      }

      const existing = await queryOne(
        "SELECT id FROM subject_teachers WHERE subject_id = ? AND teacher_id = ? AND class_id IS ? AND academic_session = ?",
        [subjectId, teacherId, classId || null, session]
      );
      if (existing) return conflict("Teacher already assigned to this subject/class combination");

      const id = generateId();
      await execute(
        `INSERT INTO subject_teachers (id, subject_id, teacher_id, class_id, academic_session, term, assigned_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
        [id, subjectId, teacherId, classId || null, session, term || null]
      );

      return created({ id, subjectId, teacherId, classId: classId || null, session });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);

// DELETE /api/subjects/[id]/teachers — Remove teacher assignment
export const DELETE = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const { searchParams } = new URL(req.url);
      const assignmentId = searchParams.get("assignmentId");
      const subjectId = params?.id ?? "";

      if (!assignmentId) return badRequest("assignmentId is required");

      const subject = await queryOne("SELECT id FROM subjects WHERE id = ? AND school_id = ?", [subjectId, school.id]);
      if (!subject) return notFound("Subject not found");

      const assignment = await queryOne("SELECT id FROM subject_teachers WHERE id = ? AND subject_id = ?", [assignmentId, subjectId]);
      if (!assignment) return notFound("Assignment not found");

      await execute("DELETE FROM subject_teachers WHERE id = ?", [assignmentId]);

      return ok({ message: "Teacher assignment removed" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "vp_academics", "admin_staff", "school_owner"]
);
