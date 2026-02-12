/**
 * Unified Inbox Contexts API
 * 
 * GET /api/v1/unified-inbox/contexts - Get available contexts for user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { UnifiedInboxService } from '@/lib/services/unified-inbox-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const contexts = await UnifiedInboxService.getAvailableContexts(
      context.userId,
      context.tenantId
    )

    return successResponse(contexts)
  } catch (error: any) {
    console.error('Error fetching inbox contexts:', error)
    return errorResponse('Failed to fetch contexts', 500, error.message)
  }
}
