import * as dotenvFlow from "dotenv";
import { resolve, join } from "path";
dotenvFlow.config({ path: resolve(process.cwd(), ".env") });

import { getDb } from "../lib/db/turso";
import { readFileSync } from "fs";

async function testImport() {
  const db = getDb();
  const filePath = resolve(process.cwd(), "migrations/export/User.json");
  const docs = JSON.parse(readFileSync(filePath, "utf-8"));

  console.log(`Loaded ${docs.length} users from JSON.`);

  // Try importing the first user
  const d = docs[0];
  console.log("First user in JSON:", JSON.stringify(d, null, 2));

  try {
    await db.execute({
      sql: `INSERT INTO users
         (id, name, email, password, role, school_id, is_active,
          phone, first_name, last_name, avatar,
          admission_no, dob, gender, parent_phone, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        d._id, // use raw mongo id or uuid
        d.name,
        d.email?.toLowerCase().trim() || null,
        d.password,
        d.role,
        null, // schoolId
        1, // is_active
        d.phone || null,
        d.firstName || null,
        d.lastName || null,
        d.avatar || null,
        d.admissionNo || null,
        null, // dob
        d.gender || null,
        d.parentPhone || null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    });
    console.log("Successfully inserted first user!");
  } catch (error) {
    console.error("Failed to insert first user:", error);
  }
}

testImport();
