/**
 * Health Score API
 * 
 * GET /api/v1/health/score?tenant_id=...&customer_email=...
 * Get health score for a customer
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { HealthScoringService } from '@/lib/services/health-scoring'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 requests per minute (read-only)
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const customerEmailParam = searchParams.get('customer_email')

      if (!tenantIdParam || !customerEmailParam) {
        return errorResponse('tenant_id and customer_email are required', 400)
      }

      // Validate inputs
      const tenantId = validateInput(tenantIdParam, 'uuid')
      const customerEmail = validateInput(customerEmailParam, 'email')

      // Get health score
      const healthScore = await HealthScoringService.getHealthScore(tenantId, customerEmail)

      if (!healthScore) {
        return successResponse(null, 'Health score not found')
      }

      return successResponse(healthScore)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get health score',
        500
      )
    }
  })
)



