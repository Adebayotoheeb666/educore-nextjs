import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const teacherId = params?.id ?? "";

    const subjects = await query(
      `SELECT st.subject_id, s.name as subject_name, c.name as class_name, c.id as class_id
       FROM subject_teachers st
       JOIN subjects s ON st.subject_id = s.id
       LEFT JOIN classes c ON st.class_id = c.id
       WHERE st.teacher_id = ? AND s.school_id = ?`,
      [teacherId, school.id]
    );

    return ok({ teacherId, subjects, subjectCount: subjects.length });
  } catch (err) {
    return serverError(err);
  }
});
