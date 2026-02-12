-- ============================================================================
-- ADD TEMPLATE_KEY AND JTBD TO ONBOARDING SEQUENCES
-- ============================================================================
-- Adds template_key (unique identifier) and jtbd (Jobs To Be Done) fields
-- to support template-based onboarding sequences

-- Add template_key column (unique identifier for templates)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_onboarding_sequences' 
        AND column_name = 'template_key'
    ) THEN
        ALTER TABLE cs_onboarding_sequences 
        ADD COLUMN template_key VARCHAR(100) UNIQUE;
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_onboarding_sequences_template_key 
        ON cs_onboarding_sequences(template_key) 
        WHERE template_key IS NOT NULL;
    END IF;
END $$;

-- Add jtbd column (Jobs To Be Done - customer goal description)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_onboarding_sequences' 
        AND column_name = 'jtbd'
    ) THEN
        ALTER TABLE cs_onboarding_sequences 
        ADD COLUMN jtbd TEXT;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN cs_onboarding_sequences.template_key IS 'Unique identifier for the onboarding sequence template (e.g., law_firm_pre_onboarding, law_firm_onboarding_call)';
COMMENT ON COLUMN cs_onboarding_sequences.jtbd IS 'Jobs To Be Done - Description of the customer goal this sequence addresses';
