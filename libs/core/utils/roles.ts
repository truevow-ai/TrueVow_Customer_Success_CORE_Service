/**
 * Role definitions and utilities
 */

export type SupportRole = 
  | 'support_agent'
  | 'support_manager'
  | 'csm'
  | 'head_of_cs'
  | 'solutions_engineer'
  | 'client_onboarding_manager'

export const ROLES = {
  SUPPORT_AGENT: 'support_agent',
  SUPPORT_MANAGER: 'support_manager',
  CSM: 'csm',
  HEAD_OF_CS: 'head_of_cs',
  SOLUTIONS_ENGINEER: 'solutions_engineer',
  CLIENT_ONBOARDING_MANAGER: 'client_onboarding_manager',
} as const

export const ROLE_DISPLAY_NAMES: Record<SupportRole, string> = {
  support_agent: 'Support Agent',
  support_manager: 'Support Manager',
  csm: 'Client Success Manager',
  head_of_cs: 'Head of Customer Success',
  solutions_engineer: 'Solutions Engineer',
  client_onboarding_manager: 'Client Onboarding Manager',
}

export const ROLE_HIERARCHY: Record<SupportRole, number> = {
  support_agent: 1,
  solutions_engineer: 2,
  client_onboarding_manager: 2.5, // Separate track for onboarding
  csm: 3,
  support_manager: 4,
  head_of_cs: 5,
}

/**
 * Check if a role has permission to perform an action
 */
export function canPerformAction(
  userRole: SupportRole,
  action: string
): boolean {
  const roleLevel = ROLE_HIERARCHY[userRole]

  // Define action requirements
  const actionRequirements: Record<string, number> = {
    view_tickets: 1,
    create_tickets: 1,
    assign_tickets: 4, // Manager and above
    resolve_tickets: 1,
    view_analytics: 3, // CSM and above
    manage_team: 4, // Manager and above
    manage_kb: 1,
    view_customer_health: 3, // CSM and above
    manage_sla: 4, // Manager and above
    view_reports: 3, // CSM and above
    manage_billing: 5, // Head of CS only
  }

  const requiredLevel = actionRequirements[action] || 999
  return roleLevel >= requiredLevel
}

/**
 * Check if user role is higher than or equal to another role
 */
export function isRoleHigherOrEqual(
  userRole: SupportRole,
  compareRole: SupportRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[compareRole]
}

/**
 * Get all roles that are lower than the given role
 */
export function getLowerRoles(role: SupportRole): SupportRole[] {
  const roleLevel = ROLE_HIERARCHY[role]
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < roleLevel)
    .map(([role]) => role as SupportRole)
}

/**
 * Get all roles that are higher than or equal to the given role
 */
export function getHigherOrEqualRoles(role: SupportRole): SupportRole[] {
  const roleLevel = ROLE_HIERARCHY[role]
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level >= roleLevel)
    .map(([role]) => role as SupportRole)
}

