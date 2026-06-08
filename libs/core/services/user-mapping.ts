/**
 * User Mapping Service v2.0.0
 * 
 * Maps Clerk user IDs to internal user contexts and roles.
 * Supports scope-aware auth model (internal vs tenant users).
 * 
 * MIGRATION STATUS: Supports both legacy team member model and new scope-aware model.
 * 
 * @deprecated For new code, use lib/security module directly
 */

import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/db/supabase'
import { DEV_DEFAULTS } from '@/lib/config/app-config'

// Import new scope-aware types
import {
  getUserContext,
  UserContext,
  InternalUserContext,
  TenantUserContext,
  type AuthScope,
  type InternalRole,
  type TenantRole,
} from '@/lib/security'

/**
 * Legacy UserContext interface
 * @deprecated Use UserContext from lib/security
 */
export interface LegacyUserContext {
  userId: string
  email: string
  role: string
  teamId?: string
  permissions: string[]
  /** @deprecated Use scope-aware auth */
  tenantId?: string
  /** Scope identifier (internal or tenant) */
  scope?: AuthScope
}

/**
 * Get current user context from Clerk session (LEGACY)
 * @deprecated Use getUserContext() from lib/security for new implementations
 */
export async function getCurrentUserContext(): Promise<LegacyUserContext | null> {
  const { userId, sessionClaims } = await auth()
  
  // Development mode: if no userId, check for development override
  if (!userId && process.env.NODE_ENV === 'development') {
    // Return a mock CSM user for development/testing
    // NOTE: teamId must be configured via DEV_TEAM_ID environment variable
    // No hardcoded values - everything flows from configuration
    const devTeamId = process.env.DEV_TEAM_ID || undefined
    return {
      userId: DEV_DEFAULTS.MOCK_USER_ID,
      email: DEV_DEFAULTS.MOCK_EMAIL,
      role: DEV_DEFAULTS.MOCK_ROLE,
      teamId: devTeamId,
      permissions: [],
      scope: 'internal', // Default to internal for dev mode
    };
  }
  
  if (!userId) {
    return null
  }

  // Try to get scope-aware context first
  try {
    const scopeContext = await getUserContext()
    
    if (scopeContext) {
      // Map new context to legacy format
      return {
        userId: scopeContext.userId,
        email: scopeContext.email,
        role: scopeContext.isInternal() 
          ? scopeContext.internalRole 
          : scopeContext.tenantRole,
        teamId: scopeContext.isInternal() ? undefined : scopeContext.tenantId,
        tenantId: scopeContext.isTenant() ? scopeContext.tenantId : undefined,
        permissions: [],
        scope: scopeContext.scope,
      }
    }
  } catch (error) {
    // Fall through to legacy database lookup
    console.warn('Scope-aware auth failed, falling back to legacy lookup:', error)
  }

  // Legacy database lookup
  const supabase = await createServerSupabase()
  
  // Get user details from database (look in cs_team_members table)
  const { data: teamMember, error } = await supabase
    .from('cs_team_members')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !teamMember) {
    return null
  }

  return {
    userId: teamMember.clerk_user_id,
    email: `${teamMember.clerk_user_id}@example.com`, // Placeholder email
    role: teamMember.role,
    teamId: teamMember.member_id, // Use member_id as the team member identifier
    tenantId: teamMember.tenant_id, // Include tenant_id if available
    permissions: [],
    scope: teamMember.tenant_id ? 'tenant' : 'internal',
  }
}

/**
 * Check if user is a team member
 */
export async function isTeamMember(): Promise<boolean> {
  const userContext = await getCurrentUserContext()
  return userContext !== null
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const userContext = await getCurrentUserContext()
  if (!userContext) return false
  
  return roles.includes(userContext.role)
}

/**
 * Check if user has all of the specified roles
 */
export async function hasAllRoles(roles: string[]): Promise<boolean> {
  const userContext = await getCurrentUserContext()
  if (!userContext) return false
  
  return roles.every(role => userContext.role === role)
}

// ============================================================================
// NEW SCOPE-AWARE EXPORTS
// ============================================================================

// Re-export new auth functions for convenience
export {
  getUserContext,
  type UserContext,
  type InternalUserContext,
  type TenantUserContext,
  type AuthScope,
  type InternalRole,
  type TenantRole,
}