-- ============================================================================
-- UNIFIED INBOX ARCHITECTURE
-- Multi-team, multi-context unified inbox for Sales CRM, CS-Support, 
-- Internal Ops, and TrueVow Management
-- ============================================================================

-- ============================================================================
-- INBOX CONTEXTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_inbox_contexts (
    context_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('sales', 'cs', 'ops', 'management', 'ai')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID, -- NULL for system-wide contexts (ops, management)
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(context_type, tenant_id) -- One context per type per tenant
);

-- ============================================================================
-- CONVERSATION CONTEXT ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_conversation_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    context_id UUID NOT NULL REFERENCES unified_inbox_contexts(context_id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('sales', 'cs', 'ops', 'management', 'ai')),
    assigned_team VARCHAR(50), -- 'sales', 'cs', 'ops', etc.
    priority INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, context_id)
);

-- ============================================================================
-- COLLISION DETECTION (Real-Time Collaboration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collision_detection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Clerk user ID
    team_member_id UUID REFERENCES cs_team_members(member_id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('viewing', 'typing', 'editing')),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- WORKFLOW DEFINITIONS (Visual Workflow Builder)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('sales', 'cs', 'ops', 'management', 'ai', 'all')),
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('automatic', 'manual')),
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of condition objects
    actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of action objects
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL, -- Clerk user ID
    tenant_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW EXECUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(workflow_id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    triggered_by UUID, -- Clerk user ID or 'system'
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]'::jsonb, -- Array of log entries
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BEACON API SESSIONS (Customer Portal Integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS beacon_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_email VARCHAR(255),
    customer_id UUID, -- If authenticated
    tenant_id UUID,
    page_url TEXT,
    page_context JSONB DEFAULT '{}'::jsonb, -- Page metadata for context-aware suggestions
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Unified Inbox Contexts
CREATE INDEX IF NOT EXISTS idx_unified_contexts_type ON unified_inbox_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_unified_contexts_tenant ON unified_inbox_contexts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unified_contexts_active ON unified_inbox_contexts(is_active) WHERE is_active = TRUE;

-- Conversation Contexts
CREATE INDEX IF NOT EXISTS idx_conv_contexts_conv ON unified_conversation_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_contexts_context ON unified_conversation_contexts(context_id);
CREATE INDEX IF NOT EXISTS idx_conv_contexts_type ON unified_conversation_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_conv_contexts_team ON unified_conversation_contexts(assigned_team);

-- Collision Detection
CREATE INDEX IF NOT EXISTS idx_collision_conv ON collision_detection(conversation_id);
CREATE INDEX IF NOT EXISTS idx_collision_user ON collision_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_collision_status ON collision_detection(status);
CREATE INDEX IF NOT EXISTS idx_collision_activity ON collision_detection(last_activity);

-- Workflow Definitions
CREATE INDEX IF NOT EXISTS idx_workflows_context ON workflow_definitions(context_type);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflow_definitions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflow_definitions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflow_definitions(tenant_id);

-- Workflow Executions
CREATE INDEX IF NOT EXISTS idx_workflow_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_conv ON workflow_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_triggered ON workflow_executions(triggered_at);

-- Beacon Sessions
CREATE INDEX IF NOT EXISTS idx_beacon_sessions_email ON beacon_sessions(customer_email);
CREATE INDEX IF NOT EXISTS idx_beacon_sessions_tenant ON beacon_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beacon_sessions_active ON beacon_sessions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS (idempotent - ALTER TABLE is safe to run multiple times)
ALTER TABLE unified_inbox_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collision_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_sessions ENABLE ROW LEVEL SECURITY;

-- Unified Inbox Contexts: Users can see contexts they have access to
DROP POLICY IF EXISTS unified_contexts_select ON unified_inbox_contexts;
CREATE POLICY unified_contexts_select ON unified_inbox_contexts
    FOR SELECT
    USING (
        -- System-wide contexts (ops, management) visible to all authenticated users
        tenant_id IS NULL
        OR
        -- Tenant-specific contexts visible to tenant members
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members 
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Conversation Contexts: Users can see conversations in contexts they access
DROP POLICY IF EXISTS conv_contexts_select ON unified_conversation_contexts;
CREATE POLICY conv_contexts_select ON unified_conversation_contexts
    FOR SELECT
    USING (
        context_id IN (
            SELECT context_id FROM unified_inbox_contexts
            WHERE tenant_id IS NULL
            OR tenant_id IN (
                SELECT tenant_id FROM cs_team_members 
                WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Collision Detection: Users can see their own and others' activities
DROP POLICY IF EXISTS collision_select ON collision_detection;
CREATE POLICY collision_select ON collision_detection
    FOR SELECT
    USING (
        -- Users can see collision data for conversations they can access
        conversation_id IN (
            SELECT conversation_id FROM cs_conversations
            WHERE tenant_id IN (
                SELECT tenant_id FROM cs_team_members 
                WHERE clerk_user_id = auth.uid()::text
            )
            OR tenant_id IS NULL
        )
    );

-- Collision Detection: Users can insert/update their own activities
DROP POLICY IF EXISTS collision_insert ON collision_detection;
CREATE POLICY collision_insert ON collision_detection
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS collision_update ON collision_detection;
CREATE POLICY collision_update ON collision_detection
    FOR UPDATE
    USING (user_id = auth.uid());

-- Workflow Definitions: Users can see workflows in their contexts
DROP POLICY IF EXISTS workflows_select ON workflow_definitions;
CREATE POLICY workflows_select ON workflow_definitions
    FOR SELECT
    USING (
        tenant_id IS NULL
        OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members 
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Workflow Definitions: Users can create workflows
DROP POLICY IF EXISTS workflows_insert ON workflow_definitions;
CREATE POLICY workflows_insert ON workflow_definitions
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Workflow Definitions: Users can update their own workflows
DROP POLICY IF EXISTS workflows_update ON workflow_definitions;
CREATE POLICY workflows_update ON workflow_definitions
    FOR UPDATE
    USING (created_by = auth.uid());

-- Workflow Executions: Users can see executions for workflows they can access
DROP POLICY IF EXISTS workflow_exec_select ON workflow_executions;
CREATE POLICY workflow_exec_select ON workflow_executions
    FOR SELECT
    USING (
        workflow_id IN (
            SELECT workflow_id FROM workflow_definitions
            WHERE tenant_id IS NULL
            OR tenant_id IN (
                SELECT tenant_id FROM cs_team_members 
                WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Beacon Sessions: Public access (customer-facing)
DROP POLICY IF EXISTS beacon_sessions_select ON beacon_sessions;
CREATE POLICY beacon_sessions_select ON beacon_sessions
    FOR SELECT
    USING (TRUE); -- Public read access

DROP POLICY IF EXISTS beacon_sessions_insert ON beacon_sessions;
CREATE POLICY beacon_sessions_insert ON beacon_sessions
    FOR INSERT
    WITH CHECK (TRUE); -- Public insert access

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_unified_contexts_updated_at ON unified_inbox_contexts;
CREATE TRIGGER update_unified_contexts_updated_at
    BEFORE UPDATE ON unified_inbox_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conv_contexts_updated_at ON unified_conversation_contexts;
CREATE TRIGGER update_conv_contexts_updated_at
    BEFORE UPDATE ON unified_conversation_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflow_definitions;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup stale collision detection (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_collision()
RETURNS void AS $$
BEGIN
    DELETE FROM collision_detection
    WHERE last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Run cleanup every minute (via pg_cron or application-level cron)
-- Note: Requires pg_cron extension or application-level scheduling

-- ============================================================================
-- INITIAL DATA: Default Contexts
-- ============================================================================

-- Insert default system-wide contexts
INSERT INTO unified_inbox_contexts (context_type, name, description, tenant_id, is_active)
VALUES
    ('cs', 'Customer Support', 'Customer support conversations and tickets', NULL, TRUE),
    ('ops', 'Internal Operations', 'Internal operations, HR, IT, Admin', NULL, TRUE),
    ('management', 'Management', 'Cross-functional oversight and analytics', NULL, TRUE),
    ('ai', 'AI Agent', 'AI agent conversations and automated responses', NULL, TRUE)
ON CONFLICT (context_type, tenant_id) DO NOTHING;

-- Note: Sales context should be created per-tenant by Sales CRM Service
-- or can be created here if tenant_id is known

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE unified_inbox_contexts IS 'Inbox contexts for multi-team unified inbox (Sales, CS, Ops, Management, AI)';
COMMENT ON TABLE unified_conversation_contexts IS 'Assigns conversations to specific inbox contexts';
COMMENT ON TABLE collision_detection IS 'Tracks real-time collaboration (viewing, typing, editing)';
COMMENT ON TABLE workflow_definitions IS 'Workflow definitions for automation (visual builder)';
COMMENT ON TABLE workflow_executions IS 'Workflow execution history and logs';
COMMENT ON TABLE beacon_sessions IS 'Beacon API sessions for customer portal integration';
