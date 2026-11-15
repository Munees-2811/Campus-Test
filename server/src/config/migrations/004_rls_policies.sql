\set ON_ERROR_STOP on

-- =============================================================================
-- Migration 004: Row Level Security (RLS) policies
--
-- IMPORTANT ARCHITECTURAL NOTE:
-- The backend uses the Supabase SERVICE ROLE key, which bypasses RLS entirely.
-- All data mutations (INSERT, UPDATE, DELETE) are performed exclusively through
-- the backend service and are NOT subject to these policies.
--
-- These policies are written as DEFENSE IN DEPTH — they protect against:
--   - Direct database connections using the anon or authenticated Supabase keys
--   - Accidental exposure via Supabase auto-generated REST endpoints
--
-- RLS context variables (set by the backend per-request via SET LOCAL):
--   current_setting('app.user_role', true)  -- 'admin' | 'student'
--   current_setting('app.user_id',   true)  -- UUID of the authenticated user
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE tests    FORCE ROW LEVEL SECURITY;
ALTER TABLE results  FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- profiles policies
-- Mutations are intentionally not permitted via RLS (service role only).
-- =============================================================================

-- Admins can read all profiles
DROP POLICY IF EXISTS profiles_admin_select ON profiles;
CREATE POLICY profiles_admin_select
  ON profiles
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- Students can read only their own profile
DROP POLICY IF EXISTS profiles_student_select ON profiles;
CREATE POLICY profiles_student_select
  ON profiles
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'student'
    AND id::text = current_setting('app.user_id', true)
  );

-- =============================================================================
-- tests policies
-- =============================================================================

-- Admins can SELECT all tests (including inactive)
DROP POLICY IF EXISTS tests_admin_select ON tests;
CREATE POLICY tests_admin_select
  ON tests
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- Admins can INSERT new tests
DROP POLICY IF EXISTS tests_admin_insert ON tests;
CREATE POLICY tests_admin_insert
  ON tests
  FOR INSERT
  WITH CHECK (current_setting('app.user_role', true) = 'admin');

-- Admins can UPDATE any test
DROP POLICY IF EXISTS tests_admin_update ON tests;
CREATE POLICY tests_admin_update
  ON tests
  FOR UPDATE
  USING (current_setting('app.user_role', true) = 'admin');

-- Admins can DELETE any test
DROP POLICY IF EXISTS tests_admin_delete ON tests;
CREATE POLICY tests_admin_delete
  ON tests
  FOR DELETE
  USING (current_setting('app.user_role', true) = 'admin');

-- Students can SELECT only active tests
DROP POLICY IF EXISTS tests_student_select ON tests;
CREATE POLICY tests_student_select
  ON tests
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'student'
    AND is_active = TRUE
  );

-- =============================================================================
-- results policies
-- INSERTs are performed exclusively by the backend (service role).
-- =============================================================================

-- Admins can SELECT all results
DROP POLICY IF EXISTS results_admin_select ON results;
CREATE POLICY results_admin_select
  ON results
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- Students can SELECT only their own results
DROP POLICY IF EXISTS results_student_select ON results;
CREATE POLICY results_student_select
  ON results
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'student'
    AND student_id::text = current_setting('app.user_id', true)
  );
