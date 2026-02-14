/**
 * Expansion Opportunities API
 * 
 * GET /api/v1/expansion/opportunities?tenant_id=...&status=...
 * Get expansion opportunities
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { ExpansionTriggersService } from '@/lib/services/expansion-triggers'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const statusParam = searchParams.get('status')
      const limitParam = searchParams.get('limit')

      const tenantId = tenantIdParam ? validateInput(tenantIdParam, 'uuid') : undefined
      const status = statusParam || undefined
      const limit = limitParam ? parseInt(limitParam, 10) : 50

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return errorResponse('limit must be between 1 and 100', 400)
      }

      const opportunities = await ExpansionTriggersService.getOpportunities(tenantId, status, limit)

      return successResponse(opportunities)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get expansion opportunities',
        500
      )
    }
  })
)



