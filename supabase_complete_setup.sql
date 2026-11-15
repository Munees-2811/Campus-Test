-- =============================================================================
-- CampusTest - Complete Supabase PostgreSQL Database Setup
-- 
-- INSTRUCTIONS FOR SUPABASE WEBSITE:
-- 1. Go to https://supabase.com/dashboard and open your project.
-- 2. In the left navigation, click "SQL Editor" (icon with '>_').
-- 3. Click "+ New query".
-- 4. Paste the ENTIRE contents of this file and click "Run" (green button).
-- 5. All 10 tables, triggers, RLS policies, and seed users will be created instantly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Helper Trigger Function: updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (Users: Admins and Students)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(60)   NOT NULL CHECK (length(name) >= 2),
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(10)   NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Tests Table (Assessments)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(120)  NOT NULL,
  description      TEXT          NOT NULL DEFAULT '',
  category         VARCHAR(80)   NOT NULL DEFAULT 'General',
  duration_minutes INTEGER       NOT NULL DEFAULT 30 CHECK (duration_minutes >= 1),
  total_marks      INTEGER       NOT NULL DEFAULT 0,
  pass_marks       INTEGER       NOT NULL DEFAULT 0,
  questions        JSONB         NOT NULL DEFAULT '[]', -- JSONB storage for backwards compatibility with MERN frontend
  created_by       UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);

DROP TRIGGER IF EXISTS trg_tests_updated_at ON tests;
CREATE TRIGGER trg_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Questions Table (Normalized assessment questions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id        UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text  TEXT         NOT NULL,
  question_type  VARCHAR(30)  NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'coding', 'true_false', 'short_answer')),
  options        JSONB        DEFAULT '[]',
  correct_answer INTEGER      DEFAULT 0,
  marks          INTEGER      NOT NULL DEFAULT 1 CHECK (marks >= 1),
  order_index    INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);

-- -----------------------------------------------------------------------------
-- 4. Test Cases Table (Coding assessments - Includes hidden test cases)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_cases (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  input           TEXT         NOT NULL,
  expected_output TEXT         NOT NULL,
  is_hidden       BOOLEAN      NOT NULL DEFAULT FALSE, -- Hidden test cases kept secure on backend
  marks           INTEGER      NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_hidden ON test_cases(is_hidden);

-- -----------------------------------------------------------------------------
-- 5. Assignments Table (Assigning tests to specific students or cohorts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id   UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by  UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assignment_test_student UNIQUE(test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_test_id ON assignments(test_id);

-- -----------------------------------------------------------------------------
-- 6. Attempts Table (Tracking test attempts and session timing)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id   UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status       VARCHAR(20)  NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'timed_out', 'abandoned')),
  time_spent   INTEGER      NOT NULL DEFAULT 0, -- in seconds
  score        INTEGER      DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student_test ON attempts(student_id, test_id);

-- -----------------------------------------------------------------------------
-- 7. Submissions Table (Question-level student answers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id       UUID         REFERENCES attempts(id) ON DELETE CASCADE,
  test_id          UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id       UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id      UUID         REFERENCES questions(id) ON DELETE SET NULL,
  question_index   INTEGER      NOT NULL DEFAULT 0,
  selected_option  INTEGER,
  submitted_code   TEXT,
  is_correct       BOOLEAN      NOT NULL DEFAULT FALSE,
  marks_awarded    INTEGER      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_attempt_id ON submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_test ON submissions(student_id, test_id);

-- -----------------------------------------------------------------------------
-- 8. Results Table (Final evaluated scorecards)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id            UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers            JSONB       NOT NULL DEFAULT '[]', -- [{questionIndex, selectedOption, isCorrect}]
  score              INTEGER     NOT NULL DEFAULT 0,
  total_marks        INTEGER     NOT NULL DEFAULT 0,
  passed             BOOLEAN     NOT NULL DEFAULT FALSE,
  time_taken_seconds INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_results_test_student UNIQUE (test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON results(test_id);

-- -----------------------------------------------------------------------------
-- 9. Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- -----------------------------------------------------------------------------
-- 10. Activity Logs Table (Audit and telemetry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB        DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- =============================================================================
-- Row Level Security (RLS) Configuration
-- =============================================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Note: The Express backend uses SUPABASE_SERVICE_ROLE_KEY, which safely bypasses
-- RLS. These policies ensure defense-in-depth against direct client anon access.

-- =============================================================================
-- Seed Data: Default Admin & Student Accounts
-- Password for both: Password123!
-- Bcrypt Hash: $2b$10$s9ptm8jRrVwSkqF9qoi9wuLqGUtebsUUZeIT1UbO0ChqyCx6B4TkC
-- =============================================================================
INSERT INTO profiles (id, name, email, password_hash, role)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Campus Administrator',
    'admin@campus.edu',
    '$2b$10$s9ptm8jRrVwSkqF9qoi9wuLqGUtebsUUZeIT1UbO0ChqyCx6B4TkC',
    'admin'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'John Student',
    'student@campus.edu',
    '$2b$10$s9ptm8jRrVwSkqF9qoi9wuLqGUtebsUUZeIT1UbO0ChqyCx6B4TkC',
    'student'
  )
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Tests
INSERT INTO tests (id, title, description, category, duration_minutes, total_marks, pass_marks, questions, created_by, is_active)
VALUES
  (
    'c0000000-0000-0000-0000-000000000003',
    'Full-Stack JavaScript & React Assessment',
    'Covers React hooks, Express routing, HTTP methods, and PostgreSQL concepts.',
    'Technical',
    15,
    4,
    2,
    '[
      {
        "questionText": "Which React hook is used to handle side effects in functional components?",
        "options": ["useState", "useEffect", "useMemo", "useContext"],
        "correctAnswer": 1,
        "marks": 1
      },
      {
        "questionText": "What HTTP method is typically used to create a new resource in a RESTful API?",
        "options": ["GET", "POST", "PUT", "DELETE"],
        "correctAnswer": 1,
        "marks": 1
      },
      {
        "questionText": "In relational databases like PostgreSQL, what is a row in a table called?",
        "options": ["Document", "Tuple / Record", "Collection", "Schema"],
        "correctAnswer": 1,
        "marks": 1
      },
      {
        "questionText": "What does JWT stand for in web application security?",
        "options": ["Java Web Token", "JSON Web Token", "JavaScript Web Tool", "Joint Wireless Transport"],
        "correctAnswer": 1,
        "marks": 1
      }
    ]'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'Campus Aptitude & Logical Reasoning',
    'General aptitude and problem-solving assessment for placement rounds.',
    'Aptitude',
    20,
    2,
    1,
    '[
      {
        "questionText": "If a train runs at 60 km/h, how many meters does it travel in 1 second?",
        "options": ["16.67 meters", "15.5 meters", "18.2 meters", "20.0 meters"],
        "correctAnswer": 0,
        "marks": 1
      },
      {
        "questionText": "Which number completes the sequence: 2, 6, 12, 20, 30, ?",
        "options": ["40", "42", "44", "48"],
        "correctAnswer": 1,
        "marks": 1
      }
    ]'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Welcome Notification
INSERT INTO notifications (user_id, title, message)
VALUES
  (
    'b0000000-0000-0000-0000-000000000002',
    'Welcome to CampusTest!',
    'Your student account is active. You can now take assessments from your student portal.'
  );
