import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { TicketRepository } from '@/lib/repositories/tickets'

/**
 * GET /api/v1/tickets/:id/activity
 * Get activity feed for a ticket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      // Verify ticket exists
      const ticket = await TicketRepository.findById(id)
      if (!ticket) {
        return errorResponse('Ticket not found', 404)
      }

      // Get activity feed
      const activities = await ActivityFeedRepository.findByTicket(id)

      // Format activities with user names (simplified - TODO: fetch actual user names)
      const formattedActivities = activities.map((activity) => ({
        ...activity,
        user_name: null, // TODO: Fetch user name from team member
      }))

      return successResponse({ activities: formattedActivities })
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to fetch activity', 500)
    }
  })(req)
}
