import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { capitalizeName } from "@/lib/utils/string";
import { generateId } from "@/lib/utils/id";

// POST /api/students/bulk-import — accepts JSON array of student rows
// (XLSX parsing happens client-side or via a dedicated upload endpoint)
export const POST = withAuth(
  async (req: NextRequest, { school }: AuthContext): Promise<NextResponse> => {
    try {
      if (!school) return notFound("School not found");

      const body = await req.json();
      const rows: Record<string, string>[] = body.rows;
      if (!Array.isArray(rows) || !rows.length) {
        return badRequest("rows array is required");
      }

      const year = new Date().getFullYear();
      const defaultPassword = `EduCore@${year}`;
      const hashed = await hashPassword(defaultPassword);

      let successful = 0;
      const errors: { row: number; message: string }[] = [];
      const warnings: { row: number; message: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const fullNameRaw = String(row.FULL_NAME || row.full_name || row.Name || "").trim();
        const fullName = capitalizeName(fullNameRaw);
        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || parts[0];
        const email = String(
          row.EMAIL || row.email || `row${rowNum}-${Date.now()}@import.local`
        ).toLowerCase().trim();
        const parentPhone = String(row.PARENT_PHONE || row.parent_phone || "").trim();
        const phone = String(row.PHONE || row.phone || "").trim();
        const rawGender = String(row.GENDER || row.gender || "").trim();
        const gender = rawGender
          ? rawGender.match(/^[fm]/i)
            ? rawGender[0].toLowerCase() === "f"
              ? "Female"
              : "Male"
            : rawGender
          : "";
        const classLabel = String(row.CLASS_GRADE || row.class_grade || row.Class || row.CLASS || "").trim();
        const classArm = String(row.CLASS_ARM || row.class_arm || row.ARM || row.arm || row.SECTION || row.section || "").trim();
        const dob = String(row.DOB || row.dob || row.DATE_OF_BIRTH || row.date_of_birth || "").trim();
        const address = String(row.ADDRESS || row.address || "").trim();
        const stateOfOrigin = String(row.STATE_OF_ORIGIN || row.state_of_origin || row.State || row.STATE || "").trim();

        if (!firstName) {
          errors.push({ row: rowNum, message: "FULL_NAME is required" });
          continue;
        }

        const [emailExists] = await query("SELECT id FROM users WHERE email = ?", [email]);
        if (emailExists) {
          errors.push({ row: rowNum, message: `Email already exists: ${email}` });
          continue;
        }

        let classId: string | null = null;
        if (classLabel || classArm) {
          let classDoc;
          if (classLabel && classArm) {
            classDoc = await queryOne<{ id: string }>(
              `SELECT id FROM classes WHERE school_id = ? AND (name = ? OR LOWER(name) = LOWER(?)) AND (section = ? OR LOWER(section) = LOWER(?))`,
              [school.id, classLabel, classLabel, classArm, classArm]
            );
          } else if (classLabel) {
            classDoc = await queryOne<{ id: string }>(
              "SELECT id FROM classes WHERE school_id = ? AND (name = ? OR LOWER(name) = LOWER(?))",
              [school.id, classLabel, classLabel]
            );
          } else {
            classDoc = await queryOne<{ id: string }>(
              "SELECT id FROM classes WHERE school_id = ? AND (section = ? OR LOWER(section) = LOWER(?))",
              [school.id, classArm, classArm]
            );
          }

          if (!classDoc) {
            const classDesc = classLabel ? classLabel : classArm;
            warnings.push({ row: rowNum, message: `Class "${classDesc}" not found — created without class` });
          } else {
            classId = classDoc.id;
          }
        }

        const [countRow] = await query<{ count: number }>(
          "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student'",
          [school.id]
        );
        const count = countRow?.count ?? 0;
        // Use provided student_id/admission if present; otherwise generate sequential admission no
        let admissionNo = row.STUDENT_ID || row.student_id || row.admission_no ? String(row.STUDENT_ID || row.student_id || row.admission_no).trim() : null;
        if (!admissionNo) {
          admissionNo = `SC-${year}-${String(count + 1).padStart(4, "0")}`;
        }
        // Normalize admission number to uppercase for DB consistency
        admissionNo = admissionNo ? String(admissionNo).toUpperCase() : null;

        if (admissionNo) {
          const [existingAdmission] = await query(
            "SELECT id FROM users WHERE school_id = ? AND admission_no = ?",
            [school.id, admissionNo]
          );
          if (existingAdmission) {
            errors.push({ row: rowNum, message: `Admission number already exists: ${admissionNo}` });
            continue;
          }
        }

        const studentId = generateId();
        try {
          await execute(
            `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, admission_no, dob, gender, parent_phone, address, state_of_origin, avatar, class_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [studentId, fullName || `${firstName} ${lastName}`, firstName, lastName, email, phone || null, hashed,
             school.id, admissionNo, dob || null, gender || null, parentPhone || null, address || null, stateOfOrigin || null, null, classId || null]
          );

          if (classId) {
            const session = school.academic_session || new Date().getFullYear().toString();
            const enrollmentId = generateId();
            await execute(
              `INSERT INTO students_classes (id, student_id, class_id, academic_session, status, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
              [enrollmentId, studentId, classId, session]
            );
          }

          successful++;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Database error while importing row";
          errors.push({ row: rowNum, message });
          continue;
        }
      }

      return ok({ successful, created: successful, failed: errors.length, errors, warnings });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
