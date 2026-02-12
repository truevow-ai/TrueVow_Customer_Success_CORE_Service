-- ============================================================================
-- HEALTH SCORING SYSTEM ENHANCEMENTS
-- ============================================================================
-- Enhanced customer health scoring with ML signals and personalized nudges
-- This migration enhances the existing cs_customer_health_scores table

-- Add customer_email column if it doesn't exist (for per-customer tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE cs_customer_health_scores 
        ADD COLUMN customer_email VARCHAR(255);
    END IF;
END $$;

-- Add component scores if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'engagement_score'
    ) THEN
        ALTER TABLE cs_customer_health_scores 
        ADD COLUMN engagement_score INT DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
        ADD COLUMN usage_score INT DEFAULT 0 CHECK (usage_score >= 0 AND usage_score <= 100),
        ADD COLUMN support_score INT DEFAULT 0 CHECK (support_score >= 0 AND support_score <= 100),
        ADD COLUMN billing_score INT DEFAULT 0 CHECK (billing_score >= 0 AND billing_score <= 100),
        ADD COLUMN product_fit_score INT DEFAULT 0 CHECK (product_fit_score >= 0 AND product_fit_score <= 100);
    END IF;
END $$;

-- Add ML signals if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'churn_risk'
    ) THEN
        ALTER TABLE cs_customer_health_scores 
        ADD COLUMN churn_risk DECIMAL(5,2) DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 100),
        ADD COLUMN expansion_probability DECIMAL(5,2) DEFAULT 0 CHECK (expansion_probability >= 0 AND expansion_probability <= 100),
        ADD COLUMN renewal_probability DECIMAL(5,2) DEFAULT 0 CHECK (renewal_probability >= 0 AND renewal_probability <= 100);
    END IF;
END $$;

-- Add trend tracking if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'score_trend'
    ) THEN
        ALTER TABLE cs_customer_health_scores 
        ADD COLUMN score_trend VARCHAR(20) CHECK (score_trend IN ('improving', 'stable', 'declining')),
        ADD COLUMN days_since_last_improvement INT,
        ADD COLUMN days_since_last_decline INT;
    END IF;
END $$;

-- Add personalized nudges if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'recommended_actions'
    ) THEN
        ALTER TABLE cs_customer_health_scores 
        ADD COLUMN recommended_actions JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN last_nudge_sent_at TIMESTAMPTZ,
        ADD COLUMN next_nudge_due_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update health_level check constraint to include 'churned'
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE cs_customer_health_scores 
    DROP CONSTRAINT IF EXISTS cs_customer_health_scores_health_level_check;
    
    -- Add new constraint with 'churned'
    ALTER TABLE cs_customer_health_scores 
    ADD CONSTRAINT cs_customer_health_scores_health_level_check 
    CHECK (health_level IN ('healthy', 'at_risk', 'critical', 'churned'));
END $$;

-- Add unique constraint for tenant + customer_email if customer_email exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_health_scores' 
        AND column_name = 'customer_email'
    ) THEN
        -- Drop existing unique constraint if it exists
        ALTER TABLE cs_customer_health_scores 
        DROP CONSTRAINT IF EXISTS cs_customer_health_scores_tenant_customer_unique;
        
        -- Add unique constraint
        CREATE UNIQUE INDEX IF NOT EXISTS cs_customer_health_scores_tenant_customer_unique 
        ON cs_customer_health_scores(tenant_id, customer_email) 
        WHERE customer_email IS NOT NULL;
    END IF;
END $$;

-- CS Customer Health Scores (enhanced version if needed)
-- Note: The main table is enhanced above, these are new supporting tables
    health_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    health_score INT NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    health_level VARCHAR(20) NOT NULL CHECK (health_level IN ('healthy', 'at_risk', 'critical', 'churned')),
    
    -- Score Components (0-100 each)
    engagement_score INT DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    usage_score INT DEFAULT 0 CHECK (usage_score >= 0 AND usage_score <= 100),
    support_score INT DEFAULT 0 CHECK (support_score >= 0 AND support_score <= 100),
    billing_score INT DEFAULT 0 CHECK (billing_score >= 0 AND billing_score <= 100),
    product_fit_score INT DEFAULT 0 CHECK (product_fit_score >= 0 AND product_fit_score <= 100),
    
    -- ML Signals
    churn_risk DECIMAL(5,2) DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 100),
    expansion_probability DECIMAL(5,2) DEFAULT 0 CHECK (expansion_probability >= 0 AND expansion_probability <= 100),
    renewal_probability DECIMAL(5,2) DEFAULT 0 CHECK (renewal_probability >= 0 AND renewal_probability <= 100),
    
    -- Trend Analysis
    score_trend VARCHAR(20) CHECK (score_trend IN ('improving', 'stable', 'declining')),
    days_since_last_improvement INT,
    days_since_last_decline INT,
    
    -- Personalized Nudges
    recommended_actions JSONB DEFAULT '[]'::jsonb, -- Array of action objects
    last_nudge_sent_at TIMESTAMPTZ,
    next_nudge_due_at TIMESTAMPTZ,
    
    -- Metadata
    calculation_metadata JSONB DEFAULT '{}'::jsonb, -- Stores raw data used in calculation
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one health score per tenant+customer
    UNIQUE(tenant_id, customer_email)
);

-- Indexes for health scoring queries
CREATE INDEX IF NOT EXISTS idx_health_scores_tenant ON cs_customer_health_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_customer ON cs_customer_health_scores(customer_email);
CREATE INDEX IF NOT EXISTS idx_health_scores_level ON cs_customer_health_scores(health_level);
CREATE INDEX IF NOT EXISTS idx_health_scores_churn_risk ON cs_customer_health_scores(churn_risk DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_next_nudge ON cs_customer_health_scores(next_nudge_due_at) WHERE next_nudge_due_at IS NOT NULL;

-- CS Health Score History (for trend analysis)
CREATE TABLE IF NOT EXISTS cs_health_score_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_id UUID NOT NULL REFERENCES cs_customer_health_scores(health_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    health_score INT NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    health_level VARCHAR(20) NOT NULL,
    churn_risk DECIMAL(5,2),
    score_components JSONB DEFAULT '{}'::jsonb, -- Stores component scores
    calculation_metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for history queries
CREATE INDEX IF NOT EXISTS idx_health_history_health_id ON cs_health_score_history(health_id);
CREATE INDEX IF NOT EXISTS idx_health_history_tenant ON cs_health_score_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_history_customer ON cs_health_score_history(customer_email);
CREATE INDEX IF NOT EXISTS idx_health_history_calculated ON cs_health_score_history(calculated_at DESC);

-- CS Health Score Signals (ML signals and events)
CREATE TABLE IF NOT EXISTS cs_health_signals (
    signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_id UUID NOT NULL REFERENCES cs_customer_health_scores(health_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    signal_type VARCHAR(50) NOT NULL, -- 'engagement', 'usage', 'support', 'billing', 'product_fit'
    signal_name VARCHAR(100) NOT NULL, -- e.g., 'login_frequency', 'feature_adoption', 'ticket_volume'
    signal_value DECIMAL(10,2) NOT NULL,
    signal_weight DECIMAL(5,2) DEFAULT 1.0, -- Weight in health score calculation
    impact VARCHAR(20) CHECK (impact IN ('positive', 'negative', 'neutral')),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_health_signals_health_id ON cs_health_signals(health_id);
CREATE INDEX IF NOT EXISTS idx_health_signals_tenant ON cs_health_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_signals_customer ON cs_health_signals(customer_email);
CREATE INDEX IF NOT EXISTS idx_health_signals_type ON cs_health_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_health_signals_detected ON cs_health_signals(detected_at DESC);

-- CS Health Nudges (personalized action recommendations)
CREATE TABLE IF NOT EXISTS cs_health_nudges (
    nudge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_id UUID NOT NULL REFERENCES cs_customer_health_scores(health_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    nudge_type VARCHAR(50) NOT NULL, -- 'check_in', 'feature_training', 'discount', 'upsell', 'renewal'
    nudge_title VARCHAR(200) NOT NULL,
    nudge_message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'completed', 'dismissed')),
    recommended_action JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nudges
CREATE INDEX IF NOT EXISTS idx_health_nudges_health_id ON cs_health_nudges(health_id);
CREATE INDEX IF NOT EXISTS idx_health_nudges_tenant ON cs_health_nudges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_nudges_customer ON cs_health_nudges(customer_email);
CREATE INDEX IF NOT EXISTS idx_health_nudges_status ON cs_health_nudges(status);
CREATE INDEX IF NOT EXISTS idx_health_nudges_priority ON cs_health_nudges(priority, status);

-- Triggers for updated_at
CREATE TRIGGER update_health_scores_updated_at
    BEFORE UPDATE ON cs_customer_health_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_nudges_updated_at
    BEFORE UPDATE ON cs_health_nudges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_health_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_health_nudges ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view health scores for their tenant
CREATE POLICY "team_members_view_own_tenant_health_scores" ON cs_customer_health_scores
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_health_history" ON cs_health_score_history
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_health_signals" ON cs_health_signals
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_health_nudges" ON cs_health_nudges
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Service role can insert/update (for automated calculations)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_customer_health_scores IS 'Customer health scores with ML signals and personalized nudges';
COMMENT ON TABLE cs_health_score_history IS 'Historical health scores for trend analysis';
COMMENT ON TABLE cs_health_signals IS 'ML signals and events that impact health scores';
COMMENT ON TABLE cs_health_nudges IS 'Personalized action recommendations for CSMs';
