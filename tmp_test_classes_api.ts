import { createClient } from "@libsql/client";
import * as jwt from "jsonwebtoken";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;
const jwtSecret = process.env.JWT_SECRET || "test-secret";

if (!dbUrl) {
  console.error("TURSO_DATABASE_URL not set");
  process.exit(1);
}

async function test() {
  const client = createClient({ url: dbUrl, authToken: dbToken });

  try {
    // Get a test school and user
    const userRes = await client.execute(
      "SELECT id, school_id FROM users WHERE role = 'school_owner' LIMIT 1"
    );
    
    if (!userRes.rows || userRes.rows.length === 0) {
      console.error("No school_owner user found");
      process.exit(1);
    }

    const user = userRes.rows[0] as any;
    const userId = user.id;
    const schoolId = user.school_id;

    console.log("Testing with:", { userId, schoolId });

    // Get school details
    const schoolRes = await client.execute(
      "SELECT academic_session FROM schools WHERE id = ? LIMIT 1",
      [schoolId]
    );
    
    const school = schoolRes.rows?.[0] as any;
    console.log("School:", school);

    // Query the same SQL as the API
    const classesRes = await client.execute(
      `SELECT c.id, c.name, c.school_id, c.class_teacher_id, c.level, c.section, c.academic_session, c.current_term, c.capacity, c.created_at, c.updated_at,
              MAX(u.name) as teacher_name, MAX(u.email) as teacher_email,
              COUNT(DISTINCT sc.student_id) as student_count,
              COUNT(DISTINCT CASE WHEN s.school_id = ? THEN cs.subject_id END) as subject_count
       FROM classes c
       LEFT JOIN users u ON c.class_teacher_id = u.id
       LEFT JOIN students_classes sc ON c.id = sc.class_id AND sc.academic_session = ?
       LEFT JOIN class_subjects cs ON c.id = cs.class_id AND cs.academic_session = ?
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE c.school_id = ?
       GROUP BY c.id, c.name, c.school_id, c.class_teacher_id, c.level, c.section, c.academic_session, c.current_term, c.capacity, c.created_at, c.updated_at
       ORDER BY c.level, c.name`,
      [schoolId, school?.academic_session, school?.academic_session, schoolId]
    );

    console.log("\nClasses returned:");
    if (classesRes.rows) {
      for (const row of classesRes.rows) {
        console.log(JSON.stringify(row, null, 2));
      }
    } else {
      console.log("No rows returned");
    }

  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
