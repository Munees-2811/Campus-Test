\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 001: profiles
-- Replaces the MongoDB User model.
-- Stores application users (admins and students).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trigger function: set updated_at to NOW() on every UPDATE
-- Created here once; reused by later migrations.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(60)   NOT NULL CHECK (length(name) >= 2),
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(10)   NOT NULL DEFAULT 'student'
                              CHECK (role IN ('admin', 'student')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at on row update
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_profiles_updated_at'
      AND tgrelid = 'profiles'::regclass
  ) THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
