-- ============================================================================
-- SAAS ADMIN BEHAVIORAL INTELLIGENCE SCHEMA
-- ============================================================================
--
-- IMPORTANT: This migration belongs in the SaaS Admin service repository,
-- NOT in CS Core. This file is provided as a REFERENCE for the SaaS Admin team.
--
-- ARCHITECTURAL BOUNDARY — PERMANENT RULE:
--
-- LEAD DATA RESIDES EXCLUSIVELY IN SAAS ADMIN.
-- CS Core must NEVER store, own, or reference lead data.
--
--   Owner of lead data: SaaS Admin (Tenant App feeds events, SaaS Admin stores them)
--   CS Core role: Display only — fetches aggregated intelligence via proxy API
--
-- Any lead_id appearing in this file is SaaS Admin-owned, NOT a CS Core column.
-- CS Core tables must never contain a lead_id column.
--
-- ============================================================================

-- ============================================================================
-- TABLE 1: portal_behavior_events (Append-Only Event Store)
-- ============================================================================
-- Stores all tenant behavior events from the platform
-- NEVER update, NEVER delete - append only
-- This is the single source of truth for behavioral intelligence

CREATE TABLE portal_behavior_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    -- lead_id is SaaS Admin-owned data. CS Core must NEVER store a lead_id column.
    lead_id UUID,
    event_type VARCHAR(100) NOT NULL,  -- e.g., 'lead_created', 'lead_unlocked', 'consult_scheduled'
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only enforcement: No UPDATE or DELETE triggers
-- Indexes for common query patterns
CREATE INDEX idx_behavior_events_tenant ON portal_behavior_events(tenant_id);
CREATE INDEX idx_behavior_events_type ON portal_behavior_events(event_type);
CREATE INDEX idx_behavior_events_timestamp ON portal_behavior_events(event_timestamp DESC);
CREATE INDEX idx_behavior_events_lead ON portal_behavior_events(lead_id) WHERE lead_id IS NOT NULL;

COMMENT ON TABLE portal_behavior_events IS 'Append-only event store for tenant behavior. Never update or delete.';

-- ============================================================================
-- TABLE 2: tenant_behavior_metrics (Computed Daily Metrics)
-- ============================================================================
-- Daily aggregated behavior metrics per tenant
-- Computed by SaaS Admin intelligence engine

CREATE TABLE tenant_behavior_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Response metrics
    avg_response_time_seconds INT,
    lead_response_time_p50 INT,  -- 50th percentile
    lead_response_time_p90 INT,  -- 90th percentile
    
    -- Conversion funnel metrics
    unlock_rate DECIMAL(5,2),
    unlock_to_contact_rate DECIMAL(5,2),
    contact_to_consult_rate DECIMAL(5,2),
    consult_to_retained_rate DECIMAL(5,2),
    
    -- Engagement metrics
    portal_login_frequency INT,
    dashboard_views INT,
    feature_adoption_rate DECIMAL(5,2),
    
    -- Lead metrics
    leads_created INT,
    leads_unlocked INT,
    leads_contacted INT,
    consults_scheduled INT,
    consults_completed INT,
    clients_retained INT,
    
    -- Computation metadata
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, metric_date)
);

CREATE INDEX idx_behavior_metrics_tenant ON tenant_behavior_metrics(tenant_id);
CREATE INDEX idx_behavior_metrics_date ON tenant_behavior_metrics(metric_date DESC);

COMMENT ON TABLE tenant_behavior_metrics IS 'Daily aggregated behavior metrics computed by SaaS Admin.';

-- ============================================================================
-- TABLE 3: health_scores (Persisted Health Scores)
-- ============================================================================
-- Firm/customer health scores for trend analysis and CS monitoring
-- Computed by SaaS Admin, consumed by CS Core

CREATE TABLE health_scores (
    health_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255),
    
    -- Core score
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('healthy', 'at_risk', 'critical', 'churned')),
    
    -- ML predictions
    churn_probability DECIMAL(5,2) CHECK (churn_probability >= 0 AND churn_probability <= 100),
    expansion_probability DECIMAL(5,2) CHECK (expansion_probability >= 0 AND expansion_probability <= 100),
    renewal_probability DECIMAL(5,2) CHECK (renewal_probability >= 0 AND renewal_probability <= 100),
    
    -- Score components (for explainability)
    score_components JSONB DEFAULT '{}'::jsonb,
    -- Example: {"engagement": 75, "usage": 80, "support": 65, "billing": 90, "product_fit": 70}
    
    -- Trend
    previous_score INT,
    score_trend VARCHAR(20) CHECK (score_trend IN ('improving', 'stable', 'declining')),
    
    -- Timestamps
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_scores_tenant ON health_scores(tenant_id);
CREATE INDEX idx_health_scores_customer ON health_scores(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX idx_health_scores_computed ON health_scores(computed_at DESC);
CREATE INDEX idx_health_scores_risk ON health_scores(risk_level);

COMMENT ON TABLE health_scores IS 'Health scores computed by SaaS Admin for trend analysis and CS monitoring.';

-- ============================================================================
-- TABLE 4: recommendations (Action Suggestions)
-- ============================================================================
-- Action recommendations generated by SaaS Admin intelligence engine
-- Displayed in CS Core and Customer Portal

CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255),
    
    -- Recommendation details
    recommendation_type VARCHAR(100) NOT NULL,
    -- Types: 'call_lead', 'follow_up', 'schedule_consult', 'check_in', 'feature_training', 'upsell', 'renewal'
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'acknowledged', 'in_progress', 'completed', 'dismissed', 'expired')),
    
    -- Context for the recommendation
    context JSONB DEFAULT '{}'::jsonb,
    -- Example: {"lead_id": "uuid", "wait_time_minutes": 42, "lead_value": "high"}
    
    -- lead_id/user_id are SaaS Admin-owned data. CS Core must never reference lead_id.
    lead_id UUID,
    user_id UUID,
    
    -- Timestamps
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_tenant ON recommendations(tenant_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_priority ON recommendations(priority, status);
CREATE INDEX idx_recommendations_expires ON recommendations(expires_at) WHERE status = 'issued';

COMMENT ON TABLE recommendations IS 'Action recommendations generated by SaaS Admin intelligence engine.';

-- ============================================================================
-- TABLE 5: recommendation_outcomes (Effectiveness Tracking)
-- ============================================================================
-- Tracks outcomes of recommendations for learning and optimization
-- Critical for measuring intelligence engine effectiveness

CREATE TABLE recommendation_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Action taken
    action_taken BOOLEAN DEFAULT FALSE,
    action_timestamp TIMESTAMPTZ,
    action_type VARCHAR(50),  -- e.g., 'call', 'email', 'sms', 'meeting'
    
    -- Outcome
    outcome_type VARCHAR(50),
    -- Types: 'lead_contacted', 'consult_booked', 'consult_completed', 'client_retained', 'lead_lost', 'no_response'
    
    outcome_value NUMERIC,  -- Quantifiable outcome (e.g., contract value, days to close)
    
    -- Feedback
    success_flag BOOLEAN,
    notes TEXT,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outcomes_recommendation ON recommendation_outcomes(recommendation_id);
CREATE INDEX idx_outcomes_tenant ON recommendation_outcomes(tenant_id);
CREATE INDEX idx_outcomes_type ON recommendation_outcomes(outcome_type);
CREATE INDEX idx_outcomes_recorded ON recommendation_outcomes(recorded_at DESC);

COMMENT ON TABLE recommendation_outcomes IS 'Tracks recommendation effectiveness for intelligence engine learning.';

-- ============================================================================
-- RLS POLICIES (SaaS Admin)
-- ============================================================================
-- Service role has full access
-- CS Core reads via service-to-service API calls (not direct DB access)

ALTER TABLE portal_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_outcomes ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for SaaS Admin internal operations)
-- CS Core accesses via API endpoints, not direct DB queries

-- ============================================================================
-- EVENT TYPES REFERENCE
-- ============================================================================
-- Standard event types that should be emitted by Tenant App:
--
-- Lead Events:
--   lead_created, lead_unlocked, lead_contact_attempted, lead_contacted,
--   lead_lost, lead_converted
--
-- Consult Events:
--   consult_scheduled, consult_completed, consult_cancelled, consult_no_show
--
-- Portal Events:
--   portal_login, dashboard_viewed, quick_action_clicked,
--   feature_used, settings_changed
--
-- Communication Events:
--   email_sent, email_opened, email_clicked, sms_sent, sms_delivered,
--   call_initiated, call_completed, voicemail_left
--
-- Business Events:
--   contract_signed, payment_received, subscription_upgraded,
--   subscription_downgraded, subscription_cancelled

-- ============================================================================
-- END OF SAAS ADMIN BEHAVIORAL INTELLIGENCE SCHEMA
-- ============================================================================
