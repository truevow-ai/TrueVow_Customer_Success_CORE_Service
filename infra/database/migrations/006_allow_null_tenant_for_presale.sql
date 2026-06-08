-- CS-Support Service - Allow NULL tenant_id for Pre-Sale Tickets
-- Version: 1.0
-- Created: 2026-01-10
-- Description: Allow tenant_id to be NULL for pre-sale tickets (leads don't have tenants yet)

-- ============================================================================
-- UPDATE CS_TICKETS SCHEMA
-- ============================================================================

-- Remove NOT NULL constraint from tenant_id
-- Add CHECK constraint to allow NULL only for pre-sale tickets
DO $$
BEGIN
    -- First, make tenant_id nullable
    ALTER TABLE cs_tickets 
    ALTER COLUMN tenant_id DROP NOT NULL;
    
    RAISE NOTICE 'Made tenant_id nullable in cs_tickets';
    
    -- Add CHECK constraint: tenant_id must be NOT NULL unless stage is 'pre-sale'
    -- Note: We can't add a CHECK constraint that references another column directly in this way
    -- Instead, we'll handle this in application code, or use a trigger
    
    RAISE NOTICE 'tenant_id can now be NULL for pre-sale tickets';
END $$;

-- Create a function to validate tenant_id based on stage
CREATE OR REPLACE FUNCTION validate_ticket_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If stage is 'pre-sale', tenant_id can be NULL
    IF NEW.stage = 'pre-sale' THEN
        -- Allow NULL tenant_id for pre-sale tickets
        RETURN NEW;
    END IF;
    
    -- For all other stages, tenant_id must be NOT NULL
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id cannot be NULL for non-pre-sale tickets. Stage: %', NEW.stage;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the validation
DROP TRIGGER IF EXISTS trigger_validate_ticket_tenant_id ON cs_tickets;
CREATE TRIGGER trigger_validate_ticket_tenant_id
  BEFORE INSERT OR UPDATE ON cs_tickets
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_tenant_id();

-- ============================================================================
-- UPDATE SEED DATA
-- ============================================================================

-- Update the pre-sale ticket in seed.sql to use NULL instead of placeholder
-- (This is just a note - actual seed.sql will be updated separately)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Made tenant_id nullable in cs_tickets
-- - Created validation function to ensure tenant_id is NULL only for pre-sale tickets
-- - Created trigger to enforce validation
-- - Pre-sale tickets can now have NULL tenant_id (proper business logic)
-- - All other tickets must have a tenant_id
