-- ============================================================
-- Educore SQLite/Turso Schema
-- Migrated from MongoDB/Mongoose models
-- ============================================================

-- ============================================================
-- CORE: Schools
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  type TEXT,
  owner_id TEXT,
  sub_domain TEXT UNIQUE,
  address TEXT,
  logo TEXT,
  -- Subscription fields (flattened from MongoDB nested object)
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK(subscription_status IN ('active', 'inactive', 'trial')),
  subscription_plan TEXT NOT NULL DEFAULT 'basic',
  ai_token_budget INTEGER NOT NULL DEFAULT 100000,
  used_ai_tokens INTEGER NOT NULL DEFAULT 0,
  subscription_expires_at TEXT,
  subscription_last_paid_at TEXT,
  billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')),
  -- Settings
  academic_session TEXT NOT NULL DEFAULT '2024/2025',
  current_term TEXT NOT NULL DEFAULT 'first' CHECK(current_term IN ('first', 'second', 'third')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Allow branches (multiple schools owned by the same owner) to share the same
-- email address by scoping uniqueness to the owner. This replaces the previous
-- global UNIQUE constraint on `email`.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_owner_email ON schools(owner_id, email);

CREATE TABLE IF NOT EXISTS school_backup_settings (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  google_drive_connected INTEGER NOT NULL DEFAULT 0,
  google_drive_folder_id TEXT,
  google_drive_token TEXT,
  google_drive_refresh_token TEXT,
  google_drive_token_expires_at TEXT,
  last_backup_at TEXT,
  last_restore_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_backup_settings_school_id ON school_backup_settings(school_id);

-- ============================================================
-- CORE: Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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

-- Parent-child relationships (replaces MongoDB arrays on User)
CREATE TABLE IF NOT EXISTS user_relationships (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(parent_id, child_id)
);

-- ============================================================
-- CORE: Auth Tokens (password reset, invite tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('reset', 'invite', 'verify')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Classes
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  level TEXT,
  section TEXT,
  academic_session TEXT,
  current_term TEXT,
  capacity INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Subjects
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  is_compulsory INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Student-Class Enrollments
-- ============================================================
-- Track which students are in which classes for which academic session
-- Allows students to move between classes across sessions
CREATE TABLE IF NOT EXISTS students_classes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_session TEXT NOT NULL,
  term TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'transferred', 'promoted', 'retained', 'graduated', 'withdrawn')),
  enrolled_date TEXT NOT NULL DEFAULT (datetime('now')),
  left_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, class_id, academic_session)
);

-- ============================================================
-- ACADEMIC: Class-Subject Curriculum
-- ============================================================
-- Define which subjects are taught in which classes
CREATE TABLE IF NOT EXISTS class_subjects (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_compulsory INTEGER NOT NULL DEFAULT 1,
  sequence INTEGER,
  academic_session TEXT,
  added_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(class_id, subject_id, academic_session)
);

-- Subject-Teacher assignments (many-to-many)
-- Teachers assigned to teach specific subjects in specific classes
CREATE TABLE IF NOT EXISTS subject_teachers (
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

-- ============================================================
-- ACADEMIC: Attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, class_id, date, term, academic_session)
);

-- ============================================================
-- ACADEMIC: Exams
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  type TEXT CHECK(type IN ('ca', 'exam', 'quiz', 'assignment')),
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  date TEXT,
  duration_minutes INTEGER,
  total_marks INTEGER,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Question Bank
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  instructions TEXT,
  -- For multiple choice: JSON array of options
  options TEXT,
  -- Correct answer(s)
  correct_answer TEXT,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  bloom_level TEXT CHECK(bloom_level IN ('knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation')),
  tags TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Track which questions are used in which exams
CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sequence INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_school_id ON questions(school_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_class_id ON questions(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);

-- ============================================================
-- ACADEMIC: Student-Subject Enrollment
-- ============================================================
-- Track which students are taking which subjects in which classes
-- Not all students may take all subjects in a class
CREATE TABLE IF NOT EXISTS student_subjects (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_session TEXT NOT NULL,
  term TEXT,
  enrolled_date TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'dropped', 'transferred')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, subject_id, class_id, academic_session)
);

-- ============================================================
-- ACADEMIC: Results
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  ca_score REAL,
  exam_score REAL,
  total_score REAL,
  grade TEXT,
  remark TEXT,
  position INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Lesson Plans
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  week INTEGER,
  topic TEXT,
  objectives TEXT,
  content TEXT,
  materials TEXT,
  activities TEXT,
  assessment TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACADEMIC: Timetable
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  day TEXT NOT NULL CHECK(day IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FINANCE: Fees
-- ============================================================
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  due_date TEXT,
  is_compulsory INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  fee_id TEXT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payroll_transactions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FINANCE: Payments (Flutterwave transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS online_transactions (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_type TEXT,
  metadata TEXT,
  flutterwave_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- COMMUNICATION: Announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_roles TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- COMMUNICATION: Feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  type TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- COMMUNICATION: Blog
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  tags TEXT,
  category TEXT,
  read_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  cover_image TEXT,
  shelf_location TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS book_borrows (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrowed_at TEXT NOT NULL DEFAULT (datetime('now')),
  due_date TEXT NOT NULL,
  returned_at TEXT,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK(status IN ('borrowed', 'returned', 'overdue', 'lost')),
  fine_amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_calendar (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  type TEXT CHECK(type IN ('holiday', 'exam', 'event', 'term_start', 'term_end', 'other')),
  term TEXT,
  academic_session TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- BEHAVIOR TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS behavior_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('positive', 'negative', 'neutral', 'warning', 'commendation')),
  category TEXT,
  description TEXT NOT NULL,
  action_taken TEXT,
  date TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SYNC
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  device_id TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  payload TEXT,
  error TEXT,
  synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- STAFF RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  employee_id TEXT,
  department TEXT,
  position TEXT,
  qualification TEXT,
  salary REAL,
  join_date TEXT,
  employment_type TEXT CHECK(employment_type IN ('full_time', 'part_time', 'contract')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SERVICE ARCHITECTURE (New - modular service system)
-- ============================================================

-- Service catalog
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_compulsory INTEGER NOT NULL DEFAULT 0,
  base_price REAL NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_period IN ('monthly', 'yearly', 'one_time')),
  dependencies TEXT,            -- JSON array of service slugs this depends on
  category TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Services each school is subscribed to
CREATE TABLE IF NOT EXISTS school_services (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'trial')),
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  price_paid REAL,
  billing_period TEXT,
  activated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(school_id, service_id)
);

-- Service subscription tiers
CREATE TABLE IF NOT EXISTS service_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price REAL NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  service_ids TEXT NOT NULL,    -- JSON array of service IDs included in tier
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Billing history
CREATE TABLE IF NOT EXISTS billing_history (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  tier_id TEXT REFERENCES service_tiers(id) ON DELETE SET NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
  reference TEXT,
  description TEXT,
  billing_period_start TEXT,
  billing_period_end TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Service usage tracking (for metered services like AI tokens)
CREATE TABLE IF NOT EXISTS service_usage (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  metric TEXT NOT NULL,          -- e.g. 'ai_tokens', 'storage_mb', 'api_calls'
  quantity REAL NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  period_start TEXT,
  period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_students_classes_student_id ON students_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_students_classes_class_id ON students_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_students_classes_session ON students_classes(academic_session);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_class_id ON student_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_session ON student_subjects(academic_session);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject_id ON subject_teachers(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher_id ON subject_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_class_id ON subject_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_results_subject_id ON results(subject_id);
CREATE INDEX IF NOT EXISTS idx_fees_school_id ON fees(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_library_books_school_id ON library_books(school_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_student_id ON behavior_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_school_services_school_id ON school_services(school_id);
CREATE INDEX IF NOT EXISTS idx_school_services_service_id ON school_services(service_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_school_id ON billing_history(school_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_school_id ON service_usage(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_id ON activity_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- ============================================================
-- RATE LIMITING
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,           -- e.g. "login:1.2.3.4" or "login:user@email.com"
  count INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL,  -- ISO8601 timestamp of window start
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
