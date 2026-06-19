import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne, transaction } from "@/lib/db/turso";
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

      // Prefetch existing data to minimize per-row DB roundtrips in production
      const incomingEmails = Array.from(new Set(rows.map((r) => String(r.EMAIL || r.email || '').toLowerCase().trim()).filter(Boolean)));
      const incomingAdmissions = Array.from(new Set(rows.map((r) => String(r.STUDENT_ID || r.student_id || r.admission_no || '').trim()).filter(Boolean)));

      // Load existing users for the school (emails + admission nos)
      const existingEmailsSet = new Set<string>();
      const existingAdmissionsSet = new Set<string>();
      if (incomingEmails.length) {
        const placeholders = incomingEmails.map(() => '?').join(',');
        const rowsEmails = await query<{ email: string }>(
          `SELECT email FROM users WHERE school_id = ? AND email IN (${placeholders})`,
          [school.id, ...incomingEmails]
        );
        for (const r of rowsEmails) existingEmailsSet.add(String(r.email).toLowerCase());
      }
      if (incomingAdmissions.length) {
        const placeholders = incomingAdmissions.map(() => '?').join(',');
        const rowsAdm = await query<{ admission_no: string }>(
          `SELECT admission_no FROM users WHERE school_id = ? AND admission_no IN (${placeholders})`,
          [school.id, ...incomingAdmissions]
        );
        for (const r of rowsAdm) if (r.admission_no) existingAdmissionsSet.add(String(r.admission_no).toUpperCase());
      }

      // Load classes for the school and map by name/section (case-insensitive)
      const classesForSchool = await query<{ id: string; name: string; section: string }>(
        `SELECT id, name, section FROM classes WHERE school_id = ?`,
        [school.id]
      );

      function findClassId(label: string, arm: string) {
        const l = (label || '').toLowerCase().trim();
        const a = (arm || '').toLowerCase().trim();
        for (const c of classesForSchool) {
          const name = String(c.name || '').toLowerCase().trim();
          const section = String(c.section || '').toLowerCase().trim();
          if (l && a) {
            if ((name === l || name === l) && (section === a || section === a)) return c.id;
          } else if (l) {
            if (name === l) return c.id;
          } else if (a) {
            if (section === a) return c.id;
          }
        }
        return null;
      }

      // Prepare batched statements
      const statements: { sql: string; args?: (string | number | boolean | null)[] }[] = [];

      // Get current student count to generate admission nos when not supplied
      const [countRow] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student'",
        [school.id]
      );
      let count = countRow?.count ?? 0;

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

        if (email && existingEmailsSet.has(email)) {
          errors.push({ row: rowNum, message: `Email already exists: ${email}` });
          continue;
        }

        let classId: string | null = null;
        if (classLabel || classArm) {
          classId = findClassId(classLabel, classArm);
          if (!classId) {
            const classDesc = classLabel ? classLabel : classArm;
            warnings.push({ row: rowNum, message: `Class "${classDesc}" not found — created without class` });
          }
        }

        // Use provided student_id/admission if present; otherwise generate sequential admission no
        let admissionNo = row.STUDENT_ID || row.student_id || row.admission_no ? String(row.STUDENT_ID || row.student_id || row.admission_no).trim() : null;
        if (!admissionNo) {
          count++;
          admissionNo = `SC-${year}-${String(count).padStart(4, "0")}`;
        }
        // Normalize admission number to uppercase for DB consistency
        admissionNo = admissionNo ? String(admissionNo).toUpperCase() : null;

        if (admissionNo && existingAdmissionsSet.has(admissionNo)) {
          errors.push({ row: rowNum, message: `Admission number already exists: ${admissionNo}` });
          continue;
        }

        const studentId = generateId();

        // Add insert for user
        statements.push({
          sql: `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, admission_no, dob, gender, parent_phone, address, state_of_origin, avatar, class_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          args: [studentId, fullName || `${firstName} ${lastName}`, firstName, lastName, email, phone || null, hashed,
             school.id, admissionNo, dob || null, gender || null, parentPhone || null, address || null, stateOfOrigin || null, null, classId || null]
        });

        if (classId) {
          const session = school.academic_session || new Date().getFullYear().toString();
          const enrollmentId = generateId();
          statements.push({
            sql: `INSERT INTO students_classes (id, student_id, class_id, academic_session, status, enrolled_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))`,
            args: [enrollmentId, studentId, classId, session]
          });
        }

        successful++;
      }

      // Execute batched statements in manageable chunks to avoid large single batch
      if (statements.length) {
        try {
          const chunkSize = 200;
          for (let i = 0; i < statements.length; i += chunkSize) {
            const chunk = statements.slice(i, i + chunkSize);
            await transaction(chunk);
          }
        } catch (err) {
          console.error("Bulk transaction failed:", err);
          return serverError(err);
        }
      }

      return ok({ successful, created: successful, failed: errors.length, errors, warnings });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
