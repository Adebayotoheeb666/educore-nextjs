-- Add status column to exams table
ALTER TABLE exams ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed'));
