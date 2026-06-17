import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, created, ok, conflict, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { generateId } from "@/lib/utils/id";
import { normalizePhone } from "@/lib/utils/string";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["principal", "vp_admin", "admin_staff", "school_owner"];

// GET /api/students
export const GET = withAuth(async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
  try {
    if (!school) return badRequest("School context required");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    let sql = `SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.avatar,
              u.admission_no, u.dob, u.gender, u.parent_phone, u.is_active,
              u.created_at, u.updated_at,
              p.name as parent_name, p.phone as parent_phone_linked,
              c.id as class_id, c.name as class_name
       FROM users u
       LEFT JOIN user_relationships ur ON ur.child_id = u.id
       LEFT JOIN users p ON ur.parent_id = p.id AND p.role = 'parent'
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.school_id = ? AND u.role = 'student'`;

    const params: any[] = [school.id];

    if (classId) {
      sql += ` AND (u.class_id = ? OR u.class_id IS NULL)`;
      params.push(classId);
    }

    sql += ` ORDER BY u.name`;

    const students = await query(sql, params);
    return ok(students);
  } catch (err) {
    return serverError(err);
  }
});

// POST /api/students
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return badRequest("School context required");
      const { firstName, lastName, email, dob, gender, classId, parentPhone, phone, parentId, avatar, address, stateOfOrigin, admissionNo: providedAdmissionNo } = await req.json();

      if (!firstName || !lastName) {
        return badRequest("First name and last name are required");
      }

      const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
      const normalizedPhone = phone ? normalizePhone(phone) : null;
      if (!normalizedEmail && !normalizedPhone) {
        return badRequest("Students must have either an email or phone number");
      }

      if (normalizedEmail) {
        const [existing] = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
        if (existing) return conflict("Email already registered");
      }
      if (normalizedPhone) {
        const [existingPhone] = await query("SELECT id FROM users WHERE phone = ?", [normalizedPhone]);
        if (existingPhone) return conflict("Phone number already registered");
      }

      const year = new Date().getFullYear();
      // Use provided admission number if present, else auto-generate
      let admissionNo = providedAdmissionNo ? String(providedAdmissionNo).trim() : null;
      if (!admissionNo) {
        const [countRow] = await query<{ count: number }>(
          "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student'",
          [school.id]
        );
        const count = countRow?.count ?? 0;
        admissionNo = `SC-${year}-${String(count + 1).padStart(4, "0")}`;
      }
      // Normalize admission number to uppercase for DB consistency
      admissionNo = admissionNo ? String(admissionNo).toUpperCase() : null;
      const defaultPassword = `EduCore@${year}`;

      const studentId = generateId();
      const hashed = await hashPassword(defaultPassword);
      await execute(
        `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, admission_no, dob, gender, parent_phone, address, state_of_origin, avatar, class_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [studentId, `${firstName} ${lastName}`, firstName, lastName, normalizedEmail, normalizedPhone || null, hashed, school.id,
         admissionNo, dob || null, gender || null, parentPhone || null, address || null, stateOfOrigin || null, avatar || null, classId || null]
      );

      // If assigning to a class, also insert into students_classes join table
      if (classId) {
        const session = school.academic_session || new Date().getFullYear().toString();
        const enrollmentId = generateId();
        await execute(
          `INSERT INTO students_classes (id, student_id, class_id, academic_session, status, enrolled_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
          [enrollmentId, studentId, classId, session]
        );

        // Auto-enroll in compulsory subjects for this class
        const compulsorySubjects = await query(
          "SELECT subject_id FROM class_subjects WHERE class_id = ? AND academic_session = ? AND is_compulsory = 1",
          [classId, session]
        );

        for (const subject of compulsorySubjects || []) {
          const subjectId = (subject as any).subject_id;
          const subjectEnrollmentId = generateId();
          await execute(
            `INSERT INTO student_subjects (id, student_id, subject_id, class_id, academic_session, status, enrolled_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
            [subjectEnrollmentId, studentId, subjectId, classId, session]
          );
        }
      }

      // Link parent if provided
      if (parentId) {
        const relId = generateId();
        await execute(
          `INSERT OR IGNORE INTO user_relationships (id, parent_id, child_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
          [relId, parentId, studentId]
        );
        // Auto-populate parent_phone from the linked parent's phone if not already set
        if (!parentPhone) {
          const parentData = await query<{ phone: string | null }>(
            "SELECT phone FROM users WHERE id = ? AND role = 'parent'",
            [parentId]
          );
          const parent = parentData?.[0];
          if (parent?.phone) {
            await execute(
              "UPDATE users SET parent_phone = ? WHERE id = ?",
              [parent.phone, studentId]
            );
          }
        }
      }

      return created({ studentId, admissionNo, defaultPassword });
    } catch (err) {
      return serverError(err);
    }
  },
  ADMIN_ROLES
);
