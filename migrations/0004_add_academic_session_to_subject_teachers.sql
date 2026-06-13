-- Add academic_session column to subject_teachers table
-- This column is needed to track which academic session a teacher was assigned to a subject

ALTER TABLE subject_teachers ADD COLUMN academic_session TEXT;

-- Create index for filtering by academic_session
CREATE INDEX IF NOT EXISTS idx_subject_teachers_academic_session ON subject_teachers(academic_session);
