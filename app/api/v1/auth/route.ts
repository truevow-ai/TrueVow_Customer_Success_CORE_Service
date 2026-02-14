import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { getCurrentUserContext } from '@/lib/services/user-mapping'

/**
 * GET /api/v1/auth
 * Get current authenticated user information
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  const userContext = await getCurrentUserContext()

  if (!userContext.teamMember) {
    return errorResponse('User is not a team member', 403)
  }

  return successResponse({
    userId: context.userId,
    teamMemberId: context.teamMemberId,
    role: context.role,
    teamMember: {
      memberId: userContext.teamMember.member_id,
      role: userContext.teamMember.role,
      isActive: userContext.teamMember.is_active,
      timezone: userContext.teamMember.timezone,
      skills: userContext.teamMember.skills,
      maxTickets: userContext.teamMember.max_tickets,
    },
  })
})




