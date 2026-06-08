/**
 * Health Score Calculation API (PROXY LAYER)
 *
 * @deprecated This endpoint is deprecated. Use /api/intelligence/health/calculate instead.
 *
 * POST /api/v1/health/calculate
 * Calculate or recalculate health score for a customer.
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - This endpoint now proxies to SaaS Admin
 * - CS Core does NOT compute health scores locally
 * - The actual calculation happens in SaaS Admin
 *
 * Migration Date: 2026-03-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { calculateHealthScore } from '@/lib/intelligence/client'
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

      // Proxy to SaaS Admin - NO local computation
      const response = await calculateHealthScore(tenantId, customerEmail)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return NextResponse.json(
          { error: errorData.error || 'Failed to calculate health score in SaaS Admin' },
          { status: response.status }
        )
      }

      const healthScore = await response.json()

      // Add deprecation header
      return NextResponse.json(
        {
          success: true,
          data: healthScore,
          message: 'Health score calculated successfully',
          _deprecated: 'This endpoint is deprecated. Use /api/intelligence/health/calculate instead.'
        },
        {
          status: 200,
          headers: {
            'X-Deprecated': 'true',
            'X-Deprecation-Message': 'Use /api/intelligence/health/calculate instead',
            'X-Migration-Date': '2026-03-08'
          }
        }
      )
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to calculate health score',
        500
      )
    }
  })
)
