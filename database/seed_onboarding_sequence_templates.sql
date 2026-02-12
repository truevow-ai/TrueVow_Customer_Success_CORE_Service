-- ============================================================================
-- SEED SAAS ADMIN ONBOARDING SEQUENCE TEMPLATES
-- ============================================================================
-- Date: January 24, 2026
-- Purpose: 
--   - Seed onboarding sequence templates for SaaS Admin service
--   - These templates support the law firm customer onboarding journey
--   - Client Onboarding Manager uses these templates in SaaS Admin
-- ============================================================================
-- 
-- NOTE: This seed file should be applied to SaaS Admin database
-- Onboarding sequences are no longer in CS-Support database
-- ============================================================================

-- Insert SaaS Admin onboarding sequence templates
-- Note: These are template shells - actual stages, milestones, and communication flows
-- will be designed and added in a future phase

INSERT INTO cs_onboarding_sequences (
    template_key,
    name,
    description,
    jtbd,
    tenant_id,
    is_default,
    is_active,
    stages,
    milestones,
    communication_flows,
    estimated_duration_days,
    created_at
) VALUES
(
    'law_firm_pre_onboarding',
    'Law Firm Pre-Onboarding Preparation',
    'Client Onboarding Manager sends automated email about preparing groundwork and checklist items before onboarding call.',
    'Help me prepare everything needed for a successful onboarding call.',
    NULL, -- Default template available to all tenants
    TRUE,
    TRUE,
    '[]'::jsonb, -- Stages to be designed
    '[]'::jsonb, -- Milestones to be designed
    '[]'::jsonb, -- Communication flows to be designed
    3, -- Estimated 3 days to prepare
    NOW()
),
(
    'law_firm_onboarding_call',
    'Law Firm Onboarding Call',
    'Client Onboarding Manager helps fill in profile information during white-glove onboarding call, then account configuration.',
    'Help me complete my profile setup with expert guidance.',
    NULL, -- Default template available to all tenants
    TRUE,
    TRUE,
    '[]'::jsonb, -- Stages to be designed
    '[]'::jsonb, -- Milestones to be designed
    '[]'::jsonb, -- Communication flows to be designed
    1, -- Onboarding call + configuration
    NOW()
),
(
    'law_firm_post_onboarding_90_days',
    'Law Firm Post-Onboarding Support (First 90 Days)',
    'First-line AI agent + Client Success Manager team support for first 90 days of using INTAKE service (handled in CS-Support after transfer).',
    'Help me successfully use INTAKE and resolve any issues I face.',
    NULL, -- Default template available to all tenants
    TRUE,
    TRUE,
    '[]'::jsonb, -- Stages to be designed
    '[]'::jsonb, -- Milestones to be designed
    '[]'::jsonb, -- Communication flows to be designed
    90, -- First 90 days of support
    NOW()
)
ON CONFLICT (template_key) 
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    jtbd = EXCLUDED.jtbd,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add comments
COMMENT ON TABLE cs_onboarding_sequences IS 'SaaS Admin onboarding sequence templates. These support law firm customers during onboarding. Client Onboarding Manager uses these templates in SaaS Admin service.';
