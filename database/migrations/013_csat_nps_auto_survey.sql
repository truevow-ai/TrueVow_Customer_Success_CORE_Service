-- ============================================================================
-- CSAT/NPS AUTO-SURVEY SYSTEM
-- ============================================================================
-- Automated post-resolution feedback loops and surveys

-- Enhance existing survey tables if needed
DO $$ 
BEGIN
    -- Add auto_survey fields to CSAT if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_survey_csat' 
        AND column_name = 'auto_sent'
    ) THEN
        ALTER TABLE cs_survey_csat 
        ADD COLUMN auto_sent BOOLEAN DEFAULT FALSE,
        ADD COLUMN sent_at TIMESTAMPTZ,
        ADD COLUMN reminder_sent_at TIMESTAMPTZ,
        ADD COLUMN reminder_count INT DEFAULT 0,
        ADD COLUMN survey_channel VARCHAR(50) CHECK (survey_channel IN ('email', 'sms', 'in_app')),
        ADD COLUMN survey_link VARCHAR(500);
    END IF;
    
    -- Add auto_survey fields to NPS if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_survey_nps' 
        AND column_name = 'auto_sent'
    ) THEN
        ALTER TABLE cs_survey_nps 
        ADD COLUMN auto_sent BOOLEAN DEFAULT FALSE,
        ADD COLUMN sent_at TIMESTAMPTZ,
        ADD COLUMN reminder_sent_at TIMESTAMPTZ,
        ADD COLUMN reminder_count INT DEFAULT 0,
        ADD COLUMN survey_channel VARCHAR(50) CHECK (survey_channel IN ('email', 'sms', 'in_app')),
        ADD COLUMN survey_link VARCHAR(500);
    END IF;
END $$;

-- CS Survey Templates
CREATE TABLE IF NOT EXISTS cs_survey_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN ('csat', 'nps')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template Content
    subject VARCHAR(500), -- Email subject
    message_text TEXT, -- SMS or email body
    message_html TEXT, -- HTML email body
    
    -- Survey Questions
    questions JSONB DEFAULT '[]'::jsonb, -- Array of question objects
    
    -- Timing
    delay_hours INT DEFAULT 24, -- Hours after resolution to send
    reminder_hours INT DEFAULT 72, -- Hours to wait before reminder
    max_reminders INT DEFAULT 1, -- Maximum reminder attempts
    
    -- Channel
    default_channel VARCHAR(50) DEFAULT 'email' CHECK (default_channel IN ('email', 'sms', 'in_app')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    tenant_id UUID, -- NULL for default templates
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Survey Responses (Enhanced)
CREATE TABLE IF NOT EXISTS cs_survey_responses (
    response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL, -- References cs_survey_csat or cs_survey_nps
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN ('csat', 'nps')),
    tenant_id UUID NOT NULL,
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Response Data
    score INT, -- CSAT score (1-5) or NPS score (0-10)
    rating INT, -- Alternative rating field
    feedback_text TEXT, -- Open-ended feedback
    responses JSONB DEFAULT '{}'::jsonb, -- Additional question responses
    
    -- Response Metadata
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_channel VARCHAR(50) CHECK (response_channel IN ('email', 'sms', 'in_app', 'web')),
    ip_address INET,
    user_agent TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Survey Automation Rules
CREATE TABLE IF NOT EXISTS cs_survey_automation_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default rules
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger Conditions
    trigger_on VARCHAR(50) NOT NULL CHECK (trigger_on IN ('ticket_resolved', 'ticket_closed', 'conversation_resolved')),
    ticket_status VARCHAR(50), -- Required ticket status
    ticket_priority VARCHAR(50), -- Optional priority filter
    ticket_channel VARCHAR(50), -- Optional channel filter
    min_resolution_time_minutes INT, -- Minimum resolution time to trigger
    
    -- Survey Configuration
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN ('csat', 'nps', 'both')),
    template_id UUID REFERENCES cs_survey_templates(template_id),
    delay_hours INT DEFAULT 24,
    
    -- Channel Selection
    preferred_channel VARCHAR(50) DEFAULT 'email' CHECK (preferred_channel IN ('email', 'sms', 'in_app', 'auto')),
    
    -- Exclusion Rules
    exclude_if_resolved_by VARCHAR(255), -- Exclude if resolved by specific user/role
    exclude_if_reopened BOOLEAN DEFAULT TRUE, -- Exclude if ticket was reopened
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0, -- Rule priority (higher = evaluated first)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Survey Reminders
CREATE TABLE IF NOT EXISTS cs_survey_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL, -- References cs_survey_csat or cs_survey_nps
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN ('csat', 'nps')),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Reminder Details
    reminder_number INT DEFAULT 1, -- 1st reminder, 2nd reminder, etc.
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    channel VARCHAR(50) CHECK (channel IN ('email', 'sms', 'in_app')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_templates_type ON cs_survey_templates(survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_templates_tenant ON cs_survey_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_templates_default ON cs_survey_templates(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON cs_survey_responses(survey_id, survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant ON cs_survey_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_ticket ON cs_survey_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_customer ON cs_survey_responses(customer_email);
CREATE INDEX IF NOT EXISTS idx_survey_responses_responded ON cs_survey_responses(responded_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_automation_rules_tenant ON cs_survey_automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_automation_rules_active ON cs_survey_automation_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_survey_automation_rules_priority ON cs_survey_automation_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_survey_reminders_survey ON cs_survey_reminders(survey_id, survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_reminders_tenant ON cs_survey_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_reminders_scheduled ON cs_survey_reminders(scheduled_at) WHERE status = 'pending';

-- Triggers for updated_at
CREATE TRIGGER update_survey_templates_updated_at
    BEFORE UPDATE ON cs_survey_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_automation_rules_updated_at
    BEFORE UPDATE ON cs_survey_automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_reminders_updated_at
    BEFORE UPDATE ON cs_survey_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-send survey when ticket is resolved
CREATE OR REPLACE FUNCTION trigger_auto_survey_on_resolution()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_customer_email VARCHAR(255);
    v_resolved_at TIMESTAMPTZ;
BEGIN
    -- Only trigger on status change to resolved/closed
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        v_tenant_id := NEW.tenant_id;
        v_customer_email := NEW.customer_email;
        v_resolved_at := COALESCE(NEW.resolved_at, NOW());
        
        -- Queue survey for sending (will be processed by background job)
        -- Store in metadata for processing
        PERFORM pg_notify('survey_queue', json_build_object(
            'ticket_id', NEW.ticket_id,
            'tenant_id', v_tenant_id,
            'customer_email', v_customer_email,
            'resolved_at', v_resolved_at
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_survey_on_ticket_resolution ON cs_tickets;
CREATE TRIGGER trigger_auto_survey_on_ticket_resolution
    AFTER UPDATE OF status ON cs_tickets
    FOR EACH ROW
    WHEN (NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed'))
    EXECUTE FUNCTION trigger_auto_survey_on_resolution();

-- RLS Policies
ALTER TABLE cs_survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_survey_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_survey_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view survey templates for their tenant
CREATE POLICY "team_members_view_own_tenant_survey_templates" ON cs_survey_templates
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view survey responses for their tenant
CREATE POLICY "team_members_view_own_tenant_survey_responses" ON cs_survey_responses
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view automation rules for their tenant
CREATE POLICY "team_members_view_own_tenant_survey_rules" ON cs_survey_automation_rules
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Policy: Team members can view reminders for their tenant
CREATE POLICY "team_members_view_own_tenant_survey_reminders" ON cs_survey_reminders
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_survey_templates IS 'Survey templates for CSAT and NPS surveys';
COMMENT ON TABLE cs_survey_responses IS 'Survey responses with feedback and follow-up tracking';
COMMENT ON TABLE cs_survey_automation_rules IS 'Rules for automatically sending surveys after ticket resolution';
COMMENT ON TABLE cs_survey_reminders IS 'Survey reminder tracking and scheduling';
