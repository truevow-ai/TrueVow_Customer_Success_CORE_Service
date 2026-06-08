-- ============================================================================
-- EXPANSION TRIGGERS SYSTEM
-- ============================================================================
-- Usage spikes detection, upsell workflows, and expansion opportunity identification

-- CS Expansion Triggers (Trigger Definitions)
CREATE TABLE IF NOT EXISTS cs_expansion_triggers (
    trigger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default triggers
    
    -- Trigger Identification
    trigger_name VARCHAR(255) NOT NULL,
    trigger_description TEXT,
    trigger_category VARCHAR(100) NOT NULL, -- 'usage_spike', 'feature_adoption', 'engagement', 'revenue', 'custom'
    
    -- Trigger Conditions
    condition_type VARCHAR(100) NOT NULL, -- 'usage_threshold', 'feature_adoption', 'engagement_score', 'revenue_milestone', 'custom'
    condition_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Condition-specific configuration
    /*
    Condition config examples:
    {
      "metric": "feature_usage",
      "feature_name": "intake_form",
      "threshold": 100,
      "time_window_days": 7,
      "comparison": "greater_than"
    }
    {
      "metric": "usage_spike",
      "percentage_increase": 50,
      "time_window_days": 7,
      "baseline_days": 30
    }
    */
    
    -- Action Configuration
    action_type VARCHAR(100) NOT NULL, -- 'playbook', 'notification', 'task', 'workflow', 'custom'
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Action-specific configuration
    /*
    Action config examples:
    {
      "playbook_id": "uuid",
      "delay_hours": 24
    }
    {
      "notification_type": "email",
      "recipients": ["csm", "head_of_cs"],
      "template_id": "uuid"
    }
    */
    
    -- Execution Settings
    cooldown_days INT DEFAULT 7, -- Days to wait before re-triggering for same customer
    max_triggers_per_customer INT DEFAULT 1, -- Maximum triggers per customer
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default triggers available to all tenants
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- CS Expansion Trigger Executions (Triggered Events)
CREATE TABLE IF NOT EXISTS cs_expansion_trigger_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID NOT NULL REFERENCES cs_expansion_triggers(trigger_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Trigger Data
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trigger_metric_value DECIMAL(10,2), -- Value that triggered the condition
    trigger_metric_type VARCHAR(100), -- Type of metric that triggered
    trigger_context JSONB DEFAULT '{}'::jsonb, -- Additional context data
    
    -- Action Execution
    action_executed BOOLEAN DEFAULT FALSE,
    action_executed_at TIMESTAMPTZ,
    action_result JSONB DEFAULT '{}'::jsonb, -- Result from action execution
    
    -- Outcome Tracking
    outcome_tracked BOOLEAN DEFAULT FALSE,
    outcome_type VARCHAR(100), -- 'upsell', 'expansion', 'engagement', 'none'
    outcome_value DECIMAL(10,2), -- Monetary value if applicable
    outcome_date DATE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Expansion Opportunities (Identified Opportunities)
CREATE TABLE IF NOT EXISTS cs_expansion_opportunities (
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Opportunity Identification
    opportunity_type VARCHAR(100) NOT NULL, -- 'upsell', 'addon', 'upgrade', 'feature_unlock', 'seat_expansion'
    opportunity_category VARCHAR(100), -- 'usage_based', 'feature_based', 'engagement_based', 'revenue_based'
    opportunity_name VARCHAR(255) NOT NULL,
    opportunity_description TEXT,
    
    -- Opportunity Metrics
    confidence_score DECIMAL(5,2) DEFAULT 0, -- Confidence in opportunity (0-100)
    estimated_value DECIMAL(10,2), -- Estimated revenue value
    estimated_probability DECIMAL(5,2) DEFAULT 0, -- Probability of success (0-100)
    
    -- Triggering Signals
    triggering_signals JSONB DEFAULT '[]'::jsonb, -- Signals that identified this opportunity
    /*
    Signal structure:
    [
      {
        "signal_type": "usage_spike",
        "signal_value": 150,
        "signal_description": "Feature usage increased 50% in last 7 days"
      }
    ]
    */
    
    -- Recommended Actions
    recommended_actions JSONB DEFAULT '[]'::jsonb, -- Recommended actions to pursue opportunity
    recommended_playbook_id UUID, -- Recommended playbook to execute
    
    -- Status
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'won', 'lost', 'deferred', 'closed')),
    assigned_to UUID, -- CSM assigned to pursue opportunity
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Tracking
    identified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pursued_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closed_reason TEXT,
    
    -- Results
    actual_value DECIMAL(10,2), -- Actual revenue if won
    win_probability_actual DECIMAL(5,2), -- Actual win probability
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Usage Spike Detection (Usage Spike Events)
CREATE TABLE IF NOT EXISTS cs_usage_spike_detections (
    detection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Spike Detection
    spike_type VARCHAR(100) NOT NULL, -- 'feature_usage', 'login_frequency', 'session_duration', 'data_volume', 'api_calls'
    feature_name VARCHAR(255), -- Feature that spiked (if applicable)
    
    -- Spike Metrics
    baseline_value DECIMAL(10,2) NOT NULL, -- Baseline value
    spike_value DECIMAL(10,2) NOT NULL, -- Spike value
    percentage_increase DECIMAL(10,2) NOT NULL, -- Percentage increase
    spike_duration_days INT, -- Duration of spike
    
    -- Time Windows
    baseline_period_start DATE NOT NULL,
    baseline_period_end DATE NOT NULL,
    spike_period_start DATE NOT NULL,
    spike_period_end DATE NOT NULL,
    
    -- Detection
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_method VARCHAR(100), -- 'statistical', 'ml', 'threshold', 'manual'
    confidence_score DECIMAL(5,2) DEFAULT 0, -- Confidence in detection (0-100)
    
    -- Status
    status VARCHAR(50) DEFAULT 'detected' CHECK (status IN ('detected', 'analyzed', 'actioned', 'resolved', 'false_positive')),
    analyzed_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    
    -- Related Data
    related_trigger_execution_id UUID, -- If triggered an expansion trigger
    related_opportunity_id UUID, -- If created an opportunity
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expansion_triggers_tenant ON cs_expansion_triggers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expansion_triggers_category ON cs_expansion_triggers(trigger_category);
CREATE INDEX IF NOT EXISTS idx_expansion_triggers_active ON cs_expansion_triggers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_expansion_triggers_default ON cs_expansion_triggers(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_expansion_trigger_executions_trigger ON cs_expansion_trigger_executions(trigger_id);
CREATE INDEX IF NOT EXISTS idx_expansion_trigger_executions_tenant ON cs_expansion_trigger_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expansion_trigger_executions_customer ON cs_expansion_trigger_executions(customer_email);
CREATE INDEX IF NOT EXISTS idx_expansion_trigger_executions_status ON cs_expansion_trigger_executions(status);
CREATE INDEX IF NOT EXISTS idx_expansion_trigger_executions_triggered ON cs_expansion_trigger_executions(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_tenant ON cs_expansion_opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_customer ON cs_expansion_opportunities(customer_email);
CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_type ON cs_expansion_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_status ON cs_expansion_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_confidence ON cs_expansion_opportunities(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_expansion_opportunities_identified ON cs_expansion_opportunities(identified_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_spike_detections_tenant ON cs_usage_spike_detections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_spike_detections_customer ON cs_usage_spike_detections(customer_email);
CREATE INDEX IF NOT EXISTS idx_usage_spike_detections_type ON cs_usage_spike_detections(spike_type);
CREATE INDEX IF NOT EXISTS idx_usage_spike_detections_status ON cs_usage_spike_detections(status);
CREATE INDEX IF NOT EXISTS idx_usage_spike_detections_detected ON cs_usage_spike_detections(detected_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_expansion_triggers_updated_at
    BEFORE UPDATE ON cs_expansion_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expansion_trigger_executions_updated_at
    BEFORE UPDATE ON cs_expansion_trigger_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expansion_opportunities_updated_at
    BEFORE UPDATE ON cs_expansion_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_spike_detections_updated_at
    BEFORE UPDATE ON cs_usage_spike_detections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_expansion_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_expansion_trigger_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_expansion_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_usage_spike_detections ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view expansion triggers for their tenant
CREATE POLICY "team_members_view_own_tenant_expansion_triggers" ON cs_expansion_triggers
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_trigger_executions" ON cs_expansion_trigger_executions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_opportunities" ON cs_expansion_opportunities
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_spike_detections" ON cs_usage_spike_detections
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_expansion_triggers IS 'Expansion trigger definitions for upsell workflows';
COMMENT ON TABLE cs_expansion_trigger_executions IS 'Executed expansion triggers';
COMMENT ON TABLE cs_expansion_opportunities IS 'Identified expansion opportunities';
COMMENT ON TABLE cs_usage_spike_detections IS 'Detected usage spikes for expansion triggers';
