-- ============================================================================
-- Migration: CS CORE Agent Framework Expansion
-- Version: 2.0.0
-- Date: 2026-03-03
-- 
-- Expands cs_core_agents to match FLS JTBD + 2x2 Quadrant framework for 
-- Internal Ops compatibility.
-- 
-- CS CORE is LLM-FREE - uses execution_config instead of llm_config
-- ============================================================================

BEGIN;

-- ============================================================
-- Expand cs_core_agents with full JTBD + 2x2 structure
-- ============================================================

-- Role responsibilities (detailed with mission, scope, boundaries)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS role_responsibilities JSONB DEFAULT '{
        "primary_mission": "",
        "scope": [],
        "boundaries": [],
        "escalation_paths": {}
    }';

-- Brief config (personality, tone, response style)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS brief_config JSONB DEFAULT '{
        "personality": "Professional and efficient",
        "tone": "professional",
        "response_style": "concise"
    }';

-- Execution config (replaces llm_config for deterministic agents)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS execution_config JSONB DEFAULT '{
        "workflow_engine": "deterministic",
        "max_retries": 3,
        "timeout_ms": 30000,
        "fallback_action": "escalate_human"
    }';

-- Performance metrics (structured tracking)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{
        "total_executions": 0,
        "avg_execution_time_ms": 0,
        "success_rate": 0,
        "escalation_rate": 0,
        "customer_satisfaction": 0
    }';

-- Autonomy actions (action-level autonomy control)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS autonomy_actions JSONB DEFAULT '{
        "fully_autonomous": [],
        "requires_approval": [],
        "human_only": []
    }';

-- Customer outcome metrics (JTBD customer value layer)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS customer_outcome_metrics JSONB DEFAULT '[]';

-- Business outcome metrics (JTBD org value layer)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS business_outcome_metrics JSONB DEFAULT '[]';

-- Service stage and TrueVow service assignment
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS service_stage VARCHAR(50) DEFAULT 'Post-sale';

ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS truevow_service VARCHAR(50) DEFAULT 'ALL';

-- Status field (matches FLS)
ALTER TABLE cs_core_agents
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add constraints
ALTER TABLE cs_core_agents
    DROP CONSTRAINT IF EXISTS valid_service_stage;
ALTER TABLE cs_core_agents
    ADD CONSTRAINT valid_service_stage CHECK (service_stage IN (
        'Pre-sale', 'Post-sale', 'Retention', 'All stages'
    ));

ALTER TABLE cs_core_agents
    DROP CONSTRAINT IF EXISTS valid_truevow_service;
ALTER TABLE cs_core_agents
    ADD CONSTRAINT valid_truevow_service CHECK (truevow_service IN (
        'INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL'
    ));

ALTER TABLE cs_core_agents
    DROP CONSTRAINT IF EXISTS valid_agent_status;
ALTER TABLE cs_core_agents
    ADD CONSTRAINT valid_agent_status CHECK (status IN (
        'active', 'inactive', 'testing', 'maintenance'
    ));

-- ============================================================
-- CS CORE Agent Executions (track deterministic actions)
-- ============================================================

CREATE TABLE IF NOT EXISTS cs_core_agent_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES cs_core_agents(agent_id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Execution type (deterministic actions)
    execution_type VARCHAR(50) NOT NULL,
    
    -- Context
    trigger_source VARCHAR(50) NOT NULL, -- 'saas_admin', 'fls', 'cron', 'manual'
    input_context JSONB DEFAULT '{}',
    
    -- Result
    output_result JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    
    -- Attribution (for Internal Ops)
    jtbd_layer VARCHAR(20),
    autonomy_score INTEGER,
    attribution_score INTEGER,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_execution_type CHECK (execution_type IN (
        'sequence_trigger',      -- CSM: trigger 90-day sequence step
        'health_check',          -- CSM: calculate health score
        'churn_detection',       -- CSM: detect churn risk
        'integration_configure', -- CAS: configure integration
        'integration_health',    -- CAS: check integration health
        'oauth_refresh',         -- CAS: refresh OAuth token
        'troubleshoot',          -- CAS: troubleshoot integration issue
        'template_sync',         -- CAS-Draft: sync document templates
        'escalate'               -- All: escalate to human
    )),
    CONSTRAINT valid_execution_status CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'timeout', 'escalated'
    )),
    CONSTRAINT valid_jtbd_layer CHECK (jtbd_layer IS NULL OR jtbd_layer IN (
        'standard', 'customer_value', 'org_value'
    ))
);

-- Indexes for execution tracking
CREATE INDEX IF NOT EXISTS idx_core_executions_agent ON cs_core_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_core_executions_tenant ON cs_core_agent_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_core_executions_type ON cs_core_agent_executions(execution_type);
CREATE INDEX IF NOT EXISTS idx_core_executions_status ON cs_core_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_core_executions_created ON cs_core_agent_executions(created_at DESC);

-- ============================================================
-- Update existing agent seed data with expanded config
-- ============================================================

-- CSM
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["sequence_orchestration", "health_monitoring", "churn_prevention", "renewal_preparation"],
        "escalation_triggers": ["health_score_critical", "churn_risk_high", "customer_complaint"],
        "autonomous_actions": ["sequence_trigger", "health_check", "email_reminder"],
        "human_approval_required": ["account_modification", "discount_approval", "contract_change"]
    }',
    brief_config = '{
        "personality": "Proactive and customer-focused",
        "tone": "professional",
        "response_style": "detailed",
        "escalation_threshold": 0.6
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 3,
        "timeout_ms": 60000,
        "fallback_action": "escalate_human"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'ALL',
    status = 'active'
WHERE agent_type = 'CSM';

-- CAS-GCalendar
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["oauth_management", "calendar_sync", "appointment_capture"],
        "escalation_triggers": ["oauth_expired", "sync_failure_repeated", "api_error"],
        "autonomous_actions": ["oauth_refresh", "health_check", "sync_trigger"],
        "human_approval_required": ["oauth_revoke", "calendar_access_change"]
    }',
    brief_config = '{
        "personality": "Technical and reliable",
        "tone": "professional",
        "response_style": "concise",
        "escalation_threshold": 0.8
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 5,
        "timeout_ms": 30000,
        "fallback_action": "log_and_retry"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'INTAKE',
    status = 'active'
WHERE agent_type = 'CAS-GCalendar';

-- CAS-Gmail
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["oauth_management", "email_routing", "inbox_sync"],
        "escalation_triggers": ["oauth_expired", "routing_failure", "api_error"],
        "autonomous_actions": ["oauth_refresh", "health_check", "route_email"],
        "human_approval_required": ["oauth_revoke", "routing_rule_change"]
    }',
    brief_config = '{
        "personality": "Technical and reliable",
        "tone": "professional",
        "response_style": "concise",
        "escalation_threshold": 0.8
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 5,
        "timeout_ms": 30000,
        "fallback_action": "log_and_retry"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'INTAKE',
    status = 'active'
WHERE agent_type = 'CAS-Gmail';

-- CAS-Phone
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["voip_configuration", "call_routing", "number_provisioning"],
        "escalation_triggers": ["call_failure", "routing_error", "number_issue"],
        "autonomous_actions": ["health_check", "routing_update", "call_log_sync"],
        "human_approval_required": ["number_change", "routing_rule_major_change"]
    }',
    brief_config = '{
        "personality": "Technical and responsive",
        "tone": "professional",
        "response_style": "concise",
        "escalation_threshold": 0.7
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 3,
        "timeout_ms": 15000,
        "fallback_action": "escalate_human"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'INTAKE',
    status = 'active'
WHERE agent_type = 'CAS-Phone';

-- CAS-Microsoft
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["oauth_management", "graph_api_sync", "o365_integration"],
        "escalation_triggers": ["oauth_expired", "sync_failure", "api_error"],
        "autonomous_actions": ["oauth_refresh", "health_check", "sync_trigger"],
        "human_approval_required": ["oauth_revoke", "permission_change"]
    }',
    brief_config = '{
        "personality": "Technical and reliable",
        "tone": "professional",
        "response_style": "concise",
        "escalation_threshold": 0.8
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 5,
        "timeout_ms": 30000,
        "fallback_action": "log_and_retry"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'INTAKE',
    status = 'active'
WHERE agent_type = 'CAS-Microsoft';

-- CAS-Stripe
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["stripe_connect_management", "payment_sync", "billing_integration"],
        "escalation_triggers": ["payment_failure", "connect_error", "webhook_failure"],
        "autonomous_actions": ["health_check", "webhook_verify", "balance_check"],
        "human_approval_required": ["refund_approval", "subscription_change", "payout_change"]
    }',
    brief_config = '{
        "personality": "Precise and cautious",
        "tone": "formal",
        "response_style": "detailed",
        "escalation_threshold": 0.5
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 2,
        "timeout_ms": 20000,
        "fallback_action": "escalate_human"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'SETTLE',
    status = 'active'
WHERE agent_type = 'CAS-Stripe';

-- CAS-Draft
UPDATE cs_core_agents
SET 
    role_responsibilities = '{
        "primary_functions": ["template_sync", "document_generation", "draft_api_management"],
        "escalation_triggers": ["template_error", "generation_failure", "api_error"],
        "autonomous_actions": ["health_check", "template_sync", "cache_refresh"],
        "human_approval_required": ["template_modification", "api_credential_change"]
    }',
    brief_config = '{
        "personality": "Technical and thorough",
        "tone": "professional",
        "response_style": "concise",
        "escalation_threshold": 0.7
    }',
    execution_config = '{
        "workflow_engine": "deterministic",
        "max_retries": 3,
        "timeout_ms": 45000,
        "fallback_action": "log_and_retry"
    }',
    service_stage = 'Post-sale',
    truevow_service = 'DRAFT',
    status = 'active'
WHERE agent_type = 'CAS-Draft';

COMMIT;
