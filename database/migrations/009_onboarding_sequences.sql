-- ============================================================================
-- ONBOARDING SEQUENCES SYSTEM
-- ============================================================================
-- Automated onboarding sequences with milestone tracking and communication triggers

-- CS Onboarding Sequences (Templates)
-- Create this table FIRST before adding foreign key references
CREATE TABLE IF NOT EXISTS cs_onboarding_sequences (
    sequence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID, -- NULL for default sequences, UUID for tenant-specific
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Sequence structure
    stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of stage objects
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of milestone objects
    communication_flows JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of communication triggers
    
    -- Metadata
    estimated_duration_days INT,
    created_by UUID, -- Team member who created this sequence
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhance existing onboarding progress table if needed
-- This must come AFTER cs_onboarding_sequences table is created
DO $$ 
BEGIN
    -- Add customer_email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_onboarding_progress' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE cs_customer_onboarding_progress 
        ADD COLUMN customer_email VARCHAR(255);
    END IF;
    
    -- Add sequence_id if it doesn't exist (to link to onboarding sequence template)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_onboarding_progress' 
        AND column_name = 'sequence_id'
    ) THEN
        ALTER TABLE cs_customer_onboarding_progress 
        ADD COLUMN sequence_id UUID REFERENCES cs_onboarding_sequences(sequence_id);
    END IF;
    
    -- Add milestone tracking if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_onboarding_progress' 
        AND column_name = 'current_milestone'
    ) THEN
        ALTER TABLE cs_customer_onboarding_progress 
        ADD COLUMN current_milestone VARCHAR(100),
        ADD COLUMN milestones_completed JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN milestones_pending JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN next_milestone_due_at TIMESTAMPTZ;
    END IF;
END $$;

-- CS Onboarding Milestones
CREATE TABLE IF NOT EXISTS cs_onboarding_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES cs_onboarding_sequences(sequence_id) ON DELETE CASCADE,
    milestone_key VARCHAR(100) NOT NULL, -- Unique key within sequence (e.g., 'account_created', 'first_login')
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    stage VARCHAR(50) NOT NULL, -- Which onboarding stage this belongs to
    
    -- Milestone requirements
    required_actions JSONB DEFAULT '[]'::jsonb, -- Actions customer must complete
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Conditions that trigger this milestone
    
    -- Communication triggers
    trigger_email BOOLEAN DEFAULT FALSE,
    trigger_sms BOOLEAN DEFAULT FALSE,
    trigger_call BOOLEAN DEFAULT FALSE,
    email_template_id UUID, -- Reference to email template
    sms_template_id UUID, -- Reference to SMS template
    call_script_id UUID, -- Reference to call script
    
    -- Timing
    days_after_previous INT DEFAULT 0, -- Days after previous milestone
    due_days_after_start INT, -- Days after onboarding start
    
    -- Ordering
    order_index INT NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(sequence_id, milestone_key)
);

-- CS Onboarding Communications (Sent/Received)
CREATE TABLE IF NOT EXISTS cs_onboarding_communications (
    communication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES cs_onboarding_milestones(milestone_id),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('email', 'sms', 'call', 'in_app')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed', 'completed')),
    
    -- Content
    subject VARCHAR(500), -- For emails
    body TEXT,
    template_id UUID,
    
    -- Channel-specific
    email_message_id VARCHAR(255), -- SendGrid message ID
    sms_message_id VARCHAR(255), -- Twilio message SID
    call_sid VARCHAR(255), -- Twilio call SID
    call_duration_seconds INT,
    call_recording_url TEXT,
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Response tracking
    response_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Onboarding Milestone Completions
CREATE TABLE IF NOT EXISTS cs_onboarding_milestone_completions (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES cs_onboarding_milestones(milestone_id),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Completion details
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_method VARCHAR(50) CHECK (completion_method IN ('automatic', 'manual', 'api', 'webhook')),
    completed_by UUID, -- Team member if manually completed
    completion_data JSONB DEFAULT '{}'::jsonb, -- Data that triggered completion
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_tenant ON cs_onboarding_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_default ON cs_onboarding_sequences(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_sequence ON cs_onboarding_milestones(sequence_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_stage ON cs_onboarding_milestones(stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_progress ON cs_onboarding_communications(onboarding_progress_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_milestone ON cs_onboarding_communications(milestone_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_customer ON cs_onboarding_communications(tenant_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_scheduled ON cs_onboarding_communications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_progress ON cs_onboarding_milestone_completions(onboarding_progress_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_milestone ON cs_onboarding_milestone_completions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_customer ON cs_onboarding_milestone_completions(tenant_id, customer_email);

-- Triggers for updated_at
-- Drop existing triggers first to make migration idempotent
DROP TRIGGER IF EXISTS update_onboarding_sequences_updated_at ON cs_onboarding_sequences;
CREATE TRIGGER update_onboarding_sequences_updated_at
    BEFORE UPDATE ON cs_onboarding_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_milestones_updated_at ON cs_onboarding_milestones;
CREATE TRIGGER update_onboarding_milestones_updated_at
    BEFORE UPDATE ON cs_onboarding_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_communications_updated_at ON cs_onboarding_communications;
CREATE TRIGGER update_onboarding_communications_updated_at
    BEFORE UPDATE ON cs_onboarding_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_onboarding_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_milestone_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view onboarding sequences for their tenant
DROP POLICY IF EXISTS "team_members_view_own_tenant_onboarding_sequences" ON cs_onboarding_sequences;
CREATE POLICY "team_members_view_own_tenant_onboarding_sequences" ON cs_onboarding_sequences
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view onboarding progress for their tenant
DROP POLICY IF EXISTS "team_members_view_own_tenant_onboarding_progress" ON cs_customer_onboarding_progress;
CREATE POLICY "team_members_view_own_tenant_onboarding_progress" ON cs_customer_onboarding_progress
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view communications for their tenant
DROP POLICY IF EXISTS "team_members_view_own_tenant_onboarding_communications" ON cs_onboarding_communications;
CREATE POLICY "team_members_view_own_tenant_onboarding_communications" ON cs_onboarding_communications
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view completions for their tenant
DROP POLICY IF EXISTS "team_members_view_own_tenant_onboarding_completions" ON cs_onboarding_milestone_completions;
CREATE POLICY "team_members_view_own_tenant_onboarding_completions" ON cs_onboarding_milestone_completions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_onboarding_sequences IS 'Onboarding sequence templates with stages, milestones, and communication flows';
COMMENT ON TABLE cs_onboarding_milestones IS 'Individual milestones within onboarding sequences';
COMMENT ON TABLE cs_onboarding_communications IS 'All communications sent/received during onboarding';
COMMENT ON TABLE cs_onboarding_milestone_completions IS 'Track milestone completions for analytics';
