
CREATE TABLE IF NOT EXISTS users_tmp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
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
  -- Student-specific fields
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

INSERT OR IGNORE INTO users_tmp SELECT * FROM users;

DROP TABLE users;

ALTER TABLE users_tmp RENAME TO users;
