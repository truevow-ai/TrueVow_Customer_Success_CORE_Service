/**
 * Product Feedback API
 * 
 * GET /api/v1/analytics/trends/feedback?tenant_id=...&period_start=...&period_end=...
 * Get product feedback extracted from tickets and surveys
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { TrendAnalysisService } from '@/lib/services/trend-analysis'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const periodStartParam = searchParams.get('period_start')
      const periodEndParam = searchParams.get('period_end')

      // Parse tenant ID
      const tenantId = tenantIdParam ? validateInput(tenantIdParam, 'uuid') : undefined

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

      // Extract product feedback
      const feedback = await TrendAnalysisService.extractProductFeedback(tenantId, periodStart, periodEnd)

      return successResponse(feedback)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get product feedback',
        500
      )
    }
  })
)
