-- Update legacy subject_teachers table schema to support the new application model.
-- This migration adds the missing columns used by the current codebase and fills defaults.

ALTER TABLE subject_teachers ADD COLUMN id TEXT;
ALTER TABLE subject_teachers ADD COLUMN term TEXT;
ALTER TABLE subject_teachers ADD COLUMN assigned_date TEXT;
ALTER TABLE subject_teachers ADD COLUMN created_at TEXT;
ALTER TABLE subject_teachers ADD COLUMN updated_at TEXT;

UPDATE subject_teachers
SET id = lower(hex(randomblob(16)))
WHERE id IS NULL;

UPDATE subject_teachers
SET assigned_date = datetime('now')
WHERE assigned_date IS NULL;

UPDATE subject_teachers
SET created_at = datetime('now')
WHERE created_at IS NULL;

UPDATE subject_teachers
SET updated_at = datetime('now')
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subject_teachers_academic_session ON subject_teachers(academic_session);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher_id ON subject_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject_id ON subject_teachers(subject_id);
