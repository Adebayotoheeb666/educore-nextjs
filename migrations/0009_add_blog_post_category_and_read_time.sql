-- Add missing blog post metadata fields used by the current codebase
ALTER TABLE blog_posts ADD COLUMN category TEXT;
ALTER TABLE blog_posts ADD COLUMN read_time TEXT;
