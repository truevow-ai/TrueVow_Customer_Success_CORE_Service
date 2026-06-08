/**
 * Example API Routes using Scope-Aware Auth
 * 
 * This file demonstrates how to use the new scope-aware authentication
 * in API routes. Choose the appropriate pattern based on your endpoint's
 * access requirements.
 * 
 * Copy the relevant pattern to your actual API route files.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  withAuth,
  withInternalAuth,
  withTenantAuth,
  withInternalPermission,
  withTenantPermission,
  UserContext,
  InternalUserContext,
  TenantUserContext,
  Permission,
  TenantPermission,
} from '@/lib/security'

// ============================================================================
// PATTERN 1: Dual-Scope Endpoint (Both Internal and Tenant users)
// ============================================================================

/**
 * Example: GET /api/v1/tickets
 * Both internal users (TrueVow employees) and tenant users can access,
 * but with different data visibility.
 */
export const GET = withAuth(async (
  req: NextRequest,
  context: UserContext
) => {
  // Branch based on scope
  if (context.isInternal()) {
    // Internal user - can see across tenants
    const internalUser: InternalUserContext = context
    
    // Fetch all tickets (internal view)
    return NextResponse.json({
      scope: 'internal',
      userRole: internalUser.internalRole,
      function: internalUser.internalFunction,
      tickets: [], // Would fetch from all tenants
    })
  } else {
    // Tenant user - filter by tenant
    const tenantUser: TenantUserContext = context
    
    // Fetch tickets filtered by tenantUser.tenantId
    return NextResponse.json({
      scope: 'tenant',
      tenantId: tenantUser.tenantId,
      userRole: tenantUser.tenantRole,
      tickets: [], // Would fetch only for this tenant
    })
  }
})

// ============================================================================
// PATTERN 2: Internal-Only Endpoint
// ============================================================================

/**
 * Example: GET /api/v1/internal/analytics
 * Only TrueVow employees can access this endpoint.
 */
export const GET_INTERNAL = withInternalAuth(async (
  req: NextRequest,
  context: InternalUserContext
) => {
  // Only internal users can reach here
  // context has: userId, email, orgId, internalRole, internalFunction
  
  return NextResponse.json({
    message: 'Internal analytics data',
    userRole: context.internalRole,
    function: context.internalFunction,
    data: [], // Internal-only data
  })
})

// ============================================================================
// PATTERN 3: Tenant-Only Endpoint
// ============================================================================

/**
 * Example: GET /api/v1/tenant/settings
 * Only tenant users can access this endpoint.
 */
export const GET_TENANT = withTenantAuth(async (
  req: NextRequest,
  context: TenantUserContext
) => {
  // Only tenant users can reach here
  // context has: userId, email, tenantId, tenantRole, orgId
  
  // Use context.tenantId to filter database queries
  return NextResponse.json({
    tenantId: context.tenantId,
    userRole: context.tenantRole,
    settings: {}, // Would fetch settings for this tenant
  })
})

// ============================================================================
// PATTERN 4: Internal with Permission Check
// ============================================================================

/**
 * Example: POST /api/v1/internal/escalate
 * Only TrueVow employees with 'manage:escalations' permission can access.
 */
export const POST_INTERNAL_PERM = withInternalPermission(
  [Permission.ESCALATIONS_MANAGE],
  async (req: NextRequest, context: InternalUserContext) => {
    // Only users with ESCALATIONS_MANAGE permission can reach here
    
    // Log audit event
    await context.logAuditEvent('escalation_created', {
      endpoint: '/api/v1/internal/escalate',
    })
    
    return NextResponse.json({
      message: 'Escalation created',
      escalatedBy: context.email,
    })
  }
)

// ============================================================================
// PATTERN 5: Tenant with Permission Check
// ============================================================================

/**
 * Example: POST /api/v1/tenant/billing/manage
 * Only tenant users with 'tenant:manage_billing' permission can access.
 */
export const POST_TENANT_PERM = withTenantPermission(
  [TenantPermission.BILLING_MANAGE],
  async (req: NextRequest, context: TenantUserContext) => {
    // Only users with BILLING_MANAGE permission can reach here
    
    // Log audit event
    await context.logAuditEvent('billing_updated', {
      tenantId: context.tenantId,
      endpoint: '/api/v1/tenant/billing/manage',
    })
    
    return NextResponse.json({
      message: 'Billing settings updated',
      tenantId: context.tenantId,
    })
  }
)

// ============================================================================
// PATTERN 6: Legacy Compatibility (Existing Routes)
// ============================================================================

/**
 * For existing routes using the legacy auth pattern, you can continue
 * using the old middleware. It will still work but is marked as deprecated.
 * 
 * Migrate to the new patterns when possible.
 */

// Legacy pattern (still works, but deprecated)
import { withTeamMember, AuthContext } from '@/lib/middleware/auth'

export const GET_LEGACY = withTeamMember(async (
  req: NextRequest,
  context: AuthContext
) => {
  // Legacy context has: userId, teamMemberId, teamId, role
  // This still works for backward compatibility
  
  return NextResponse.json({
    message: 'Legacy endpoint',
    role: context.role,
  })
})
