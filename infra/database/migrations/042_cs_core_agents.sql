-- ============================================================================
-- Migration: CS CORE Agents (Deterministic)
-- Version: 1.0.0
-- Date: 2026-03-03
-- 
-- CS CORE is LLM-FREE. This table stores deterministic agent definitions
-- for CSM and CAS-* specialists. FLS owns LLM agents separately.
-- ============================================================================

BEGIN;

-- ============================================================
-- CS CORE Agents Table (DETERMINISTIC ONLY)
-- ============================================================
-- This table is owned by CS CORE (Port 3061)
-- All agents here have execution_mode = 'deterministic'
-- FLS (Port 3066) has its own llm_agents table
-- ============================================================

CREATE TABLE IF NOT EXISTS cs_core_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent identity
    agent_type VARCHAR(50) NOT NULL UNIQUE, -- 'CSM', 'CAS-GCalendar', 'CAS-Gmail', etc.
    agent_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Autonomy & Rollout
    autonomy_tier VARCHAR(10) NOT NULL DEFAULT 'LEVEL_1',
    rollout_phase VARCHAR(20) NOT NULL DEFAULT 'full_autonomous',
    approval_required_for JSONB DEFAULT '[]',
    
    -- JTBD Framework (3-layer)
    jtbd_layers JSONB DEFAULT '[]',
    jtbd_performance_targets JSONB DEFAULT '[]',
    
    -- Training & Attribution
    training_cycle JSONB DEFAULT '{}',
    quadrant_position JSONB DEFAULT '{}',
    attribution_metrics JSONB DEFAULT '{}',
    
    -- Execution mode (ALWAYS deterministic for CS CORE)
    execution_mode VARCHAR(20) NOT NULL DEFAULT 'deterministic',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_autonomy_tier CHECK (autonomy_tier IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3')),
    CONSTRAINT valid_rollout_phase CHECK (rollout_phase IN (
        'suggest_only', 'limited_execution', 'strategic',
        'full_autonomous', 'deprecated'
    )),
    CONSTRAINT cs_core_deterministic_only CHECK (execution_mode = 'deterministic')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_core_agents_type ON cs_core_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_cs_core_agents_active ON cs_core_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_cs_core_agents_autonomy ON cs_core_agents(autonomy_tier);

-- Update trigger
CREATE OR REPLACE FUNCTION update_cs_core_agents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cs_core_agents_updated ON cs_core_agents;
CREATE TRIGGER cs_core_agents_updated
    BEFORE UPDATE ON cs_core_agents
    FOR EACH ROW EXECUTE FUNCTION update_cs_core_agents_timestamp();

-- ============================================================
-- Seed default agent definitions
-- ============================================================

INSERT INTO cs_core_agents (agent_type, agent_name, description, autonomy_tier, rollout_phase, execution_mode)
VALUES 
    ('CSM', 'Client Success Manager', 'Orchestrates 90-day post-onboarding sequences', 'LEVEL_1', 'full_autonomous', 'deterministic'),
    ('CAS-GCalendar', 'Google Calendar Specialist', 'Configures and maintains Google Calendar integrations (external OAuth)', 'LEVEL_2', 'full_autonomous', 'deterministic'),
    ('CAS-Gmail', 'Gmail Integration Specialist', 'Configures and maintains Gmail routing integrations (external OAuth)', 'LEVEL_2', 'full_autonomous', 'deterministic'),
    ('CAS-Phone', 'Phone Integration Specialist', 'Configures and maintains VoIP/phone integrations (TrueVow-held Twilio)', 'LEVEL_2', 'full_autonomous', 'deterministic'),
    ('CAS-Microsoft', 'Microsoft 365 Specialist', 'Configures and maintains Microsoft Graph integrations (external OAuth)', 'LEVEL_2', 'full_autonomous', 'deterministic'),
    ('CAS-Stripe', 'Stripe Payment Specialist', 'Configures and maintains Stripe payment integrations (Stripe Connect)', 'LEVEL_3', 'full_autonomous', 'deterministic'),
    ('CAS-Draft', 'Draft Service Specialist', 'Syncs document templates with internal TrueVow DRAFT service', 'LEVEL_2', 'full_autonomous', 'deterministic')
ON CONFLICT (agent_type) DO NOTHING;

COMMIT;
