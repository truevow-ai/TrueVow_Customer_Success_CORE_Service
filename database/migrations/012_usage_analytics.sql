-- ============================================================================
-- USAGE ANALYTICS SYSTEM
-- ============================================================================
-- Track feature adoption, usage patterns, and predict churn

-- CS Usage Events (Feature Usage Tracking)
CREATE TABLE IF NOT EXISTS cs_usage_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id VARCHAR(255), -- Clerk user ID or customer email
    event_type VARCHAR(100) NOT NULL, -- 'feature_used', 'login', 'document_created', etc.
    feature_name VARCHAR(255) NOT NULL, -- e.g., 'intake_form', 'calendar_sync', 'phone_call'
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Event Details
    event_data JSONB DEFAULT '{}'::jsonb, -- Additional event context
    session_id VARCHAR(255), -- Session identifier
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Feature Adoption Metrics (Aggregated)
CREATE TABLE IF NOT EXISTS cs_feature_adoption_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    
    -- Adoption Metrics
    total_users INT DEFAULT 0, -- Total users who have used this feature
    active_users_7d INT DEFAULT 0, -- Active users in last 7 days
    active_users_30d INT DEFAULT 0, -- Active users in last 30 days
    total_events INT DEFAULT 0, -- Total events for this feature
    events_7d INT DEFAULT 0, -- Events in last 7 days
    events_30d INT DEFAULT 0, -- Events in last 30 days
    
    -- Adoption Rate
    adoption_rate DECIMAL(5,2) DEFAULT 0, -- Percentage of users who have used this feature
    growth_rate DECIMAL(5,2) DEFAULT 0, -- Growth rate compared to previous period
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, feature_name, period_start, period_end)
);

-- CS Usage Patterns (User Behavior Analysis)
CREATE TABLE IF NOT EXISTS cs_usage_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Pattern Analysis
    login_frequency_7d INT DEFAULT 0, -- Logins in last 7 days
    login_frequency_30d INT DEFAULT 0, -- Logins in last 30 days
    session_duration_avg DECIMAL(10,2), -- Average session duration in minutes
    features_used_count INT DEFAULT 0, -- Number of unique features used
    features_used_list JSONB DEFAULT '[]'::jsonb, -- List of features used
    
    -- Engagement Metrics
    engagement_score DECIMAL(5,2) DEFAULT 0, -- Calculated engagement score (0-100)
    engagement_level VARCHAR(50) CHECK (engagement_level IN ('high', 'medium', 'low', 'inactive')),
    
    -- Churn Prediction
    churn_risk_score DECIMAL(5,2) DEFAULT 0, -- Churn risk (0-100)
    churn_risk_level VARCHAR(50) CHECK (churn_risk_level IN ('low', 'medium', 'high', 'critical')),
    churn_prediction_date DATE, -- Predicted churn date
    
    -- Trend Analysis
    usage_trend VARCHAR(50) CHECK (usage_trend IN ('increasing', 'stable', 'decreasing', 'inactive')),
    days_since_last_activity INT,
    
    -- Period
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id, period_start, period_end)
);

-- CS Usage Analytics Summary (Dashboard Data)
CREATE TABLE IF NOT EXISTS cs_usage_analytics_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Overall Metrics
    total_active_users_7d INT DEFAULT 0,
    total_active_users_30d INT DEFAULT 0,
    total_logins_7d INT DEFAULT 0,
    total_logins_30d INT DEFAULT 0,
    total_feature_uses_7d INT DEFAULT 0,
    total_feature_uses_30d INT DEFAULT 0,
    
    -- Feature Adoption
    top_features_7d JSONB DEFAULT '[]'::jsonb, -- Top features by usage in last 7 days
    top_features_30d JSONB DEFAULT '[]'::jsonb, -- Top features by usage in last 30 days
    adoption_rates JSONB DEFAULT '{}'::jsonb, -- Adoption rates per feature
    
    -- Churn Indicators
    at_risk_users_count INT DEFAULT 0, -- Users with high churn risk
    inactive_users_count INT DEFAULT 0, -- Users inactive for 30+ days
    churn_prediction_count INT DEFAULT 0, -- Users predicted to churn
    
    -- Growth Metrics
    new_users_7d INT DEFAULT 0,
    new_users_30d INT DEFAULT 0,
    user_growth_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant ON cs_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON cs_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON cs_usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_feature ON cs_usage_events(feature_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON cs_usage_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_timestamp ON cs_usage_events(tenant_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_feature_adoption_tenant ON cs_feature_adoption_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_feature ON cs_feature_adoption_metrics(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_period ON cs_feature_adoption_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_patterns_tenant ON cs_usage_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_patterns_user ON cs_usage_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_patterns_churn_risk ON cs_usage_patterns(churn_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_usage_patterns_period ON cs_usage_patterns(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_tenant ON cs_usage_analytics_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_period ON cs_usage_analytics_summary(period_start, period_end);

-- Triggers for updated_at
CREATE TRIGGER update_feature_adoption_metrics_updated_at
    BEFORE UPDATE ON cs_feature_adoption_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_patterns_updated_at
    BEFORE UPDATE ON cs_usage_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_analytics_summary_updated_at
    BEFORE UPDATE ON cs_usage_analytics_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_feature_adoption_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_usage_analytics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view usage analytics for their tenant
CREATE POLICY "team_members_view_own_tenant_usage_events" ON cs_usage_events
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_feature_adoption" ON cs_feature_adoption_metrics
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_usage_patterns" ON cs_usage_patterns
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_usage_analytics" ON cs_usage_analytics_summary
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_usage_events IS 'Individual usage events for feature adoption tracking';
COMMENT ON TABLE cs_feature_adoption_metrics IS 'Aggregated feature adoption metrics per period';
COMMENT ON TABLE cs_usage_patterns IS 'User behavior patterns and churn prediction';
COMMENT ON TABLE cs_usage_analytics_summary IS 'Summary analytics for dashboard display';
