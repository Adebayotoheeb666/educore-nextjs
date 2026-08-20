import { query, execute, transaction } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";

// Active students currently enrolled in a class for the given academic session.
export async function getActiveClassStudents(classId: string, session: string): Promise<string[]> {
  const rows = await query<{ student_id: string }>(
    `SELECT sc.student_id
     FROM students_classes sc
     JOIN users u ON sc.student_id = u.id
     WHERE sc.class_id = ? AND sc.academic_session = ? AND sc.status = 'active' AND u.role = 'student'`,
    [classId, session]
  );
  return (rows || []).map((r) => r.student_id);
}

// Keeps student_subjects in sync with the compulsory flag of a subject in a class.
//
// When the subject is compulsory, every active student in the class is auto-enrolled
// (source = 'auto'). When it is optional, auto-created enrollments are removed but
// explicitly assigned (source = 'manual') students are kept.
export async function syncSubjectEnrollment(
  classId: string,
  subjectId: string,
  session: string,
  isCompulsory: boolean
): Promise<number> {
  if (isCompulsory) {
    const studentIds = await getActiveClassStudents(classId, session);
    const statements = studentIds.map((studentId) => ({
      sql: `INSERT OR IGNORE INTO student_subjects
            (id, student_id, subject_id, class_id, academic_session, status, source, enrolled_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
      args: [generateId(), studentId, subjectId, classId, session],
    }));
    if (statements.length > 0) {
      await transaction(statements);
    }
    return statements.length;
  }

  const result = await execute(
    `DELETE FROM student_subjects
     WHERE subject_id = ? AND class_id = ? AND academic_session = ? AND source = 'auto'`,
    [subjectId, classId, session]
  );
  return Number(result.rowsAffected ?? 0);
}