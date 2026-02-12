import { auth } from '@clerk/nextjs/server'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

/**
 * User Mapping Service
 * Maps Clerk user IDs to internal support team member records
 */

export interface UserContext {
  userId: string // Clerk user ID
  teamMember: Awaited<ReturnType<typeof TeamMemberRepository.findByClerkUserId>> | null
  role: string | null
  isAuthenticated: boolean
}

/**
 * Get current user context from Clerk and map to team member
 */
export async function getCurrentUserContext(): Promise<UserContext> {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: '',
      teamMember: null,
      role: null,
      isAuthenticated: false,
    }
  }

  // Map Clerk user ID to team member
  const teamMember = await TeamMemberRepository.findByClerkUserId(userId)

  return {
    userId,
    teamMember,
    role: teamMember?.role || null,
    isAuthenticated: true,
  }
}

/**
 * Get team member by Clerk user ID
 */
export async function getTeamMemberByClerkId(clerkUserId: string) {
  return TeamMemberRepository.findByClerkUserId(clerkUserId)
}

/**
 * Get team member by internal user ID
 */
export async function getTeamMemberByUserId(userId: string) {
  return TeamMemberRepository.findByUserId(userId)
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const context = await getCurrentUserContext()
  return context.role === requiredRole
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const context = await getCurrentUserContext()
  return context.role ? roles.includes(context.role) : false
}

/**
 * Check if user is authenticated and is a team member
 */
export async function isTeamMember(): Promise<boolean> {
  const context = await getCurrentUserContext()
  return context.isAuthenticated && context.teamMember !== null
}

/**
 * Get user's permissions based on role
 */
export async function getUserPermissions() {
  const context = await getCurrentUserContext()
  
  if (!context.teamMember) {
    return {
      canViewTickets: false,
      canCreateTickets: false,
      canAssignTickets: false,
      canResolveTickets: false,
      canViewAnalytics: false,
      canManageTeam: false,
      canManageKB: false,
      canViewCustomerHealth: false,
    }
  }

  const role = context.teamMember.role

  // Define permissions by role
  const permissions = {
    support_agent: {
      canViewTickets: true,
      canCreateTickets: true,
      canAssignTickets: false, // Only managers can assign
      canResolveTickets: true,
      canViewAnalytics: false,
      canManageTeam: false,
      canManageKB: true, // Can create/edit KB articles
      canViewCustomerHealth: false,
    },
    support_manager: {
      canViewTickets: true,
      canCreateTickets: true,
      canAssignTickets: true,
      canResolveTickets: true,
      canViewAnalytics: true,
      canManageTeam: true,
      canManageKB: true,
      canViewCustomerHealth: true,
    },
    csm: {
      canViewTickets: true,
      canCreateTickets: true,
      canAssignTickets: false,
      canResolveTickets: true,
      canViewAnalytics: true,
      canManageTeam: false,
      canManageKB: true,
      canViewCustomerHealth: true,
      canManageOnboarding: false, // Client Success Manager cannot create/manage onboarding (post-onboarding only)
    },
    client_onboarding_manager: {
      canViewTickets: false,
      canCreateTickets: false,
      canAssignTickets: false,
      canResolveTickets: false,
      canViewAnalytics: false,
      canManageTeam: false,
      canManageKB: false,
      canViewCustomerHealth: false,
      canManageOnboarding: true, // Only Client Onboarding Manager can create/manage onboarding
    },
    head_of_cs: {
      canViewTickets: true,
      canCreateTickets: true,
      canAssignTickets: true,
      canResolveTickets: true,
      canViewAnalytics: true,
      canManageTeam: true,
      canManageKB: true,
      canViewCustomerHealth: true,
    },
    solutions_engineer: {
      canViewTickets: true,
      canCreateTickets: true,
      canAssignTickets: false,
      canResolveTickets: true,
      canViewAnalytics: false,
      canManageTeam: false,
      canManageKB: true,
      canViewCustomerHealth: false,
    },
  }

  return permissions[role] || permissions.support_agent
}

