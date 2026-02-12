-- ============================================================================
-- LAW FIRM ONBOARDING FLOW - PHASES 1-4, STEPS 1-5
-- ============================================================================
-- Specific onboarding flow for law firms: self-serve setup → internal config → go-live → success call

-- Enhance onboarding progress table with law firm specific fields
DO $$ 
BEGIN
    -- Add onboarding phase tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_onboarding_progress' 
        AND column_name = 'onboarding_phase'
    ) THEN
        ALTER TABLE cs_customer_onboarding_progress 
        ADD COLUMN onboarding_phase VARCHAR(50) CHECK (onboarding_phase IN (
            'phase_1_self_serve', 'phase_2_internal_config', 'phase_3_go_live', 'phase_4_success_call', 'completed'
        )),
        ADD COLUMN internal_status VARCHAR(50) CHECK (internal_status IN (
            'not_started', 'configuring', 'ready_for_success_call', 'success_call_scheduled', 'success_call_completed', 'onboarding_complete'
        )),
        ADD COLUMN onboarding_completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (onboarding_completion_percentage >= 0 AND onboarding_completion_percentage <= 100);
    END IF;
END $$;

-- Law Firm Onboarding Metadata (Phase 1, Step 1)
CREATE TABLE IF NOT EXISTS cs_onboarding_firm_profile (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Firm Information
    firm_name VARCHAR(255) NOT NULL,
    practice_areas JSONB DEFAULT '[]'::jsonb, -- Array of practice areas
    state VARCHAR(50),
    timezone VARCHAR(100),
    
    -- Team Members
    attorneys JSONB DEFAULT '[]'::jsonb, -- Array of attorney objects
    staff JSONB DEFAULT '[]'::jsonb, -- Array of staff objects
    
    -- Attorney/Staff Structure:
    -- {
    --   "name": "John Doe",
    --   "role": "attorney" | "staff",
    --   "email": "john@firm.com",
    --   "specialization": "Immigration – Asylum",
    --   "calendar_type": "google" | "outlook" | "other"
    -- }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(onboarding_progress_id)
);

-- Law Firm Phone Configuration (Phase 1, Step 2)
CREATE TABLE IF NOT EXISTS cs_onboarding_phone_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Phone Setup Options
    setup_method VARCHAR(50) CHECK (setup_method IN ('new_twilio_number', 'forward_existing_line')),
    twilio_number_english VARCHAR(20), -- Assigned Twilio number for English
    twilio_number_spanish VARCHAR(20), -- Assigned Twilio number for Spanish (if applicable)
    existing_phone_number VARCHAR(20), -- If forwarding existing line
    forwarding_enabled BOOLEAN DEFAULT FALSE,
    carrier_detected VARCHAR(100), -- Detected carrier for video guide
    
    -- Configuration Status
    english_number_configured BOOLEAN DEFAULT FALSE,
    spanish_number_configured BOOLEAN DEFAULT FALSE,
    forwarding_configured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(onboarding_progress_id)
);

-- Law Firm Calendar & Email Integrations (Phase 1, Step 3)
CREATE TABLE IF NOT EXISTS cs_onboarding_calendar_integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    team_member_email VARCHAR(255) NOT NULL,
    
    -- Calendar Integration
    calendar_type VARCHAR(50) CHECK (calendar_type IN ('google', 'outlook', 'other')),
    calendar_oauth_token_encrypted TEXT, -- Encrypted OAuth token
    calendar_connected BOOLEAN DEFAULT FALSE,
    calendar_connected_at TIMESTAMPTZ,
    
    -- Email Integration (if separate from calendar)
    email_integrated BOOLEAN DEFAULT FALSE,
    email_integrated_at TIMESTAMPTZ,
    
    -- Master Calendar
    is_master_calendar BOOLEAN DEFAULT FALSE,
    master_calendar_configured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one integration per team member per onboarding
    UNIQUE(onboarding_progress_id, team_member_email)
);

-- Law Firm Compliance Settings (Phase 1, Step 4)
CREATE TABLE IF NOT EXISTS cs_onboarding_compliance_settings (
    settings_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Zero-Knowledge Default
    zero_knowledge_enabled BOOLEAN DEFAULT TRUE, -- Default: no recordings, no transcripts
    
    -- Transcript Opt-In (Optional)
    transcript_opt_in BOOLEAN DEFAULT FALSE,
    transcript_opt_in_consent_date TIMESTAMPTZ, -- When consent was given
    transcript_retention_days INT DEFAULT 7, -- If opted in, retention period
    
    -- Compliance Metadata
    consent_checkbox_checked BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    
    -- Important: We NEVER store actual transcripts here
    -- This is only the preference flag
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(onboarding_progress_id)
);

-- Law Firm Onboarding Step Completion Tracking
CREATE TABLE IF NOT EXISTS cs_onboarding_step_completions (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Step Information
    phase VARCHAR(50) NOT NULL,
    step_number INT NOT NULL CHECK (step_number >= 1 AND step_number <= 5),
    step_name VARCHAR(255) NOT NULL,
    
    -- Completion Details
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_method VARCHAR(50) CHECK (completion_method IN ('self_serve', 'manual', 'api')),
    completion_data JSONB DEFAULT '{}'::jsonb, -- Step-specific data
    
    -- Progress Tracking
    progress_percentage_before DECIMAL(5,2),
    progress_percentage_after DECIMAL(5,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_firm_profile_tenant ON cs_onboarding_firm_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_phone_config_tenant ON cs_onboarding_phone_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_calendar_integrations_tenant ON cs_onboarding_calendar_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_calendar_integrations_member ON cs_onboarding_calendar_integrations(team_member_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_compliance_tenant ON cs_onboarding_compliance_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_completions_tenant ON cs_onboarding_step_completions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_completions_progress ON cs_onboarding_step_completions(onboarding_progress_id);

-- Triggers for updated_at
CREATE TRIGGER update_onboarding_firm_profile_updated_at
    BEFORE UPDATE ON cs_onboarding_firm_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_phone_config_updated_at
    BEFORE UPDATE ON cs_onboarding_phone_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_calendar_integrations_updated_at
    BEFORE UPDATE ON cs_onboarding_calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_compliance_settings_updated_at
    BEFORE UPDATE ON cs_onboarding_compliance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_onboarding_firm_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_phone_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_onboarding_step_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view onboarding data for their tenant
CREATE POLICY "team_members_view_own_tenant_onboarding_firm_profile" ON cs_onboarding_firm_profile
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_onboarding_phone_config" ON cs_onboarding_phone_config
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_onboarding_calendar" ON cs_onboarding_calendar_integrations
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_onboarding_compliance" ON cs_onboarding_compliance_settings
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

CREATE POLICY "team_members_view_own_tenant_onboarding_steps" ON cs_onboarding_step_completions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_onboarding_firm_profile IS 'Phase 1, Step 1: Firm and team profile data';
COMMENT ON TABLE cs_onboarding_phone_config IS 'Phase 1, Step 2: Phone number setup configuration';
COMMENT ON TABLE cs_onboarding_calendar_integrations IS 'Phase 1, Step 3: Calendar and email OAuth integrations';
COMMENT ON TABLE cs_onboarding_compliance_settings IS 'Phase 1, Step 4: Compliance and data settings (zero-knowledge, transcript opt-in)';
COMMENT ON TABLE cs_onboarding_step_completions IS 'Track completion of each onboarding step with progress percentages';
