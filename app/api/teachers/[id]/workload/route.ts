import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const teacherId = params?.id ?? "";

    const subjects = await query(
      `SELECT DISTINCT s.id as subject_id, s.name as subject_name, c.name as class_name, c.id as class_id
       FROM subjects s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id AND st.teacher_id = ?
       WHERE s.school_id = ? AND (st.teacher_id IS NOT NULL OR s.teacher_id = ?)
       ORDER BY s.name`,
      [teacherId, school.id, teacherId]
    );

    return ok({ teacherId, subjects, subjectCount: subjects.length });
  } catch (err) {
    return serverError(err);
  }
});
