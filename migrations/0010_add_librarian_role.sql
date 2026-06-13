-- Migration: Add 'librarian' to users.role CHECK constraint
-- SQLite cannot alter CHECK constraints directly, so recreate the users table

-- Recreate `questions` with nullable `created_by` to avoid FK/NOT NULL conflicts
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS questions_tmp;
CREATE TABLE questions_tmp (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  instructions TEXT,
  options TEXT,
  correct_answer TEXT,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  bloom_level TEXT CHECK(bloom_level IN ('knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation')),
  tags TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO questions_tmp (id, school_id, subject_id, class_id, type, difficulty, question_text, instructions, options, correct_answer, explanation, marks, bloom_level, tags, created_by, created_at, updated_at)
SELECT id, school_id, subject_id, class_id, type, difficulty, question_text, instructions, options, correct_answer, explanation, marks, bloom_level, tags, created_by, created_at, updated_at FROM questions;
DROP TABLE IF EXISTS questions;
ALTER TABLE questions_tmp RENAME TO questions;
CREATE INDEX IF NOT EXISTS idx_questions_school_id ON questions(school_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_class_id ON questions(class_id);

-- Keep foreign keys disabled while migrating the users table
PRAGMA foreign_keys=OFF;

CREATE TABLE users_tmp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN (
    'principal','vp_admin','vp_academics','admin_staff',
    'class_teacher','subject_teacher','bursar','librarian',
    'school_owner','parent','student','super_admin'
  )),
  school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  admission_no TEXT,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  dob TEXT,
  gender TEXT CHECK(gender IN ('Male', 'Female', '')),
  parent_phone TEXT,
  address TEXT,
  state_of_origin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_tmp (id, name, email, password, role, school_id, is_active, phone, first_name, last_name, avatar, admission_no, class_id, dob, gender, parent_phone, address, state_of_origin, created_at, updated_at)
SELECT id, name, email, password, role, school_id, is_active, phone, first_name, last_name, avatar, admission_no, class_id, dob, gender, parent_phone, address, state_of_origin, created_at, updated_at FROM users;

DROP TABLE IF EXISTS users;
ALTER TABLE users_tmp RENAME TO users;
PRAGMA foreign_keys=ON;
