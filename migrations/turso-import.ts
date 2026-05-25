/**
 * Turso Import Script — MongoDB JSON → Turso SQLite
 *
 * Reads exported JSON files from ./migrations/export/ and imports them
 * into the Turso database, transforming MongoDB documents to the SQL schema.
 *
 * Run after:
 *   1. node migrations/mongodb-export.js
 *   2. npm run db:migrate   (applies schema.sql)
 *
 * Usage: tsx migrations/turso-import.ts [--collection=users]
 *
 * Requires: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in environment.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getDb, execute, query, transaction } from "../lib/db/turso";
import { v4 as uuid } from "uuid";

const EXPORT_DIR = join(__dirname, "export");

async function batchExecute(
  statements: { sql: string; args: (string | number | boolean | null)[] }[]
) {
  const CHUNK_SIZE = 100;
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    await transaction(chunk);
  }
}

// ── ID mapping: MongoDB ObjectId → UUID ────────────────────────────────────
const idMap = new Map<string, string>();

function mapId(mongoId: string | null | undefined): string | null {
  if (!mongoId) return null;
  if (idMap.has(mongoId)) return idMap.get(mongoId)!;
  const newId = uuid();
  idMap.set(mongoId, newId);
  return newId;
}

function forceId(mongoId: string): string {
  return mapId(mongoId) ?? uuid();
}

function getSchoolId(mongoId: string | null | undefined): string | null {
  if (!mongoId) return null;
  return idMap.get(mongoId) ?? null;
}

const insertedUserIds = new Set<string>();

function getUserId(mongoId: string | null | undefined): string | null {
  if (!mongoId) return null;
  const mapped = idMap.get(mongoId) ?? null;
  if (mapped && insertedUserIds.has(mapped)) return mapped;
  return null;
}

const insertedClassIds = new Set<string>();

function getClassId(mongoId: string | null | undefined): string | null {
  if (!mongoId) return null;
  const mapped = idMap.get(mongoId) ?? null;
  if (mapped && insertedClassIds.has(mapped)) return mapped;
  return null;
}

const insertedSubjectIds = new Set<string>();

function getSubjectId(mongoId: string | null | undefined): string | null {
  if (!mongoId) return null;
  const mapped = idMap.get(mongoId) ?? null;
  if (mapped && insertedSubjectIds.has(mapped)) return mapped;
  return null;
}

function readExport(name: string): Record<string, unknown>[] {
  const filePath = join(EXPORT_DIR, `${name}.json`);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ ${name}.json not found — skipping`);
    return [];
  }
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function ts(val: unknown): string | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val as string);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function bool(val: unknown): number {
  return val ? 1 : 0;
}

// ── 1. Schools ──────────────────────────────────────────────────────────────
async function importSchools() {
  const docs = readExport("School");
  let count = 0;
  for (const d of docs) {
    const sub = (d.subscription as Record<string, unknown>) ?? {};
    const settings = (d.settings as Record<string, unknown>) ?? {};
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO schools
         (id, name, email, phone, state, type, sub_domain, address,
          subscription_status, subscription_plan, ai_token_budget, used_ai_tokens,
          subscription_expires_at, subscription_last_paid_at, billing_cycle,
          academic_session, current_term, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, d.name as string, (d.email as string) || null,
        (d.phone as string) || null, (d.state as string) || null,
        (d.type as string) || null, (d.subDomain as string) || null,
        (d.address as string) || null,
        (sub.status as string) || "trial",
        (sub.plan as string) || "basic",
        (sub.aiTokenBudget as number) ?? 100000,
        (sub.usedAiTokens as number) ?? 0,
        ts(sub.expiresAt), ts(sub.lastPaidAt),
        (sub.billingCycle as string) || null,
        (settings.academicSession as string) || "2024/2025",
        (settings.currentTerm as string) || "first",
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Schools: ${count}`);
}

// ── 2. Users ────────────────────────────────────────────────────────────────
async function importUsers() {
  const docs = readExport("User");
  const deferredRelations: { parentId: string; childId: string }[] = [];
  const statements: { sql: string; args: (string | number | boolean | null)[] }[] = [];

  for (const d of docs) {
    const id = forceId(d._id as string);
    const schoolId = getSchoolId(d.schoolId as string);
    insertedUserIds.add(id);
    statements.push({
      sql: `INSERT OR IGNORE INTO users
         (id, name, email, password, role, school_id, is_active,
          phone, first_name, last_name, avatar,
          admission_no, dob, gender, parent_phone, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, d.name as string, (d.email as string)?.toLowerCase().trim(),
        d.password as string, d.role as string, schoolId,
        bool(d.isActive !== false),
        (d.phone as string) || null,
        (d.firstName as string) || null,
        (d.lastName as string) || null,
        (d.avatar as string) || null,
        (d.admissionNo as string) || null,
        ts(d.dob), (d.gender as string) || null,
        (d.parentPhone as string) || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    });

    // Save relationship info for deferral
    const parents = (d.parents as string[]) || [];
    for (const parentId of parents) {
      deferredRelations.push({ parentId, childId: d._id as string });
    }
  }

  console.log(`  Inserting ${statements.length} users in batches...`);
  await batchExecute(statements);
  console.log(`  ✓ Users inserted`);

  console.log(`  Importing ${deferredRelations.length} user relationships...`);
  const relStatements: { sql: string; args: (string | number | boolean | null)[] }[] = [];
  for (const rel of deferredRelations) {
    const mappedParent = getUserId(rel.parentId);
    const mappedChild = getUserId(rel.childId);
    if (mappedParent && mappedChild) {
      const relId = uuid();
      relStatements.push({
        sql: "INSERT OR IGNORE INTO user_relationships (id, parent_id, child_id, created_at) VALUES (?,?,?,datetime('now'))",
        args: [relId, mappedParent, mappedChild]
      });
    }
  }
  await batchExecute(relStatements);
  console.log(`  ✓ User relationships inserted`);
}

// ── 3. Update school owner_id ───────────────────────────────────────────────
async function linkSchoolOwners() {
  const docs = readExport("School");
  for (const d of docs) {
    if (!d.owner) continue;
    const schoolId = mapId(d._id as string);
    const ownerId = mapId(d.owner as string);
    if (schoolId && ownerId) {
      await execute("UPDATE schools SET owner_id = ? WHERE id = ?", [ownerId, schoolId]);
    }
  }
  console.log(`  ✓ School owner_id linked`);
}

// ── 4. Classes ──────────────────────────────────────────────────────────────
async function importClasses() {
  const docs = readExport("Class");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    const teacherId = getUserId(d.classTeacher as string);
    const schoolId = getSchoolId(d.school as string);
    await execute(
      `INSERT OR IGNORE INTO classes
         (id, name, section, level, class_teacher_id, school_id, academic_session, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id, d.name as string, (d.arm as string) || null,
        (d.level as string) || null,
        teacherId,
        schoolId,
        (d.session as string) || "2024/2025",
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    insertedClassIds.add(id);
    count++;
  }
  console.log(`  ✓ Classes: ${count}`);
}

// ── 5. Subjects ─────────────────────────────────────────────────────────────
async function importSubjects() {
  const docs = readExport("Subject");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    const schoolId = getSchoolId(d.school as string);
    await execute(
      `INSERT OR IGNORE INTO subjects
         (id, name, code, school_id, is_compulsory, description, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        id, d.name as string, (d.code as string) || null,
        schoolId, 1,
        (d.description as string) || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    insertedSubjectIds.add(id);

    // subject-teacher assignments
    const teachers = (d.teachers as string[]) || [];
    for (const teacherId of teachers) {
      const mappedTeacher = getUserId(teacherId);
      if (mappedTeacher) {
        const assignmentId = uuid();
        await execute(
          "INSERT OR IGNORE INTO subject_teachers (id, subject_id, teacher_id, created_at, updated_at) VALUES (?,?,?,datetime('now'),datetime('now'))",
          [assignmentId, id, mappedTeacher]
        );
      }
    }
    count++;
  }
  console.log(`  ✓ Subjects: ${count}`);
}

// ── 6. Attendance ───────────────────────────────────────────────────────────
async function importAttendance() {
  const docs = readExport("Attendance");
  const statements: { sql: string; args: (string | number | boolean | null)[] }[] = [];
  for (const d of docs) {
    const classId = mapId(d.class as string);
    const schoolId = mapId(d.school as string);
    const recordedBy = mapId(d.takenBy as string);
    const dateStr = ts(d.date)?.split("T")[0] ?? new Date().toISOString().split("T")[0];
    const term = (d.term as string) || "first";
    const session = (d.session as string) || "2024/2025";

    const records = (d.records as Array<Record<string, unknown>>) || [];
    for (const rec of records) {
      const studentId = mapId(rec.student as string);
      if (!studentId || !classId || !schoolId) continue;
      const id = uuid();
      statements.push({
        sql: `INSERT OR IGNORE INTO attendance
           (id, school_id, class_id, student_id, date, status, term, academic_session, recorded_by, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          id, schoolId, classId, studentId, dateStr,
          (rec.status as string) || "present", term, session, recordedBy,
          ts(d.createdAt) || new Date().toISOString(),
          ts(d.updatedAt) || new Date().toISOString(),
        ]
      });
    }
  }
  console.log(`  Inserting ${statements.length} attendance records in batches...`);
  await batchExecute(statements);
  console.log(`  ✓ Attendance records inserted`);
}

// ── 7. Results (MongoDB stores per-student, subjects array) ─────────────────
async function importResults() {
  const docs = readExport("Result");
  const statements: { sql: string; args: (string | number | boolean | null)[] }[] = [];
  for (const d of docs) {
    const studentId = getUserId(d.student as string);
    const classId = getClassId(d.class as string);
    const schoolId = getSchoolId(d.school as string);
    if (!studentId || !classId || !schoolId) continue;

    const subjects = (d.subjects as Array<Record<string, unknown>>) || [];
    for (const sub of subjects) {
      const subjectId = getSubjectId(sub.subject as string);
      if (!subjectId) continue;
      const id = uuid();
      statements.push({
        sql: `INSERT OR IGNORE INTO results
           (id, school_id, student_id, class_id, subject_id, term, academic_session,
            ca_score, exam_score, total_score, grade, position, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          id, schoolId, studentId, classId, subjectId,
          (d.term as string) || "first",
          (d.session as string) || "2024/2025",
          (sub.caScore as number) ?? null,
          (sub.examScore as number) ?? null,
          (sub.totalScore as number) ?? null,
          (sub.grade as string) || null,
          (d.positionInClass as number) || null,
          ts(d.createdAt) || new Date().toISOString(),
          ts(d.updatedAt) || new Date().toISOString(),
        ]
      });
    }
  }
  console.log(`  Inserting ${statements.length} results in batches...`);
  await batchExecute(statements);
  console.log(`  ✓ Results inserted`);
}

// ── 8. Exams ────────────────────────────────────────────────────────────────
async function importExams() {
  const docs = readExport("Exam");
  const statements: { sql: string; args: (string | number | boolean | null)[] }[] = [];
  for (const d of docs) {
    const id = forceId(d._id as string);
    const schoolId = getSchoolId(d.school as string);
    const classId = getClassId(d.class as string);
    const subjectId = getSubjectId(d.subject as string);
    const creatorId = getUserId(d.createdBy as string);

    statements.push({
      sql: `INSERT OR IGNORE INTO exams
         (id, title, school_id, class_id, subject_id, type, term, academic_session,
          date, duration_minutes, total_marks, instructions, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, (d.title as string) || "Exam",
        schoolId, classId, subjectId,
        (d.type as string) || null,
        (d.term as string) || "first",
        (d.session as string) || "2024/2025",
        ts(d.scheduledDate)?.split("T")[0] || null,
        (d.duration as number) || null,
        (d.totalScore as number) || null,
        (d.instructions as string) || null,
        creatorId,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    });
  }
  console.log(`  Inserting ${statements.length} exams in batches...`);
  await batchExecute(statements);
  console.log(`  ✓ Exams inserted`);
}

// ── 9. Fees ──────────────────────────────────────────────────────────────────
async function importFees() {
  const docs = readExport("Fee");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO fees
         (id, school_id, name, amount, class_id, term, academic_session, due_date, is_compulsory, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
      [
        id, mapId(d.school as string),
        (d.title as string) || "Fee",
        (d.totalAmount as number) ?? 0,
        mapId(d.class as string),
        (d.term as string) || "first",
        (d.session as string) || "2024/2025",
        ts(d.dueDate)?.split("T")[0] || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Fees: ${count}`);
}

// ── 10. Lesson Plans ────────────────────────────────────────────────────────
async function importLessonPlans() {
  const docs = readExport("LessonPlan");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO lesson_plans
         (id, title, school_id, teacher_id, class_id, subject_id, term,
          topic, objectives, content, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, (d.title as string) || "Lesson Plan",
        mapId(d.school as string), mapId(d.teacher as string),
        mapId(d.class as string), mapId(d.subject as string),
        (d.term as string) || "first",
        (d.topic as string) || null,
        typeof d.objectives === "string" ? d.objectives : JSON.stringify(d.objectives) || null,
        (d.content as string) || null,
        (d.status as string) || "draft",
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Lesson Plans: ${count}`);
}

// ── 11. Announcements ────────────────────────────────────────────────────────
async function importAnnouncements() {
  const docs = readExport("Announcement");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO announcements
         (id, title, content, school_id, author_id, target_roles, is_pinned, created_at, updated_at)
       VALUES (?,?,?,?,?,?,0,?,?)`,
      [
        id, (d.title as string) || "Announcement",
        (d.content as string || d.body as string) || "",
        mapId(d.school as string), mapId(d.author as string || d.createdBy as string),
        (d.targetRoles as string[])?.join(",") || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Announcements: ${count}`);
}

// ── 12. Library Books ────────────────────────────────────────────────────────
async function importLibraryBooks() {
  const docs = readExport("LibraryBook");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    const qty = (d.quantity as number) ?? 1;
    const avail = (d.availableQuantity as number) ?? qty;
    await execute(
      `INSERT OR IGNORE INTO library_books
         (id, school_id, title, author, isbn, category, quantity, available_quantity, shelf_location, description, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, mapId(d.school as string),
        d.title as string, (d.author as string) || null,
        (d.isbn as string) || null, (d.category as string) || null,
        qty, avail,
        (d.shelfLocation as string) || null,
        (d.description as string) || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Library Books: ${count}`);
}

// ── 13. Behavior Logs ────────────────────────────────────────────────────────
async function importBehaviorLogs() {
  const docs = readExport("BehaviorLog");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO behavior_logs
         (id, school_id, student_id, recorded_by, type, category, description,
          action_taken, date, term, academic_session, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, mapId(d.school as string), mapId(d.student as string),
        mapId(d.recordedBy as string),
        (d.type as string) || "neutral",
        (d.category as string) || null,
        (d.description as string) || "",
        (d.actionTaken as string) || null,
        ts(d.date)?.split("T")[0] || new Date().toISOString().split("T")[0],
        (d.term as string) || "first",
        (d.session as string) || "2024/2025",
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Behavior Logs: ${count}`);
}

// ── 14. Academic Calendar ────────────────────────────────────────────────────
async function importCalendar() {
  const docs = readExport("AcademicCalendar");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO academic_calendar
         (id, school_id, title, description, start_date, end_date, type, term, academic_session, is_public, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?)`,
      [
        id, mapId(d.school as string),
        (d.title as string) || "Event",
        (d.description as string) || null,
        ts(d.startDate)?.split("T")[0] || "",
        ts(d.endDate)?.split("T")[0] || null,
        (d.type as string) || "event",
        (d.term as string) || null,
        (d.session as string) || null,
        mapId(d.createdBy as string),
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Calendar Events: ${count}`);
}

// ── 15. Blog Posts ──────────────────────────────────────────────────────────
async function importBlog() {
  const docs = readExport("BlogPost");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    const slug = ((d.slug as string) || (d.title as string)?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || id) + "-" + id.slice(0, 8);
    await execute(
      `INSERT OR IGNORE INTO blog_posts
         (id, title, slug, content, excerpt, cover_image, author_id, school_id, status, published_at, tags, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, (d.title as string) || "Post", slug,
        (d.content as string) || "",
        (d.excerpt as string) || null,
        (d.coverImage as string) || null,
        mapId(d.author as string),
        mapId(d.school as string),
        (d.status as string) || "draft",
        ts(d.publishedAt),
        Array.isArray(d.tags) ? (d.tags as string[]).join(",") : (d.tags as string) || null,
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Blog Posts: ${count}`);
}

// ── 16. Feedback ─────────────────────────────────────────────────────────────
async function importFeedback() {
  const docs = readExport("Feedback");
  let count = 0;
  for (const d of docs) {
    const id = forceId(d._id as string);
    await execute(
      `INSERT OR IGNORE INTO feedback
         (id, school_id, user_id, type, subject, message, rating, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        id, mapId(d.school as string), mapId(d.user as string),
        (d.type as string) || null, (d.subject as string) || null,
        (d.message as string) || "", (d.rating as number) || null,
        (d.status as string) || "open",
        ts(d.createdAt) || new Date().toISOString(),
        ts(d.updatedAt) || new Date().toISOString(),
      ]
    );
    count++;
  }
  console.log(`  ✓ Feedback: ${count}`);
}

// ── 17. Timetable ────────────────────────────────────────────────────────────
async function importTimetable() {
  const docs = readExport("Timetable");
  let count = 0;
  for (const d of docs) {
    const classId = mapId(d.class as string);
    const schoolId = mapId(d.school as string);
    const slots = (d.slots as Array<Record<string, unknown>>) || [];
    for (const slot of slots) {
      const id = uuid();
      await execute(
        `INSERT OR IGNORE INTO timetable
           (id, school_id, class_id, subject_id, teacher_id, day, start_time, end_time, term, academic_session, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
        [
          id, schoolId, classId,
          mapId(slot.subject as string), mapId(slot.teacher as string),
          (slot.day as string) || "Monday",
          (slot.startTime as string) || "08:00",
          (slot.endTime as string) || "09:00",
          (d.term as string) || "first",
          (d.session as string) || "2024/2025",
        ]
      );
      count++;
    }
  }
  console.log(`  ✓ Timetable slots: ${count}`);
}

// ── Validate import ──────────────────────────────────────────────────────────
async function validateImport() {
  const tables = [
    "schools", "users", "classes", "subjects", "attendance",
    "results", "exams", "fees", "lesson_plans", "announcements",
    "library_books", "behavior_logs", "academic_calendar", "blog_posts", "feedback",
  ];

  console.log("\nValidation:");
  for (const table of tables) {
    const [row] = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  ${table}: ${row?.count ?? 0} rows`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("Starting Turso import...\n");

  const { readFileSync: rfs } = await import("fs");
  const schemaPath = join(__dirname, "../lib/db/schema.sql");
  const schemaSql = rfs(schemaPath, "utf-8");
  const db = getDb();

  console.log("Cleaning up existing database tables in correct dependency order...");
  const tablesRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
  const existingTables = new Set(tablesRes.rows.map(row => row.name as string));

  const dropOrder = [
    // 1. Core relationship / log tables (no dependents)
    "fee_payments", "book_borrows", "user_relationships", "sync_logs",
    "staff_records", "activity_logs", "subject_teachers", "lesson_plans",
    "timetable", "attendance", "results", "exams", "fees", "subjects",
    "classes", "users", "schools", "tokens", "online_transactions",
    "announcements", "feedback", "blog_posts", "library_books",
    "academic_calendar", "behavior_logs", "services", "school_services",
    "service_tiers", "billing_history", "service_usage", "rate_limits"
  ];

  const dropStatements: { sql: string; args: any[] }[] = [];
  // First drop tables in our defined order if they exist
  for (const table of dropOrder) {
    if (existingTables.has(table)) {
      console.log(`  Scheduling drop: ${table}`);
      dropStatements.push({ sql: `DROP TABLE IF EXISTS ${table}`, args: [] });
      existingTables.delete(table);
    }
  }
  // Then drop any remaining tables
  for (const table of existingTables) {
    if (table.startsWith("sqlite_")) continue;
    console.log(`  Scheduling drop for remaining table: ${table}`);
    dropStatements.push({ sql: `DROP TABLE IF EXISTS ${table}`, args: [] });
  }

  if (dropStatements.length > 0) {
    await transaction(dropStatements);
  }
  console.log("Database cleaned.\n");

  // Remove comment lines
  const cleanSql = schemaSql
    .split("\n")
    .map((line) => (line.trim().startsWith("--") ? "" : line))
    .join("\n");

  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log("Applying schema...");
  for (const sql of statements) {
    await db.execute(sql + ";");
  }
  console.log("Schema applied.\n");

  console.log("Disabling foreign key constraints temporarily...");
  await db.execute("PRAGMA foreign_keys = OFF;");

  console.log("Importing collections (in dependency order)...");
  await importSchools();
  await importUsers();
  await linkSchoolOwners();
  await importClasses();
  await importSubjects();
  await importAttendance();
  await importResults();
  await importExams();
  await importFees();
  await importLessonPlans();
  await importAnnouncements();
  await importLibraryBooks();
  await importBehaviorLogs();
  await importCalendar();
  await importBlog();
  await importFeedback();
  await importTimetable();

  console.log("Re-enabling foreign key constraints...");
  await db.execute("PRAGMA foreign_keys = ON;");

  await validateImport();

  console.log("\n✅ Import complete!");
  console.log("ID mapping stats:", { mongoIds: idMap.size });
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
