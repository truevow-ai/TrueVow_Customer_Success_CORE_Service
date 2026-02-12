import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { AnalyticsService } from '@/lib/services/analytics'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { z } from 'zod'

const dashboardQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

/**
 * GET /api/v1/analytics/dashboard
 * Get comprehensive dashboard metrics
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Default to last 30 days if not provided
    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const defaultTo = now.toISOString()

    const timeRange = {
      from: from || defaultFrom,
      to: to || defaultTo,
    }

    // Get team member for tenant ID
    const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
    if (!teamMember) {
      return errorResponse('Team member not found', 404)
    }

    const metrics = await AnalyticsService.getDashboardMetrics(
      teamMember.tenant_id,
      timeRange
    )

    return successResponse(metrics)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch analytics',
      500
    )
  }
})
