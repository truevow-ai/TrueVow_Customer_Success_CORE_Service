-- ============================================================================
-- Migration: Tenant RBAC Schema for Scope-Aware Auth
-- Version: 1.0.0
-- Date: 2026-03-02
-- 
-- Creates tables for tenant-based role and permission management.
-- Part of the Scope-Aware Auth Architecture migration.
-- 
-- CRITICAL RULES:
-- 1. Tenant services MUST NOT query hr_employees, hr_roles, hr_functions
-- 2. Internal services MUST NOT query tenant_users, tenant_roles
-- 3. DB is source of truth for permissions, not JWT
-- ============================================================================

-- ============================================================================
-- TENANT ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- References tenants in Platform Service (no FK constraint)
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tenant_roles_role_name_check 
        CHECK (role_name IN ('admin', 'billing_admin', 'member', 'viewer')),
    CONSTRAINT tenant_roles_tenant_role_unique 
        UNIQUE (tenant_id, role_name)
);

-- Index for quick role lookups by tenant
CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant_id ON tenant_roles(tenant_id);

-- ============================================================================
-- TENANT PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tenant_permissions_category_check 
        CHECK (category IN ('general', 'users', 'billing', 'cases', 'reports', 'settings', 'support'))
);

-- Seed default tenant permissions
INSERT INTO tenant_permissions (permission_code, permission_name, description, category) VALUES
    -- User management
    ('tenant:view_users', 'View Users', 'View tenant team members', 'users'),
    ('tenant:invite_users', 'Invite Users', 'Invite new users to tenant', 'users'),
    ('tenant:manage_users', 'Manage Users', 'Edit and remove tenant users', 'users'),
    
    -- Billing
    ('tenant:view_billing', 'View Billing', 'View billing information', 'billing'),
    ('tenant:manage_billing', 'Manage Billing', 'Update billing and payment methods', 'billing'),
    
    -- Cases
    ('tenant:create_cases', 'Create Cases', 'Create new cases', 'cases'),
    ('tenant:manage_cases', 'Manage Cases', 'Edit and close cases', 'cases'),
    
    -- Reports
    ('tenant:view_reports', 'View Reports', 'View tenant reports and analytics', 'reports'),
    
    -- Settings
    ('tenant:manage_settings', 'Manage Settings', 'Configure tenant settings', 'settings'),
    
    -- Support
    ('tenant:view_tickets', 'View Tickets', 'View support tickets', 'support'),
    ('tenant:create_tickets', 'Create Tickets', 'Create support tickets', 'support'),
    ('tenant:manage_tickets', 'Manage Tickets', 'Manage and respond to tickets', 'support')
ON CONFLICT (permission_code) DO NOTHING;

-- ============================================================================
-- TENANT ROLE-PERMISSION MAPPING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tenant_role_permissions_role_fkey 
        FOREIGN KEY (tenant_role_id) REFERENCES tenant_roles(id) ON DELETE CASCADE,
    CONSTRAINT tenant_role_permissions_permission_fkey 
        FOREIGN KEY (permission_id) REFERENCES tenant_permissions(id) ON DELETE CASCADE,
    CONSTRAINT tenant_role_permissions_unique 
        UNIQUE (tenant_role_id, permission_id)
);

-- Index for permission lookups
CREATE INDEX IF NOT EXISTS idx_tenant_role_permissions_role ON tenant_role_permissions(tenant_role_id);

-- ============================================================================
-- TENANT USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- References tenants in Platform Service (no FK constraint)
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    invited_by UUID,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tenant_users_role_id_fkey 
        FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE RESTRICT
);

-- Indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_clerk_user_id ON tenant_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);

-- ============================================================================
-- AUTH AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    tenant_id UUID,
    scope VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT auth_audit_log_scope_check 
        CHECK (scope IN ('internal', 'tenant'))
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_tenant_id ON auth_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_scope ON auth_audit_log(scope);

-- ============================================================================
-- INTERNAL ROLE PERMISSIONS (for CS Support team members)
-- ============================================================================

-- Note: CS Support uses cs_team_members table with support-specific roles
-- Roles: support_agent, support_manager, csm, head_of_cs, solutions_engineer

CREATE TABLE IF NOT EXISTS cs_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT cs_role_permissions_role_check 
        CHECK (role IN ('support_agent', 'support_manager', 'csm', 'head_of_cs', 'solutions_engineer')),
    CONSTRAINT cs_role_permissions_unique 
        UNIQUE (role, permission_code)
);

-- Seed default CS role permissions
INSERT INTO cs_role_permissions (role, permission_code) VALUES
    -- Support Agent
    ('support_agent', 'read:tasks'),
    ('support_agent', 'create:tasks'),
    ('support_agent', 'manage:kb'),
    
    -- Solutions Engineer
    ('solutions_engineer', 'read:tasks'),
    ('solutions_engineer', 'create:tasks'),
    ('solutions_engineer', 'read:projects'),
    ('solutions_engineer', 'manage:kb'),
    
    -- CSM (Client Success Manager)
    ('csm', 'read:tasks'),
    ('csm', 'create:tasks'),
    ('csm', 'read:projects'),
    ('csm', 'view:analytics'),
    ('csm', 'view:customer_health'),
    ('csm', 'manage:kb'),
    
    -- Support Manager
    ('support_manager', 'read:tasks'),
    ('support_manager', 'create:tasks'),
    ('support_manager', 'read:projects'),
    ('support_manager', 'manage:users'),
    ('support_manager', 'manage:roles'),
    ('support_manager', 'read:financials'),
    ('support_manager', 'view:analytics'),
    ('support_manager', 'view:all_tickets'),
    ('support_manager', 'configure:sla'),
    
    -- Head of CS
    ('head_of_cs', 'read:tasks'),
    ('head_of_cs', 'create:tasks'),
    ('head_of_cs', 'read:projects'),
    ('head_of_cs', 'manage:users'),
    ('head_of_cs', 'manage:roles'),
    ('head_of_cs', 'read:financials'),
    ('head_of_cs', 'process:payroll'),
    ('head_of_cs', 'view:operations_monitoring'),
    ('head_of_cs', 'access:audit_logs'),
    ('head_of_cs', 'view:all_tickets'),
    ('head_of_cs', 'manage:escalations'),
    ('head_of_cs', 'configure:sla'),
    ('head_of_cs', 'view:analytics')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR TENANT ROLE MANAGEMENT
-- ============================================================================

-- Function to create default tenant roles for a new tenant
-- Note: This should be called when a new tenant is created in Platform Service
CREATE OR REPLACE FUNCTION create_default_tenant_roles(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    admin_role_id UUID;
    billing_admin_role_id UUID;
    member_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Create roles
    INSERT INTO tenant_roles (tenant_id, role_name, description, is_default)
    VALUES 
        (p_tenant_id, 'admin', 'Full administrative access', FALSE),
        (p_tenant_id, 'billing_admin', 'Billing and user management', FALSE),
        (p_tenant_id, 'member', 'Standard member access', TRUE),
        (p_tenant_id, 'viewer', 'Read-only access', FALSE)
    RETURNING id INTO admin_role_id;
    
    SELECT id INTO billing_admin_role_id FROM tenant_roles WHERE tenant_id = p_tenant_id AND role_name = 'billing_admin';
    SELECT id INTO member_role_id FROM tenant_roles WHERE tenant_id = p_tenant_id AND role_name = 'member';
    SELECT id INTO viewer_role_id FROM tenant_roles WHERE tenant_id = p_tenant_id AND role_name = 'viewer';
    
    -- Assign permissions to admin role
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT admin_role_id, id FROM tenant_permissions;
    
    -- Assign permissions to billing_admin role
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT billing_admin_role_id, id FROM tenant_permissions 
    WHERE permission_code IN (
        'tenant:view_users', 'tenant:invite_users', 
        'tenant:view_billing', 'tenant:manage_billing',
        'tenant:view_reports', 'tenant:view_tickets'
    );
    
    -- Assign permissions to member role
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT member_role_id, id FROM tenant_permissions 
    WHERE permission_code IN (
        'tenant:view_users', 'tenant:view_reports',
        'tenant:create_cases', 'tenant:view_tickets', 'tenant:create_tickets'
    );
    
    -- Assign permissions to viewer role
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT viewer_role_id, id FROM tenant_permissions 
    WHERE permission_code IN (
        'tenant:view_users', 'tenant:view_reports', 'tenant:view_tickets'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
    p_user_id VARCHAR(255),
    p_scope VARCHAR(20),
    p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE(permission_code VARCHAR, permission_name VARCHAR) AS $$
BEGIN
    IF p_scope = 'internal' THEN
        -- Get internal permissions from cs_role_permissions (CS Support team members)
        RETURN QUERY
        SELECT crp.permission_code::VARCHAR, crp.permission_code::VARCHAR
        FROM cs_team_members ctm
        JOIN cs_role_permissions crp ON crp.role = ctm.role
        WHERE ctm.clerk_user_id = p_user_id
        AND ctm.is_active = TRUE;
    ELSIF p_scope = 'tenant' AND p_tenant_id IS NOT NULL THEN
        -- Get tenant permissions
        RETURN QUERY
        SELECT tp.permission_code::VARCHAR, tp.permission_name::VARCHAR
        FROM tenant_users tu
        JOIN tenant_role_permissions trp ON trp.tenant_role_id = tu.role_id
        JOIN tenant_permissions tp ON tp.id = trp.permission_id
        WHERE tu.clerk_user_id = p_user_id 
        AND tu.tenant_id = p_tenant_id
        AND tu.is_active = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for tenant_users
CREATE OR REPLACE FUNCTION update_tenant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_users_updated_at ON tenant_users;
CREATE TRIGGER tenant_users_updated_at
    BEFORE UPDATE ON tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_users_updated_at();

-- Update timestamp trigger for tenant_roles
CREATE OR REPLACE FUNCTION update_tenant_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_roles_updated_at ON tenant_roles;
CREATE TRIGGER tenant_roles_updated_at
    BEFORE UPDATE ON tenant_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_roles_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_role_permissions ENABLE ROW LEVEL SECURITY;

-- Tenant roles policies
DROP POLICY IF EXISTS tenant_roles_select ON tenant_roles;
CREATE POLICY tenant_roles_select ON tenant_roles
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        OR EXISTS (
            SELECT 1 FROM cs_team_members 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS tenant_roles_insert ON tenant_roles;
CREATE POLICY tenant_roles_insert ON tenant_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_users 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND tenant_id = tenant_roles.tenant_id
            AND EXISTS (
                SELECT 1 FROM tenant_role_permissions trp
                JOIN tenant_permissions tp ON tp.id = trp.permission_id
                JOIN tenant_roles tr ON tr.id = trp.tenant_role_id
                WHERE tr.tenant_id = tenant_users.tenant_id
                AND tr.role_name = 'admin'
                AND tp.permission_code = 'tenant:manage_settings'
            )
        )
    );

-- Tenant users policies
DROP POLICY IF EXISTS tenant_users_select ON tenant_users;
CREATE POLICY tenant_users_select ON tenant_users
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        OR EXISTS (
            SELECT 1 FROM cs_team_members 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS tenant_users_insert ON tenant_users;
CREATE POLICY tenant_users_insert ON tenant_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_users tu
            JOIN tenant_role_permissions trp ON trp.tenant_role_id = tu.role_id
            JOIN tenant_permissions tp ON tp.id = trp.permission_id
            WHERE tu.clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND tu.tenant_id = tenant_users.tenant_id
            AND tp.permission_code = 'tenant:invite_users'
        )
    );

-- Auth audit log policies (CS team members can view all, tenant users only their tenant)
DROP POLICY IF EXISTS auth_audit_log_select ON auth_audit_log;
CREATE POLICY auth_audit_log_select ON auth_audit_log
    FOR SELECT USING (
        (scope = 'internal' AND EXISTS (
            SELECT 1 FROM cs_team_members 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND is_active = TRUE
        ))
        OR (scope = 'tenant' AND tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID)
    );

DROP POLICY IF EXISTS auth_audit_log_insert ON auth_audit_log;
CREATE POLICY auth_audit_log_insert ON auth_audit_log
    FOR INSERT WITH CHECK (TRUE); -- Allow all authenticated users to insert audit logs

-- CS role permissions (CS team members only)
DROP POLICY IF EXISTS cs_role_permissions_select ON cs_role_permissions;
CREATE POLICY cs_role_permissions_select ON cs_role_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cs_team_members 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
            AND is_active = TRUE
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON tenant_permissions TO authenticated;
GRANT SELECT ON tenant_roles TO authenticated;
GRANT SELECT ON tenant_role_permissions TO authenticated;
GRANT SELECT ON tenant_users TO authenticated;
GRANT INSERT ON auth_audit_log TO authenticated;
GRANT SELECT ON auth_audit_log TO authenticated;
GRANT SELECT ON cs_role_permissions TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tenant_roles IS 'Role definitions for tenant users (law firm employees)';
COMMENT ON TABLE tenant_permissions IS 'Permission definitions for tenant operations';
COMMENT ON TABLE tenant_role_permissions IS 'Mapping of roles to permissions for tenants';
COMMENT ON TABLE tenant_users IS 'User membership in tenants with role assignments';
COMMENT ON TABLE auth_audit_log IS 'Audit log for authentication and authorization events';
COMMENT ON TABLE cs_role_permissions IS 'Mapping of CS support roles to permissions for CS team members';

COMMENT ON FUNCTION create_default_tenant_roles IS 'Creates default roles and permissions for a new tenant';
COMMENT ON FUNCTION get_user_permissions IS 'Retrieves permissions for a user based on scope (internal/tenant)';
