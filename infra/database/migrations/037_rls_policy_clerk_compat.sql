-- CS-Support Service - RLS Policy Clerk Compatibility Update
-- Version: 1.0
-- Created: 2026-02-22
-- Description: Updates RLS policies to work with Clerk authentication (anon key + context)
-- 
-- ARCHITECTURE COMPLIANCE: This enables RLS enforcement for Clerk-authenticated users
-- using the anon key, as required by the TrueVow Data Architecture Directive.

-- ============================================================================
-- CONTEXT VALIDATION FUNCTION
-- ============================================================================

-- Check if request has valid Clerk context (for RLS with anon key)
CREATE OR REPLACE FUNCTION has_valid_clerk_context()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if Clerk user context is set via our RPC call
  RETURN get_current_clerk_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if request is from authenticated team member (via Clerk)
CREATE OR REPLACE FUNCTION is_authenticated_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  -- Must have valid Clerk context AND be a team member
  RETURN has_valid_clerk_context() AND is_team_member();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if request is from authenticated admin (via Clerk)
CREATE OR REPLACE FUNCTION is_authenticated_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Must have valid Clerk context AND be an admin
  RETURN has_valid_clerk_context() AND is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if request is from authenticated CSM (via Clerk)
CREATE OR REPLACE FUNCTION is_authenticated_csm()
RETURNS BOOLEAN AS $$
BEGIN
  -- Must have valid Clerk context AND be a CSM or above
  RETURN has_valid_clerk_context() AND is_csm_or_above();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION TO SAFELY UPDATE POLICIES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_table_policies(
  p_table_name TEXT,
  p_policy_type TEXT DEFAULT 'team_member'
)
RETURNS TEXT AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = p_table_name
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN 'SKIPPED: Table ' || p_table_name || ' does not exist';
  END IF;
  
  -- Drop existing policies
  EXECUTE format('DROP POLICY IF EXISTS "team_members_can_view_%s" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "team_members_can_create_%s" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "team_members_can_update_%s" ON %I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "admins_can_delete_%s" ON %I', p_table_name, p_table_name);
  
  IF p_policy_type = 'team_member' THEN
    -- SELECT policy
    EXECUTE format('
      CREATE POLICY "team_members_can_view_%s"
        ON %I FOR SELECT
        USING (is_authenticated_team_member())
    ', p_table_name, p_table_name);
    
    -- INSERT policy
    EXECUTE format('
      CREATE POLICY "team_members_can_create_%s"
        ON %I FOR INSERT
        WITH CHECK (is_authenticated_team_member())
    ', p_table_name, p_table_name);
    
    -- UPDATE policy
    EXECUTE format('
      CREATE POLICY "team_members_can_update_%s"
        ON %I FOR UPDATE
        USING (is_authenticated_team_member())
        WITH CHECK (is_authenticated_team_member())
    ', p_table_name, p_table_name);
    
    -- DELETE policy (admin only)
    EXECUTE format('
      CREATE POLICY "admins_can_delete_%s"
        ON %I FOR DELETE
        USING (is_authenticated_admin())
    ', p_table_name, p_table_name);
    
  ELSIF p_policy_type = 'admin' THEN
    -- Drop admin-style policies too
    EXECUTE format('DROP POLICY IF EXISTS "admins_can_view_%s" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "admins_can_create_%s" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "admins_can_update_%s" ON %I', p_table_name, p_table_name);
    
    -- Admin-only policies
    EXECUTE format('
      CREATE POLICY "admins_can_view_%s"
        ON %I FOR SELECT
        USING (is_authenticated_admin())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "admins_can_create_%s"
        ON %I FOR INSERT
        WITH CHECK (is_authenticated_admin())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "admins_can_update_%s"
        ON %I FOR UPDATE
        USING (is_authenticated_admin())
        WITH CHECK (is_authenticated_admin())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "admins_can_delete_%s"
        ON %I FOR DELETE
        USING (is_authenticated_admin())
    ', p_table_name, p_table_name);
    
  ELSIF p_policy_type = 'csm' THEN
    -- Drop CSM-style policies
    EXECUTE format('DROP POLICY IF EXISTS "csm_can_view_%s" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "csm_can_create_%s" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "csm_can_update_%s" ON %I', p_table_name, p_table_name);
    
    -- CSM policies
    EXECUTE format('
      CREATE POLICY "csm_can_view_%s"
        ON %I FOR SELECT
        USING (is_authenticated_csm())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "csm_can_create_%s"
        ON %I FOR INSERT
        WITH CHECK (is_authenticated_csm())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "csm_can_update_%s"
        ON %I FOR UPDATE
        USING (is_authenticated_csm())
        WITH CHECK (is_authenticated_csm())
    ', p_table_name, p_table_name);
    
    EXECUTE format('
      CREATE POLICY "admins_can_delete_%s"
        ON %I FOR DELETE
        USING (is_authenticated_admin())
    ', p_table_name, p_table_name);
  END IF;
  
  RETURN 'OK: Updated policies for ' || p_table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES FOR ALL TABLES
-- ============================================================================

-- Core tables (team member access)
SELECT update_table_policies('cs_tickets');
SELECT update_table_policies('cs_messages');
SELECT update_table_policies('cs_conversations');
SELECT update_table_policies('cs_team_activity_feed');
SELECT update_table_policies('cs_team_members');
SELECT update_table_policies('cs_agent_executions');

-- KB tables (special handling - public read)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cs_kb_articles') THEN
    DROP POLICY IF EXISTS "public_can_read_kb_articles" ON cs_kb_articles;
    DROP POLICY IF EXISTS "team_members_can_view_all_kb_articles" ON cs_kb_articles;
    DROP POLICY IF EXISTS "team_members_can_create_kb_articles" ON cs_kb_articles;
    DROP POLICY IF EXISTS "team_members_can_update_kb_articles" ON cs_kb_articles;
    DROP POLICY IF EXISTS "managers_can_delete_kb_articles" ON cs_kb_articles;

    CREATE POLICY "public_can_read_kb_articles"
      ON cs_kb_articles FOR SELECT
      USING (status = 'published');

    CREATE POLICY "team_members_can_view_all_kb_articles"
      ON cs_kb_articles FOR SELECT
      USING (is_authenticated_team_member());

    CREATE POLICY "team_members_can_create_kb_articles"
      ON cs_kb_articles FOR INSERT
      WITH CHECK (is_authenticated_team_member());

    CREATE POLICY "team_members_can_update_kb_articles"
      ON cs_kb_articles FOR UPDATE
      USING (is_authenticated_team_member())
      WITH CHECK (is_authenticated_team_member());

    CREATE POLICY "managers_can_delete_kb_articles"
      ON cs_kb_articles FOR DELETE
      USING (is_authenticated_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cs_kb_categories') THEN
    DROP POLICY IF EXISTS "public_can_read_kb_categories" ON cs_kb_categories;
    DROP POLICY IF EXISTS "team_members_can_create_kb_categories" ON cs_kb_categories;
    DROP POLICY IF EXISTS "team_members_can_update_kb_categories" ON cs_kb_categories;
    DROP POLICY IF EXISTS "managers_can_delete_kb_categories" ON cs_kb_categories;

    CREATE POLICY "public_can_read_kb_categories"
      ON cs_kb_categories FOR SELECT
      USING (TRUE);

    CREATE POLICY "team_members_can_create_kb_categories"
      ON cs_kb_categories FOR INSERT
      WITH CHECK (is_authenticated_team_member());

    CREATE POLICY "team_members_can_update_kb_categories"
      ON cs_kb_categories FOR UPDATE
      USING (is_authenticated_team_member())
      WITH CHECK (is_authenticated_team_member());

    CREATE POLICY "managers_can_delete_kb_categories"
      ON cs_kb_categories FOR DELETE
      USING (is_authenticated_admin());
  END IF;
END $$;

-- Admin-only tables
SELECT update_table_policies('cs_llm_agents', 'admin');
SELECT update_table_policies('cs_integrations', 'admin');
SELECT update_table_policies('cs_api_keys', 'admin');

-- CSM tables
SELECT update_table_policies('cs_customer_success_metrics', 'csm');
SELECT update_table_policies('cs_customer_health_scores', 'csm');
SELECT update_table_policies('cs_customer_churn_risk', 'csm');
SELECT update_table_policies('cs_customer_onboarding_progress', 'csm');

-- Remaining tables (team member access)
SELECT update_table_policies('cs_agent_performance_metrics');
SELECT update_table_policies('cs_email_logs');
SELECT update_table_policies('cs_notifications');
SELECT update_table_policies('cs_sla_policies');
SELECT update_table_policies('cs_survey_csat');
SELECT update_table_policies('cs_survey_nps');
SELECT update_table_policies('cs_sms_logs');
SELECT update_table_policies('cs_call_logs');
SELECT update_table_policies('cs_kb_tags');
SELECT update_table_policies('cs_kb_article_tags');
SELECT update_table_policies('cs_kb_article_views');
SELECT update_table_policies('cs_sla_tracking');
SELECT update_table_policies('cs_ticket_quality_scores');
SELECT update_table_policies('cs_agent_feedback');
SELECT update_table_policies('cs_agent_training_data');
SELECT update_table_policies('cs_agent_state');
SELECT update_table_policies('cs_agent_orchestration');
SELECT update_table_policies('cs_agent_circuit_breakers');
SELECT update_table_policies('cs_agent_dlq');
SELECT update_table_policies('cs_agent_rate_limits');
SELECT update_table_policies('cs_agent_cost_tracking');
SELECT update_table_policies('cs_agent_monitoring');
SELECT update_table_policies('cs_webhooks');

-- Clean up helper function
DROP FUNCTION IF EXISTS update_table_policies(TEXT, TEXT);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary of changes:
-- 1. Created 4 new helper functions that check Clerk context + role
-- 2. Updated all RLS policies to work with anon key + Clerk authentication
-- 3. Removed dependency on Supabase Auth's 'authenticated' role
-- 4. Access is now enforced via Clerk context set by set_clerk_user_context()
--
-- Flow:
-- 1. Request arrives with Clerk session
-- 2. createServerSupabase() extracts userId from Clerk
-- 3. Calls set_clerk_user_context(userId) RPC
-- 4. RLS policies check is_authenticated_team_member() / is_authenticated_admin()
-- 5. These functions verify Clerk context is set AND user has appropriate role
