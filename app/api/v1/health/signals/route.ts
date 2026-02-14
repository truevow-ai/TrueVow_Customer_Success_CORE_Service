/**
 * Health Signals API
 * 
 * GET /api/v1/health/signals?tenant_id=...&customer_email=...&limit=20
 * Get recent health signals for a customer
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
      const limitParam = searchParams.get('limit')

      if (!tenantIdParam || !customerEmailParam) {
        return errorResponse('tenant_id and customer_email are required', 400)
      }

      // Validate inputs
      const tenantId = validateInput(tenantIdParam, 'uuid')
      const customerEmail = validateInput(customerEmailParam, 'email')
      const limit = limitParam ? parseInt(limitParam, 10) : 20

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return errorResponse('limit must be between 1 and 100', 400)
      }

      // Get signals
      const signals = await HealthScoringService.getRecentSignals(tenantId, customerEmail, limit)

      return successResponse(signals)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get health signals',
        500
      )
    }
  })
)



