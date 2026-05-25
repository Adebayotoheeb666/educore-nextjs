import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
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
        const fullName = String(row.FULL_NAME || row.full_name || row.Name || "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || parts[0];
        const email = String(
          row.EMAIL || row.email || `row${rowNum}-${Date.now()}@import.local`
        ).toLowerCase().trim();
        const parentPhone = String(row.PARENT_PHONE || row.parent_phone || "").trim();
        const phone = String(row.PHONE || row.phone || "").trim();
        const gender = String(row.GENDER || row.gender || "").trim();
        const classLabel = String(row.CLASS_GRADE || row.class_grade || row.Class || row.CLASS || "").trim();
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
        if (classLabel) {
          const classDoc = await queryOne<{ id: string }>(
            "SELECT id FROM classes WHERE school_id = ? AND (name = ? OR LOWER(name) = LOWER(?))",
            [school.id, classLabel, classLabel]
          );
          if (!classDoc) {
            warnings.push({ row: rowNum, message: `Class "${classLabel}" not found — created without class` });
          } else {
            classId = classDoc.id;
          }
        }

        const [countRow] = await query<{ count: number }>(
          "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'student'",
          [school.id]
        );
        const count = countRow?.count ?? 0;
        const admissionNo = String(row.STUDENT_ID || row.student_id || `SC-${year}-${String(count + 1).padStart(4, "0")}`).trim();

        const studentId = generateId();
        await execute(
          `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, admission_no, gender, parent_phone, address, state_of_origin, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [studentId, fullName || `${firstName} ${lastName}`, firstName, lastName, email, phone || null, hashed,
           school.id, admissionNo, gender || null, parentPhone || null, address || null, stateOfOrigin || null]
        );

        successful++;
      }

      return ok({ successful, created: successful, failed: errors.length, errors, warnings });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
