-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Security audit logging for all sensitive operations

CREATE TABLE IF NOT EXISTS cs_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL, -- e.g., 'crm_sync_create', 'crm_sync_update'
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
        'ticket', 'crm_case', 'conversation', 'message', 'kb_article', 'team_member'
    )),
    resource_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    team_member_id UUID REFERENCES cs_team_members(member_id),
    tenant_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB DEFAULT '{}'::jsonb,
    response_status INT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON cs_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team_member ON cs_audit_logs(team_member_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON cs_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON cs_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON cs_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON cs_audit_logs(created_at DESC);

-- RLS policies for audit logs (read-only for authorized users)
ALTER TABLE cs_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view audit logs for their tenant
CREATE POLICY "team_members_view_own_tenant_audit_logs" ON cs_audit_logs
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Service role can insert audit logs (bypasses RLS)
-- Note: Service role bypasses RLS automatically, but we document it here

COMMENT ON TABLE cs_audit_logs IS 'Security audit logs for all sensitive operations including CRM syncs';
COMMENT ON COLUMN cs_audit_logs.action IS 'Action performed (e.g., crm_sync_create, crm_sync_update)';
COMMENT ON COLUMN cs_audit_logs.resource_type IS 'Type of resource affected';
COMMENT ON COLUMN cs_audit_logs.resource_id IS 'ID of the resource affected';
COMMENT ON COLUMN cs_audit_logs.request_data IS 'Sanitized request data (no sensitive info)';
COMMENT ON COLUMN cs_audit_logs.error_message IS 'Error message if operation failed';
