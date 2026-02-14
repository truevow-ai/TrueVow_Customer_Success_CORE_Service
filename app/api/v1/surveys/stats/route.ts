/**
 * Survey Statistics API
 * 
 * GET /api/v1/surveys/stats?tenant_id=...&period_start=...&period_end=...
 * Get CSAT/NPS statistics
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { CSATNPSSurveyService } from '@/lib/services/csat-nps-survey'

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

      if (!tenantIdParam) {
        return errorResponse('tenant_id is required', 400)
      }

      // Validate tenant ID
      const tenantId = validateInput(tenantIdParam, 'uuid')

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

      // Get survey statistics
      const stats = await CSATNPSSurveyService.getSurveyStats(tenantId, periodStart, periodEnd)

      return successResponse(stats)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get survey statistics',
        500
      )
    }
  })
)



