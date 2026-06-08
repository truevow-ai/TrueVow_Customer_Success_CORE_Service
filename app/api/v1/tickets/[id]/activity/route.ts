import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { TicketRepository } from '@/lib/repositories/tickets'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

function resolveName(clerkId: string, resolvedNames: Map<string, string>): string {
  const display = resolvedNames.get(clerkId)
  if (display) return display
  return clerkId.replace(/^user_/, 'User ').substring(0, 16)
}

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

      const clerkIds = [...new Set(activities.map(a => a.user_id || '').filter(Boolean))]
      const members = await Promise.all(clerkIds.map(cid => TeamMemberRepository.findByClerkUserId(cid).catch(() => null)))
      const resolvedNames = new Map<string, string>()
      for (const m of members) {
        if (m) resolvedNames.set(m.clerk_user_id, (m.metadata as any)?.display_name || '')
      }

      const formattedActivities = activities.map((activity) => ({
        ...activity,
        user_name: activity.user_id ? resolveName(activity.user_id, resolvedNames) : null,
      }))

      return successResponse({ activities: formattedActivities })
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to fetch activity', 500)
    }
  })(req)
}
