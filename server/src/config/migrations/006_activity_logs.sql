\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 006: activity_logs
-- Append-only audit trail for significant actions in the platform.
-- user_id is nullable to allow logging of actions by deleted users or
-- unauthenticated requests (e.g. failed login attempts).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: activity_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL when the acting user has been deleted (ON DELETE SET NULL)
  user_id     UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  -- Human-readable action name, e.g. 'submit_test', 'create_test', 'login'
  action      VARCHAR(100) NOT NULL,
  -- The kind of entity affected, e.g. 'test', 'result', 'user'
  entity_type VARCHAR(50),
  -- The UUID of the affected entity (nullable for non-entity actions)
  entity_id   UUID,
  -- Arbitrary JSON bag for extra context (request IP, diff, etc.)
  metadata    JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs (user_id);

-- Composite index supports queries filtering by entity type + id
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_id
  ON activity_logs (entity_type, entity_id);
