/**
 * Playbook Statistics API
 * 
 * GET /api/v1/playbooks/[id]/stats?period_start=...&period_end=...
 * Get playbook execution statistics
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context: { params: { id: string } }) => {
    try {
      const playbookId = context.params.id
      const searchParams = req.nextUrl.searchParams
      const periodStartParam = searchParams.get('period_start')
      const periodEndParam = searchParams.get('period_end')

      if (!playbookId) {
        return errorResponse('Playbook ID is required', 400)
      }

      const sanitizedId = validateInput(playbookId, 'uuid')

      // Parse dates (default to last 30 days)
      const periodStart = periodStartParam
        ? new Date(periodStartParam)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const periodEnd = periodEndParam
        ? new Date(periodEndParam)
        : new Date()

      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return errorResponse('Invalid date format. Use YYYY-MM-DD', 400)
      }

      const stats = await SuccessPlaybooksService.getPlaybookStats(sanitizedId, periodStart, periodEnd)

      return successResponse(stats)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get playbook statistics',
        500
      )
    }
  })
)
