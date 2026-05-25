import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

// GET /api/classes/[id]/subjects/[subjectId]/students — get students taking this subject
export const GET = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const { searchParams } = new URL(req.url);
      const session = searchParams.get("session") || school.academic_session;

      const students = await query(
        `SELECT ss.id, u.id as student_id, u.name, u.admission_no, u.email, ss.status, ss.enrolled_date
         FROM student_subjects ss
         JOIN users u ON ss.student_id = u.id
         WHERE ss.subject_id = ? AND ss.class_id = ? AND ss.academic_session = ?
         ORDER BY u.name`,
        [subjectId, classId, session]
      );

      return ok(students || []);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "vp_admin", "school_owner", "class_teacher", "subject_teacher"]
);

// POST /api/classes/[id]/subjects/[subjectId]/students — enroll students in subject
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const classId = params?.id ?? "";
      const subjectId = params?.subjectId ?? "";
      const { studentIds, academicSession = school.academic_session, term } = await req.json();

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return ok({ enrolled: [], duplicates: [], failed: [] });
      }

      const enrolled = [];
      const duplicates = [];
      const failed = [];

      for (const studentId of studentIds) {
        try {
          // Check if already enrolled
          const existing = await queryOne(
            "SELECT id FROM student_subjects WHERE student_id = ? AND subject_id = ? AND class_id = ? AND academic_session = ?",
            [studentId, subjectId, classId, academicSession]
          );

          if (existing) {
            duplicates.push(studentId);
            continue;
          }

          // Enroll student
          const id = generateId();
          await execute(
            `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, term, status, enrolled_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
            [id, studentId, subjectId, classId, academicSession, term || null]
          );
          enrolled.push(studentId);
        } catch (err) {
          failed.push(studentId);
        }
      }

      return ok({ enrolled, duplicates, failed });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_academics", "vp_admin", "school_owner", "class_teacher"]
);
