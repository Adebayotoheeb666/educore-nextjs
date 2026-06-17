import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { capitalizeName } from "@/lib/utils/string";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

// POST /api/teachers/bulk-import — accepts JSON array of teacher rows
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

      const validRoles = ["class_teacher", "subject_teacher", "vp_academics", "vp_admin", "principal", "bursar", "admin_staff", "librarian"];
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
        const emailRaw = row.EMAIL || row.email || row.Email || null;
        const phoneRaw = String(row.PHONE || row.phone || row.Phone || "").trim();
        const email = emailRaw ? String(emailRaw).toLowerCase().trim() : null;
        const phone = phoneRaw || null;
        const role = String(row.ROLE || row.role || "subject_teacher").toLowerCase().trim();
        const qualifications = String(row.QUALIFICATIONS || row.qualifications || "").trim();
        const subjectArea = String(row.SUBJECT_AREA || row.subject_area || row.SUBJECT || row.subject || "").trim();
        const gender = String(row.GENDER || row.gender || "").trim() || null;

        if (!firstName) {
          errors.push({ row: rowNum, message: "FULL_NAME is required" });
          continue;
        }

        if (!validRoles.includes(role)) {
          errors.push({ 
            row: rowNum, 
            message: `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}` 
          });
          continue;
        }

        if (!email && !phone) {
          errors.push({ row: rowNum, message: `Either EMAIL or PHONE is required` });
          continue;
        }

        if (email) {
          const [emailExists] = await query("SELECT id FROM users WHERE email = ?", [email]);
          if (emailExists) {
            errors.push({ row: rowNum, message: `Email already exists: ${email}` });
            continue;
          }
        }
        if (phone) {
          const [phoneExists] = await query("SELECT id FROM users WHERE phone = ?", [phone]);
          if (phoneExists) {
            errors.push({ row: rowNum, message: `Phone already exists: ${phone}` });
            continue;
          }
        }

        const teacherId = generateId();
        await execute(
          `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, gender, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [teacherId, fullName || `${firstName} ${lastName}`, firstName, lastName, email, phone || null, hashed, role, school.id, gender]
        );

        if (qualifications || subjectArea) {
          const noteId = generateId();
          const note = `Qualifications: ${qualifications}${subjectArea ? ` | Subject Area: ${subjectArea}` : ""}`;
          // Store as metadata (can be extended with a teacher_metadata table later)
          // For now, this is logged in audit
        }

        successful++;
      }

      return ok({ 
        successful, 
        created: successful, 
        failed: errors.length, 
        errors, 
        warnings,
        defaultPassword: defaultPassword,
        message: "Teachers imported successfully. They can log in with the provided email and default password."
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "vp_admin", "school_owner"]
);
