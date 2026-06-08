-- CS-Support Service Database Schema
-- Version: 1.0
-- Created: 2026-01-07
-- Description: Initial database schema for CS-Support Service

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB for metadata storage
-- (Already available in PostgreSQL)

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================

CREATE TABLE cs_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- References tenants table (in Platform Service)
    customer_id UUID, -- References customer/lead (in Sales CRM or Platform Service)
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    message TEXT, -- Initial message
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'call', 'chat', 'facebook', 'form')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    stage VARCHAR(20) CHECK (stage IN ('pre-sale', 'post-sale', 'converted')),
    source VARCHAR(50) DEFAULT 'customer' CHECK (source IN ('lead', 'customer', 'internal')),
    assigned_to UUID, -- References users table (Clerk user ID mapped to internal user)
    created_by UUID, -- References users table (Clerk user ID)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    sla_first_response_target TIMESTAMPTZ,
    sla_resolution_target TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SUPPORT MESSAGES (Conversation Thread)
-- ============================================================================

CREATE TABLE cs_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    from_type VARCHAR(50) NOT NULL CHECK (from_type IN ('customer', 'agent', 'system')),
    from_user_id UUID, -- References users table (Clerk user ID) - NULL for customer messages
    sender_id VARCHAR(255), -- Customer email or user ID
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('agent', 'customer', 'system')),
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes visible only to team
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment objects
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    in_reply_to UUID REFERENCES cs_messages(message_id), -- For threading
    references_header TEXT[], -- Email references for threading
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SUPPORT TEAM ACTIVITY FEED
-- ============================================================================

CREATE TABLE cs_team_activity_feed (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References users table (Clerk user ID)
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN (
        'ticket_created',
        'ticket_assigned',
        'ticket_resolved',
        'ticket_closed',
        'ticket_reopened',
        'message_sent',
        'status_changed',
        'priority_changed',
        'sla_breached',
        'sla_warning',
        'escalated',
        'tag_added',
        'tag_removed',
        'note_added'
    )),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT AGENT PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE cs_agent_performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users table (Clerk user ID)
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    tickets_assigned INT DEFAULT 0,
    tickets_resolved INT DEFAULT 0,
    tickets_closed INT DEFAULT 0,
    avg_response_time INTERVAL,
    avg_resolution_time INTERVAL,
    first_response_time_p95 INTERVAL, -- 95th percentile
    resolution_time_p95 INTERVAL, -- 95th percentile
    csat_score DECIMAL(3,2), -- Average CSAT score
    csat_count INT DEFAULT 0, -- Number of CSAT responses
    nps_score INT, -- Net Promoter Score
    nps_count INT DEFAULT 0, -- Number of NPS responses
    sla_compliance_rate DECIMAL(5,2), -- Percentage of tickets within SLA
    sla_breaches INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period_start, period_end)
);

-- ============================================================================
-- SUPPORT EMAIL LOGS
-- ============================================================================

CREATE TABLE cs_email_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    message_id UUID REFERENCES cs_messages(message_id) ON DELETE SET NULL,
    email_id VARCHAR(255), -- External email ID (SendGrid message ID)
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT NOTIFICATIONS
-- ============================================================================

CREATE TABLE cs_notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users table (Clerk user ID)
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'sla_breach', 'sla_warning', 'escalation', 'mention', 'reply', 'status_change')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE BASE ARTICLES
-- ============================================================================

CREATE TABLE cs_kb_articles (
    article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT, -- Short summary
    category_id UUID, -- References cs_kb_categories
    tags TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    author_id UUID NOT NULL, -- References users table (Clerk user ID)
    views INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- KNOWLEDGE BASE CATEGORIES
-- ============================================================================

CREATE TABLE cs_kb_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES cs_kb_categories(category_id) ON DELETE CASCADE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for KB articles
ALTER TABLE cs_kb_articles 
ADD CONSTRAINT cs_kb_articles_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES cs_kb_categories(category_id) ON DELETE SET NULL;

-- ============================================================================
-- CUSTOMER HEALTH SCORES
-- ============================================================================

CREATE TABLE cs_customer_health_scores (
    health_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- References tenants table (in Platform Service)
    health_score INT NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    health_level VARCHAR(50) NOT NULL CHECK (health_level IN ('healthy', 'at_risk', 'critical')),
    factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- { usage: 30, support_tickets: 20, nps: 25, payment: 15, engagement: 10 }
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_score INT,
    trend VARCHAR(50) CHECK (trend IN ('improving', 'stable', 'declining')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SLA POLICIES
-- ============================================================================

CREATE TABLE cs_sla_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    first_response_time INTERVAL NOT NULL, -- e.g., '2 hours'
    resolution_time INTERVAL NOT NULL, -- e.g., '24 hours'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CSAT SURVEYS
-- ============================================================================

CREATE TABLE cs_survey_csat (
    survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- NPS SCORES
-- ============================================================================

CREATE TABLE cs_survey_nps (
    nps_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    score INT NOT NULL CHECK (score >= 0 AND score <= 10),
    comment TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SUPPORT TEAM MEMBERS
-- ============================================================================

CREATE TABLE cs_team_members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- References users table (Clerk user ID)
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID for mapping
    role VARCHAR(50) NOT NULL CHECK (role IN ('support_agent', 'support_manager', 'csm', 'head_of_cs', 'solutions_engineer')),
    is_active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi', -- PKT timezone
    work_schedule JSONB, -- { start: "18:00", end: "02:00", days: ["monday", "tuesday", ...] }
    skills TEXT[], -- Technical skills, product knowledge, etc.
    max_tickets INT DEFAULT 10, -- Maximum concurrent tickets
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Support Tickets Indexes
CREATE INDEX idx_cs_tickets_tenant ON cs_tickets(tenant_id);
CREATE INDEX idx_cs_tickets_status ON cs_tickets(status);
CREATE INDEX idx_cs_tickets_stage ON cs_tickets(stage);
CREATE INDEX idx_cs_tickets_source ON cs_tickets(source);
CREATE INDEX idx_cs_tickets_assigned ON cs_tickets(assigned_to);
CREATE INDEX idx_cs_tickets_created ON cs_tickets(created_at DESC);
CREATE INDEX idx_cs_tickets_priority ON cs_tickets(priority);
CREATE INDEX idx_cs_tickets_channel ON cs_tickets(channel);
CREATE INDEX idx_cs_tickets_customer_email ON cs_tickets(customer_email);

-- Support Messages Indexes
CREATE INDEX idx_cs_messages_ticket ON cs_messages(ticket_id);
CREATE INDEX idx_cs_messages_created ON cs_messages(created_at DESC);
CREATE INDEX idx_cs_messages_sender ON cs_messages(sender_id);
CREATE INDEX idx_cs_messages_in_reply_to ON cs_messages(in_reply_to);

-- Activity Feed Indexes
CREATE INDEX idx_cs_team_activity_ticket ON cs_team_activity_feed(ticket_id);
CREATE INDEX idx_cs_team_activity_user ON cs_team_activity_feed(user_id);
CREATE INDEX idx_cs_team_activity_type ON cs_team_activity_feed(activity_type);
CREATE INDEX idx_cs_team_activity_created ON cs_team_activity_feed(created_at DESC);

-- Agent Performance Indexes
CREATE INDEX idx_cs_agent_metrics_user ON cs_agent_performance_metrics(user_id);
CREATE INDEX idx_cs_agent_metrics_period ON cs_agent_performance_metrics(period_start, period_end);

-- Email Logs Indexes
CREATE INDEX idx_cs_email_ticket ON cs_email_logs(ticket_id);
CREATE INDEX idx_cs_email_message ON cs_email_logs(message_id);
CREATE INDEX idx_cs_email_status ON cs_email_logs(status);
CREATE INDEX idx_cs_email_sent ON cs_email_logs(sent_at DESC);

-- Notifications Indexes
CREATE INDEX idx_cs_notifications_user ON cs_notifications(user_id);
CREATE INDEX idx_cs_notifications_ticket ON cs_notifications(ticket_id);
CREATE INDEX idx_cs_notifications_read ON cs_notifications(read, created_at DESC);
CREATE INDEX idx_cs_notifications_type ON cs_notifications(type);

-- KB Articles Indexes
CREATE INDEX idx_cs_kb_status ON cs_kb_articles(status);
CREATE INDEX idx_cs_kb_category ON cs_kb_articles(category_id);
CREATE INDEX idx_cs_kb_published ON cs_kb_articles(published_at DESC);
CREATE INDEX idx_cs_kb_title_search ON cs_kb_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_cs_kb_content_search ON cs_kb_articles USING gin(to_tsvector('english', content));

-- KB Categories Indexes
CREATE INDEX idx_cs_kb_categories_parent ON cs_kb_categories(parent_category_id);

-- Customer Health Indexes
CREATE INDEX idx_cs_customer_health_tenant ON cs_customer_health_scores(tenant_id);
CREATE INDEX idx_cs_customer_health_level ON cs_customer_health_scores(health_level);
CREATE INDEX idx_cs_customer_health_calculated ON cs_customer_health_scores(calculated_at DESC);

-- CSAT Indexes
CREATE INDEX idx_cs_survey_csat_ticket ON cs_survey_csat(ticket_id);
CREATE INDEX idx_cs_survey_csat_tenant ON cs_survey_csat(tenant_id);
CREATE INDEX idx_cs_survey_csat_submitted ON cs_survey_csat(submitted_at DESC);

-- NPS Indexes
CREATE INDEX idx_cs_survey_nps_tenant ON cs_survey_nps(tenant_id);
CREATE INDEX idx_cs_survey_nps_submitted ON cs_survey_nps(submitted_at DESC);

-- Team Members Indexes
CREATE INDEX idx_cs_team_user ON cs_team_members(user_id);
CREATE INDEX idx_cs_team_clerk ON cs_team_members(clerk_user_id);
CREATE INDEX idx_cs_team_role ON cs_team_members(role);
CREATE INDEX idx_cs_team_active ON cs_team_members(is_active);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_cs_tickets_updated_at BEFORE UPDATE ON cs_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_kb_articles_updated_at BEFORE UPDATE ON cs_kb_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_kb_categories_updated_at BEFORE UPDATE ON cs_kb_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_team_members_updated_at BEFORE UPDATE ON cs_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_agent_performance_metrics_updated_at BEFORE UPDATE ON cs_agent_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cs_sla_policies_updated_at BEFORE UPDATE ON cs_sla_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE cs_tickets IS 'Support tickets for customer inquiries and issues';
COMMENT ON TABLE cs_messages IS 'Messages in support ticket conversation threads';
COMMENT ON TABLE cs_team_activity_feed IS 'Activity feed for team collaboration and tracking';
COMMENT ON TABLE cs_agent_performance_metrics IS 'Performance metrics for support agents';
COMMENT ON TABLE cs_email_logs IS 'Email logs for tracking email delivery and engagement';
COMMENT ON TABLE cs_notifications IS 'Notifications for support team members';
COMMENT ON TABLE cs_kb_articles IS 'Knowledge base articles for self-service support';
COMMENT ON TABLE cs_kb_categories IS 'Categories for organizing knowledge base articles';
COMMENT ON TABLE cs_customer_health_scores IS 'Customer health scores for proactive customer success';
COMMENT ON TABLE cs_sla_policies IS 'SLA policies for ticket response and resolution times';
COMMENT ON TABLE cs_survey_csat IS 'Customer Satisfaction (CSAT) survey responses';
COMMENT ON TABLE cs_survey_nps IS 'Net Promoter Score (NPS) survey responses';
COMMENT ON TABLE cs_team_members IS 'Support team member profiles and configurations';

