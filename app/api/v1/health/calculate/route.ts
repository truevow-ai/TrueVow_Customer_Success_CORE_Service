/**
 * Health Score Calculation API
 * 
 * POST /api/v1/health/calculate
 * Calculate or recalculate health score for a customer
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { HealthScoringService } from '@/lib/services/health-scoring'
import { z } from 'zod'

const calculateSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  customerEmail: z.string().email('Invalid customer email'),
}).strict()

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 10, // 10 calculations per minute
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, calculateSchema)
      if (!validation.success) {
        return validation.response
      }

      const { tenantId, customerEmail } = validation.data

      // Calculate health score
      const healthScore = await HealthScoringService.calculateHealthScore(tenantId, customerEmail)

      return successResponse(healthScore, 'Health score calculated successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to calculate health score',
        500
      )
    }
  })
)
