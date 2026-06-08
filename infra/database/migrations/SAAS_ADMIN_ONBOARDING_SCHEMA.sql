-- ============================================================================
-- SAAS ADMIN - ONBOARDING DATABASE SCHEMA
-- ============================================================================
-- Date: January 24, 2026
-- Purpose: 
--   - Complete onboarding database schema for SaaS Admin service
--   - Client Onboarding Manager works here (no LLM intrusion)
--   - Handles all onboarding workflows: customer profile, phone config, 
--     calendar/email setup, user management, training, etc.
--   - After go-live acceptance, customer is transferred to CS-Support
-- ============================================================================
-- 
-- NOTE: This schema should be applied to SaaS Admin database
-- All onboarding tables are removed from CS-Support database (see migration 032)
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================
-- Drop function if exists (idempotent)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE ONBOARDING TABLES
-- ============================================================================

-- CS Customer Onboarding Progress (Main tracking table)
CREATE TABLE IF NOT EXISTS cs_customer_onboarding_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Onboarding Stage Tracking
    onboarding_stage VARCHAR(50) NOT NULL CHECK (onboarding_stage IN (
        'not_started', 'account_setup', 'initial_config', 'first_use', 'training', 'go_live', 'completed'
    )),
    current_step VARCHAR(100),
    steps_completed JSONB DEFAULT '[]'::jsonb, -- Array of completed step IDs
    steps_total INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Law Firm Onboarding Phases (Phases 1-4)
    onboarding_phase VARCHAR(50) CHECK (onboarding_phase IN (
        'phase_1_self_serve', 'phase_2_internal_config', 'phase_3_go_live', 'phase_4_success_call', 'completed'
    )),
    internal_status VARCHAR(50) CHECK (internal_status IN (
        'not_started', 'configuring', 'ready_for_success_call', 'success_call_scheduled', 'success_call_completed', 'onboarding_complete'
    )),
    onboarding_completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (onboarding_completion_percentage >= 0 AND onboarding_completion_percentage <= 100),
    
    -- Sequence Tracking
    sequence_id UUID, -- References cs_onboarding_sequences
    template_key VARCHAR(100), -- Template identifier
    current_milestone VARCHAR(100),
    current_milestone_key VARCHAR(100),
    current_milestone_name VARCHAR(255),
    milestones_completed JSONB DEFAULT '[]'::jsonb,
    milestones_pending JSONB DEFAULT '[]'::jsonb,
    next_milestone_due_at TIMESTAMPTZ,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    go_live_date TIMESTAMPTZ, -- When customer accepted go-live
    
    -- Assignment
    assigned_client_onboarding_manager_id UUID, -- Client Onboarding Manager assigned
    assigned_csm_id UUID, -- Client Success Manager (after transfer)
    
    -- Transfer Information
    transferred_to_cs_support_at TIMESTAMPTZ, -- When transferred to CS-Support
    transfer_status VARCHAR(50) CHECK (transfer_status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, customer_email)
);

-- CS Onboarding Sequences (Templates)
CREATE TABLE IF NOT EXISTS cs_onboarding_sequences (
    sequence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_key VARCHAR(100) UNIQUE, -- Unique identifier (e.g., 'law_firm_pre_onboarding')
    tenant_id UUID, -- NULL for default sequences, UUID for tenant-specific
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Sequence structure
    stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of stage objects
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of milestone objects
    communication_flows JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of communication triggers
    jtbd TEXT, -- Jobs To Be Done description
    
    -- Metadata
    estimated_duration_days INT,
    created_by UUID, -- Team member who created this sequence
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Onboarding Milestones
CREATE TABLE IF NOT EXISTS cs_onboarding_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES cs_onboarding_sequences(sequence_id) ON DELETE CASCADE,
    milestone_key VARCHAR(100) NOT NULL, -- Unique key within sequence
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    stage VARCHAR(50) NOT NULL,
    
    -- Milestone requirements
    required_actions JSONB DEFAULT '[]'::jsonb,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    
    -- Communication triggers
    trigger_email BOOLEAN DEFAULT FALSE,
    trigger_sms BOOLEAN DEFAULT FALSE,
    trigger_call BOOLEAN DEFAULT FALSE,
    email_template_id UUID,
    sms_template_id UUID,
    call_script_id UUID,
    
    -- Timing
    days_after_previous INT DEFAULT 0,
    due_days_after_start INT,
    
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
    template_key VARCHAR(100), -- Reference to communication template
    
    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('email', 'sms', 'call', 'in_app')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed', 'completed')),
    
    -- Content
    subject VARCHAR(500),
    body TEXT,
    template_id UUID,
    
    -- Channel-specific
    email_message_id VARCHAR(255),
    sms_message_id VARCHAR(255),
    call_sid VARCHAR(255),
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
    milestone_key VARCHAR(100) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    
    -- Completion details
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_method VARCHAR(50) CHECK (completion_method IN ('automatic', 'manual', 'api', 'webhook')),
    completed_by UUID, -- Team member if manually completed
    completion_data JSONB DEFAULT '{}'::jsonb,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LAW FIRM ONBOARDING TABLES (Phase 1, Steps 1-5)
-- ============================================================================

-- Law Firm Onboarding Metadata (Phase 1, Step 1)
CREATE TABLE IF NOT EXISTS cs_onboarding_firm_profile (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Firm Information
    firm_name VARCHAR(255) NOT NULL,
    practice_areas JSONB DEFAULT '[]'::jsonb,
    state VARCHAR(50),
    timezone VARCHAR(100),
    
    -- Team Members
    attorneys JSONB DEFAULT '[]'::jsonb, -- Array of attorney objects
    staff JSONB DEFAULT '[]'::jsonb, -- Array of staff objects
    
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
    twilio_number_english VARCHAR(20),
    twilio_number_spanish VARCHAR(20),
    existing_phone_number VARCHAR(20),
    forwarding_enabled BOOLEAN DEFAULT FALSE,
    carrier_detected VARCHAR(100),
    
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
    calendar_oauth_token_encrypted TEXT,
    calendar_connected BOOLEAN DEFAULT FALSE,
    calendar_connected_at TIMESTAMPTZ,
    
    -- Email Integration
    email_integrated BOOLEAN DEFAULT FALSE,
    email_integrated_at TIMESTAMPTZ,
    
    -- Master Calendar
    is_master_calendar BOOLEAN DEFAULT FALSE,
    master_calendar_configured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(onboarding_progress_id, team_member_email)
);

-- Law Firm Compliance Settings (Phase 1, Step 4)
CREATE TABLE IF NOT EXISTS cs_onboarding_compliance_settings (
    settings_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_progress_id UUID NOT NULL REFERENCES cs_customer_onboarding_progress(progress_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Zero-Knowledge Default
    zero_knowledge_enabled BOOLEAN DEFAULT TRUE,
    
    -- Transcript Opt-In (Optional)
    transcript_opt_in BOOLEAN DEFAULT FALSE,
    transcript_opt_in_consent_date TIMESTAMPTZ,
    transcript_retention_days INT DEFAULT 7,
    
    -- Compliance Metadata
    consent_checkbox_checked BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    
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
    completion_data JSONB DEFAULT '{}'::jsonb,
    
    -- Progress Tracking
    progress_percentage_before DECIMAL(5,2),
    progress_percentage_after DECIMAL(5,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Onboarding Progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_tenant ON cs_customer_onboarding_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_email ON cs_customer_onboarding_progress(customer_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_stage ON cs_customer_onboarding_progress(onboarding_stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_phase ON cs_customer_onboarding_progress(onboarding_phase);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON cs_customer_onboarding_progress(internal_status);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_manager ON cs_customer_onboarding_progress(assigned_client_onboarding_manager_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_transfer ON cs_customer_onboarding_progress(transfer_status);

-- Onboarding Sequences
CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_tenant ON cs_onboarding_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_template ON cs_onboarding_sequences(template_key);
CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_default ON cs_onboarding_sequences(is_default) WHERE is_default = TRUE;

-- Onboarding Milestones
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_sequence ON cs_onboarding_milestones(sequence_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_stage ON cs_onboarding_milestones(stage);

-- Onboarding Communications
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_progress ON cs_onboarding_communications(onboarding_progress_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_milestone ON cs_onboarding_communications(milestone_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_customer ON cs_onboarding_communications(tenant_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_communications_scheduled ON cs_onboarding_communications(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Onboarding Milestone Completions
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_progress ON cs_onboarding_milestone_completions(onboarding_progress_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_milestone ON cs_onboarding_milestone_completions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completions_customer ON cs_onboarding_milestone_completions(tenant_id, customer_email);

-- Law Firm Onboarding Tables
CREATE INDEX IF NOT EXISTS idx_onboarding_firm_profile_tenant ON cs_onboarding_firm_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_phone_config_tenant ON cs_onboarding_phone_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_calendar_integrations_tenant ON cs_onboarding_calendar_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_calendar_integrations_member ON cs_onboarding_calendar_integrations(team_member_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_compliance_tenant ON cs_onboarding_compliance_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_completions_tenant ON cs_onboarding_step_completions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_completions_progress ON cs_onboarding_step_completions(onboarding_progress_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamps
-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON cs_customer_onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON cs_customer_onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS update_onboarding_firm_profile_updated_at ON cs_onboarding_firm_profile;
CREATE TRIGGER update_onboarding_firm_profile_updated_at
    BEFORE UPDATE ON cs_onboarding_firm_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_phone_config_updated_at ON cs_onboarding_phone_config;
CREATE TRIGGER update_onboarding_phone_config_updated_at
    BEFORE UPDATE ON cs_onboarding_phone_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_calendar_integrations_updated_at ON cs_onboarding_calendar_integrations;
CREATE TRIGGER update_onboarding_calendar_integrations_updated_at
    BEFORE UPDATE ON cs_onboarding_calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_compliance_settings_updated_at ON cs_onboarding_compliance_settings;
CREATE TRIGGER update_onboarding_compliance_settings_updated_at
    BEFORE UPDATE ON cs_onboarding_compliance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cs_customer_onboarding_progress IS 'Main onboarding progress tracking - all onboarding happens in SaaS Admin';
COMMENT ON TABLE cs_onboarding_sequences IS 'Onboarding sequence templates with stages, milestones, and communication flows';
COMMENT ON TABLE cs_onboarding_milestones IS 'Individual milestones within onboarding sequences';
COMMENT ON TABLE cs_onboarding_communications IS 'All communications sent/received during onboarding';
COMMENT ON TABLE cs_onboarding_milestone_completions IS 'Track milestone completions for analytics';
COMMENT ON TABLE cs_onboarding_firm_profile IS 'Phase 1, Step 1: Firm and team profile data';
COMMENT ON TABLE cs_onboarding_phone_config IS 'Phase 1, Step 2: Phone number setup configuration';
COMMENT ON TABLE cs_onboarding_calendar_integrations IS 'Phase 1, Step 3: Calendar and email OAuth integrations';
COMMENT ON TABLE cs_onboarding_compliance_settings IS 'Phase 1, Step 4: Compliance and data settings (zero-knowledge, transcript opt-in)';
COMMENT ON TABLE cs_onboarding_step_completions IS 'Track completion of each onboarding step with progress percentages';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All onboarding tables are in SaaS Admin database (no LLM intrusion)
-- 2. Client Onboarding Manager works entirely in SaaS Admin
-- 3. After go-live acceptance, customer is transferred to CS-Support
-- 4. CS-Support only has minimal post-onboarding tracking table
-- 5. RLS policies should be added based on SaaS Admin's auth system
-- ============================================================================
