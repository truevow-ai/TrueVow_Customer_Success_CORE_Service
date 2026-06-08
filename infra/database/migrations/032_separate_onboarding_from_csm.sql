-- ============================================================================
-- REMOVE ONBOARDING TABLES FROM CS-SUPPORT DATABASE
-- ============================================================================
-- Date: January 24, 2026
-- Purpose: 
--   - Remove ALL onboarding-related tables from CS-Support database
--   - Onboarding workflows are handled entirely in SaaS Admin service (no LLM intrusion)
--   - Client Onboarding Manager works in SaaS Admin to:
--     * Enrich contact management database with customer profile and law firm details
--     * Configure phone numbers and intake questions/answers
--     * Configure law firm calendars and email accounts
--     * Add law firm users and train on customer portal
--   - After go-live acceptance, internal customer transfer is triggered
--   - Client Success Manager and support team handle law firm customer from CS-Support onwards
--   - CS-Support only needs post-onboarding customer data (health scores, success metrics, etc.)
-- ============================================================================

-- ============================================================================
-- DROP ALL ONBOARDING TABLES FROM CS-SUPPORT DATABASE
-- ============================================================================
-- These tables will be created in SaaS Admin database instead
-- ============================================================================

-- Drop law firm onboarding tables (created in migration 011)
DROP TABLE IF EXISTS cs_onboarding_step_completions CASCADE;
DROP TABLE IF EXISTS cs_onboarding_compliance_settings CASCADE;
DROP TABLE IF EXISTS cs_onboarding_calendar_integrations CASCADE;
DROP TABLE IF EXISTS cs_onboarding_phone_config CASCADE;
DROP TABLE IF EXISTS cs_onboarding_firm_profile CASCADE;

-- Drop onboarding sequence tables (created in migration 009)
DROP TABLE IF EXISTS cs_onboarding_communications CASCADE;
DROP TABLE IF EXISTS cs_onboarding_milestone_completions CASCADE;
DROP TABLE IF EXISTS cs_onboarding_sequences CASCADE;

-- Drop main onboarding progress table (created in migration 002)
-- NOTE: We keep a minimal version for post-onboarding tracking only
-- The full onboarding progress table will be in SaaS Admin
DROP TABLE IF EXISTS cs_customer_onboarding_progress CASCADE;

-- ============================================================================
-- CREATE MINIMAL POST-ONBOARDING TRACKING TABLE
-- ============================================================================
-- This table only tracks post-onboarding customer data for Client Success Managers
-- All pre-go-live onboarding data lives in SaaS Admin database
-- ============================================================================

CREATE TABLE IF NOT EXISTS cs_customer_post_onboarding (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Go-live information (transferred from SaaS Admin)
    go_live_date TIMESTAMPTZ NOT NULL,
    onboarding_completed_at TIMESTAMPTZ NOT NULL,
    transferred_from_onboarding_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Post-onboarding tracking
    assigned_csm_id UUID, -- Client Success Manager assigned
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    churn_risk_level VARCHAR(50) CHECK (churn_risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, customer_email)
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_customer_post_onboarding_tenant_id 
    ON cs_customer_post_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_post_onboarding_csm_id 
    ON cs_customer_post_onboarding(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_customer_post_onboarding_email 
    ON cs_customer_post_onboarding(customer_email);

-- ============================================================================
-- RLS POLICIES FOR POST-ONBOARDING TABLE
-- ============================================================================

-- Enable RLS on post-onboarding table
ALTER TABLE cs_customer_post_onboarding ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "csm_can_view_post_onboarding" ON cs_customer_post_onboarding;
DROP POLICY IF EXISTS "csm_can_create_post_onboarding" ON cs_customer_post_onboarding;
DROP POLICY IF EXISTS "csm_can_update_post_onboarding" ON cs_customer_post_onboarding;
DROP POLICY IF EXISTS "admins_can_delete_post_onboarding" ON cs_customer_post_onboarding;

-- Client Success Managers and above can view post-onboarding customers
CREATE POLICY "csm_can_view_post_onboarding"
  ON cs_customer_post_onboarding FOR SELECT
  TO authenticated
  USING (is_csm_or_above());

-- Client Success Managers and above can create post-onboarding records (during transfer)
CREATE POLICY "csm_can_create_post_onboarding"
  ON cs_customer_post_onboarding FOR INSERT
  TO authenticated
  WITH CHECK (is_csm_or_above());

-- Client Success Managers and above can update post-onboarding records
CREATE POLICY "csm_can_update_post_onboarding"
  ON cs_customer_post_onboarding FOR UPDATE
  TO authenticated
  USING (is_csm_or_above())
  WITH CHECK (is_csm_or_above());

-- Only admins can delete post-onboarding records
CREATE POLICY "admins_can_delete_post_onboarding"
  ON cs_customer_post_onboarding FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_customer_post_onboarding_updated_at ON cs_customer_post_onboarding;

CREATE TRIGGER update_customer_post_onboarding_updated_at
    BEFORE UPDATE ON cs_customer_post_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All onboarding tables have been removed from CS-Support database
-- 2. Onboarding workflows are handled entirely in SaaS Admin (no LLM intrusion)
-- 3. Client Onboarding Manager works in SaaS Admin to configure everything
-- 4. After go-live acceptance, customer is transferred to CS-Support
-- 5. CS-Support only tracks post-onboarding customer data (health, success metrics)
-- 6. SaaS Admin database will have all onboarding table schemas
-- 7. Seed file seed_onboarding_sequence_templates.sql should be moved to SaaS Admin
-- ============================================================================
