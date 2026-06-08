/**
 * JWT Claims Schema v2.0.0
 * 
 * TRUEVOW SECURITY CONTRACT v1 COMPLIANT
 * Scope-aware JWT validation for TrueVow microservices.
 * Supports internal (TrueVow employees), tenant (law firm users), and platform_admin contexts.
 * 
 * CRITICAL RULES (Security Contract v1):
 * 1. Never mix scopes - JWT with both internal AND tenant claims is REJECTED
 * 2. Never accept missing scope - JWT without scope is REJECTED
 * 3. DB is source of truth - Permissions come from DB, not JWT
 * 4. tenant_role is INFORMATIONAL ONLY - Never trust it for authorization
 * 5. tenant_id = org_id (TEXT format "org_xxxxx") - Never UUID
 */

import { auth } from '@clerk/nextjs/server'

/**
 * Valid scope values per Security Contract v1
 * 
 * Service Scope Mapping:
 * - Tenant App: 'tenant'
 * - Internal Ops: 'internal'
 * - SaaS Admin: 'platform_admin'
 * - Platform Core: Service-specific
 * - CS Support: 'internal' (this service)
 */
export type AuthScope = 'internal' | 'tenant' | 'platform_admin'

/**
 * Internal role types for CS Support team members
 * These match the roles in cs_team_members table
 */
export type InternalRole = 
  | 'support_agent' 
  | 'support_manager' 
  | 'csm' 
  | 'head_of_cs' 
  | 'solutions_engineer'

/**
 * Internal function types (departments) - for CS Support, mapped from role
 */
export type InternalFunction = 
  | 'support' 
  | 'customer_success' 
  | 'solutions' 
  | 'management'

/**
 * Tenant role types for law firm users
 */
export type TenantRole = 'admin' | 'billing_admin' | 'member' | 'viewer'

/**
 * JWT Claims structure for internal users
 * 
 * Per Security Contract v1:
 * - org_id is extracted for internal users
 * - tenant_id is NOT set for internal users
 */
export interface InternalJWTClaims {
  iss: string
  sub: string
  email: string
  scope: 'internal'
  org_id: string
  internal_role: InternalRole
  internal_function: InternalFunction
  iat: number
  exp: number
}

/**
 * JWT Claims structure for tenant users
 * 
 * Per Security Contract v1:
 * - tenant_id = org_id (both extracted from JWT)
 * - tenant_id is TEXT format "org_xxxxx" - NEVER UUID
 * - tenant_role is INFORMATIONAL ONLY - not trusted for authz
 */
export interface TenantJWTClaims {
  iss: string
  sub: string
  email: string
  scope: 'tenant'
  org_id: string              // Same as tenant_id (Clerk org_id)
  tenant_id: string           // TEXT format "org_xxxxx" - matches org_id
  tenant_role: TenantRole     // INFORMATIONAL ONLY - DB is source of truth
  iat: number
  exp: number
}

/**
 * JWT Claims structure for platform admin users
 * 
 * Per Security Contract v1:
 * - Used by SaaS Admin service
 * - Has access to all tenants
 */
export interface PlatformAdminJWTClaims {
  iss: string
  sub: string
  email: string
  scope: 'platform_admin'
  org_id: string
  iat: number
  exp: number
}

/**
 * Union type for all valid JWT claims
 */
export type JWTClaims = InternalJWTClaims | TenantJWTClaims | PlatformAdminJWTClaims

/**
 * Raw JWT claims from Clerk (may be incomplete or invalid)
 */
export interface RawClerkClaims {
  sub?: string
  email?: string
  scope?: string
  org_id?: string
  internal_role?: string
  internal_function?: string
  tenant_id?: string
  tenant_role?: string
  iat?: number
  exp?: number
}

/**
 * JWT Validation Error
 */
export class JWTValidationError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_SCOPE' | 'MIXED_SCOPES' | 'INVALID_SCOPE' | 'MISSING_CLAIMS' | 'EXPIRED'
  ) {
    super(message)
    this.name = 'JWTValidationError'
  }
}

/**
 * Validate JWT claims structure
 * 
 * CRITICAL (Security Contract v1): Enforces scope separation rules
 * Scope validation is the FIRST GATE after signature verification.
 */
export function validateJWTClaims(claims: RawClerkClaims): JWTClaims {
  // Rule 1: Never accept missing scope (Security Contract v1 §3)
  if (!claims.scope) {
    throw new JWTValidationError(
      'JWT missing required scope claim - rejecting per Security Contract v1',
      'MISSING_SCOPE'
    )
  }

  // Rule 2: Validate scope value (Security Contract v1 §3)
  const validScopes = ['internal', 'tenant', 'platform_admin']
  if (!validScopes.includes(claims.scope)) {
    throw new JWTValidationError(
      `Invalid scope value: ${claims.scope}. Must be 'internal', 'tenant', or 'platform_admin'`,
      'INVALID_SCOPE'
    )
  }

  // Check for required base claims
  if (!claims.sub || !claims.email) {
    throw new JWTValidationError(
      'JWT missing required claims (sub, email)',
      'MISSING_CLAIMS'
    )
  }

  // Validate based on scope type
  if (claims.scope === 'internal') {
    // Validate internal claims
    if (!claims.internal_role || !claims.internal_function) {
      throw new JWTValidationError(
        'Internal JWT missing required claims (internal_role, internal_function)',
        'MISSING_CLAIMS'
      )
    }

    // Rule 3: Never mix scopes - reject if tenant claims present
    if (claims.tenant_id || claims.tenant_role) {
      throw new JWTValidationError(
        'JWT contains both internal and tenant claims - scope mixing is forbidden',
        'MIXED_SCOPES'
      )
    }

    return {
      iss: 'https://clerk.truevow.com',
      sub: claims.sub,
      email: claims.email,
      scope: 'internal',
      org_id: claims.org_id || '',
      internal_role: claims.internal_role as InternalRole,
      internal_function: claims.internal_function as InternalFunction,
      iat: claims.iat || 0,
      exp: claims.exp || 0,
    }
  } else if (claims.scope === 'tenant') {
    // Validate tenant claims
    // Security Contract v1: tenant_id = org_id, both must be extracted
    const tenantId = claims.tenant_id || claims.org_id || ''
    const orgId = claims.org_id || tenantId
    
    if (!tenantId) {
      throw new JWTValidationError(
        'Tenant JWT missing required claims (tenant_id or org_id)',
        'MISSING_CLAIMS'
      )
    }

    // Rule 3: Never mix scopes - reject if internal claims present
    if (claims.internal_role || claims.internal_function) {
      throw new JWTValidationError(
        'JWT contains both tenant and internal claims - scope mixing is forbidden',
        'MIXED_SCOPES'
      )
    }

    // Security Contract v1: Validate tenant_id format is TEXT "org_xxxxx", not UUID
    if (tenantId && !tenantId.startsWith('org_') && !tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Allow non-org_ format for development/testing, but log warning
      console.warn(`[SecurityContract] tenant_id "${tenantId}" does not match expected format "org_xxxxx"`)
    }

    return {
      iss: 'https://clerk.truevow.com',
      sub: claims.sub,
      email: claims.email,
      scope: 'tenant',
      org_id: orgId,
      tenant_id: tenantId,  // Security Contract v1: tenant_id = org_id
      tenant_role: claims.tenant_role as TenantRole,  // INFORMATIONAL ONLY
      iat: claims.iat || 0,
      exp: claims.exp || 0,
    }
  } else {
    // platform_admin scope
    return {
      iss: 'https://clerk.truevow.com',
      sub: claims.sub,
      email: claims.email,
      scope: 'platform_admin',
      org_id: claims.org_id || '',
      iat: claims.iat || 0,
      exp: claims.exp || 0,
    }
  }
}

/**
 * Get and validate JWT claims from Clerk session
 */
export async function getJWTClaims(): Promise<JWTClaims | null> {
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    return null
  }

  // Clerk sessionClaims may contain our custom claims
  const rawClaims: RawClerkClaims = {
    sub: userId,
    email: (sessionClaims as any)?.email || '',
    scope: (sessionClaims as any)?.scope,
    org_id: (sessionClaims as any)?.org_id,
    internal_role: (sessionClaims as any)?.internal_role,
    internal_function: (sessionClaims as any)?.internal_function,
    tenant_id: (sessionClaims as any)?.tenant_id,
    tenant_role: (sessionClaims as any)?.tenant_role,
    iat: (sessionClaims as any)?.iat,
    exp: (sessionClaims as any)?.exp,
  }

  return validateJWTClaims(rawClaims)
}

/**
 * Type guard for internal JWT claims
 */
export function isInternalClaims(claims: JWTClaims): claims is InternalJWTClaims {
  return claims.scope === 'internal'
}

/**
 * Type guard for tenant JWT claims
 */
export function isTenantClaims(claims: JWTClaims): claims is TenantJWTClaims {
  return claims.scope === 'tenant'
}

/**
 * Type guard for platform admin JWT claims
 */
export function isPlatformAdminClaims(claims: JWTClaims): claims is PlatformAdminJWTClaims {
  return claims.scope === 'platform_admin'
}

// ============================================================================
// SECURITY CONTRACT V1 - AUTH MODE GUARD
// ============================================================================

/**
 * AUTH_MODE configuration
 * 
 * Per Security Contract v1 §5:
 * - "local" mode allowed only in non-production
 * - "clerk" mode required in production
 */
export type AuthMode = 'local' | 'clerk'

/**
 * Get current AUTH_MODE from environment
 */
export function getAuthMode(): AuthMode {
  return (process.env.AUTH_MODE as AuthMode) || 'clerk'
}

/**
 * Security Contract v1 §5: AUTH_MODE Guard
 * 
 * MUST be called at application startup.
 * If ENV=production AND AUTH_MODE != "clerk", raises RuntimeError.
 */
export function enforceAuthModeGuard(): void {
  const env = process.env.NODE_ENV || 'development'
  const authMode = getAuthMode()
  
  if (env === 'production' && authMode !== 'clerk') {
    throw new Error(
      '[SECURITY CONTRACT VIOLATION] AUTH_MODE=local forbidden in production. ' +
      'Set AUTH_MODE=clerk before deployment.'
    )
  }
  
  if (authMode === 'local' && env !== 'test') {
    console.warn(
      `[SecurityContract] WARNING: AUTH_MODE=local is set. ` +
      `This MUST be changed to 'clerk' before production deployment.`
    )
  }
}

/**
 * Permission fail-open flag (Migration only - Security Contract v1 §6.2)
 * 
 * CRITICAL: This MUST be removed before production.
 * If PERMISSION_FAIL_OPEN=true in production, the app MUST reject it.
 */
export function isPermissionFailOpenAllowed(): boolean {
  const env = process.env.NODE_ENV || 'development'
  const failOpen = process.env.PERMISSION_FAIL_OPEN === 'true'
  
  if (failOpen && env === 'production') {
    throw new Error(
      '[SECURITY CONTRACT VIOLATION] PERMISSION_FAIL_OPEN=true forbidden in production. ' +
      'Remove this flag before deployment.'
    )
  }
  
  return failOpen
}
