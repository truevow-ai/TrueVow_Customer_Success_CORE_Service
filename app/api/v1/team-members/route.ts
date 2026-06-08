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
      label: (member.metadata as any)?.display_name || member.clerk_user_id.replace(/^user_/, 'User ').substring(0, 16),
      role: member.role,
    }))

    return successResponse({ teamMembers: formatted })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch team members', 500)
  }
})



