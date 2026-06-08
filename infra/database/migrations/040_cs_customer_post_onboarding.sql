-- ============================================================================
-- Migration: Post-Onboarding Customer Table
-- Version: 1.3.0
-- Date: 2026-03-02
-- 
-- Creates the cs_customer_post_onboarding table that stores customers
-- transferred from SaaS Admin after go-live acceptance.
-- 
-- Security Contract v1 compliant: tenant_id is TEXT format "org_xxxxx"
-- ============================================================================

-- ============================================================================
-- CS_CUSTOMER_POST_ONBOARDING TABLE (Create first, no FK constraints)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cs_customer_post_onboarding (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,  -- Security Contract v1: TEXT format "org_xxxxx"
    customer_email TEXT NOT NULL,
    go_live_date TIMESTAMPTZ NOT NULL,
    onboarding_completed_at TIMESTAMPTZ NOT NULL,
    transferred_from_onboarding_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_csm_id UUID,  -- FK added separately below
    health_score INT DEFAULT 75 CHECK (health_score >= 0 AND health_score <= 100),
    churn_risk_level VARCHAR(20) DEFAULT 'healthy' CHECK (churn_risk_level IN ('healthy', 'at_risk', 'critical')),
    customer_tier VARCHAR(20) DEFAULT 'standard' CHECK (customer_tier IN ('premium', 'standard', 'free')),
    value_achieved BOOLEAN DEFAULT FALSE,
    value_achieved_at TIMESTAMPTZ,
    day_90_gate_passed BOOLEAN DEFAULT FALSE,
    day_90_gate_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Idempotency constraint: one customer per tenant/email
    CONSTRAINT cs_customer_post_onboarding_unique UNIQUE (tenant_id, customer_email)
);

-- Add foreign key constraint only if cs_team_members exists
-- First, clean up any orphaned assigned_csm_id values
DO $$
DECLARE
    team_member_exists BOOLEAN;
BEGIN
    -- Check if cs_team_members table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cs_team_members') INTO team_member_exists;
    
    IF team_member_exists THEN
        -- Set assigned_csm_id to NULL where it doesn't match any team member
        -- Use EXECUTE to defer parsing until runtime
        EXECUTE '
            UPDATE cs_customer_post_onboarding cpo
            SET assigned_csm_id = NULL 
            WHERE cpo.assigned_csm_id IS NOT NULL 
            AND NOT EXISTS (
                SELECT 1 FROM cs_team_members ctm 
                WHERE ctm.member_id::text = cpo.assigned_csm_id::text
            )';
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_assigned_csm_id' 
            AND table_name = 'cs_customer_post_onboarding'
        ) THEN
            EXECUTE 'ALTER TABLE cs_customer_post_onboarding 
                ADD CONSTRAINT fk_assigned_csm_id 
                FOREIGN KEY (assigned_csm_id) REFERENCES cs_team_members(member_id) ON DELETE SET NULL';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- ALTER EXISTING TABLE: Rename tier -> customer_tier (if needed)
-- ============================================================================

-- Rename column from 'tier' to 'customer_tier' for normalization (if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_post_onboarding' 
        AND column_name = 'tier'
    ) THEN
        ALTER TABLE cs_customer_post_onboarding RENAME COLUMN tier TO customer_tier;
        RAISE NOTICE 'Renamed column tier to customer_tier';
    END IF;
END $$;

-- Add customer_tier column if it doesn't exist (for existing tables created before this column)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_post_onboarding' 
        AND column_name = 'customer_tier'
    ) THEN
        ALTER TABLE cs_customer_post_onboarding ADD COLUMN customer_tier VARCHAR(20) DEFAULT 'standard';
        ALTER TABLE cs_customer_post_onboarding ADD CONSTRAINT chk_customer_tier CHECK (customer_tier IN ('premium', 'standard', 'free'));
        RAISE NOTICE 'Added customer_tier column';
    END IF;
END $$;

-- Add day_90_gate_passed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_post_onboarding' 
        AND column_name = 'day_90_gate_passed'
    ) THEN
        ALTER TABLE cs_customer_post_onboarding ADD COLUMN day_90_gate_passed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added day_90_gate_passed column';
    END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Drop old index if exists
DROP INDEX IF EXISTS idx_post_onboarding_tier;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_post_onboarding_tenant ON cs_customer_post_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_post_onboarding_csm ON cs_customer_post_onboarding(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_post_onboarding_health ON cs_customer_post_onboarding(health_score);
CREATE INDEX IF NOT EXISTS idx_post_onboarding_risk ON cs_customer_post_onboarding(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_post_onboarding_tier ON cs_customer_post_onboarding(customer_tier);
CREATE INDEX IF NOT EXISTS idx_post_onboarding_transferred ON cs_customer_post_onboarding(transferred_from_onboarding_at);

-- ============================================================================
-- CS_POST_ONBOARDING_SEQUENCES TABLE (90-Day Automation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cs_post_onboarding_sequences (
    sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,  -- FK added separately below
    tenant_id TEXT NOT NULL,
    phase VARCHAR(30) NOT NULL CHECK (phase IN ('immediate', 'early_adoption', 'established', 'long_term')),
    day_number INT NOT NULL,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('email', 'sms', 'call', 'health_check', 'task', 'gate')),
    action_name VARCHAR(100) NOT NULL,
    action_description TEXT,
    action_due_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    skipped BOOLEAN DEFAULT FALSE,
    skip_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One action per customer per day
    CONSTRAINT cs_post_onboarding_sequences_unique UNIQUE (customer_id, day_number, action_type)
);

-- Add FK constraint for customer_id (only if customer_id column exists in parent table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_post_onboarding' 
        AND column_name = 'customer_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_sequence_customer_id' 
            AND table_name = 'cs_post_onboarding_sequences'
        ) THEN
            ALTER TABLE cs_post_onboarding_sequences 
            ADD CONSTRAINT fk_sequence_customer_id 
            FOREIGN KEY (customer_id) REFERENCES cs_customer_post_onboarding(customer_id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Indexes for sequence queries
CREATE INDEX IF NOT EXISTS idx_sequence_customer ON cs_post_onboarding_sequences(customer_id);
CREATE INDEX IF NOT EXISTS idx_sequence_tenant ON cs_post_onboarding_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sequence_due ON cs_post_onboarding_sequences(action_due_at) WHERE completed_at IS NULL AND skipped = FALSE;
CREATE INDEX IF NOT EXISTS idx_sequence_phase ON cs_post_onboarding_sequences(phase);

-- ============================================================================
-- CS_CUSTOMER_CHURN_RISK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cs_customer_churn_risk (
    risk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,  -- FK added separately below
    tenant_id TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('healthy', 'at_risk', 'critical')),
    risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_factors JSONB DEFAULT '{}'::jsonb,
    intervention_required BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(50),
    intervention_at TIMESTAMPTZ,
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One risk assessment per customer (latest)
    CONSTRAINT cs_customer_churn_risk_unique UNIQUE (customer_id)
);

-- Add customer_id column to cs_customer_churn_risk if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_churn_risk' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE cs_customer_churn_risk ADD COLUMN customer_id UUID NOT NULL;
    END IF;
END $$;

-- Add FK constraint for customer_id (only if customer_id column exists in parent table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_post_onboarding' 
        AND column_name = 'customer_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_churn_risk_customer_id' 
            AND table_name = 'cs_customer_churn_risk'
        ) THEN
            ALTER TABLE cs_customer_churn_risk 
            ADD CONSTRAINT fk_churn_risk_customer_id 
            FOREIGN KEY (customer_id) REFERENCES cs_customer_post_onboarding(customer_id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_churn_risk_customer ON cs_customer_churn_risk(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON cs_customer_churn_risk(risk_level);

-- ============================================================================
-- HEALTH SCORE HISTORY FOR POST-ONBOARDING CUSTOMERS
-- ============================================================================

-- Add customer_id reference to existing cs_customer_health_scores if not exists
-- This links health scores to post-onboarding customers

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_cs_customer_post_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cs_customer_post_onboarding_updated_at ON cs_customer_post_onboarding;
CREATE TRIGGER cs_customer_post_onboarding_updated_at
    BEFORE UPDATE ON cs_customer_post_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_customer_post_onboarding_updated_at();

DROP TRIGGER IF EXISTS cs_post_onboarding_sequences_updated_at ON cs_post_onboarding_sequences;
CREATE TRIGGER cs_post_onboarding_sequences_updated_at
    BEFORE UPDATE ON cs_post_onboarding_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_customer_post_onboarding_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE cs_customer_post_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_post_onboarding_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_customer_churn_risk ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if cs_team_members table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cs_team_members') THEN
        -- Post-onboarding customers: CS team can see all, tenant users see their own
        DROP POLICY IF EXISTS cs_customer_post_onboarding_select ON cs_customer_post_onboarding;
        EXECUTE 'CREATE POLICY cs_customer_post_onboarding_select ON cs_customer_post_onboarding
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
                OR tenant_id::text = current_setting(''app.current_tenant_id'', TRUE)::text
            )';

        DROP POLICY IF EXISTS cs_customer_post_onboarding_update ON cs_customer_post_onboarding;
        EXECUTE 'CREATE POLICY cs_customer_post_onboarding_update ON cs_customer_post_onboarding
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
            )';

        -- Sequences: CS team only
        DROP POLICY IF EXISTS cs_post_onboarding_sequences_select ON cs_post_onboarding_sequences;
        EXECUTE 'CREATE POLICY cs_post_onboarding_sequences_select ON cs_post_onboarding_sequences
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
            )';

        DROP POLICY IF EXISTS cs_post_onboarding_sequences_update ON cs_post_onboarding_sequences;
        EXECUTE 'CREATE POLICY cs_post_onboarding_sequences_update ON cs_post_onboarding_sequences
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
            )';

        -- Churn risk: CS team only
        DROP POLICY IF EXISTS cs_customer_churn_risk_select ON cs_customer_churn_risk;
        EXECUTE 'CREATE POLICY cs_customer_churn_risk_select ON cs_customer_churn_risk
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
            )';

        DROP POLICY IF EXISTS cs_customer_churn_risk_update ON cs_customer_churn_risk;
        EXECUTE 'CREATE POLICY cs_customer_churn_risk_update ON cs_customer_churn_risk
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM cs_team_members 
                    WHERE clerk_user_id::text = current_setting(''app.clerk_user_id'', TRUE)::text
                    AND is_active = TRUE
                )
            )';
    ELSE
        -- Fallback policies when cs_team_members doesn't exist
        DROP POLICY IF EXISTS cs_customer_post_onboarding_select ON cs_customer_post_onboarding;
        CREATE POLICY cs_customer_post_onboarding_select ON cs_customer_post_onboarding
            FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);

        DROP POLICY IF EXISTS cs_customer_post_onboarding_update ON cs_customer_post_onboarding;
        CREATE POLICY cs_customer_post_onboarding_update ON cs_customer_post_onboarding
            FOR UPDATE USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);

        DROP POLICY IF EXISTS cs_post_onboarding_sequences_select ON cs_post_onboarding_sequences;
        CREATE POLICY cs_post_onboarding_sequences_select ON cs_post_onboarding_sequences
            FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);

        DROP POLICY IF EXISTS cs_post_onboarding_sequences_update ON cs_post_onboarding_sequences;
        CREATE POLICY cs_post_onboarding_sequences_update ON cs_post_onboarding_sequences
            FOR UPDATE USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);

        DROP POLICY IF EXISTS cs_customer_churn_risk_select ON cs_customer_churn_risk;
        CREATE POLICY cs_customer_churn_risk_select ON cs_customer_churn_risk
            FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);

        DROP POLICY IF EXISTS cs_customer_churn_risk_update ON cs_customer_churn_risk;
        CREATE POLICY cs_customer_churn_risk_update ON cs_customer_churn_risk
            FOR UPDATE USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE)::text);
    END IF;
END $$;

-- Insert policies don't reference cs_team_members
DROP POLICY IF EXISTS cs_customer_post_onboarding_insert ON cs_customer_post_onboarding;
CREATE POLICY cs_customer_post_onboarding_insert ON cs_customer_post_onboarding
    FOR INSERT WITH CHECK (TRUE);  -- Allow service-to-service inserts

DROP POLICY IF EXISTS cs_post_onboarding_sequences_insert ON cs_post_onboarding_sequences;
CREATE POLICY cs_post_onboarding_sequences_insert ON cs_post_onboarding_sequences
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS cs_customer_churn_risk_insert ON cs_customer_churn_risk;
CREATE POLICY cs_customer_churn_risk_insert ON cs_customer_churn_risk
    FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON cs_customer_post_onboarding TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cs_post_onboarding_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cs_customer_churn_risk TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cs_customer_post_onboarding IS 'Customers transferred from SaaS Admin after go-live. Security Contract v1: tenant_id is TEXT format "org_xxxxx"';
COMMENT ON TABLE cs_post_onboarding_sequences IS '90-day post-onboarding automation sequence. Day 90 gate: health_score >= 70 AND feature_adoption >= 60%';
COMMENT ON TABLE cs_customer_churn_risk IS 'Churn risk assessment for post-onboarding customers. Risk levels: healthy (70+), at_risk (50-69), critical (<50)';

COMMENT ON COLUMN cs_customer_post_onboarding.tenant_id IS 'Canonical tenant identifier from Clerk org_id (TEXT format "org_xxxxx") per Security Contract v1';
COMMENT ON COLUMN cs_customer_post_onboarding.health_score IS 'Initial score 75 (optimistic baseline for new customers)';
COMMENT ON COLUMN cs_customer_post_onboarding.customer_tier IS 'Customer tier for CSM assignment: premium (1:20-30), standard (1:50-75), free (pool only)';
COMMENT ON COLUMN cs_customer_post_onboarding.day_90_gate_passed IS 'True if customer passes Day 90 health gate: health_score >= 70 AND feature_adoption >= 60%';
