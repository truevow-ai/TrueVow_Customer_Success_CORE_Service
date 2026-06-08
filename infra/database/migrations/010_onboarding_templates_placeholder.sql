-- ============================================================================
-- ONBOARDING TEMPLATES PLACEHOLDER
-- ============================================================================
-- This migration creates placeholder templates that can be customized later
-- Actual content will be designed and added in a future phase

-- Email Templates Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS cs_email_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names
    milestone_key VARCHAR(100), -- Associated milestone
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS Templates Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS cs_sms_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL, -- Max 1600 characters
    variables JSONB DEFAULT '[]'::jsonb,
    milestone_key VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call Scripts Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS cs_call_scripts (
    script_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    script_text TEXT NOT NULL,
    talking_points JSONB DEFAULT '[]'::jsonb, -- Array of talking points
    milestone_key VARCHAR(100),
    estimated_duration_minutes INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_milestone ON cs_email_templates(milestone_key);
CREATE INDEX IF NOT EXISTS idx_sms_templates_milestone ON cs_sms_templates(milestone_key);
CREATE INDEX IF NOT EXISTS idx_call_scripts_milestone ON cs_call_scripts(milestone_key);

-- Placeholder Templates (to be customized later)
-- These are basic templates that can be enhanced with actual content

INSERT INTO cs_email_templates (name, subject, body_html, body_text, milestone_key) VALUES
(
    'Welcome Email - Account Created',
    'Welcome to TrueVow! Let''s get you started',
    '<h1>Welcome to TrueVow!</h1><p>Hi {{customer_name}},</p><p>Your account has been created. Next steps: {{next_steps}}</p>',
    'Welcome to TrueVow! Hi {{customer_name}}, Your account has been created. Next steps: {{next_steps}}',
    'account_created'
),
(
    'Tenant Setup Guide',
    'Complete your TrueVow setup',
    '<h1>Complete Your Setup</h1><p>Hi {{customer_name}},</p><p>Let''s finish setting up your TrueVow account: {{setup_link}}</p>',
    'Complete Your Setup. Hi {{customer_name}}, Let''s finish setting up your TrueVow account: {{setup_link}}',
    'tenant_configured'
),
(
    'Intake Configuration Guide',
    'Set up your intake system',
    '<h1>Configure Your Intake</h1><p>Hi {{customer_name}},</p><p>Let''s set up your intake forms and workflows: {{intake_setup_link}}</p>',
    'Configure Your Intake. Hi {{customer_name}}, Let''s set up your intake forms and workflows: {{intake_setup_link}}',
    'intake_configured'
),
(
    'Phone Integration Guide',
    'Set up phone integration',
    '<h1>Phone Integration Setup</h1><p>Hi {{customer_name}},</p><p>Let''s connect your phone system: {{phone_setup_link}}</p>',
    'Phone Integration Setup. Hi {{customer_name}}, Let''s connect your phone system: {{phone_setup_link}}',
    'phone_integration_setup'
),
(
    'SMS Integration Guide',
    'Set up SMS integration',
    '<h1>SMS Integration Setup</h1><p>Hi {{customer_name}},</p><p>Let''s connect your SMS system: {{sms_setup_link}}</p>',
    'SMS Integration Setup. Hi {{customer_name}}, Let''s connect your SMS system: {{sms_setup_link}}',
    'sms_integration_setup'
),
(
    'Calendar Integration Guide',
    'Connect your calendar to TrueVow',
    '<h1>Calendar Integration Setup</h1><p>Hi {{customer_name}},</p><p>Let''s connect your calendar (Google Calendar, Outlook, etc.): {{calendar_setup_link}}</p>',
    'Calendar Integration Setup. Hi {{customer_name}}, Let''s connect your calendar: {{calendar_setup_link}}',
    'calendar_integration_setup'
),
(
    'Calendar Synced Confirmation',
    'Your calendar is now connected!',
    '<h1>Calendar Connected!</h1><p>Hi {{customer_name}},</p><p>Great! Your calendar is now synced with TrueVow. You can add more calendars if needed: {{calendar_setup_link}}</p>',
    'Calendar Connected! Hi {{customer_name}}, Your calendar is now synced. Add more calendars: {{calendar_setup_link}}',
    'calendar_synced'
),
(
    'Multiple Calendars Guide',
    'Add additional calendars',
    '<h1>Add More Calendars</h1><p>Hi {{customer_name}},</p><p>You can connect multiple calendars (personal, work, team calendars). Add more: {{calendar_setup_link}}</p>',
    'Add More Calendars. Hi {{customer_name}}, Connect multiple calendars: {{calendar_setup_link}}',
    'multiple_calendars_added'
),
(
    'Master Calendar Setup Guide',
    'Configure your firm''s master calendar',
    '<h1>Master Calendar Setup</h1><p>Hi {{customer_name}},</p><p>Let''s set up your internal master calendar for firm-wide events, court dates, and team coordination: {{master_calendar_setup_link}}</p>',
    'Master Calendar Setup. Hi {{customer_name}}, Set up your firm''s master calendar: {{master_calendar_setup_link}}',
    'master_calendar_configured'
)
ON CONFLICT DO NOTHING;

INSERT INTO cs_sms_templates (name, message, milestone_key) VALUES
(
    'Welcome SMS',
    'Hi {{customer_name}}, welcome to TrueVow! Complete your setup: {{setup_link}}',
    'account_created'
),
(
    'Setup Reminder SMS',
    'Hi {{customer_name}}, don''t forget to complete your TrueVow setup! {{setup_link}}',
    'tenant_configured'
),
(
    'Integration Reminder SMS',
    'Hi {{customer_name}}, ready to set up your phone/SMS integration? {{integration_link}}',
    'phone_integration_setup'
),
(
    'Calendar Setup Reminder SMS',
    'Hi {{customer_name}}, connect your calendar to TrueVow for seamless scheduling: {{calendar_setup_link}}',
    'calendar_integration_setup'
),
(
    'Calendar Synced SMS',
    'Hi {{customer_name}}, your calendar is connected! Add more calendars if needed: {{calendar_setup_link}}',
    'calendar_synced'
),
(
    'Master Calendar Setup SMS',
    'Hi {{customer_name}}, set up your firm''s master calendar for team coordination: {{master_calendar_setup_link}}',
    'master_calendar_configured'
)
ON CONFLICT DO NOTHING;

INSERT INTO cs_call_scripts (name, script_text, talking_points, milestone_key, estimated_duration_minutes) VALUES
(
    'Welcome Call - Account Setup',
    'Welcome to TrueVow! Let''s walk through your account setup. First, let''s verify your profile...',
    ARRAY[
        'Welcome and introduction',
        'Verify account information',
        'Walk through initial setup',
        'Answer questions',
        'Schedule next steps'
    ],
    'account_created',
    15
),
(
    'Integration Setup Call',
    'Let''s set up your phone and SMS integration. First, we''ll need your phone number...',
    ARRAY[
        'Explain integration benefits',
        'Collect phone number',
        'Walk through setup process',
        'Test integration',
        'Answer questions'
    ],
    'phone_integration_setup',
    20
),
(
    'Calendar Integration Call',
    'Let''s connect your calendar to TrueVow. Which calendar do you use? Google Calendar, Outlook, or another?',
    ARRAY[
        'Explain calendar integration benefits',
        'Identify calendar type (Google, Outlook, etc.)',
        'Walk through OAuth connection',
        'Test calendar sync',
        'Explain multiple calendar support',
        'Answer questions'
    ],
    'calendar_integration_setup',
    15
),
(
    'Master Calendar Setup Call',
    'Let''s configure your firm''s master calendar. This is important for coordinating firm-wide events, court dates, and team schedules.',
    ARRAY[
        'Explain master calendar benefits',
        'Discuss firm-wide event coordination',
        'Set up master calendar permissions',
        'Configure calendar sharing rules',
        'Test master calendar sync',
        'Explain integration with individual calendars',
        'Answer questions'
    ],
    'master_calendar_configured',
    20
)
ON CONFLICT DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON cs_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at
    BEFORE UPDATE ON cs_sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_scripts_updated_at
    BEFORE UPDATE ON cs_call_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_call_scripts ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view templates for their tenant (or global templates)
CREATE POLICY "team_members_view_email_templates" ON cs_email_templates
    FOR SELECT
    USING (TRUE); -- All templates are viewable (can be restricted later)

CREATE POLICY "team_members_view_sms_templates" ON cs_sms_templates
    FOR SELECT
    USING (TRUE);

CREATE POLICY "team_members_view_call_scripts" ON cs_call_scripts
    FOR SELECT
    USING (TRUE);

COMMENT ON TABLE cs_email_templates IS 'Email templates for onboarding communications (to be customized with actual content)';
COMMENT ON TABLE cs_sms_templates IS 'SMS templates for onboarding communications (to be customized with actual content)';
COMMENT ON TABLE cs_call_scripts IS 'Call scripts for onboarding communications (to be customized with actual content)';
