-- Minimal idempotent bootstrap so seed_onboarding_sequence_templates.sql can run.
-- Creates cs_onboarding_sequences with columns expected by the seed (template_key, jtbd, etc.).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cs_onboarding_sequences (
    sequence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    communication_flows JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_duration_days INT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cs_onboarding_sequences' AND column_name = 'template_key') THEN
        ALTER TABLE cs_onboarding_sequences ADD COLUMN template_key VARCHAR(100) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cs_onboarding_sequences' AND column_name = 'jtbd') THEN
        ALTER TABLE cs_onboarding_sequences ADD COLUMN jtbd TEXT;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cs_onboarding_sequences_template_key ON cs_onboarding_sequences(template_key) WHERE template_key IS NOT NULL;
