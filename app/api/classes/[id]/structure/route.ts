import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError, badRequest } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// GET /api/classes/[id]/structure — Get complete class structure (class teacher, students, subjects, subject teachers)
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const classId = params?.id ?? "";
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") || school.academic_session;

    const classData = await queryOne(
      `SELECT c.*, u.name as class_teacher_name, u.email as class_teacher_email, u.phone as class_teacher_phone
       FROM classes c
       LEFT JOIN users u ON c.class_teacher_id = u.id
       WHERE c.id = ? AND c.school_id = ?`,
      [classId, school.id]
    );

    if (!classData) return notFound("Class not found");

    const subjects = await query(
      `SELECT cs.id, cs.sequence, s.id as subject_id, s.name, s.code, s.description, s.is_compulsory,
              GROUP_CONCAT(DISTINCT st.id) as assignment_ids,
              GROUP_CONCAT(DISTINCT u.id) as teacher_ids,
              GROUP_CONCAT(DISTINCT u.name) as teacher_names,
              GROUP_CONCAT(DISTINCT u.email) as teacher_emails,
              COUNT(DISTINCT st.teacher_id) as teacher_count
       FROM class_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id AND st.class_id = ? AND st.academic_session = ?
       LEFT JOIN users u ON st.teacher_id = u.id
       WHERE cs.class_id = ? AND s.school_id = ? AND cs.academic_session = ?
       GROUP BY cs.id, s.id
       ORDER BY cs.sequence, s.name`,
      [classId, session, classId, school.id, session]
    );

    const enrollmentStats = await queryOne(
      `SELECT 
        COUNT(*) as total_enrolled,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'transferred' THEN 1 ELSE 0 END) as transferred,
        SUM(CASE WHEN status = 'promoted' THEN 1 ELSE 0 END) as promoted,
        SUM(CASE WHEN status = 'graduated' THEN 1 ELSE 0 END) as graduated
       FROM students_classes
       WHERE class_id = ? AND academic_session = ?`,
      [classId, session]
    );

    return ok({
      class: classData,
      academicSession: session,
      subjects: subjects || [],
      enrollmentStats: enrollmentStats || {
        total_enrolled: 0,
        active: 0,
        transferred: 0,
        promoted: 0,
        graduated: 0,
      },
    });
  } catch (err) {
    return serverError(err);
  }
});
