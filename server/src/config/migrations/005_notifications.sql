\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 005: notifications
-- Stores in-app notifications delivered to users (admin or student).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- Composite index supports queries like:
--   WHERE user_id = $1 AND is_read = FALSE
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read
  ON notifications (user_id, is_read);
