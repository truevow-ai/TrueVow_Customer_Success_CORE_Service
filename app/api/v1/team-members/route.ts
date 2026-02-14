import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

/**
 * GET /api/v1/team-members
 * Get list of active team members for assignment dropdowns
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const teamMembers = await TeamMemberRepository.findAll({
      isActive: true,
    })

    // Format for dropdown
    const formatted = teamMembers.map((member) => ({
      value: member.member_id,
      label: member.clerk_user_id, // TODO: Get actual name from user profile
      role: member.role,
    }))

    return successResponse({ teamMembers: formatted })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch team members', 500)
  }
})



