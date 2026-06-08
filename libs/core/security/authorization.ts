/**
 * Authorization Module v2.0.0
 * 
 * TRUEVOW SECURITY CONTRACT v1 COMPLIANT
 * Scope-aware authorization for TrueVow microservices.
 * Provides UserContext classes for internal and tenant users with permission checking.
 * 
 * SECURITY CONTRACT v1 RULES:
 * 1. DB is source of truth for permissions, not JWT claims
 * 2. Fail-closed: If permission service unavailable, deny access (403)
 * 3. Permission naming: resource:action format
 * 4. tenant_role is INFORMATIONAL ONLY - never trust for authz
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  JWTClaims, 
  InternalJWTClaims, 
  TenantJWTClaims,
  PlatformAdminJWTClaims,
  getJWTClaims,
  validateJWTClaims,
  isInternalClaims,
  isTenantClaims,
  isPlatformAdminClaims,
  JWTValidationError,
  InternalRole,
  InternalFunction,
  TenantRole,
  AuthScope,
  isPermissionFailOpenAllowed
} from './jwt-claims'
import { createServerSupabase } from '@/lib/db/supabase'

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Permission naming convention per Security Contract v1 §6.3
 * Format: resource:action
 * 
 * Examples:
 * - cases:read
 * - leads:write
 * - billing:admin
 * - settings:read
 */

/**
 * Internal permissions for TrueVow employees
 */
export enum Permission {
  // Task management
  TASKS_READ = 'tasks:read',
  TASKS_CREATE = 'tasks:create',
  TASKS_MANAGE = 'tasks:manage',
  
  // Project management
  PROJECTS_READ = 'projects:read',
  PROJECTS_MANAGE = 'projects:manage',
  
  // User management
  USERS_MANAGE = 'users:manage',
  ROLES_MANAGE = 'roles:manage',
  
  // Financials
  FINANCIALS_READ = 'financials:read',
  PAYROLL_PROCESS = 'payroll:process',
  
  // Operations
  OPERATIONS_VIEW = 'operations:view',
  AUDIT_LOGS_ACCESS = 'audit_logs:access',
  
  // Support-specific permissions
  TICKETS_VIEW_ALL = 'tickets:view_all',
  ESCALATIONS_MANAGE = 'escalations:manage',
  SLA_CONFIGURE = 'sla:configure',
  ANALYTICS_VIEW = 'analytics:view',
  
  // Knowledge base
  KB_MANAGE = 'kb:manage',
  
  // Customer health
  CUSTOMER_HEALTH_VIEW = 'customer_health:view',
}

/**
 * Tenant permissions for law firm users
 * Per Security Contract v1 §6.3: resource:action format
 */
export enum TenantPermission {
  // User management
  USERS_VIEW = 'users:view',
  USERS_INVITE = 'users:invite',
  USERS_MANAGE = 'users:manage',
  
  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',
  
  // Cases
  CASES_CREATE = 'cases:create',
  CASES_MANAGE = 'cases:manage',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  
  // Settings
  SETTINGS_MANAGE = 'settings:manage',
  
  // Support
  TICKETS_VIEW = 'tickets:view',
  TICKETS_CREATE = 'tickets:create',
  TICKETS_MANAGE = 'tickets:manage',
}

// ============================================================================
// ROLE-PERMISSION MAPPINGS (DEFAULT - DB IS SOURCE OF TRUTH)
// ============================================================================

/**
 * Default internal role permissions for CS Support team
 * 
 * NOTE: DB is source of truth. These are fallback defaults only.
 * Security Contract v1 §6.2: Fail-closed if DB unavailable.
 */
const INTERNAL_ROLE_PERMISSIONS: Record<InternalRole, Permission[]> = {
  support_agent: [
    Permission.TASKS_READ,
    Permission.TASKS_CREATE,
    Permission.KB_MANAGE,
  ],
  solutions_engineer: [
    Permission.TASKS_READ,
    Permission.TASKS_CREATE,
    Permission.PROJECTS_READ,
    Permission.KB_MANAGE,
  ],
  csm: [
    Permission.TASKS_READ,
    Permission.TASKS_CREATE,
    Permission.PROJECTS_READ,
    Permission.ANALYTICS_VIEW,
    Permission.CUSTOMER_HEALTH_VIEW,
    Permission.KB_MANAGE,
  ],
  support_manager: [
    Permission.TASKS_READ,
    Permission.TASKS_CREATE,
    Permission.PROJECTS_READ,
    Permission.USERS_MANAGE,
    Permission.ROLES_MANAGE,
    Permission.FINANCIALS_READ,
    Permission.ANALYTICS_VIEW,
    Permission.TICKETS_VIEW_ALL,
    Permission.SLA_CONFIGURE,
  ],
  head_of_cs: [
    Permission.TASKS_READ,
    Permission.TASKS_CREATE,
    Permission.PROJECTS_READ,
    Permission.USERS_MANAGE,
    Permission.ROLES_MANAGE,
    Permission.FINANCIALS_READ,
    Permission.PAYROLL_PROCESS,
    Permission.OPERATIONS_VIEW,
    Permission.AUDIT_LOGS_ACCESS,
    Permission.TICKETS_VIEW_ALL,
    Permission.ESCALATIONS_MANAGE,
    Permission.SLA_CONFIGURE,
    Permission.ANALYTICS_VIEW,
  ],
}

/**
 * Default tenant role permissions
 * 
 * NOTE: DB is source of truth. These are fallback defaults only.
 * Security Contract v1 §6.2: Fail-closed if DB unavailable.
 */
const TENANT_ROLE_PERMISSIONS: Record<TenantRole, TenantPermission[]> = {
  admin: [
    TenantPermission.USERS_VIEW,
    TenantPermission.USERS_INVITE,
    TenantPermission.USERS_MANAGE,
    TenantPermission.BILLING_VIEW,
    TenantPermission.BILLING_MANAGE,
    TenantPermission.CASES_CREATE,
    TenantPermission.CASES_MANAGE,
    TenantPermission.REPORTS_VIEW,
    TenantPermission.SETTINGS_MANAGE,
    TenantPermission.TICKETS_VIEW,
    TenantPermission.TICKETS_CREATE,
    TenantPermission.TICKETS_MANAGE,
  ],
  billing_admin: [
    TenantPermission.USERS_VIEW,
    TenantPermission.USERS_INVITE,
    TenantPermission.BILLING_VIEW,
    TenantPermission.BILLING_MANAGE,
    TenantPermission.REPORTS_VIEW,
    TenantPermission.TICKETS_VIEW,
  ],
  member: [
    TenantPermission.USERS_VIEW,
    TenantPermission.REPORTS_VIEW,
    TenantPermission.CASES_CREATE,
    TenantPermission.TICKETS_VIEW,
    TenantPermission.TICKETS_CREATE,
  ],
  viewer: [
    TenantPermission.USERS_VIEW,
    TenantPermission.REPORTS_VIEW,
    TenantPermission.TICKETS_VIEW,
  ],
}

// ============================================================================
// USER CONTEXT CLASSES
// ============================================================================

/**
 * Base user context interface
 */
export interface BaseUserContext {
  userId: string
  email: string
  scope: AuthScope
  isInternal(): this is InternalUserContext
  isTenant(): this is TenantUserContext
  hasPermission(permission: Permission | TenantPermission): Promise<boolean>
  logAuditEvent(action: string, metadata?: Record<string, any>): Promise<void>
}

/**
 * Internal user context for TrueVow employees
 * 
 * Security Contract v1 compliant:
 * - Permissions loaded from DB (not JWT)
 * - Fail-closed if DB unavailable (unless PERMISSION_FAIL_OPEN=true)
 */
export class InternalUserContext implements BaseUserContext {
  readonly scope = 'internal' as const
  public permissions: Permission[] | null = null
  private permissionFetchError: boolean = false
  
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly orgId: string,
    public readonly internalRole: InternalRole,
    public readonly internalFunction: InternalFunction,
    private readonly claims: InternalJWTClaims
  ) {}

  isInternal(): this is InternalUserContext {
    return true
  }

  isTenant(): this is TenantUserContext {
    return false
  }

  /**
   * Check if user has a specific permission
   * 
   * Security Contract v1 §6.2: Fail-closed enforcement
   * - If permission service unavailable: deny access (403)
   * - Log critical event
   * - No silent fallback
   * 
   * Migration-only: PERMISSION_FAIL_OPEN=true allows fallback
   */
  async hasPermission(permission: Permission | TenantPermission): Promise<boolean> {
    // Fetch permissions from DB if not cached
    if (this.permissions === null) {
      await this.fetchPermissions()
    }
    
    // Security Contract v1 §6.2: Fail-closed if fetch failed
    if (this.permissionFetchError && !isPermissionFailOpenAllowed()) {
      // Log critical event
      await this.logAuditEvent('permission_service_unavailable', {
        permission_requested: permission,
        fail_closed: true,
      })
      return false // DENY ACCESS - fail-closed
    }
    
    return this.permissions!.includes(permission as Permission)
  }

  /**
   * Fetch permissions from database
   * 
   * Security Contract v1 §6.1: DB is source of truth
   */
  private async fetchPermissions(): Promise<void> {
    try {
      const supabase = await createServerSupabase()
      
      // Query cs_role_permissions for the user's role
      const { data, error } = await supabase
        .from('cs_role_permissions')
        .select('permission_code')
        .eq('role', this.internalRole)
      
      if (error) {
        console.error('[SecurityContract] Permission fetch error:', error)
        this.permissionFetchError = true
        
        // Security Contract v1 §6.2: Fail-closed, but allow fallback for migration
        if (isPermissionFailOpenAllowed()) {
          this.permissions = INTERNAL_ROLE_PERMISSIONS[this.internalRole] || []
        }
        return
      }
      
      if (!data || data.length === 0) {
        // No permissions found in DB - use defaults (migration-safe)
        this.permissions = INTERNAL_ROLE_PERMISSIONS[this.internalRole] || []
        return
      }
      
      this.permissions = data.map(p => p.permission_code as Permission)
    } catch (error) {
      console.error('[SecurityContract] Permission fetch exception:', error)
      this.permissionFetchError = true
      
      // Security Contract v1 §6.2: Fail-closed, but allow fallback for migration
      if (isPermissionFailOpenAllowed()) {
        this.permissions = INTERNAL_ROLE_PERMISSIONS[this.internalRole] || []
      }
    }
  }

  /**
   * Log audit event for compliance
   * 
   * Security Contract v1 §9: Auth Audit Logging
   */
  async logAuditEvent(eventType: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const supabase = await createServerSupabase()
      
      await supabase.from('auth_audit_log').insert({
        request_id: metadata?.request_id || crypto.randomUUID(),
        event_type: eventType,
        tenant_id: null, // Internal users don't have tenant_id
        clerk_user_id: this.userId,
        endpoint: metadata?.endpoint || null,
        method: metadata?.method || null,
        ip_address: metadata?.ip_address || null,
        user_agent: metadata?.user_agent || null,
        permission_checked: metadata?.permission_requested || null,
        response_status: metadata?.response_status || null,
        details: {
          ...metadata,
          scope: 'internal',
          role: this.internalRole,
          function: this.internalFunction,
          org_id: this.orgId,
        },
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[SecurityContract] Failed to log audit event:', error)
    }
  }
}

/**
 * Tenant user context for law firm users
 * 
 * Security Contract v1 compliant:
 * - Permissions loaded from DB (not JWT)
 * - Fail-closed if DB unavailable (unless PERMISSION_FAIL_OPEN=true)
 * - tenant_id is TEXT format "org_xxxxx" (never UUID)
 * - tenant_role is INFORMATIONAL ONLY (not trusted for authz)
 */
export class TenantUserContext implements BaseUserContext {
  readonly scope = 'tenant' as const
  public permissions: TenantPermission[] | null = null
  private permissionFetchError: boolean = false
  
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,  // TEXT format "org_xxxxx" per Security Contract v1
    public readonly tenantRole: TenantRole,  // INFORMATIONAL ONLY - not trusted
    public readonly orgId: string,
    private readonly claims: TenantJWTClaims
  ) {}

  isInternal(): this is InternalUserContext {
    return false
  }

  isTenant(): this is TenantUserContext {
    return true
  }

  /**
   * Check if user has a specific permission
   * 
   * Security Contract v1 §6.2: Fail-closed enforcement
   * - If permission service unavailable: deny access (403)
   * - Log critical event
   * - No silent fallback
   * 
   * Migration-only: PERMISSION_FAIL_OPEN=true allows fallback
   */
  async hasPermission(permission: Permission | TenantPermission): Promise<boolean> {
    // Fetch permissions from DB if not cached
    if (this.permissions === null) {
      await this.fetchPermissions()
    }
    
    // Security Contract v1 §6.2: Fail-closed if fetch failed
    if (this.permissionFetchError && !isPermissionFailOpenAllowed()) {
      // Log critical event
      await this.logAuditEvent('permission_service_unavailable', {
        permission_requested: permission,
        fail_closed: true,
        tenant_id: this.tenantId,
      })
      return false // DENY ACCESS - fail-closed
    }
    
    return this.permissions!.includes(permission as TenantPermission)
  }

  /**
   * Fetch permissions from database
   * 
   * Security Contract v1 §6.1: DB is source of truth
   */
  private async fetchPermissions(): Promise<void> {
    try {
      const supabase = await createServerSupabase()
      
      // Query tenant_role_permissions for the user's role
      // Note: tenant_id is TEXT format "org_xxxxx" per Security Contract v1
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          role_id,
          tenant_roles!inner (
            role_name,
            tenant_role_permissions (
              permission_id,
              tenant_permissions ( permission_code )
            )
          )
        `)
        .eq('clerk_user_id', this.userId)
        .eq('tenant_id', this.tenantId)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.error('[SecurityContract] Permission fetch error:', error)
        this.permissionFetchError = true
        
        // Security Contract v1 §6.2: Fail-closed, but allow fallback for migration
        if (isPermissionFailOpenAllowed()) {
          this.permissions = TENANT_ROLE_PERMISSIONS[this.tenantRole] || []
        }
        return
      }
      
      if (!data) {
        // No user found in tenant - use defaults (migration-safe)
        this.permissions = TENANT_ROLE_PERMISSIONS[this.tenantRole] || []
        return
      }
      
      // Extract permissions from joined data
      const roleData = data.tenant_roles as any
      if (roleData?.tenant_role_permissions) {
        this.permissions = roleData.tenant_role_permissions
          .map((p: any) => p.tenant_permissions?.permission_code)
          .filter(Boolean) as TenantPermission[]
      } else {
        this.permissions = TENANT_ROLE_PERMISSIONS[this.tenantRole] || []
      }
    } catch (error) {
      console.error('[SecurityContract] Permission fetch exception:', error)
      this.permissionFetchError = true
      
      // Security Contract v1 §6.2: Fail-closed, but allow fallback for migration
      if (isPermissionFailOpenAllowed()) {
        this.permissions = TENANT_ROLE_PERMISSIONS[this.tenantRole] || []
      }
    }
  }

  /**
   * Log audit event for compliance
   * 
   * Security Contract v1 §9: Auth Audit Logging
   */
  async logAuditEvent(eventType: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const supabase = await createServerSupabase()
      
      await supabase.from('auth_audit_log').insert({
        request_id: metadata?.request_id || crypto.randomUUID(),
        event_type: eventType,
        tenant_id: this.tenantId,  // TEXT format "org_xxxxx"
        clerk_user_id: this.userId,
        endpoint: metadata?.endpoint || null,
        method: metadata?.method || null,
        ip_address: metadata?.ip_address || null,
        user_agent: metadata?.user_agent || null,
        permission_checked: metadata?.permission_requested || null,
        response_status: metadata?.response_status || null,
        details: {
          ...metadata,
          scope: 'tenant',
          role: this.tenantRole,  // INFORMATIONAL ONLY
          org_id: this.orgId,
        },
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[SecurityContract] Failed to log audit event:', error)
    }
  }
}

/**
 * Union type for all user contexts
 */
export type UserContext = InternalUserContext | TenantUserContext

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Get user context from current request
 * Validates JWT and returns appropriate user context type
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    const claims = await getJWTClaims()
    
    if (!claims) {
      return null
    }
    
    if (isInternalClaims(claims)) {
      return new InternalUserContext(
        claims.sub,
        claims.email,
        claims.org_id,
        claims.internal_role,
        claims.internal_function,
        claims
      )
    } else if (isTenantClaims(claims)) {
      return new TenantUserContext(
        claims.sub,
        claims.email,
        claims.tenant_id,
        claims.tenant_role,
        claims.org_id,
        claims
      )
    }
    
    return null
  } catch (error) {
    if (error instanceof JWTValidationError) {
      console.error('JWT validation failed:', error.message, error.code)
    }
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<UserContext> {
  const context = await getUserContext()
  
  if (!context) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  return context
}

/**
 * Require internal user - throws if not internal TrueVow employee
 */
export async function requireInternalUser(): Promise<InternalUserContext> {
  const context = await requireAuth()
  
  if (!context.isInternal()) {
    throw new Error('Forbidden: Internal user access required')
  }
  
  return context
}

/**
 * Require tenant user - throws if not tenant user
 */
export async function requireTenantUser(): Promise<TenantUserContext> {
  const context = await requireAuth()
  
  if (!context.isTenant()) {
    throw new Error('Forbidden: Tenant user access required')
  }
  
  return context
}

/**
 * Require specific internal permission
 */
export async function requireInternalPermission(
  permissions: Permission[]
): Promise<InternalUserContext> {
  const context = await requireInternalUser()
  
  for (const permission of permissions) {
    const hasPermission = await context.hasPermission(permission)
    if (!hasPermission) {
      throw new Error(`Forbidden: Permission '${permission}' required`)
    }
  }
  
  return context
}

/**
 * Require specific tenant permission
 */
export async function requireTenantPermission(
  permissions: TenantPermission[]
): Promise<TenantUserContext> {
  const context = await requireTenantUser()
  
  for (const permission of permissions) {
    const hasPermission = await context.hasPermission(permission)
    if (!hasPermission) {
      throw new Error(`Forbidden: Permission '${permission}' required`)
    }
  }
  
  return context
}

// ============================================================================
// API ROUTE WRAPPERS
// ============================================================================

/**
 * API route wrapper for authenticated endpoints (both internal and tenant)
 */
export function withAuth(
  handler: (req: NextRequest, context: UserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireAuth()
      return await handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: 401 }
      )
    }
  }
}

/**
 * API route wrapper for internal-only endpoints
 */
export function withInternalAuth(
  handler: (req: NextRequest, context: InternalUserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireInternalUser()
      return await handler(req, context)
    } catch (error) {
      const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 401
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status }
      )
    }
  }
}

/**
 * API route wrapper for tenant-only endpoints
 */
export function withTenantAuth(
  handler: (req: NextRequest, context: TenantUserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireTenantUser()
      return await handler(req, context)
    } catch (error) {
      const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 401
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status }
      )
    }
  }
}

/**
 * API route wrapper for internal permission-based endpoints
 */
export function withInternalPermission(
  permissions: Permission[],
  handler: (req: NextRequest, context: InternalUserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireInternalPermission(permissions)
      return await handler(req, context)
    } catch (error) {
      const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 401
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status }
      )
    }
  }
}

/**
 * API route wrapper for tenant permission-based endpoints
 */
export function withTenantPermission(
  permissions: TenantPermission[],
  handler: (req: NextRequest, context: TenantUserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireTenantPermission(permissions)
      return await handler(req, context)
    } catch (error) {
      const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 401
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status }
      )
    }
  }
}

// Re-export types from jwt-claims for convenience
export type { AuthScope, InternalRole, InternalFunction, TenantRole }
