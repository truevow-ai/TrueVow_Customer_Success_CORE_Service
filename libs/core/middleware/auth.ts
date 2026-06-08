import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserContext, isTeamMember } from '@/lib/services/user-mapping'
import { canPerformAction, SupportRole } from '@/lib/utils/roles'

// New scope-aware authorization imports
import {
  UserContext,
  InternalUserContext,
  TenantUserContext,
  getUserContext,
  requireAuth as requireScopeAuth,
  requireInternalUser,
  requireTenantUser,
  Permission,
  TenantPermission,
} from '@/lib/security'

/**
 * Authentication and Authorization Middleware
 * 
 * MIGRATION STATUS: v1.0.0 - Scope-aware auth model
 * 
 * This module provides two auth patterns:
 * 1. NEW (recommended): Scope-aware auth via lib/security module
 * 2. LEGACY: Team member-based auth for backward compatibility
 * 
 * See docs/01-main/adr/ADR_20260302_scope_aware_auth_architecture.md for details.
 */

// ============================================================================
// LEGACY AUTH CONTEXT (Backward Compatibility)
// ============================================================================

export interface AuthContext {
  userId: string
  teamMemberId: string | null
  teamId: string | null
  role: SupportRole | null
  isAuthenticated: boolean
  /** @deprecated Use scope-aware auth from lib/security */
  tenantId?: string | null
}

/**
 * Get authentication context from request (LEGACY)
 * @deprecated Use getUserContext() from lib/security for new implementations
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth()
  const userContext = await getCurrentUserContext()

  return {
    userId: userId || '',
    teamMemberId: userContext?.teamId || null,
    teamId: userContext?.teamId || null,
    role: (userContext?.role as SupportRole) || null,
    isAuthenticated: !!userId,
  }
}

/**
 * Require authentication middleware (LEGACY)
 * @deprecated Use requireAuth() from lib/security for new implementations
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext()

  if (!context.isAuthenticated) {
    throw new Error('Unauthorized: Authentication required')
  }

  return context
}

/**
 * Require team member (must be mapped to support team) (LEGACY)
 * @deprecated Use requireInternalUser() or requireTenantUser() from lib/security
 */
export async function requireTeamMember(): Promise<AuthContext> {
  const context = await requireAuth()

  if (!context.teamMemberId) {
    throw new Error('Unauthorized: User must be a team member')
  }

  return context
}

/**
 * Require specific role (LEGACY)
 * @deprecated Use requireInternalPermission() or requireTenantPermission() from lib/security
 */
export async function requireRole(requiredRole: SupportRole): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (context.role !== requiredRole) {
    throw new Error(`Unauthorized: Role '${requiredRole}' required`)
  }

  return context
}

/**
 * Require any of the specified roles (LEGACY)
 * @deprecated Use requireInternalPermission() or requireTenantPermission() from lib/security
 */
export async function requireAnyRole(roles: SupportRole[]): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (!context.role || !roles.includes(context.role)) {
    throw new Error(`Unauthorized: One of the following roles required: ${roles.join(', ')}`)
  }

  return context
}

/**
 * Require permission to perform action (LEGACY)
 * @deprecated Use requireInternalPermission() or requireTenantPermission() from lib/security
 */
export async function requirePermission(action: string): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (!context.role || !canPerformAction(context.role, action)) {
    throw new Error(`Unauthorized: Permission to '${action}' required`)
  }

  return context
}

// ============================================================================
// NEW SCOPE-AWARE AUTH EXPORTS
// ============================================================================

// Re-export new auth functions for easy migration
export {
  getUserContext,
  requireInternalUser,
  requireTenantUser,
  Permission,
  TenantPermission,
  type UserContext,
  type InternalUserContext,
  type TenantUserContext,
}

// ============================================================================
// API ROUTE WRAPPERS (LEGACY)
// ============================================================================

/**
 * API route wrapper for authenticated endpoints (LEGACY)
 * @deprecated Use withAuth from lib/security for new implementations
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
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
 * API route wrapper for team member endpoints (LEGACY)
 * @deprecated Use withInternalAuth or withTenantAuth from lib/security
 */
export function withTeamMember(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireTeamMember()
      return await handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: 403 }
      )
    }
  }
}

/**
 * API route wrapper for role-based endpoints (LEGACY)
 * @deprecated Use withInternalPermission or withTenantPermission from lib/security
 */
export function withRole(
  requiredRole: SupportRole,
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireRole(requiredRole)
      return await handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: 403 }
      )
    }
  }
}

/**
 * API route wrapper for permission-based endpoints (LEGACY)
 * @deprecated Use withInternalPermission or withTenantPermission from lib/security
 */
export function withPermission(
  action: string,
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requirePermission(action)
      return await handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: 403 }
      )
    }
  }
}

