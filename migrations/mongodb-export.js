#!/usr/bin/env node
/**
 * MongoDB → JSON Export Script
 *
 * Exports all Educore MongoDB collections to JSON files in ./migrations/export/
 * Run: node migrations/mongodb-export.js
 *
 * Requires: MONGODB_URI environment variable (or pass via CLI: MONGODB_URI=... node ...)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required');
  process.exit(1);
}

const EXPORT_DIR = path.join(__dirname, 'export');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

// ── Minimal schema definitions (just enough to export) ──────────────────────
const ObjectId = mongoose.Schema.Types.ObjectId;

const schemas = {
  School: new mongoose.Schema({}, { strict: false, timestamps: true }),
  User: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Class: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Subject: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Attendance: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Result: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Exam: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Submission: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Fee: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Payment: new mongoose.Schema({}, { strict: false, timestamps: true }),
  OnlineTransaction: new mongoose.Schema({}, { strict: false, timestamps: true }),
  LessonPlan: new mongoose.Schema({}, { strict: false, timestamps: true }),
  SchemeOfWork: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Timetable: new mongoose.Schema({}, { strict: false, timestamps: true }),
  AcademicCalendar: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Announcement: new mongoose.Schema({}, { strict: false, timestamps: true }),
  BehaviorLog: new mongoose.Schema({}, { strict: false, timestamps: true }),
  LibraryBook: new mongoose.Schema({}, { strict: false, timestamps: true }),
  BookBorrow: new mongoose.Schema({}, { strict: false, timestamps: true }),
  BlogPost: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Feedback: new mongoose.Schema({}, { strict: false, timestamps: true }),
  SyncLog: new mongoose.Schema({}, { strict: false, timestamps: true }),
  StaffRecord: new mongoose.Schema({}, { strict: false, timestamps: true }),
  Token: new mongoose.Schema({}, { strict: false, timestamps: true }),
};

// Map collection names (MongoDB pluralizes model names)
const COLLECTION_MAP = {
  School: 'schools',
  User: 'users',
  Class: 'classes',
  Subject: 'subjects',
  Attendance: 'attendances',
  Result: 'results',
  Exam: 'exams',
  Submission: 'submissions',
  Fee: 'fees',
  Payment: 'payments',
  OnlineTransaction: 'onlinetransactions',
  LessonPlan: 'lessonplans',
  SchemeOfWork: 'schemeofworks',
  Timetable: 'timetables',
  AcademicCalendar: 'academiccalendars',
  Announcement: 'announcements',
  BehaviorLog: 'behaviorlogs',
  LibraryBook: 'librarybooks',
  BookBorrow: 'bookborrows',
  BlogPost: 'blogposts',
  Feedback: 'feedbacks',
  SyncLog: 'synclogs',
  StaffRecord: 'staffrecords',
  Token: 'tokens',
};

function toJSON(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  // Convert all ObjectIds to strings recursively
  return JSON.parse(JSON.stringify(obj, (key, val) => {
    if (val && val._bsontype === 'ObjectId') return val.toString();
    if (val instanceof Date) return val.toISOString();
    return val;
  }));
}

async function exportCollection(Model, name) {
  const docs = await Model.find({}).lean();
  const data = docs.map(toJSON);
  const filePath = path.join(EXPORT_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${name}: ${data.length} documents → ${filePath}`);
  return data.length;
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const models = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const collName = COLLECTION_MAP[name];
    models[name] = mongoose.models[name] || mongoose.model(name, schema, collName);
  }

  console.log('Exporting collections...');
  let total = 0;
  for (const [name, Model] of Object.entries(models)) {
    const count = await exportCollection(Model, name);
    total += count;
  }

  console.log(`\nExport complete. Total documents: ${total}`);
  console.log(`Files saved to: ${EXPORT_DIR}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
