-- ============================================================================
-- Migration: Security Contract v1 Compliance
-- Version: 1.0.0
-- Date: 2026-03-02
-- 
-- Updates database schema to comply with TrueVow Security Contract v1:
-- 1. tenant_id is TEXT format "org_xxxxx" (never UUID)
-- 2. auth_audit_log has all required fields per §9
-- 3. Permission naming follows resource:action convention
-- 
-- BREAKING CHANGE: tenant_id column type changed from UUID to TEXT
-- ============================================================================

-- ============================================================================
-- 1. UPDATE auth_audit_log TO SECURITY CONTRACT v1 §9 SPEC
-- ============================================================================

-- Add missing columns to auth_audit_log
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS endpoint VARCHAR(255);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS method VARCHAR(10);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS permission_checked VARCHAR(100);
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS response_status INTEGER;
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- Migrate existing data
UPDATE auth_audit_log 
SET 
  request_id = COALESCE(request_id, gen_random_uuid()),
  event_type = COALESCE(event_type, action),
  clerk_user_id = COALESCE(clerk_user_id, user_id),
  details = COALESCE(details, metadata)
WHERE request_id IS NULL OR event_type IS NULL OR clerk_user_id IS NULL;

-- Add NOT NULL constraints after migration
ALTER TABLE auth_audit_log ALTER COLUMN request_id SET NOT NULL;
ALTER TABLE auth_audit_log ALTER COLUMN event_type SET NOT NULL;
ALTER TABLE auth_audit_log ALTER COLUMN created_at SET NOT NULL;

-- Add check constraint for event_type
ALTER TABLE auth_audit_log DROP CONSTRAINT IF EXISTS auth_audit_log_event_type_check;
ALTER TABLE auth_audit_log ADD CONSTRAINT auth_audit_log_event_type_check 
  CHECK (event_type IN (
    'auth_success',
    'auth_failure',
    'scope_rejected',
    'permission_denied',
    'permission_service_unavailable'
  ));

-- Create index on request_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_request_id ON auth_audit_log(request_id);

-- Rename old columns for backwards compatibility during migration
ALTER TABLE auth_audit_log RENAME COLUMN user_id TO _legacy_user_id;
ALTER TABLE auth_audit_log RENAME COLUMN action TO _legacy_action;
ALTER TABLE auth_audit_log RENAME COLUMN metadata TO _legacy_metadata;

-- Add comment
COMMENT ON TABLE auth_audit_log IS 'Auth audit log per Security Contract v1 §9. Required fields: request_id, event_type, tenant_id, clerk_user_id, endpoint, method, ip_address, user_agent, permission_checked, response_status, details, created_at';

-- ============================================================================
-- 2. UPDATE tenant_id TO TEXT FORMAT (Security Contract v1 §1.1)
-- ============================================================================

-- IMPORTANT: This is a breaking change. The tenant_id format changes from UUID to TEXT.
-- The canonical format is "org_xxxxx" from Clerk's org_id.

-- Step 1: Create new TEXT columns
ALTER TABLE tenant_roles ADD COLUMN IF NOT EXISTS tenant_id_text TEXT;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS tenant_id_text TEXT;

-- Step 2: Migrate existing UUID data to TEXT (temporary - will need manual mapping)
-- NOTE: In production, you'll need to map existing UUID tenant_ids to Clerk org_id format
-- This is a placeholder that converts UUID to string for migration safety
UPDATE tenant_roles SET tenant_id_text = tenant_id::TEXT WHERE tenant_id_text IS NULL;
UPDATE tenant_users SET tenant_id_text = tenant_id::TEXT WHERE tenant_id_text IS NULL;

-- Step 3: Update auth_audit_log tenant_id to TEXT
ALTER TABLE auth_audit_log ADD COLUMN IF NOT EXISTS tenant_id_text TEXT;
UPDATE auth_audit_log SET tenant_id_text = tenant_id::TEXT WHERE tenant_id_text IS NULL AND tenant_id IS NOT NULL;

-- Step 4: Add validation for org_xxxxx format (Security Contract v1 §1.1)
-- This check allows both "org_xxxxx" format AND legacy UUIDs during migration
ALTER TABLE tenant_roles DROP CONSTRAINT IF EXISTS tenant_roles_tenant_id_format_check;
ALTER TABLE tenant_roles ADD CONSTRAINT tenant_roles_tenant_id_format_check 
  CHECK (tenant_id_text LIKE 'org_%' OR tenant_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_format_check;
ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_tenant_id_format_check 
  CHECK (tenant_id_text LIKE 'org_%' OR tenant_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- ============================================================================
-- 3. UPDATE PERMISSION NAMING (Security Contract v1 §6.3)
-- ============================================================================

-- Update tenant_permissions to use resource:action format
UPDATE tenant_permissions SET permission_code = 'users:view' WHERE permission_code = 'tenant:view_users';
UPDATE tenant_permissions SET permission_code = 'users:invite' WHERE permission_code = 'tenant:invite_users';
UPDATE tenant_permissions SET permission_code = 'users:manage' WHERE permission_code = 'tenant:manage_users';
UPDATE tenant_permissions SET permission_code = 'billing:view' WHERE permission_code = 'tenant:view_billing';
UPDATE tenant_permissions SET permission_code = 'billing:manage' WHERE permission_code = 'tenant:manage_billing';
UPDATE tenant_permissions SET permission_code = 'cases:create' WHERE permission_code = 'tenant:create_cases';
UPDATE tenant_permissions SET permission_code = 'cases:manage' WHERE permission_code = 'tenant:manage_cases';
UPDATE tenant_permissions SET permission_code = 'reports:view' WHERE permission_code = 'tenant:view_reports';
UPDATE tenant_permissions SET permission_code = 'settings:manage' WHERE permission_code = 'tenant:manage_settings';
UPDATE tenant_permissions SET permission_code = 'tickets:view' WHERE permission_code = 'tenant:view_tickets';
UPDATE tenant_permissions SET permission_code = 'tickets:create' WHERE permission_code = 'tenant:create_tickets';
UPDATE tenant_permissions SET permission_code = 'tickets:manage' WHERE permission_code = 'tenant:manage_tickets';

-- Update cs_role_permissions to use resource:action format
UPDATE cs_role_permissions SET permission_code = 'tasks:read' WHERE permission_code = 'read:tasks';
UPDATE cs_role_permissions SET permission_code = 'tasks:create' WHERE permission_code = 'create:tasks';
UPDATE cs_role_permissions SET permission_code = 'projects:read' WHERE permission_code = 'read:projects';
UPDATE cs_role_permissions SET permission_code = 'users:manage' WHERE permission_code = 'manage:users';
UPDATE cs_role_permissions SET permission_code = 'roles:manage' WHERE permission_code = 'manage:roles';
UPDATE cs_role_permissions SET permission_code = 'financials:read' WHERE permission_code = 'read:financials';
UPDATE cs_role_permissions SET permission_code = 'payroll:process' WHERE permission_code = 'process:payroll';
UPDATE cs_role_permissions SET permission_code = 'operations:view' WHERE permission_code = 'view:operations_monitoring';
UPDATE cs_role_permissions SET permission_code = 'audit_logs:access' WHERE permission_code = 'access:audit_logs';
UPDATE cs_role_permissions SET permission_code = 'tickets:view_all' WHERE permission_code = 'view:all_tickets';
UPDATE cs_role_permissions SET permission_code = 'escalations:manage' WHERE permission_code = 'manage:escalations';
UPDATE cs_role_permissions SET permission_code = 'sla:configure' WHERE permission_code = 'configure:sla';
UPDATE cs_role_permissions SET permission_code = 'analytics:view' WHERE permission_code = 'view:analytics';
UPDATE cs_role_permissions SET permission_code = 'kb:manage' WHERE permission_code = 'manage:kb';
UPDATE cs_role_permissions SET permission_code = 'customer_health:view' WHERE permission_code = 'view:customer_health';

-- Insert any missing permissions for Security Contract v1
INSERT INTO tenant_permissions (permission_code, permission_name, description, category) VALUES
  ('users:view', 'View Users', 'View tenant team members', 'users'),
  ('users:invite', 'Invite Users', 'Invite new users to tenant', 'users'),
  ('users:manage', 'Manage Users', 'Edit and remove tenant users', 'users'),
  ('billing:view', 'View Billing', 'View billing information', 'billing'),
  ('billing:manage', 'Manage Billing', 'Update billing and payment methods', 'billing'),
  ('cases:create', 'Create Cases', 'Create new cases', 'cases'),
  ('cases:manage', 'Manage Cases', 'Edit and close cases', 'cases'),
  ('reports:view', 'View Reports', 'View tenant reports and analytics', 'reports'),
  ('settings:manage', 'Manage Settings', 'Configure tenant settings', 'settings'),
  ('tickets:view', 'View Tickets', 'View support tickets', 'support'),
  ('tickets:create', 'Create Tickets', 'Create support tickets', 'support'),
  ('tickets:manage', 'Manage Tickets', 'Manage and respond to tickets', 'support')
ON CONFLICT (permission_code) DO NOTHING;

-- ============================================================================
-- 4. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN auth_audit_log.request_id IS 'UUID generated at request entry per Security Contract v1 §4';
COMMENT ON COLUMN auth_audit_log.event_type IS 'Event type: auth_success, auth_failure, scope_rejected, permission_denied, permission_service_unavailable';
COMMENT ON COLUMN auth_audit_log.tenant_id_text IS 'Canonical tenant identifier from Clerk org_id (TEXT format "org_xxxxx") per Security Contract v1 §1.1';
COMMENT ON COLUMN auth_audit_log.clerk_user_id IS 'Canonical user identifier from Clerk sub claim per Security Contract v1 §1.2';
COMMENT ON COLUMN auth_audit_log.permission_checked IS 'Permission checked in resource:action format per Security Contract v1 §6.3';

COMMENT ON COLUMN tenant_roles.tenant_id_text IS 'Canonical tenant identifier from Clerk org_id (TEXT format "org_xxxxx") per Security Contract v1 §1.1';
COMMENT ON COLUMN tenant_users.tenant_id_text IS 'Canonical tenant identifier from Clerk org_id (TEXT format "org_xxxxx") per Security Contract v1 §1.1';

-- ============================================================================
-- 5. MIGRATION NOTES
-- ============================================================================

/*
POST-MIGRATION STEPS:

1. Update application code to use tenant_id_text instead of tenant_id
2. Map existing UUID tenant_ids to Clerk org_id format:
   - Query Clerk API for organization mappings
   - Update tenant_id_text to org_xxxxx format
3. Once all data migrated, drop old UUID columns:
   - ALTER TABLE tenant_roles DROP COLUMN tenant_id;
   - ALTER TABLE tenant_roles RENAME COLUMN tenant_id_text TO tenant_id;
   - ALTER TABLE tenant_users DROP COLUMN tenant_id;
   - ALTER TABLE tenant_users RENAME COLUMN tenant_id_text TO tenant_id;
4. Update RLS policies to use TEXT tenant_id
5. Remove PERMISSION_FAIL_OPEN flag before production deployment
*/
