import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { notFound, ok, serverError } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

type Params = { params: { id: string } };

// GET /api/students/[id]
export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
  try {
    if (!school) return notFound("School not found");
    const student = await queryOne(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.admission_no, u.dob, u.gender, u.parent_phone, u.is_active, u.address, u.state_of_origin, u.created_at, u.updated_at,
              p.id as parent_id, p.name as parent_name, p.email as parent_email, p.phone as parent_phone_linked,
              c.id as class_id, c.name as class_name, c.section as class_section,
              ct.id as class_teacher_id, ct.name as class_teacher_name, ct.email as class_teacher_email
       FROM users u
       LEFT JOIN user_relationships ur ON ur.child_id = u.id
       LEFT JOIN users p ON ur.parent_id = p.id AND p.role = 'parent'
       LEFT JOIN classes c ON u.class_id = c.id
       LEFT JOIN users ct ON c.class_teacher_id = ct.id
       WHERE u.id = ? AND u.school_id = ? AND u.role = 'student'`,
      [params?.id ?? "", school.id]
    );
    if (!student) return notFound("Student not found");
    return ok(student);
  } catch (err) {
    return serverError(err);
  }
});

// PATCH /api/students/[id]
export const PATCH = withAuth(
  async (req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne(
        "SELECT id, first_name, last_name, class_id FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
        [id, school.id]
      );
      if (!existing) return notFound("Student not found");

      const body = await req.json();
      const { firstName, lastName, email, dob, gender, classId, parentId, isActive, avatar, address, stateOfOrigin, parentPhone, admissionNo: providedAdmissionNo } = body;
      const ex = existing as { first_name: string | null; last_name: string | null; class_id: string | null };
      const newFirst = firstName ?? ex.first_name ?? "";
      const newLast = lastName ?? ex.last_name ?? "";

      let setClauses = `first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           name = ?,
           dob = COALESCE(?, dob),
           gender = ?,
           is_active = COALESCE(?, is_active),
           avatar = COALESCE(?, avatar),
           class_id = COALESCE(?, class_id),
           address = COALESCE(?, address),
           state_of_origin = COALESCE(?, state_of_origin),
           parent_phone = COALESCE(?, parent_phone),
           updated_at = datetime('now')`;
      let args: (string | number | null)[] = [firstName || null, lastName || null, `${newFirst} ${newLast}`.trim(),
         dob || null, gender !== undefined ? gender : null,
         isActive !== undefined ? (isActive ? 1 : 0) : null,
         avatar || null,
         classId !== undefined ? classId : null,
         address || null,
         stateOfOrigin || null,
         parentPhone || null];

      if (email !== undefined) {
        setClauses = `email = COALESCE(?, email), ${setClauses}`;
        args.unshift(email || null);
      }

      // Allow updating admission number if provided explicitly
      if (providedAdmissionNo !== undefined) {
        setClauses = `admission_no = COALESCE(?, admission_no), ${setClauses}`;
        // Normalize to uppercase before storing
        args.unshift(providedAdmissionNo ? String(providedAdmissionNo).trim().toUpperCase() : null);
      }

      args.push(id);

      await execute(
        `UPDATE users SET ${setClauses} WHERE id = ?`,
        args
      );

      // Keep class enrollment and subject enrollment in sync
      if (classId !== undefined && classId !== ex.class_id) {
        const session = school.academic_session || new Date().getFullYear().toString();

        if (ex.class_id) {
          // Mark old enrollment in the current academic session as transferred
          await execute(
            `UPDATE students_classes SET status = 'transferred', left_date = datetime('now'), updated_at = datetime('now')
             WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
            [id, ex.class_id, session]
          );

          // Mark old subjects in current session as transferred
          await execute(
            `UPDATE student_subjects SET status = 'transferred', updated_at = datetime('now')
             WHERE student_id = ? AND class_id = ? AND academic_session = ? AND status = 'active'`,
            [id, ex.class_id, session]
          );
        }

        if (classId) {
          // Check if there is an existing enrollment in the new class
          const newExisting = await queryOne(
            "SELECT id FROM students_classes WHERE student_id = ? AND class_id = ? AND academic_session = ?",
            [id, classId, session]
          );

          if (!newExisting) {
            const enrollmentId = generateId();
            await execute(
              `INSERT INTO students_classes (id, student_id, class_id, academic_session, status, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
              [enrollmentId, id, classId, session]
            );
          } else {
            // Update its status back to active
            await execute(
              `UPDATE students_classes SET status = 'active', left_date = null, updated_at = datetime('now')
               WHERE student_id = ? AND class_id = ? AND academic_session = ?`,
              [id, classId, session]
            );
          }

          // Auto-enroll in compulsory subjects for this new class
          const compulsorySubjects = await query(
            "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
            [classId, session]
          );

          for (const subject of compulsorySubjects || []) {
            const subjectId = (subject as any).subject_id;
            const subjectEnrollmentId = generateId();
            try {
              await execute(
                `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, status, source, enrolled_date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'active', 'auto', datetime('now'), datetime('now'), datetime('now'))`,
                [subjectEnrollmentId, id, subjectId, classId, session]
              );
            } catch (err) {
              // already enrolled or constraints, update status to active
              await execute(
                `UPDATE student_subjects SET status = 'active', updated_at = datetime('now')
                 WHERE student_id = ? AND subject_id = ? AND class_id = ? AND academic_session = ?`,
                [id, subjectId, classId, session]
              );
            }
          }
        }
      }

      if (parentId) {
        const parentRecord = await queryOne(
          "SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'parent'",
          [parentId, school.id]
        );
        if (parentRecord) {
          const relId = generateId();
          await execute(
            `INSERT OR IGNORE INTO user_relationships (id, parent_id, child_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
            [relId, parentId, id]
          );
        }
      }

      const updated = await queryOne(
        `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.admission_no, u.dob, u.gender, u.parent_phone, u.is_active, u.address, u.state_of_origin, u.created_at, u.updated_at
         FROM users u
         WHERE u.id = ?`,
        [id]
      );
      return ok(updated);
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner", "vp_admin"]
);

// DELETE /api/students/[id]
export const DELETE = withAuth(
  async (_req: NextRequest, { school }: AuthContext, params): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");
      const id = params?.id ?? "";
      const existing = await queryOne(
        "SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'student'",
        [id, school.id]
      );
      if (!existing) return notFound("Student not found");

      await execute("DELETE FROM users WHERE id = ?", [id]);
      await execute("DELETE FROM user_relationships WHERE child_id = ? OR parent_id = ?", [id, id]);
      return ok({ message: "Student deleted" });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "school_owner", "admin_staff", "vp_admin"]
);
