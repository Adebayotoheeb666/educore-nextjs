import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/db/turso";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/utils/response";
import { hashPassword } from "@/lib/utils/password";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-dynamic";

// POST /api/parents/bulk-import — accepts JSON array of parent rows and links them to students
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
      let linked = 0;
      const errors: { row: number; message: string }[] = [];
      const warnings: { row: number; message: string }[] = [];
      const createdParents: Array<{ email: string; linked: boolean }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const fullName = String(row.FULL_NAME || row.full_name || row.Name || "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || parts[0];
        const email = String(row.EMAIL || row.email || `parent${rowNum}-${Date.now()}@import.local`).toLowerCase().trim();
        const phone = String(row.PHONE || row.phone || "").trim();
        const studentEmail = String(row.STUDENT_EMAIL || row.student_email || row.CHILD_EMAIL || row.child_email || "").toLowerCase().trim();
        const relationship = String(row.RELATIONSHIP || row.relationship || "Parent").trim();

        if (!firstName) {
          errors.push({ row: rowNum, message: "FULL_NAME is required" });
          continue;
        }

        // Check if parent already exists
        let parentId: string | null = null;
        const [existingParent] = await query<{ id: string }>(
          "SELECT id FROM users WHERE email = ? AND school_id = ? AND role = 'parent'",
          [email, school.id]
        );

        if (existingParent) {
          parentId = existingParent.id;
          warnings.push({ row: rowNum, message: `Parent with email ${email} already exists — will attempt to link to student` });
        } else {
          const [emailExists] = await query("SELECT id FROM users WHERE email = ?", [email]);
          if (emailExists) {
            errors.push({ row: rowNum, message: `Email already exists with a different role: ${email}` });
            continue;
          }

          parentId = generateId();
          await execute(
            `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, school_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'parent', ?, 1, datetime('now'), datetime('now'))`,
            [parentId, fullName || `${firstName} ${lastName}`, firstName, lastName, email, phone || null, hashed, school.id]
          );
          successful++;
        }

        // Link to student if student email provided
        let studentLinked = false;
        if (studentEmail && parentId) {
          const student = await queryOne<{ id: string }>(
            "SELECT id FROM users WHERE email = ? AND school_id = ? AND role = 'student'",
            [studentEmail, school.id]
          );

          if (student) {
            // Check if relationship already exists
            const [existing] = await query(
              "SELECT id FROM user_relationships WHERE parent_id = ? AND child_id = ?",
              [parentId, student.id]
            );

            if (!existing) {
              const relId = generateId();
              await execute(
                `INSERT INTO user_relationships (id, parent_id, child_id, relationship, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [relId, parentId, student.id, relationship]
              );
              studentLinked = true;
              linked++;
            } else {
              warnings.push({ row: rowNum, message: `Parent-student relationship already exists` });
            }
          } else {
            warnings.push({ row: rowNum, message: `Student with email ${studentEmail} not found — parent created but not linked` });
          }
        }

        createdParents.push({ email, linked: studentLinked });
      }

      return ok({
        successful,
        created: successful,
        linked,
        failed: errors.length,
        errors,
        warnings,
        defaultPassword: defaultPassword,
        createdParents,
        message: "Parents imported successfully. They can log in with the provided email and default password."
      });
    } catch (err) {
      return serverError(err);
    }
  },
  ["principal", "admin_staff", "school_owner"]
);
