-- Migration 045: Conversation Routing Rules
-- Rules-based routing for incoming tickets/conversations

CREATE TABLE IF NOT EXISTS cs_conversation_routing_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('round_robin', 'skill_match', 'priority_based', 'static_assign')),
    rule_config JSONB NOT NULL DEFAULT '{}',
    rule_conditions JSONB DEFAULT '{}',
    rule_priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_tenant ON cs_conversation_routing_rules(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS cs_agent_round_robin_state (
    round_robin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    last_assigned_agent_id VARCHAR(255) NOT NULL,
    last_assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_round_robin_tenant ON cs_agent_round_robin_state(tenant_id);
