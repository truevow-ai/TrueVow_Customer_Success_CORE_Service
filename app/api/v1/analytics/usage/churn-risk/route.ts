/**
 * Churn Risk API
 * 
 * GET /api/v1/analytics/usage/churn-risk?tenant_id=...&risk_level=high&limit=50
 * Get users at risk of churn
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { UsageAnalyticsService } from '@/lib/services/usage-analytics'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const riskLevelParam = searchParams.get('risk_level')
      const limitParam = searchParams.get('limit')

      if (!tenantIdParam) {
        return errorResponse('tenant_id is required', 400)
      }

      // Validate tenant ID
      const tenantId = validateInput(tenantIdParam, 'uuid')

      // Parse risk level
      const riskLevel = (riskLevelParam === 'critical' ? 'critical' : 'high') as 'high' | 'critical'
      
      // Parse limit
      const limit = limitParam ? parseInt(limitParam, 10) : 50
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return errorResponse('limit must be between 1 and 100', 400)
      }

      // Get at-risk users
      const atRiskUsers = await UsageAnalyticsService.getAtRiskUsers(tenantId, riskLevel, limit)

      return successResponse(atRiskUsers)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get churn risk data',
        500
      )
    }
  })
)
