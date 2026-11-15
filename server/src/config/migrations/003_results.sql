\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 003: results
-- Replaces the MongoDB Result model.
-- Records a student's submission for a specific test.
-- One submission per student per test (enforced by UNIQUE constraint).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id            UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- [{questionIndex, selectedOption, isCorrect}]
  answers            JSONB       NOT NULL DEFAULT '[]',
  score              INTEGER     NOT NULL DEFAULT 0,
  total_marks        INTEGER     NOT NULL DEFAULT 0,
  passed             BOOLEAN     NOT NULL DEFAULT FALSE,
  time_taken_seconds INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate submissions
  CONSTRAINT uq_results_test_student UNIQUE (test_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_results_student_id
  ON results (student_id);

CREATE INDEX IF NOT EXISTS idx_results_test_id
  ON results (test_id);
