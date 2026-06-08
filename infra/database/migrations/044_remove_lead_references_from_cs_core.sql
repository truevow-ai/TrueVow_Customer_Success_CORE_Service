-- ============================================================================
-- Migration: Remove Lead Data References from CS Core
-- ============================================================================
-- Migration Number: 044
-- Date: 2026-03-08
--
-- REASON: ARCHITECTURAL BOUNDARY ENFORCEMENT
--
-- Lead data resides exclusively in SaaS Admin.
-- CS Core must NEVER own, store, or reference lead data.
--
-- Three-Layer Intelligence Stack rule:
--   Layer 1 (Tenant App): Intake intelligence — owns lead data, intake signals
--   Layer 2 (SaaS Admin): Behavioral intelligence — references lead_id as foreign key
--   Layer 3 (CS Core):   Operational intelligence — NO lead data, display only
--
-- Violations fixed by this migration:
--   1. employee_messages.lead_id       — dropped (CS Core must not store lead refs)
--   2. employee_messages.service_type  — constrained to 'cs_support' only
--                                        ('sales_crm' removed, that service owns its own DB)
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Drop lead_id column from employee_messages
-- CS Core has no business storing a lead_id — leads live in SaaS Admin/Tenant App
-- ============================================================================
ALTER TABLE employee_messages
  DROP COLUMN IF EXISTS lead_id;

-- ============================================================================
-- Step 2: Drop the now-invalid lead_id index (already dropped with column,
-- but guard here for idempotency)
-- ============================================================================
DROP INDEX IF EXISTS idx_employee_messages_lead_id;

-- ============================================================================
-- Step 3: Constrain service_type to cs_support only
-- CS Core should NOT be aware of sales_crm — that is a separate service boundary
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE employee_messages
    DROP CONSTRAINT IF EXISTS employee_messages_service_type_check;

  -- Re-add with cs_support only
  ALTER TABLE employee_messages
    ADD CONSTRAINT employee_messages_service_type_check
    CHECK (service_type IN ('cs_support'));
END $$;

-- ============================================================================
-- Step 4: Update table comment to reflect corrected boundary
-- ============================================================================
COMMENT ON TABLE employee_messages IS
  'CS Core messaging table for SMS and WhatsApp. '
  'CS Support service only — lead data is NOT stored here. '
  'Lead data resides exclusively in SaaS Admin. '
  'Architectural boundary: CS Core must never own or reference lead-level data.';

COMMIT;

-- ============================================================================
-- ARCHITECTURAL RULE (PERMANENT — DO NOT VIOLATE):
--
-- CS Core must NEVER:
--   - Store a leads table
--   - Store a lead_id column referencing SaaS Admin leads
--   - Compute lead quality scores
--   - Compute intake signals (injury_severity, liability_strength, etc.)
--   - Run LeadScorer logic of any kind
--
-- CS Core may:
--   - Display health scores fetched from SaaS Admin
--   - Display recommendations fetched from SaaS Admin
--   - Record recommendation outcomes via the intelligence client proxy
--   - Track CS support tickets (cs_tickets) which are post-lead customer records
-- ============================================================================
