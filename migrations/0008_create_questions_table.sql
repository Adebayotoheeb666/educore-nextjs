-- Create questions table for question bank
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
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
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
