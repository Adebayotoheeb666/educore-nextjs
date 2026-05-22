-- Add missing student-specific fields to users table
-- These columns support student profile management

-- Add address column if it doesn't exist
ALTER TABLE users ADD COLUMN address TEXT;

-- Add state_of_origin column if it doesn't exist  
ALTER TABLE users ADD COLUMN state_of_origin TEXT;

-- Add class_id column with foreign key if it doesn't exist
ALTER TABLE users ADD COLUMN class_id TEXT REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for class_id lookups
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
