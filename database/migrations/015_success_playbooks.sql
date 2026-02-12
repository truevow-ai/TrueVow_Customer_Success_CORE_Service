-- ============================================================================
-- SUCCESS PLAYBOOKS SYSTEM
-- ============================================================================
-- Template sequences for legal upsell, automated workflows, and customer success actions

-- CS Success Playbooks (Playbook Templates)
CREATE TABLE IF NOT EXISTS cs_success_playbooks (
    playbook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default playbooks
    
    -- Playbook Identification
    playbook_name VARCHAR(255) NOT NULL,
    playbook_description TEXT,
    playbook_category VARCHAR(100) NOT NULL, -- 'upsell', 'onboarding', 'retention', 'expansion', 'renewal', 'custom'
    
    -- Trigger Conditions
    trigger_type VARCHAR(100) NOT NULL, -- 'manual', 'health_score', 'usage_pattern', 'milestone', 'event', 'schedule'
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Condition-specific data
    
    -- Playbook Steps
    steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of step objects
    /*
    Step structure:
    {
      "step_id": "uuid",
      "step_order": 1,
      "step_type": "email" | "sms" | "call" | "task" | "wait" | "condition",
      "step_name": "Send welcome email",
      "step_config": {
        "template_id": "uuid",
        "delay_hours": 0,
        "channel": "email",
        ...
      },
      "step_conditions": {...}, // Optional conditions
      "step_actions": {...} // Actions on completion
    }
    */
    
    -- Execution Settings
    max_executions_per_customer INT DEFAULT 1, -- Maximum times to run per customer
    execution_window_days INT, -- Days within which playbook can execute
    cooldown_days INT DEFAULT 0, -- Days to wait before re-executing
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default playbooks available to all tenants
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- CS Playbook Executions (Active Playbook Runs)
CREATE TABLE IF NOT EXISTS cs_playbook_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID NOT NULL REFERENCES cs_success_playbooks(playbook_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'cancelled', 'failed')),
    current_step_id VARCHAR(255), -- Current step being executed
    current_step_order INT DEFAULT 0,
    
    -- Execution Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    paused_reason TEXT,
    
    -- Progress
    steps_completed INT DEFAULT 0,
    steps_total INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Results
    execution_result VARCHAR(50) CHECK (execution_result IN ('success', 'partial', 'failed', 'cancelled')),
    execution_notes TEXT,
    
    -- Trigger Information
    triggered_by VARCHAR(100), -- 'manual', 'system', 'event', 'schedule'
    trigger_event_id UUID, -- ID of triggering event
    trigger_data JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Playbook Step Executions (Individual Step Tracking)
CREATE TABLE IF NOT EXISTS cs_playbook_step_executions (
    step_execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES cs_playbook_executions(execution_id) ON DELETE CASCADE,
    step_id VARCHAR(255) NOT NULL,
    step_order INT NOT NULL,
    
    -- Step Details
    step_type VARCHAR(100) NOT NULL,
    step_name VARCHAR(255),
    step_config JSONB DEFAULT '{}'::jsonb,
    
    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'executing', 'completed', 'skipped', 'failed')),
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Results
    execution_result JSONB DEFAULT '{}'::jsonb, -- Step-specific results
    error_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Playbook Templates (Communication Templates for Playbooks)
CREATE TABLE IF NOT EXISTS cs_playbook_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID REFERENCES cs_success_playbooks(playbook_id) ON DELETE SET NULL,
    tenant_id UUID, -- NULL for default templates
    
    -- Template Identification
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('email', 'sms', 'call_script', 'task', 'notification')),
    
    -- Template Content
    subject VARCHAR(500), -- Email subject or SMS/call title
    body_text TEXT, -- Plain text body
    body_html TEXT, -- HTML body (for emails)
    
    -- Template Variables
    variables JSONB DEFAULT '[]'::jsonb, -- Available variables for personalization
    /*
    Variable structure:
    [
      {
        "name": "customer_name",
        "description": "Customer's name",
        "default": "Valued Customer"
      },
      {
        "name": "health_score",
        "description": "Customer health score",
        "type": "number"
      }
    ]
    */
    
    -- Personalization
    personalization_enabled BOOLEAN DEFAULT TRUE,
    personalization_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Playbook Outcomes (Track Playbook Results)
CREATE TABLE IF NOT EXISTS cs_playbook_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES cs_playbook_executions(execution_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Outcome Type
    outcome_type VARCHAR(100) NOT NULL, -- 'upsell', 'renewal', 'expansion', 'retention', 'engagement', 'other'
    outcome_value DECIMAL(10,2), -- Monetary value (for upsell/expansion)
    
    -- Outcome Details
    outcome_description TEXT,
    outcome_metrics JSONB DEFAULT '{}'::jsonb, -- Metrics before/after playbook
    
    -- Attribution
    attributed_to_playbook BOOLEAN DEFAULT TRUE,
    confidence_score DECIMAL(5,2), -- Confidence that playbook caused outcome (0-100)
    
    -- Timing
    outcome_date DATE NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playbooks_tenant ON cs_success_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_category ON cs_success_playbooks(playbook_category);
CREATE INDEX IF NOT EXISTS idx_playbooks_active ON cs_success_playbooks(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_playbooks_default ON cs_success_playbooks(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_playbook_executions_playbook ON cs_playbook_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_tenant ON cs_playbook_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_customer ON cs_playbook_executions(customer_email);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_status ON cs_playbook_executions(status);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_started ON cs_playbook_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_playbook_step_executions_execution ON cs_playbook_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_playbook_step_executions_status ON cs_playbook_step_executions(status);
CREATE INDEX IF NOT EXISTS idx_playbook_step_executions_scheduled ON cs_playbook_step_executions(scheduled_at) WHERE status IN ('pending', 'scheduled');

CREATE INDEX IF NOT EXISTS idx_playbook_templates_playbook ON cs_playbook_templates(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_tenant ON cs_playbook_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_type ON cs_playbook_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_playbook_outcomes_execution ON cs_playbook_outcomes(execution_id);
CREATE INDEX IF NOT EXISTS idx_playbook_outcomes_tenant ON cs_playbook_outcomes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbook_outcomes_type ON cs_playbook_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_playbook_outcomes_date ON cs_playbook_outcomes(outcome_date DESC);

-- Triggers for updated_at
CREATE TRIGGER update_playbooks_updated_at
    BEFORE UPDATE ON cs_success_playbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_executions_updated_at
    BEFORE UPDATE ON cs_playbook_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_step_executions_updated_at
    BEFORE UPDATE ON cs_playbook_step_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_templates_updated_at
    BEFORE UPDATE ON cs_playbook_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_success_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_playbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_playbook_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_playbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_playbook_outcomes ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view playbooks for their tenant
CREATE POLICY "team_members_view_own_tenant_playbooks" ON cs_success_playbooks
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_executions" ON cs_playbook_executions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_step_executions" ON cs_playbook_step_executions
    FOR SELECT
    USING (
        execution_id IN (
            SELECT execution_id FROM cs_playbook_executions
            WHERE tenant_id IN (
                SELECT tenant_id FROM cs_team_members
                WHERE clerk_user_id = get_current_clerk_user_id()
            )
        )
    );

CREATE POLICY "team_members_view_own_tenant_templates" ON cs_playbook_templates
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_outcomes" ON cs_playbook_outcomes
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_success_playbooks IS 'Success playbook templates for automated workflows';
COMMENT ON TABLE cs_playbook_executions IS 'Active and completed playbook executions';
COMMENT ON TABLE cs_playbook_step_executions IS 'Individual step execution tracking';
COMMENT ON TABLE cs_playbook_templates IS 'Communication templates for playbook steps';
COMMENT ON TABLE cs_playbook_outcomes IS 'Track outcomes and results from playbook executions';
