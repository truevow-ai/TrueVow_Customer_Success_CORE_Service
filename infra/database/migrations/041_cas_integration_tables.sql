-- ============================================================================
-- Migration: CAS Integration Tables
-- Version: 1.0.0
-- Date: 2026-03-03
-- Source: Internal Ops Agent Framework Spec
-- ============================================================================

BEGIN;

-- ============================================================
-- CAS Integration Assignments
-- Tracks which CAS specialist is assigned to which tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS cas_integration_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    cas_type VARCHAR(50) NOT NULL, -- 'CAS-GCalendar', 'CAS-Gmail', 'CAS-Phone', 'CAS-Microsoft', 'CAS-Stripe', 'CAS-Draft'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'configured', 'active', 'error', 'disabled'
    config JSONB DEFAULT '{}',
    assigned_to VARCHAR(255), -- CSM or system
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'degraded', 'error', 'unknown'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_cas_type CHECK (cas_type IN (
        'CAS-GCalendar', 'CAS-Gmail', 'CAS-Phone', 
        'CAS-Microsoft', 'CAS-Stripe', 'CAS-Draft'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'pending', 'configured', 'active', 'error', 'disabled'
    )),
    CONSTRAINT valid_health_status CHECK (health_status IN (
        'healthy', 'degraded', 'error', 'unknown'
    ))
);

CREATE INDEX IF NOT EXISTS idx_cas_assignments_tenant ON cas_integration_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cas_assignments_type ON cas_integration_assignments(cas_type);
CREATE INDEX IF NOT EXISTS idx_cas_assignments_status ON cas_integration_assignments(status);

-- ============================================================
-- Integration Health Logs
-- Health check history for each integration
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_health_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES cas_integration_assignments(assignment_id) ON DELETE CASCADE,
    health_status VARCHAR(20) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'oauth_valid', 'api_reachable', 'sync_working', 'manual'
    error_details JSONB,
    latency_ms INTEGER,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_health_log_status CHECK (health_status IN (
        'healthy', 'degraded', 'error', 'unknown'
    ))
);

CREATE INDEX IF NOT EXISTS idx_health_logs_assignment ON integration_health_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_checked_at ON integration_health_logs(checked_at DESC);

-- ============================================================
-- Integration OAuth Tokens
-- Stores encrypted OAuth tokens for each tenant/provider
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_oauth_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'stripe'
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_provider UNIQUE (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_tenant ON integration_oauth_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON integration_oauth_tokens(provider);

-- ============================================================
-- Update triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_cas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cas_assignments_updated ON cas_integration_assignments;
CREATE TRIGGER cas_assignments_updated
    BEFORE UPDATE ON cas_integration_assignments
    FOR EACH ROW EXECUTE FUNCTION update_cas_timestamp();

DROP TRIGGER IF EXISTS oauth_tokens_updated ON integration_oauth_tokens;
CREATE TRIGGER oauth_tokens_updated
    BEFORE UPDATE ON integration_oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_cas_timestamp();

-- ============================================================
-- CAS Troubleshooting Logs
-- Tracks escalated integration issues from FLS
-- ============================================================
CREATE TABLE IF NOT EXISTS cas_troubleshooting_logs (
    troubleshoot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES cas_integration_assignments(assignment_id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    cas_type VARCHAR(50) NOT NULL,
    ticket_id VARCHAR(255),
    escalated_by VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    issue_description TEXT NOT NULL,
    error_logs JSONB DEFAULT '{}',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_troubleshoot_status CHECK (status IN (
        'open', 'investigating', 'pending_customer', 'resolved', 'closed'
    ))
);

CREATE INDEX IF NOT EXISTS idx_troubleshoot_logs_assignment ON cas_troubleshooting_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_troubleshoot_logs_tenant ON cas_troubleshooting_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_troubleshoot_logs_status ON cas_troubleshooting_logs(status);
CREATE INDEX IF NOT EXISTS idx_troubleshoot_logs_ticket ON cas_troubleshooting_logs(ticket_id);

DROP TRIGGER IF EXISTS troubleshoot_logs_updated ON cas_troubleshooting_logs;
CREATE TRIGGER troubleshoot_logs_updated
    BEFORE UPDATE ON cas_troubleshooting_logs
    FOR EACH ROW EXECUTE FUNCTION update_cas_timestamp();

COMMIT;
