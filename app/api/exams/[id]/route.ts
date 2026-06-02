import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/turso";
import { requireService } from "@/lib/middleware/requireService";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export const GET = withAuth(requireService("exams", async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const exam = await queryOne(
      `SELECT e.*, s.name as subject_name, s.code as subject_code, c.name as class_name
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN classes c ON e.class_id = c.id
       WHERE e.id = ? AND e.school_id = ?`,
      [params?.id ?? "", school.id]
    );
    if (!exam) return notFound("Exam not found");
    return ok(exam);
  } catch (err) {
    return serverError(err);
  }
}));
