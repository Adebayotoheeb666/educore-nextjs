-- Enforce single active enrollment per student per academic session
-- This prevents a student from being enrolled in multiple classes at the same time

-- Clean up any duplicate active enrollments (keep most recent) before adding constraint
-- If a student has multiple active rows for same session, mark older ones as transferred
UPDATE students_classes
SET status = 'transferred', left_date = datetime('now'), updated_at = datetime('now')
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY student_id, academic_session ORDER BY enrolled_date DESC, created_at DESC) as rn
    FROM students_classes
    WHERE status = 'active'
  ) WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_classes_one_active_per_session ON students_classes(student_id, academic_session) WHERE status = 'active';
