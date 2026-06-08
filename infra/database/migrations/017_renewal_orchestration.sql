-- ============================================================================
-- RENEWAL ORCHESTRATION SYSTEM
-- ============================================================================
-- Risk scoring, retention campaigns, and renewal tracking

-- CS Renewal Tracking (Renewal Information)
CREATE TABLE IF NOT EXISTS cs_renewal_tracking (
    renewal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Renewal Information
    current_subscription_id VARCHAR(255), -- Subscription ID from Platform Service
    subscription_tier VARCHAR(100), -- Current subscription tier
    subscription_start_date DATE NOT NULL,
    subscription_end_date DATE NOT NULL,
    renewal_date DATE NOT NULL, -- Next renewal date
    renewal_type VARCHAR(50) NOT NULL CHECK (renewal_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    
    -- Renewal Status
    renewal_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (renewal_status IN ('pending', 'at_risk', 'in_progress', 'renewed', 'cancelled', 'expired', 'churned')),
    renewal_probability DECIMAL(5,2) DEFAULT 0, -- Probability of renewal (0-100)
    renewal_risk_score DECIMAL(5,2) DEFAULT 0, -- Risk score (0-100, higher = more risk)
    
    -- Risk Factors
    risk_factors JSONB DEFAULT '[]'::jsonb, -- Array of risk factors
    /*
    Risk factor structure:
    [
      {
        "factor_type": "usage_drop",
        "factor_description": "Usage dropped 40% in last 30 days",
        "risk_contribution": 15,
        "detected_at": "2026-01-01T00:00:00Z"
      }
    ]
    */
    
    -- Retention Campaign
    retention_campaign_id UUID, -- Active retention campaign
    retention_campaign_status VARCHAR(50), -- Campaign status
    retention_actions_taken JSONB DEFAULT '[]'::jsonb, -- Actions taken for retention
    
    -- Renewal Process
    renewal_initiated_at TIMESTAMPTZ,
    renewal_initiated_by UUID, -- Team member who initiated
    renewal_negotiation_notes TEXT,
    renewal_terms JSONB DEFAULT '{}'::jsonb, -- Renewal terms (discount, duration, etc.)
    
    -- Outcome
    renewal_outcome VARCHAR(50) CHECK (renewal_outcome IN ('renewed', 'cancelled', 'downgraded', 'upgraded', 'expired')),
    renewal_outcome_date DATE,
    renewal_value DECIMAL(10,2), -- Actual renewal value
    renewal_duration_months INT, -- Renewal duration in months
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Retention Campaigns (Retention Campaign Definitions)
CREATE TABLE IF NOT EXISTS cs_retention_campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default campaigns
    
    -- Campaign Identification
    campaign_name VARCHAR(255) NOT NULL,
    campaign_description TEXT,
    campaign_type VARCHAR(100) NOT NULL, -- 'risk_based', 'time_based', 'engagement', 'custom'
    
    -- Campaign Configuration
    target_risk_score_min DECIMAL(5,2) DEFAULT 0, -- Minimum risk score to target
    target_risk_score_max DECIMAL(5,2) DEFAULT 100, -- Maximum risk score to target
    days_before_renewal INT, -- Days before renewal to start campaign
    campaign_duration_days INT DEFAULT 30, -- Campaign duration
    
    -- Campaign Steps
    campaign_steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of campaign step objects
    /*
    Step structure:
    {
      "step_id": "uuid",
      "step_order": 1,
      "step_type": "email" | "sms" | "call" | "discount" | "task",
      "step_name": "Send retention email",
      "step_config": {...},
      "step_conditions": {...},
      "step_delay_days": 0
    }
    */
    
    -- Success Criteria
    success_metrics JSONB DEFAULT '{}'::jsonb, -- Metrics to measure success
    target_renewal_probability_increase DECIMAL(5,2), -- Target increase in renewal probability
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default campaigns available to all tenants
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- CS Retention Campaign Executions (Active Campaign Runs)
CREATE TABLE IF NOT EXISTS cs_retention_campaign_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES cs_retention_campaigns(campaign_id) ON DELETE CASCADE,
    renewal_id UUID NOT NULL REFERENCES cs_renewal_tracking(renewal_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'cancelled', 'failed')),
    current_step_order INT DEFAULT 0,
    
    -- Execution Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    paused_reason TEXT,
    
    -- Progress
    steps_completed INT DEFAULT 0,
    steps_total INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Results
    renewal_probability_before DECIMAL(5,2), -- Renewal probability before campaign
    renewal_probability_after DECIMAL(5,2), -- Renewal probability after campaign
    renewal_probability_delta DECIMAL(5,2), -- Change in renewal probability
    campaign_success BOOLEAN, -- Whether campaign was successful
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Renewal Risk Signals (Risk Signal Tracking)
CREATE TABLE IF NOT EXISTS cs_renewal_risk_signals (
    signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renewal_id UUID NOT NULL REFERENCES cs_renewal_tracking(renewal_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Signal Information
    signal_type VARCHAR(100) NOT NULL, -- 'usage_drop', 'support_issues', 'payment_failure', 'engagement_low', 'competitor_mention', 'custom'
    signal_severity VARCHAR(50) CHECK (signal_severity IN ('low', 'medium', 'high', 'critical')),
    signal_description TEXT NOT NULL,
    
    -- Signal Metrics
    signal_value DECIMAL(10,2), -- Signal value/metric
    signal_threshold DECIMAL(10,2), -- Threshold that was crossed
    risk_contribution DECIMAL(5,2) DEFAULT 0, -- Contribution to risk score (0-100)
    
    -- Detection
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_method VARCHAR(100), -- 'automated', 'manual', 'ml', 'statistical'
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'resolved', 'false_positive')),
    mitigated_at TIMESTAMPTZ,
    mitigation_action TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Renewal Forecasts (Renewal Predictions)
CREATE TABLE IF NOT EXISTS cs_renewal_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    renewal_id UUID REFERENCES cs_renewal_tracking(renewal_id) ON DELETE SET NULL,
    
    -- Forecast Information
    forecast_date DATE NOT NULL, -- Date of forecast
    forecast_period_start DATE NOT NULL, -- Start of forecast period
    forecast_period_end DATE NOT NULL, -- End of forecast period
    
    -- Forecast Predictions
    renewal_probability DECIMAL(5,2) NOT NULL, -- Predicted renewal probability (0-100)
    renewal_risk_score DECIMAL(5,2) NOT NULL, -- Predicted risk score (0-100)
    churn_probability DECIMAL(5,2) NOT NULL, -- Predicted churn probability (0-100)
    
    -- Forecast Factors
    forecast_factors JSONB DEFAULT '{}'::jsonb, -- Factors influencing forecast
    confidence_score DECIMAL(5,2) DEFAULT 0, -- Confidence in forecast (0-100)
    
    -- Model Information
    model_version VARCHAR(50), -- ML model version used
    model_type VARCHAR(100), -- Model type (ml, statistical, hybrid)
    
    -- Actual Outcome (for model training)
    actual_outcome VARCHAR(50), -- 'renewed', 'cancelled', 'pending'
    actual_outcome_date DATE,
    forecast_accuracy DECIMAL(5,2), -- How accurate the forecast was
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_tenant ON cs_renewal_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_customer ON cs_renewal_tracking(customer_email);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_status ON cs_renewal_tracking(renewal_status);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_renewal_date ON cs_renewal_tracking(renewal_date);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_risk_score ON cs_renewal_tracking(renewal_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_probability ON cs_renewal_tracking(renewal_probability DESC);

CREATE INDEX IF NOT EXISTS idx_retention_campaigns_tenant ON cs_retention_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_type ON cs_retention_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_active ON cs_retention_campaigns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_default ON cs_retention_campaigns(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_retention_campaign_executions_campaign ON cs_retention_campaign_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaign_executions_renewal ON cs_retention_campaign_executions(renewal_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaign_executions_tenant ON cs_retention_campaign_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaign_executions_status ON cs_retention_campaign_executions(status);
CREATE INDEX IF NOT EXISTS idx_retention_campaign_executions_started ON cs_retention_campaign_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_renewal ON cs_renewal_risk_signals(renewal_id);
CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_tenant ON cs_renewal_risk_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_type ON cs_renewal_risk_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_severity ON cs_renewal_risk_signals(signal_severity);
CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_status ON cs_renewal_risk_signals(status);
CREATE INDEX IF NOT EXISTS idx_renewal_risk_signals_detected ON cs_renewal_risk_signals(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_renewal_forecasts_tenant ON cs_renewal_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewal_forecasts_customer ON cs_renewal_forecasts(customer_email);
CREATE INDEX IF NOT EXISTS idx_renewal_forecasts_renewal ON cs_renewal_forecasts(renewal_id);
CREATE INDEX IF NOT EXISTS idx_renewal_forecasts_date ON cs_renewal_forecasts(forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_renewal_forecasts_probability ON cs_renewal_forecasts(renewal_probability DESC);

-- Triggers for updated_at
CREATE TRIGGER update_renewal_tracking_updated_at
    BEFORE UPDATE ON cs_renewal_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_campaigns_updated_at
    BEFORE UPDATE ON cs_retention_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_campaign_executions_updated_at
    BEFORE UPDATE ON cs_retention_campaign_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renewal_risk_signals_updated_at
    BEFORE UPDATE ON cs_renewal_risk_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renewal_forecasts_updated_at
    BEFORE UPDATE ON cs_renewal_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_renewal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_retention_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_retention_campaign_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_renewal_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_renewal_forecasts ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view renewals for their tenant
CREATE POLICY "team_members_view_own_tenant_renewals" ON cs_renewal_tracking
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_retention_campaigns" ON cs_retention_campaigns
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_campaign_executions" ON cs_retention_campaign_executions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_risk_signals" ON cs_renewal_risk_signals
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_forecasts" ON cs_renewal_forecasts
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_renewal_tracking IS 'Renewal tracking and risk scoring';
COMMENT ON TABLE cs_retention_campaigns IS 'Retention campaign definitions';
COMMENT ON TABLE cs_retention_campaign_executions IS 'Active retention campaign executions';
COMMENT ON TABLE cs_renewal_risk_signals IS 'Risk signals for renewals';
COMMENT ON TABLE cs_renewal_forecasts IS 'Renewal probability forecasts';
