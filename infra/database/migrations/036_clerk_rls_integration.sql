-- CS-Support Service - Clerk RLS Integration
-- Version: 1.0
-- Created: 2026-02-22
-- Description: Integrates Clerk authentication with Supabase RLS for proper access control
-- 
-- ARCHITECTURE COMPLIANCE: This migration enables the database to be the enforcement
-- authority for access control, as required by the TrueVow Data Architecture Directive.

-- ============================================================================
-- CORE CONTEXT FUNCTIONS
-- ============================================================================

-- Drop old function with old name (renamed to set_clerk_user_context)
DROP FUNCTION IF EXISTS set_current_clerk_user_id(text);

-- Function to set the Clerk user context for the current session
-- MUST be called at the start of each request by application code
-- Example: SELECT set_clerk_user_context('user_abc123');
CREATE OR REPLACE FUNCTION set_clerk_user_context(p_clerk_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Set the session variable that RLS policies will check
  PERFORM set_config('app.current_clerk_user_id', p_clerk_user_id, false);
  
  -- Also set in the connection-level config for redundancy
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_clerk_user_id)::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing function to read from our session variable
-- NOTE: Using CREATE OR REPLACE since signature unchanged (no params, returns TEXT)
-- This preserves dependent RLS policies
CREATE OR REPLACE FUNCTION get_current_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  clerk_user_id TEXT;
BEGIN
  -- Primary: Get from session variable (set by set_clerk_user_context)
  BEGIN
    clerk_user_id := current_setting('app.current_clerk_user_id', true);
    IF clerk_user_id IS NOT NULL AND clerk_user_id != '' THEN
      RETURN clerk_user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- Fallback: Try JWT claims (for Supabase Auth compatibility)
  BEGIN
    clerk_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    IF clerk_user_id IS NOT NULL AND clerk_user_id != '' THEN
      RETURN clerk_user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- No user context found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROLE CHECKING FUNCTIONS
-- ============================================================================

-- Drop existing functions that have parameter name changes
-- Note: is_team_member(), get_current_user_role(), is_admin() have no params so OR REPLACE is safe
-- But has_role and has_any_role have param name changes (required_role -> p_role/p_roles)
DROP FUNCTION IF EXISTS has_role(text);
DROP FUNCTION IF EXISTS has_any_role(text[]);

-- Check if current user is a team member (has entry in cs_team_members)
-- Using OR REPLACE since signature unchanged
CREATE OR REPLACE FUNCTION is_team_member()
RETURNS BOOLEAN AS $$
DECLARE
  current_clerk_user_id TEXT;
  member_count INT;
BEGIN
  current_clerk_user_id := get_current_clerk_user_id();
  
  IF current_clerk_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT COUNT(*) INTO member_count
  FROM cs_team_members
  WHERE cs_team_members.clerk_user_id = current_clerk_user_id
    AND is_active = TRUE;
  
  RETURN member_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
-- Using OR REPLACE since signature unchanged
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  current_clerk_user_id TEXT;
  user_role TEXT;
BEGIN
  current_clerk_user_id := get_current_clerk_user_id();
  
  IF current_clerk_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role
  FROM cs_team_members
  WHERE cs_team_members.clerk_user_id = current_clerk_user_id
    AND is_active = TRUE
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is an admin (head_of_cs or support_manager)
-- Using OR REPLACE since signature unchanged
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_current_user_role();
  
  RETURN user_role IN ('head_of_cs', 'support_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(p_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_current_user_role();
  
  RETURN user_role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_role(p_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_current_user_role();
  
  RETURN user_role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get the team member's member_id for the current user
-- Using OR REPLACE since signature unchanged
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
DECLARE
  current_clerk_user_id TEXT;
  v_member_id UUID;
BEGIN
  current_clerk_user_id := get_current_clerk_user_id();
  
  IF current_clerk_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT member_id INTO v_member_id
  FROM cs_team_members
  WHERE cs_team_members.clerk_user_id = current_clerk_user_id
    AND is_active = TRUE
  LIMIT 1;
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONTEXT CLEARING FUNCTION
-- ============================================================================

-- Clear the user context (for security at end of request)
DROP FUNCTION IF EXISTS clear_clerk_user_context();
CREATE OR REPLACE FUNCTION clear_clerk_user_context()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_clerk_user_id', '', false);
  PERFORM set_config('request.jwt.claims', '{}', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================

-- Check if RLS context is properly set
DROP FUNCTION IF EXISTS rls_context_is_set();
CREATE OR REPLACE FUNCTION rls_context_is_set()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_clerk_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE NOTES FOR APPLICATION LAYER
-- ============================================================================
-- 
-- Application code MUST call set_clerk_user_context() at the start of each
-- request that accesses the database. Example flow:
--
-- 1. Request arrives with Clerk session
-- 2. Extract userId from Clerk auth
-- 3. Call: SELECT set_clerk_user_context('user_abc123');
-- 4. Execute database queries (RLS policies will use the context)
-- 5. Call: SELECT clear_clerk_user_context(); (optional, for security)
--
-- The createServerSupabase() function in lib/db/supabase.ts should be updated
-- to automatically call set_clerk_user_context() after creating the client.
--
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
