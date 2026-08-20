-- Track how a student-subject enrollment was created:
-- 'auto'   => auto-assigned because the subject is compulsory in the class
-- 'manual' => explicitly assigned to the student as an optional subject
ALTER TABLE student_subjects ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';