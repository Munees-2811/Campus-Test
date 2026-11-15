\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 002: tests
-- Replaces the MongoDB Test model.
-- Stores assessments created by admins.
--
-- NOTE: The `questions` JSONB column includes correctAnswer values.
-- These are NEVER sent directly to students; the backend strips correctAnswer
-- fields before returning question data to student-role API consumers.
-- RLS is NOT used to hide correctAnswer — the backend service-role key bypasses
-- RLS entirely. Stripping happens at the application layer.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: tests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(120)  NOT NULL,
  description      TEXT          NOT NULL DEFAULT '',
  category         VARCHAR(80)   NOT NULL DEFAULT 'General',
  duration_minutes INTEGER       NOT NULL DEFAULT 30 CHECK (duration_minutes >= 1),
  total_marks      INTEGER       NOT NULL DEFAULT 0,
  pass_marks       INTEGER       NOT NULL DEFAULT 0,
  -- Full question objects: [{questionText, options, correctAnswer, marks}]
  -- correctAnswer is stripped by the backend before returning to students.
  questions        JSONB         NOT NULL DEFAULT '[]',
  created_by       UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tests_is_active
  ON tests (is_active);

CREATE INDEX IF NOT EXISTS idx_tests_created_by
  ON tests (created_by);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at on row update
-- (set_updated_at() was created in 001_profiles.sql)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_tests_updated_at'
      AND tgrelid = 'tests'::regclass
  ) THEN
    CREATE TRIGGER trg_tests_updated_at
      BEFORE UPDATE ON tests
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
