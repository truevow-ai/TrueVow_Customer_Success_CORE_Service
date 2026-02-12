import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserContext, isTeamMember } from '@/lib/services/user-mapping'
import { canPerformAction, SupportRole } from '@/lib/utils/roles'

/**
 * Authentication and Authorization Middleware
 */

export interface AuthContext {
  userId: string
  teamMemberId: string | null
  role: SupportRole | null
  isAuthenticated: boolean
}

/**
 * Get authentication context from request
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth()
  const userContext = await getCurrentUserContext()

  return {
    userId: userId || '',
    teamMemberId: userContext.teamMember?.member_id || null,
    role: (userContext.role as SupportRole) || null,
    isAuthenticated: userContext.isAuthenticated,
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext()

  if (!context.isAuthenticated) {
    throw new Error('Unauthorized: Authentication required')
  }

  return context
}

/**
 * Require team member (must be mapped to support team)
 */
export async function requireTeamMember(): Promise<AuthContext> {
  const context = await requireAuth()

  if (!context.teamMemberId) {
    throw new Error('Unauthorized: User must be a team member')
  }

  return context
}

/**
 * Require specific role
 */
export async function requireRole(requiredRole: SupportRole): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (context.role !== requiredRole) {
    throw new Error(`Unauthorized: Role '${requiredRole}' required`)
  }

  return context
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: SupportRole[]): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (!context.role || !roles.includes(context.role)) {
    throw new Error(`Unauthorized: One of the following roles required: ${roles.join(', ')}`)
  }

  return context
}

/**
 * Require permission to perform action
 */
export async function requirePermission(action: string): Promise<AuthContext> {
  const context = await requireTeamMember()

  if (!context.role || !canPerformAction(context.role, action)) {
    throw new Error(`Unauthorized: Permission to '${action}' required`)
  }

  return context
}

/**
 * API route wrapper for authenticated endpoints
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
 * API route wrapper for team member endpoints
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
 * API route wrapper for role-based endpoints
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
 * API route wrapper for permission-based endpoints
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

