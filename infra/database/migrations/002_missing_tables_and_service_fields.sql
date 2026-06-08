-- CS-Support Service - Missing Tables and Service-Specific Fields
-- Version: 1.0
-- Created: 2026-01-10
-- Description: Add service-specific fields to cs_tickets and create all missing tables

-- ============================================================================
-- ADD SERVICE-SPECIFIC FIELDS TO CS_TICKETS
-- ============================================================================

DO $$
BEGIN
    -- Add truevow_service field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_tickets' AND column_name = 'truevow_service'
    ) THEN
        ALTER TABLE cs_tickets 
        ADD COLUMN truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL));
        RAISE NOTICE 'Added truevow_service column to cs_tickets';
    ELSE
        RAISE NOTICE 'Column truevow_service already exists in cs_tickets';
    END IF;

    -- Add service_stage field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_tickets' AND column_name = 'service_stage'
    ) THEN
        ALTER TABLE cs_tickets 
        ADD COLUMN service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL));
        RAISE NOTICE 'Added service_stage column to cs_tickets';
    ELSE
        RAISE NOTICE 'Column service_stage already exists in cs_tickets';
    END IF;

    -- Add service_adoption_status field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_tickets' AND column_name = 'service_adoption_status'
    ) THEN
        ALTER TABLE cs_tickets 
        ADD COLUMN service_adoption_status VARCHAR(50) CHECK (service_adoption_status IN (
            'intake_only', 'intake_settle', 'intake_settle_draft', 'complete_suite', 'founding_member', NULL
        ));
        RAISE NOTICE 'Added service_adoption_status column to cs_tickets';
    ELSE
        RAISE NOTICE 'Column service_adoption_status already exists in cs_tickets';
    END IF;

    -- Add practice_area field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_tickets' AND column_name = 'practice_area'
    ) THEN
        ALTER TABLE cs_tickets 
        ADD COLUMN practice_area VARCHAR(100);
        RAISE NOTICE 'Added practice_area column to cs_tickets';
    ELSE
        RAISE NOTICE 'Column practice_area already exists in cs_tickets';
    END IF;
END $$;

-- Create indexes for service-specific fields
CREATE INDEX IF NOT EXISTS idx_cs_tickets_service ON cs_tickets(truevow_service);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_service_stage ON cs_tickets(service_stage);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_adoption_status ON cs_tickets(service_adoption_status);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_practice_area ON cs_tickets(practice_area);

-- ============================================================================
-- MISSING CORE TABLES
-- ============================================================================

-- CS Conversations (Unified conversation tracking)
CREATE TABLE IF NOT EXISTS cs_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_id UUID,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'call', 'chat', 'facebook', 'form')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    first_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_count INT DEFAULT 0,
    unread_count INT DEFAULT 0,
    assigned_to UUID,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS SMS Logs
CREATE TABLE IF NOT EXISTS cs_sms_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    message_id UUID REFERENCES cs_messages(message_id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES cs_conversations(conversation_id) ON DELETE SET NULL,
    sms_id VARCHAR(255), -- External SMS ID (Twilio message SID)
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    body TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'received')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    error_code VARCHAR(50),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Call Logs (with transcription)
CREATE TABLE IF NOT EXISTS cs_call_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES cs_conversations(conversation_id) ON DELETE SET NULL,
    call_id VARCHAR(255), -- External call ID (Twilio call SID)
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled')),
    duration_seconds INT,
    started_at TIMESTAMPTZ,
    answered_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    recording_url TEXT,
    transcription_text TEXT,
    transcription_status VARCHAR(50) CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
    transcription_provider VARCHAR(50), -- 'deepgram', 'twilio', etc.
    cost DECIMAL(10,4),
    error_code VARCHAR(50),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MISSING KNOWLEDGE BASE TABLES
-- ============================================================================

-- CS KB Tags
CREATE TABLE IF NOT EXISTS cs_kb_tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS KB Article Tags (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS cs_kb_article_tags (
    article_id UUID NOT NULL REFERENCES cs_kb_articles(article_id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES cs_kb_tags(tag_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (article_id, tag_id)
);

-- CS KB Article Views (Analytics)
CREATE TABLE IF NOT EXISTS cs_kb_article_views (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES cs_kb_articles(article_id) ON DELETE CASCADE,
    tenant_id UUID,
    user_id UUID, -- Null for anonymous views
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_seconds INT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- MISSING SLA & QUALITY TABLES
-- ============================================================================

-- CS SLA Tracking
CREATE TABLE IF NOT EXISTS cs_sla_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    policy_id UUID REFERENCES cs_sla_policies(policy_id) ON DELETE SET NULL,
    first_response_target TIMESTAMPTZ NOT NULL,
    first_response_actual TIMESTAMPTZ,
    first_response_breached BOOLEAN DEFAULT FALSE,
    first_response_breached_at TIMESTAMPTZ,
    resolution_target TIMESTAMPTZ NOT NULL,
    resolution_actual TIMESTAMPTZ,
    resolution_breached BOOLEAN DEFAULT FALSE,
    resolution_breached_at TIMESTAMPTZ,
    warning_sent BOOLEAN DEFAULT FALSE,
    warning_sent_at TIMESTAMPTZ,
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Ticket Quality Scores
CREATE TABLE IF NOT EXISTS cs_ticket_quality_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    reviewer_id UUID, -- User who reviewed/rated
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 5),
    technical_accuracy_score DECIMAL(3,2) CHECK (technical_accuracy_score >= 0 AND technical_accuracy_score <= 5),
    timeliness_score DECIMAL(3,2) CHECK (timeliness_score >= 0 AND timeliness_score <= 5),
    professionalism_score DECIMAL(3,2) CHECK (professionalism_score >= 0 AND professionalism_score <= 5),
    feedback TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- MISSING CUSTOMER SUCCESS TABLES
-- ============================================================================

-- CS Customer Success Metrics
CREATE TABLE IF NOT EXISTS cs_customer_success_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    mrr DECIMAL(12,2), -- Monthly Recurring Revenue
    arr DECIMAL(12,2), -- Annual Recurring Revenue
    churn_rate DECIMAL(5,2), -- Percentage
    expansion_revenue DECIMAL(12,2),
    contraction_revenue DECIMAL(12,2),
    net_revenue_retention DECIMAL(5,2), -- Percentage
    active_users INT,
    feature_adoption_rate DECIMAL(5,2), -- Percentage
    support_ticket_count INT DEFAULT 0,
    avg_ticket_resolution_time INTERVAL,
    nps_score INT,
    csat_score DECIMAL(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, period_start, period_end)
);

-- CS Customer Onboarding Progress
CREATE TABLE IF NOT EXISTS cs_customer_onboarding_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    onboarding_stage VARCHAR(50) NOT NULL CHECK (onboarding_stage IN (
        'not_started', 'account_setup', 'initial_config', 'first_use', 'training', 'go_live', 'completed'
    )),
    current_step VARCHAR(100),
    steps_completed JSONB DEFAULT '[]'::jsonb, -- Array of completed step IDs
    steps_total INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_csm_id UUID, -- CSM assigned to help with onboarding
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Customer Churn Risk
CREATE TABLE IF NOT EXISTS cs_customer_churn_risk (
    risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- { usage_decline: 30, support_tickets: 20, payment_issues: 25, engagement: 15, nps: 10 }
    predicted_churn_date DATE,
    intervention_required BOOLEAN DEFAULT FALSE,
    intervention_notes TEXT,
    intervention_taken TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_score INT,
    trend VARCHAR(50) CHECK (trend IN ('improving', 'stable', 'declining')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- AI AGENT TABLES
-- ============================================================================

-- CS LLM Agents (with service-specific fields)
CREATE TABLE IF NOT EXISTS cs_llm_agents (
    agent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN (
        'customer_support', 'customer_success', 'solutions_engineer',
        'escalation_monitoring', 'knowledge_base', 'customer_health', 'ticket_quality'
    )),
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'testing', 'maintenance')) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    -- Service-Specific Fields
    service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL)),
    truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL)),
    role_responsibilities JSONB, -- Mapping of roles to responsibilities per service
    -- Configuration
    brief_config JSONB NOT NULL, -- Role, JTBD, context, guardrails, steps, outcomes
    knowledge_base JSONB, -- Documents, text content, embeddings, update schedule
    llm_config JSONB NOT NULL, -- Model, temperature, max_tokens, system_prompt
    performance_metrics JSONB, -- Execution time, token usage, success rate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- CS Agent Executions
CREATE TABLE IF NOT EXISTS cs_agent_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES cs_conversations(conversation_id) ON DELETE SET NULL,
    execution_type VARCHAR(50) NOT NULL CHECK (execution_type IN ('chat', 'suggest', 'analyze', 'escalate', 'other')),
    input_text TEXT,
    output_text TEXT,
    llm_provider VARCHAR(50), -- 'anthropic', 'kimi', etc.
    llm_model VARCHAR(100),
    tokens_input INT,
    tokens_output INT,
    tokens_total INT,
    cost_usd DECIMAL(10,6),
    execution_time_ms INT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Feedback
CREATE TABLE IF NOT EXISTS cs_agent_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES cs_agent_executions(execution_id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL, -- User who provided feedback
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('positive', 'negative', 'neutral', 'correction')),
    feedback_text TEXT,
    was_helpful BOOLEAN,
    was_accurate BOOLEAN,
    was_appropriate BOOLEAN,
    suggested_improvements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Training Data
CREATE TABLE IF NOT EXISTS cs_agent_training_data (
    training_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    execution_id UUID REFERENCES cs_agent_executions(execution_id) ON DELETE SET NULL,
    feedback_id UUID REFERENCES cs_agent_feedback(feedback_id) ON DELETE SET NULL,
    input_text TEXT NOT NULL,
    expected_output TEXT,
    actual_output TEXT,
    context JSONB,
    tags TEXT[],
    quality_score DECIMAL(3,2),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent State
CREATE TABLE IF NOT EXISTS cs_agent_state (
    state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    state_type VARCHAR(50) NOT NULL CHECK (state_type IN ('conversation', 'workflow', 'session')),
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    checkpoint_id UUID, -- Reference to checkpoint if this is a checkpoint state
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Orchestration
CREATE TABLE IF NOT EXISTS cs_agent_orchestration (
    orchestration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES cs_conversations(conversation_id) ON DELETE SET NULL,
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('sequential', 'parallel', 'conditional', 'silo')),
    pattern_config JSONB NOT NULL, -- Configuration for the orchestration pattern
    agents_involved UUID[] NOT NULL, -- Array of agent IDs
    context_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_tokens INT,
    total_cost_usd DECIMAL(10,6),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Circuit Breakers
CREATE TABLE IF NOT EXISTS cs_agent_circuit_breakers (
    breaker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    llm_provider VARCHAR(50) NOT NULL, -- 'anthropic', 'kimi', etc.
    state VARCHAR(50) NOT NULL CHECK (state IN ('closed', 'open', 'half-open')) DEFAULT 'closed',
    failure_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_threshold INT DEFAULT 5,
    last_failure_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_id, llm_provider)
);

-- CS Agent DLQ (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS cs_agent_dlq (
    dlq_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    execution_id UUID REFERENCES cs_agent_executions(execution_id) ON DELETE SET NULL,
    original_request JSONB NOT NULL,
    error_type VARCHAR(100),
    error_message TEXT,
    error_stack TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'retrying', 'failed', 'resolved', 'manually_reviewed')) DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Rate Limits
CREATE TABLE IF NOT EXISTS cs_agent_rate_limits (
    limit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('calls_per_hour', 'calls_per_day', 'tokens_per_hour', 'tokens_per_day', 'cost_per_day')),
    limit_value DECIMAL(12,2) NOT NULL,
    current_usage DECIMAL(12,2) DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Cost Tracking
CREATE TABLE IF NOT EXISTS cs_agent_cost_tracking (
    cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    execution_id UUID REFERENCES cs_agent_executions(execution_id) ON DELETE SET NULL,
    llm_provider VARCHAR(50) NOT NULL,
    llm_model VARCHAR(100),
    tokens_input INT NOT NULL,
    tokens_output INT NOT NULL,
    tokens_total INT NOT NULL,
    cost_usd DECIMAL(10,6) NOT NULL,
    period_date DATE NOT NULL,
    tenant_id UUID, -- For cost allocation
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Agent Monitoring
CREATE TABLE IF NOT EXISTS cs_agent_monitoring (
    monitoring_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES cs_llm_agents(agent_id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'execution_time', 'token_usage', 'success_rate', 'error_rate', 
        'cost', 'latency', 'throughput', 'quality_score'
    )),
    metric_value DECIMAL(12,4) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- CS Integrations
CREATE TABLE IF NOT EXISTS cs_integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN (
        'sendgrid', 'twilio', 'plivo', 'sales_crm', 'platform', 'internal_ops', 'tenant_service'
    )),
    integration_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'error', 'testing')) DEFAULT 'active',
    config JSONB NOT NULL DEFAULT '{}'::jsonb, -- API keys, endpoints, settings
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    health_status VARCHAR(50) CHECK (health_status IN ('healthy', 'degraded', 'down')) DEFAULT 'healthy',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Webhooks
CREATE TABLE IF NOT EXISTS cs_webhooks (
    webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES cs_integrations(integration_id) ON DELETE SET NULL,
    webhook_type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH')),
    headers JSONB DEFAULT '{}'::jsonb,
    payload JSONB,
    response_status INT,
    response_body TEXT,
    response_time_ms INT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'retrying')) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS API Keys (Service-to-Service)
CREATE TABLE IF NOT EXISTS cs_api_keys (
    key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL, -- 'sales_crm', 'platform', 'internal_ops', 'tenant_service'
    key_name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL, -- Hashed API key (never store plain text)
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    permissions JSONB DEFAULT '{}'::jsonb, -- What this key can access
    rate_limit_per_minute INT,
    rate_limit_per_day INT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR NEW TABLES
-- ============================================================================

-- CS Conversations Indexes
CREATE INDEX IF NOT EXISTS idx_cs_conversations_tenant ON cs_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_customer_email ON cs_conversations(customer_email);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_status ON cs_conversations(status);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_channel ON cs_conversations(channel);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_ticket ON cs_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_assigned ON cs_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cs_conversations_last_message ON cs_conversations(last_message_at DESC);

-- CS SMS Logs Indexes
CREATE INDEX IF NOT EXISTS idx_cs_sms_ticket ON cs_sms_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_sms_message ON cs_sms_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_cs_sms_conversation ON cs_sms_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cs_sms_status ON cs_sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_cs_sms_direction ON cs_sms_logs(direction);
CREATE INDEX IF NOT EXISTS idx_cs_sms_created ON cs_sms_logs(created_at DESC);

-- CS Call Logs Indexes
CREATE INDEX IF NOT EXISTS idx_cs_call_ticket ON cs_call_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_call_conversation ON cs_call_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cs_call_status ON cs_call_logs(status);
CREATE INDEX IF NOT EXISTS idx_cs_call_direction ON cs_call_logs(direction);
CREATE INDEX IF NOT EXISTS idx_cs_call_started ON cs_call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_call_transcription_status ON cs_call_logs(transcription_status);

-- CS KB Tags Indexes
CREATE INDEX IF NOT EXISTS idx_cs_kb_tags_name ON cs_kb_tags(name);
CREATE INDEX IF NOT EXISTS idx_cs_kb_tags_usage ON cs_kb_tags(usage_count DESC);

-- CS KB Article Tags Indexes
CREATE INDEX IF NOT EXISTS idx_cs_kb_article_tags_article ON cs_kb_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_cs_kb_article_tags_tag ON cs_kb_article_tags(tag_id);

-- CS KB Article Views Indexes
CREATE INDEX IF NOT EXISTS idx_cs_kb_views_article ON cs_kb_article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_cs_kb_views_tenant ON cs_kb_article_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_kb_views_viewed ON cs_kb_article_views(viewed_at DESC);

-- CS SLA Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_cs_sla_tracking_ticket ON cs_sla_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_sla_tracking_policy ON cs_sla_tracking(policy_id);
CREATE INDEX IF NOT EXISTS idx_cs_sla_tracking_breached ON cs_sla_tracking(first_response_breached, resolution_breached);
CREATE INDEX IF NOT EXISTS idx_cs_sla_tracking_escalated ON cs_sla_tracking(escalated);

-- CS Ticket Quality Scores Indexes
CREATE INDEX IF NOT EXISTS idx_cs_quality_ticket ON cs_ticket_quality_scores(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_quality_reviewer ON cs_ticket_quality_scores(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_cs_quality_score ON cs_ticket_quality_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_cs_quality_reviewed ON cs_ticket_quality_scores(reviewed_at DESC);

-- CS Customer Success Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_cs_cs_metrics_tenant ON cs_customer_success_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_cs_metrics_period ON cs_customer_success_metrics(period_start, period_end);

-- CS Customer Onboarding Progress Indexes
CREATE INDEX IF NOT EXISTS idx_cs_onboarding_tenant ON cs_customer_onboarding_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_onboarding_stage ON cs_customer_onboarding_progress(onboarding_stage);
CREATE INDEX IF NOT EXISTS idx_cs_onboarding_csm ON cs_customer_onboarding_progress(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_cs_onboarding_completed ON cs_customer_onboarding_progress(completed_at DESC);

-- CS Customer Churn Risk Indexes
CREATE INDEX IF NOT EXISTS idx_cs_churn_tenant ON cs_customer_churn_risk(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_churn_level ON cs_customer_churn_risk(risk_level);
CREATE INDEX IF NOT EXISTS idx_cs_churn_score ON cs_customer_churn_risk(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_cs_churn_intervention ON cs_customer_churn_risk(intervention_required);
CREATE INDEX IF NOT EXISTS idx_cs_churn_calculated ON cs_customer_churn_risk(calculated_at DESC);

-- CS LLM Agents Indexes
CREATE INDEX IF NOT EXISTS idx_cs_llm_agents_type ON cs_llm_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_cs_llm_agents_status ON cs_llm_agents(status);
CREATE INDEX IF NOT EXISTS idx_cs_llm_agents_active ON cs_llm_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_cs_llm_agents_service ON cs_llm_agents(truevow_service);
CREATE INDEX IF NOT EXISTS idx_cs_llm_agents_stage ON cs_llm_agents(service_stage);

-- CS Agent Executions Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_agent ON cs_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_ticket ON cs_agent_executions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_conversation ON cs_agent_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_status ON cs_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_type ON cs_agent_executions(execution_type);
CREATE INDEX IF NOT EXISTS idx_cs_agent_exec_created ON cs_agent_executions(created_at DESC);

-- CS Agent Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_feedback_execution ON cs_agent_feedback(execution_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_feedback_agent ON cs_agent_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_feedback_reviewer ON cs_agent_feedback(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_feedback_rating ON cs_agent_feedback(rating);

-- CS Agent Training Data Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_training_agent ON cs_agent_training_data(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_training_approved ON cs_agent_training_data(is_approved);
CREATE INDEX IF NOT EXISTS idx_cs_agent_training_quality ON cs_agent_training_data(quality_score DESC);

-- CS Agent State Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_state_agent ON cs_agent_state(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_state_ticket ON cs_agent_state(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_state_conversation ON cs_agent_state(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_state_type ON cs_agent_state(state_type);

-- CS Agent Orchestration Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_orch_ticket ON cs_agent_orchestration(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_orch_conversation ON cs_agent_orchestration(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_orch_status ON cs_agent_orchestration(status);
CREATE INDEX IF NOT EXISTS idx_cs_agent_orch_pattern ON cs_agent_orchestration(pattern_type);

-- CS Agent Circuit Breakers Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_cb_agent ON cs_agent_circuit_breakers(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_cb_provider ON cs_agent_circuit_breakers(llm_provider);
CREATE INDEX IF NOT EXISTS idx_cs_agent_cb_state ON cs_agent_circuit_breakers(state);

-- CS Agent DLQ Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_dlq_agent ON cs_agent_dlq(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_dlq_status ON cs_agent_dlq(status);
CREATE INDEX IF NOT EXISTS idx_cs_agent_dlq_retry ON cs_agent_dlq(next_retry_at) WHERE status = 'pending';

-- CS Agent Rate Limits Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_rate_agent ON cs_agent_rate_limits(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_rate_type ON cs_agent_rate_limits(limit_type);
CREATE INDEX IF NOT EXISTS idx_cs_agent_rate_period ON cs_agent_rate_limits(period_start, period_end);

-- CS Agent Cost Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_cost_agent ON cs_agent_cost_tracking(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_cost_period ON cs_agent_cost_tracking(period_date);
CREATE INDEX IF NOT EXISTS idx_cs_agent_cost_tenant ON cs_agent_cost_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_cost_provider ON cs_agent_cost_tracking(llm_provider);

-- CS Agent Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_cs_agent_monitoring_agent ON cs_agent_monitoring(agent_id);
CREATE INDEX IF NOT EXISTS idx_cs_agent_monitoring_type ON cs_agent_monitoring(metric_type);
CREATE INDEX IF NOT EXISTS idx_cs_agent_monitoring_period ON cs_agent_monitoring(period_start, period_end);

-- CS Integrations Indexes
CREATE INDEX IF NOT EXISTS idx_cs_integrations_type ON cs_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_cs_integrations_status ON cs_integrations(status);
CREATE INDEX IF NOT EXISTS idx_cs_integrations_health ON cs_integrations(health_status);

-- CS Webhooks Indexes
CREATE INDEX IF NOT EXISTS idx_cs_webhooks_integration ON cs_webhooks(integration_id);
CREATE INDEX IF NOT EXISTS idx_cs_webhooks_status ON cs_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_cs_webhooks_type ON cs_webhooks(webhook_type);
CREATE INDEX IF NOT EXISTS idx_cs_webhooks_created ON cs_webhooks(created_at DESC);

-- CS API Keys Indexes
CREATE INDEX IF NOT EXISTS idx_cs_api_keys_service ON cs_api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_cs_api_keys_active ON cs_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_cs_api_keys_prefix ON cs_api_keys(key_prefix);

-- ============================================================================
-- TRIGGERS FOR NEW TABLES
-- ============================================================================

-- Apply updated_at trigger to new tables (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_conversations_updated_at' AND tgrelid = 'cs_conversations'::regclass) THEN
        CREATE TRIGGER update_cs_conversations_updated_at BEFORE UPDATE ON cs_conversations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_conversations_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_conversations_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_customer_success_metrics_updated_at' AND tgrelid = 'cs_customer_success_metrics'::regclass) THEN
        CREATE TRIGGER update_cs_customer_success_metrics_updated_at BEFORE UPDATE ON cs_customer_success_metrics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_customer_success_metrics_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_customer_success_metrics_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_customer_onboarding_progress_updated_at' AND tgrelid = 'cs_customer_onboarding_progress'::regclass) THEN
        CREATE TRIGGER update_cs_customer_onboarding_progress_updated_at BEFORE UPDATE ON cs_customer_onboarding_progress
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_customer_onboarding_progress_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_customer_onboarding_progress_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_customer_churn_risk_updated_at' AND tgrelid = 'cs_customer_churn_risk'::regclass) THEN
        CREATE TRIGGER update_cs_customer_churn_risk_updated_at BEFORE UPDATE ON cs_customer_churn_risk
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_customer_churn_risk_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_customer_churn_risk_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_llm_agents_updated_at' AND tgrelid = 'cs_llm_agents'::regclass) THEN
        CREATE TRIGGER update_cs_llm_agents_updated_at BEFORE UPDATE ON cs_llm_agents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_llm_agents_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_llm_agents_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_agent_circuit_breakers_updated_at' AND tgrelid = 'cs_agent_circuit_breakers'::regclass) THEN
        CREATE TRIGGER update_cs_agent_circuit_breakers_updated_at BEFORE UPDATE ON cs_agent_circuit_breakers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_agent_circuit_breakers_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_agent_circuit_breakers_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_agent_dlq_updated_at' AND tgrelid = 'cs_agent_dlq'::regclass) THEN
        CREATE TRIGGER update_cs_agent_dlq_updated_at BEFORE UPDATE ON cs_agent_dlq
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_agent_dlq_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_agent_dlq_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_agent_rate_limits_updated_at' AND tgrelid = 'cs_agent_rate_limits'::regclass) THEN
        CREATE TRIGGER update_cs_agent_rate_limits_updated_at BEFORE UPDATE ON cs_agent_rate_limits
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_agent_rate_limits_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_agent_rate_limits_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_integrations_updated_at' AND tgrelid = 'cs_integrations'::regclass) THEN
        CREATE TRIGGER update_cs_integrations_updated_at BEFORE UPDATE ON cs_integrations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_integrations_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_integrations_updated_at already exists. Skipping.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cs_api_keys_updated_at' AND tgrelid = 'cs_api_keys'::regclass) THEN
        CREATE TRIGGER update_cs_api_keys_updated_at BEFORE UPDATE ON cs_api_keys
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_api_keys_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_api_keys_updated_at already exists. Skipping.';
    END IF;
END $$;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE cs_conversations IS 'Unified conversation tracking across all channels';
COMMENT ON TABLE cs_sms_logs IS 'SMS message logs and tracking';
COMMENT ON TABLE cs_call_logs IS 'Call logs with transcription support';
COMMENT ON TABLE cs_kb_tags IS 'Knowledge base tags for article categorization';
COMMENT ON TABLE cs_kb_article_tags IS 'Many-to-many relationship between KB articles and tags';
COMMENT ON TABLE cs_kb_article_views IS 'Knowledge base article view analytics';
COMMENT ON TABLE cs_sla_tracking IS 'SLA compliance tracking per ticket';
COMMENT ON TABLE cs_ticket_quality_scores IS 'Ticket quality scoring and reviews';
COMMENT ON TABLE cs_customer_success_metrics IS 'Customer success metrics and KPIs';
COMMENT ON TABLE cs_customer_onboarding_progress IS 'Customer onboarding progress tracking';
COMMENT ON TABLE cs_customer_churn_risk IS 'Customer churn risk assessment and tracking';
COMMENT ON TABLE cs_llm_agents IS 'AI/LLM agent configurations and metadata';
COMMENT ON TABLE cs_agent_executions IS 'AI agent execution logs';
COMMENT ON TABLE cs_agent_feedback IS 'Human feedback on AI agent responses';
COMMENT ON TABLE cs_agent_training_data IS 'Training data collection for AI agents';
COMMENT ON TABLE cs_agent_state IS 'AI agent state management';
COMMENT ON TABLE cs_agent_orchestration IS 'Multi-agent orchestration logs';
COMMENT ON TABLE cs_agent_circuit_breakers IS 'Circuit breaker state for AI agents';
COMMENT ON TABLE cs_agent_dlq IS 'Dead letter queue for failed AI agent executions';
COMMENT ON TABLE cs_agent_rate_limits IS 'Rate limiting tracking for AI agents';
COMMENT ON TABLE cs_agent_cost_tracking IS 'Cost tracking per AI agent execution';
COMMENT ON TABLE cs_agent_monitoring IS 'AI agent monitoring and performance metrics';
COMMENT ON TABLE cs_integrations IS 'External service integrations configuration';
COMMENT ON TABLE cs_webhooks IS 'Webhook logs and tracking';
COMMENT ON TABLE cs_api_keys IS 'Service-to-service API keys management';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Added service-specific fields to cs_tickets
-- - Created 3 missing core tables (conversations, sms_logs, call_logs)
-- - Created 3 missing KB tables (tags, article_tags, article_views)
-- - Created 2 missing SLA tables (tracking, quality_scores)
-- - Created 3 missing CS tables (metrics, onboarding, churn_risk)
-- - Created 11 AI Agent tables
-- - Created 3 Integration tables
-- - Created 100+ indexes for all new tables
-- - Created 10 triggers for updated_at columns
-- Total: 25 new tables created
