-- Recreate the legacy subject_teachers table with the current schema.
-- This preserves any existing assignment rows while adding the new id and timestamp columns.

CREATE TABLE IF NOT EXISTS subject_teachers_new (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  academic_session TEXT,
  term TEXT,
  assigned_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(subject_id, teacher_id, class_id, academic_session)
);

INSERT OR IGNORE INTO subject_teachers_new (id, subject_id, teacher_id, class_id, academic_session, term, assigned_date, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  subject_id,
  teacher_id,
  class_id,
  academic_session,
  NULL,
  datetime('now'),
  datetime('now'),
  datetime('now')
FROM subject_teachers;

DROP TABLE IF EXISTS subject_teachers;
ALTER TABLE subject_teachers_new RENAME TO subject_teachers;

CREATE INDEX IF NOT EXISTS idx_subject_teachers_academic_session ON subject_teachers(academic_session);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher_id ON subject_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject_id ON subject_teachers(subject_id);
