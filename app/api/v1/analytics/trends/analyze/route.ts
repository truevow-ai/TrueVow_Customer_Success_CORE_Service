/**
 * Analyze Trends API
 * 
 * POST /api/v1/analytics/trends/analyze
 * Analyze tickets and surveys for trends
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { TrendAnalysisService } from '@/lib/services/trend-analysis'

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 10, // Lower limit for analysis operations
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const body = await req.json()
      const tenantId = body.tenant_id
      const periodStart = body.period_start ? new Date(body.period_start) : undefined
      const periodEnd = body.period_end ? new Date(body.period_end) : undefined

      // Validate tenant ID if provided
      if (tenantId) {
        validateInput(tenantId, 'uuid')
      }

      // Validate dates if provided
      if (periodStart && isNaN(periodStart.getTime())) {
        return errorResponse('Invalid period_start date format. Use YYYY-MM-DD', 400)
      }
      if (periodEnd && isNaN(periodEnd.getTime())) {
        return errorResponse('Invalid period_end date format. Use YYYY-MM-DD', 400)
      }

      // Analyze trends
      const trends = await TrendAnalysisService.analyzeTickets(tenantId, periodStart, periodEnd)

      return successResponse(trends)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to analyze trends',
        500
      )
    }
  })
)



