-- ============================================================================
-- TREND ANALYSIS SYSTEM
-- ============================================================================
-- Common pain points, product feedback aggregation, and trend detection

-- CS Trend Analysis (Aggregated Trends)
CREATE TABLE IF NOT EXISTS cs_trend_analysis (
    trend_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for global trends
    
    -- Trend Identification
    trend_type VARCHAR(100) NOT NULL, -- 'pain_point', 'feature_request', 'bug_report', 'usage_pattern', 'sentiment'
    trend_category VARCHAR(255), -- e.g., 'billing', 'onboarding', 'feature_x'
    trend_keyword VARCHAR(255), -- Main keyword/phrase for this trend
    
    -- Trend Metrics
    occurrence_count INT DEFAULT 0, -- Number of times this trend appeared
    affected_customers_count INT DEFAULT 0, -- Number of unique customers affected
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Trend Analysis
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    trend_direction VARCHAR(50) CHECK (trend_direction IN ('increasing', 'stable', 'decreasing', 'new')),
    trend_velocity DECIMAL(10,2), -- Rate of change (occurrences per day)
    
    -- Source Data
    source_channels TEXT[], -- Channels where trend was detected (email, ticket, survey, etc.)
    source_ticket_ids UUID[], -- Related ticket IDs
    source_survey_ids UUID[], -- Related survey response IDs
    
    -- Context
    trend_description TEXT, -- Human-readable description
    sample_quotes TEXT[], -- Sample quotes/examples
    related_features TEXT[], -- Related product features
    
    -- Impact Analysis
    impact_score DECIMAL(5,2) DEFAULT 0, -- Calculated impact score (0-100)
    churn_risk_contribution DECIMAL(5,2) DEFAULT 0, -- Contribution to churn risk
    revenue_impact_estimate DECIMAL(10,2), -- Estimated revenue impact
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring', 'escalated')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Trend Occurrences (Individual Trend Instances)
CREATE TABLE IF NOT EXISTS cs_trend_occurrences (
    occurrence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trend_id UUID NOT NULL REFERENCES cs_trend_analysis(trend_id) ON DELETE CASCADE,
    tenant_id UUID,
    
    -- Source Information
    source_type VARCHAR(50) NOT NULL, -- 'ticket', 'survey', 'email', 'call', 'chat', 'feedback'
    source_id UUID, -- ID of the source (ticket_id, survey_id, etc.)
    source_channel VARCHAR(50),
    
    -- Occurrence Details
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_text TEXT, -- The actual text/content where trend was detected
    sentiment VARCHAR(50) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score DECIMAL(5,2), -- Sentiment score (-100 to 100)
    
    -- Customer Context
    customer_email VARCHAR(255),
    customer_tenant_id UUID,
    customer_health_score DECIMAL(5,2), -- Health score at time of occurrence
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Product Feedback (Structured Feedback)
CREATE TABLE IF NOT EXISTS cs_product_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    customer_email VARCHAR(255),
    
    -- Feedback Type
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('feature_request', 'bug_report', 'improvement', 'complaint', 'praise', 'question')),
    feedback_category VARCHAR(255), -- e.g., 'billing', 'ui', 'integration', 'performance'
    
    -- Feedback Content
    title VARCHAR(500),
    description TEXT NOT NULL,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Source
    source_type VARCHAR(50) NOT NULL, -- 'ticket', 'survey', 'email', 'call', 'direct'
    source_id UUID, -- ID of the source
    
    -- Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'planned', 'completed', 'rejected', 'duplicate')),
    assigned_to UUID, -- Team member assigned to review
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    
    -- Product Impact
    affected_features TEXT[], -- Features affected
    estimated_effort VARCHAR(50), -- 'small', 'medium', 'large', 'xlarge'
    estimated_value VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    
    -- Aggregation
    upvotes INT DEFAULT 0, -- Number of customers who agree/upvoted
    related_feedback_ids UUID[], -- Related feedback items
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Pain Points (Common Pain Points)
CREATE TABLE IF NOT EXISTS cs_pain_points (
    pain_point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for global pain points
    
    -- Pain Point Identification
    pain_point_name VARCHAR(255) NOT NULL,
    pain_point_category VARCHAR(255), -- e.g., 'onboarding', 'billing', 'integration', 'performance'
    pain_point_description TEXT,
    
    -- Metrics
    occurrence_count INT DEFAULT 0,
    affected_customers_count INT DEFAULT 0,
    average_resolution_time_minutes INT,
    average_customer_impact_score DECIMAL(5,2), -- Average impact on customer (0-100)
    
    -- Trend Analysis
    trend_direction VARCHAR(50) CHECK (trend_direction IN ('increasing', 'stable', 'decreasing')),
    peak_period_start DATE,
    peak_period_end DATE,
    peak_occurrence_count INT,
    
    -- Impact
    churn_contribution DECIMAL(5,2) DEFAULT 0, -- Contribution to churn (%)
    csat_impact DECIMAL(5,2) DEFAULT 0, -- Impact on CSAT scores
    nps_impact DECIMAL(5,2) DEFAULT 0, -- Impact on NPS scores
    
    -- Resolution
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'resolved', 'monitoring')),
    resolution_strategy TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Related Data
    related_trend_ids UUID[],
    related_feedback_ids UUID[],
    related_ticket_ids UUID[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Trend Patterns (Pattern Detection)
CREATE TABLE IF NOT EXISTS cs_trend_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for global patterns
    
    -- Pattern Identification
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'seasonal', 'cyclical', 'correlation', 'causal'
    pattern_description TEXT,
    
    -- Pattern Data
    pattern_data JSONB NOT NULL, -- Pattern-specific data (seasonal cycles, correlations, etc.)
    confidence_score DECIMAL(5,2) DEFAULT 0, -- Confidence in pattern (0-100)
    
    -- Detection
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_method VARCHAR(100), -- 'ml', 'statistical', 'manual', 'hybrid'
    
    -- Related Trends
    related_trend_ids UUID[],
    related_pain_point_ids UUID[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trend_analysis_tenant ON cs_trend_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_type ON cs_trend_analysis(trend_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_category ON cs_trend_analysis(trend_category);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_status ON cs_trend_analysis(status);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_severity ON cs_trend_analysis(severity);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_last_seen ON cs_trend_analysis(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_trend_occurrences_trend ON cs_trend_occurrences(trend_id);
CREATE INDEX IF NOT EXISTS idx_trend_occurrences_tenant ON cs_trend_occurrences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_occurrences_source ON cs_trend_occurrences(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_trend_occurrences_detected ON cs_trend_occurrences(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_feedback_tenant ON cs_product_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_feedback_type ON cs_product_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_product_feedback_category ON cs_product_feedback(feedback_category);
CREATE INDEX IF NOT EXISTS idx_product_feedback_status ON cs_product_feedback(status);
CREATE INDEX IF NOT EXISTS idx_product_feedback_created ON cs_product_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pain_points_tenant ON cs_pain_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_category ON cs_pain_points(pain_point_category);
CREATE INDEX IF NOT EXISTS idx_pain_points_status ON cs_pain_points(status);
CREATE INDEX IF NOT EXISTS idx_pain_points_occurrence ON cs_pain_points(occurrence_count DESC);

CREATE INDEX IF NOT EXISTS idx_trend_patterns_tenant ON cs_trend_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_patterns_type ON cs_trend_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_trend_patterns_confidence ON cs_trend_patterns(confidence_score DESC);

-- Triggers for updated_at
CREATE TRIGGER update_trend_analysis_updated_at
    BEFORE UPDATE ON cs_trend_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_feedback_updated_at
    BEFORE UPDATE ON cs_product_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pain_points_updated_at
    BEFORE UPDATE ON cs_pain_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trend_patterns_updated_at
    BEFORE UPDATE ON cs_trend_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_trend_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_product_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_trend_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view trends for their tenant
CREATE POLICY "team_members_view_own_tenant_trends" ON cs_trend_analysis
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_occurrences" ON cs_trend_occurrences
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_feedback" ON cs_product_feedback
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_pain_points" ON cs_pain_points
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_patterns" ON cs_trend_patterns
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_trend_analysis IS 'Aggregated trend analysis for pain points and feedback';
COMMENT ON TABLE cs_trend_occurrences IS 'Individual trend occurrence instances';
COMMENT ON TABLE cs_product_feedback IS 'Structured product feedback from customers';
COMMENT ON TABLE cs_pain_points IS 'Common pain points identified from trends';
COMMENT ON TABLE cs_trend_patterns IS 'Pattern detection for trends (seasonal, cyclical, etc.)';
