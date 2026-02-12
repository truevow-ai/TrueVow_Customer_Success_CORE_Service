-- ============================================================================
-- COMMUNICATION TEMPLATES SYSTEM
-- ============================================================================
-- Templates for emails, SMS, and in-app messages used in onboarding sequences

-- CS Communication Templates
CREATE TABLE IF NOT EXISTS cs_communication_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    template_key VARCHAR(100) UNIQUE NOT NULL, -- Unique key (e.g., 'pre_onboarding_email_1', 'go_live_notification')
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template type and category
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('email', 'sms', 'in_app', 'call_script')),
    category VARCHAR(100), -- e.g., 'pre_onboarding', 'onboarding_call', 'post_onboarding'
    
    -- Associated onboarding sequence
    sequence_template_key VARCHAR(100), -- Links to cs_onboarding_sequences.template_key
    milestone_key VARCHAR(100), -- Links to specific milestone (optional)
    
    -- Content
    subject VARCHAR(500), -- For emails
    body TEXT NOT NULL, -- Main content (supports variable substitution)
    body_html TEXT, -- HTML version for emails (optional)
    
    -- Variable definitions
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable definitions
    -- Example: [{"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer's full name"}]
    
    -- Timing and triggers
    trigger_type VARCHAR(50) CHECK (trigger_type IN ('milestone', 'date_offset', 'manual', 'event')),
    trigger_milestone_key VARCHAR(100), -- If trigger_type = 'milestone'
    trigger_days_offset INT, -- Days after milestone or start (if trigger_type = 'date_offset')
    trigger_event VARCHAR(100), -- Event name (if trigger_type = 'event')
    
    -- Sending configuration
    send_from_email VARCHAR(255), -- From email address
    send_from_name VARCHAR(255), -- From name
    reply_to_email VARCHAR(255), -- Reply-to email
    send_conditions JSONB DEFAULT '{}'::jsonb, -- Conditions that must be met to send
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default template for this type/category
    tenant_id UUID, -- NULL for global templates, UUID for tenant-specific
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID, -- Team member who created this template
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email_template CHECK (
        template_type != 'email' OR (subject IS NOT NULL AND body IS NOT NULL)
    ),
    CONSTRAINT valid_sms_template CHECK (
        template_type != 'sms' OR (body IS NOT NULL AND LENGTH(body) <= 1600)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_key ON cs_communication_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON cs_communication_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON cs_communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_sequence ON cs_communication_templates(sequence_template_key);
CREATE INDEX IF NOT EXISTS idx_communication_templates_milestone ON cs_communication_templates(milestone_key);
CREATE INDEX IF NOT EXISTS idx_communication_templates_tenant ON cs_communication_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON cs_communication_templates(is_active) WHERE is_active = TRUE;

-- Update cs_onboarding_communications to reference templates
DO $$
BEGIN
    -- Add template_key if it doesn't exist (for easier lookup)
    -- Note: We use template_key (VARCHAR) instead of template_id (UUID) for easier lookup
    -- Foreign key constraint is not added because template_key is not a primary key
    -- We'll use application-level validation instead
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'cs_onboarding_communications' 
        AND column_name = 'template_key'
        AND data_type = 'character varying'
    ) THEN
        -- Add the column
        ALTER TABLE cs_onboarding_communications 
        ADD COLUMN template_key VARCHAR(100);
    END IF;
END $$;

-- Create index separately (after column is confirmed to exist)
-- Use a simple index without WHERE clause to avoid type checking issues during migration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'cs_onboarding_communications' 
        AND column_name = 'template_key'
        AND data_type = 'character varying'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_onboarding_communications_template_key 
        ON cs_onboarding_communications(template_key);
    END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_communication_templates_updated_at ON cs_communication_templates;
CREATE TRIGGER update_communication_templates_updated_at
    BEFORE UPDATE ON cs_communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Usage tracking will be handled in application code (CommunicationTemplatesService)
-- to avoid database trigger type conflicts. The trigger function is not created here.
-- If you need database-level usage tracking later, create the trigger after ensuring
-- all columns are properly typed and the migration is complete.

-- Note: Trigger creation is deferred to avoid type conflicts during migration
-- Usage tracking will be handled in application code (CommunicationTemplatesService)
-- To enable the trigger later, uncomment the following:
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cs_onboarding_communications'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_onboarding_communications' 
        AND column_name = 'template_key'
        AND data_type = 'character varying'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_update_template_usage ON cs_onboarding_communications;
        CREATE TRIGGER trigger_update_template_usage
            AFTER INSERT ON cs_onboarding_communications
            FOR EACH ROW
            WHEN (NEW.template_key IS NOT NULL)
            EXECUTE FUNCTION update_template_usage();
    END IF;
END $$;
*/

-- RLS Policies
ALTER TABLE cs_communication_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view all templates
DROP POLICY IF EXISTS team_members_view_templates ON cs_communication_templates;
CREATE POLICY team_members_view_templates ON cs_communication_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cs_team_members
            WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
            AND cs_team_members.is_active = TRUE
        )
    );

-- Policy: Team members can create templates
DROP POLICY IF EXISTS team_members_create_templates ON cs_communication_templates;
CREATE POLICY team_members_create_templates ON cs_communication_templates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cs_team_members
            WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
            AND cs_team_members.is_active = TRUE
        )
    );

-- Policy: Team members can update templates
DROP POLICY IF EXISTS team_members_update_templates ON cs_communication_templates;
CREATE POLICY team_members_update_templates ON cs_communication_templates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cs_team_members
            WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
            AND cs_team_members.is_active = TRUE
        )
    );

-- Policy: Team members can delete templates (soft delete via is_active)
DROP POLICY IF EXISTS team_members_delete_templates ON cs_communication_templates;
CREATE POLICY team_members_delete_templates ON cs_communication_templates
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cs_team_members
            WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
            AND cs_team_members.is_active = TRUE
        )
    );

-- Comments
COMMENT ON TABLE cs_communication_templates IS 'Communication templates for emails, SMS, and in-app messages used in onboarding sequences';
COMMENT ON COLUMN cs_communication_templates.template_key IS 'Unique identifier for the template (e.g., pre_onboarding_email_1)';
COMMENT ON COLUMN cs_communication_templates.template_type IS 'Type of communication: email, sms, in_app, or call_script';
COMMENT ON COLUMN cs_communication_templates.sequence_template_key IS 'Links to cs_onboarding_sequences.template_key';
COMMENT ON COLUMN cs_communication_templates.milestone_key IS 'Links to specific milestone in onboarding sequence';
COMMENT ON COLUMN cs_communication_templates.variables IS 'Array of variable definitions for template substitution';
COMMENT ON COLUMN cs_communication_templates.trigger_type IS 'How this template is triggered: milestone, date_offset, manual, or event';
COMMENT ON COLUMN cs_communication_templates.send_conditions IS 'JSON object with conditions that must be met to send this template';
