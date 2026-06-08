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

  if (!userContext) {
    return errorResponse('User context not found', 404)
  }

  return successResponse({
    userId: context.userId,
    teamMemberId: context.teamMemberId,
    role: context.role,
    teamMember: {
      memberId: userContext.teamId || '',
      role: userContext.role,
      isActive: true,
      timezone: 'America/New_York',
      skills: [],
      maxTickets: 50,
    },
  })
})




