-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================
-- Additional indexes and optimizations for improved query performance

-- ============================================================================
-- CONVERSATION INDEXES
-- ============================================================================

-- Index for conversation lookups by customer
CREATE INDEX IF NOT EXISTS idx_conversations_customer_email ON cs_conversations(customer_email);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON cs_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_status ON cs_conversations(channel, status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON cs_conversations(created_at DESC);

-- ============================================================================
-- MESSAGE INDEXES
-- ============================================================================

-- Index for message lookups by ticket (messages are linked to tickets, not directly to conversations)
CREATE INDEX IF NOT EXISTS idx_messages_ticket_created ON cs_messages(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_type ON cs_messages(from_type, is_internal);

-- ============================================================================
-- TICKET INDEXES
-- ============================================================================

-- Index for ticket lookups by status and priority
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON cs_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_created ON cs_tickets(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON cs_tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON cs_tickets(customer_email);

-- ============================================================================
-- HEALTH SCORE INDEXES
-- ============================================================================

-- Index for health score lookups
-- Note: cs_customer_health_scores uses calculated_at, not created_at
CREATE INDEX IF NOT EXISTS idx_health_scores_tenant_calculated ON cs_customer_health_scores(tenant_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_level ON cs_customer_health_scores(health_level);
-- Note: customer_email added in migration 008, index created there if column exists

-- ============================================================================
-- CHURN RISK INDEXES
-- ============================================================================

-- Index for churn risk lookups
-- Note: Table name is cs_customer_churn_risk (singular), uses calculated_at, not created_at
CREATE INDEX IF NOT EXISTS idx_churn_risk_tenant_calculated ON cs_customer_churn_risk(tenant_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON cs_customer_churn_risk(risk_level);

-- ============================================================================
-- KB ARTICLE INDEXES
-- ============================================================================

-- Index for KB article searches
CREATE INDEX IF NOT EXISTS idx_kb_articles_status_category ON cs_kb_articles(status, category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published_at ON cs_kb_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON cs_kb_articles USING gin(tags);

-- Full-text search index (if not exists)
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON cs_kb_articles USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- ============================================================================
-- ACTIVITY FEED INDEXES
-- ============================================================================

-- Index for activity feed queries
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON cs_team_activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_ticket_created ON cs_team_activity_feed(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type_created ON cs_team_activity_feed(activity_type, created_at DESC);

-- ============================================================================
-- SLA TRACKING INDEXES
-- ============================================================================

-- Index for SLA tracking queries
CREATE INDEX IF NOT EXISTS idx_sla_tracking_ticket ON cs_sla_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_breached ON cs_sla_tracking(first_response_breached, resolution_breached) WHERE first_response_breached = TRUE OR resolution_breached = TRUE;

-- ============================================================================
-- COMMUNICATION INDEXES
-- ============================================================================

-- Index for communication lookups
CREATE INDEX IF NOT EXISTS idx_communications_tenant_created ON cs_onboarding_communications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_customer ON cs_onboarding_communications(customer_email);
CREATE INDEX IF NOT EXISTS idx_communications_template ON cs_onboarding_communications(template_key);

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

-- Index for analytics queries
-- Note: cs_survey_csat and cs_survey_nps use submitted_at, not created_at
CREATE INDEX IF NOT EXISTS idx_survey_csat_tenant_submitted ON cs_survey_csat(tenant_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_nps_tenant_submitted ON cs_survey_nps(tenant_id, submitted_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Composite index for inbox list queries
CREATE INDEX IF NOT EXISTS idx_conversations_inbox_list ON cs_conversations(tenant_id, status, channel, created_at DESC);

-- Composite index for ticket list queries
CREATE INDEX IF NOT EXISTS idx_tickets_list ON cs_tickets(tenant_id, status, priority, created_at DESC);

-- Composite index for health score queries
-- Note: Uses calculated_at instead of created_at
CREATE INDEX IF NOT EXISTS idx_health_scores_list ON cs_customer_health_scores(tenant_id, health_level, calculated_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_conversations_inbox_list IS 'Optimizes inbox list page queries';
COMMENT ON INDEX idx_tickets_list IS 'Optimizes ticket list page queries';
COMMENT ON INDEX idx_health_scores_list IS 'Optimizes health score dashboard queries';
COMMENT ON INDEX idx_kb_articles_search IS 'Full-text search index for KB articles';
