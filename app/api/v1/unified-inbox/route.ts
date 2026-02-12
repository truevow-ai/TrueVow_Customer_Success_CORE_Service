/**
 * Unified Inbox API
 * 
 * GET /api/v1/unified-inbox - Get conversations for a context
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { UnifiedInboxService, InboxContext } from '@/lib/services/unified-inbox-service'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = req.nextUrl.searchParams
    const contextType = (searchParams.get('context') || 'cs') as InboxContext
    const channel = searchParams.get('channel') || undefined
    const status = searchParams.get('status') || undefined
    const assigned_to = searchParams.get('assigned_to') || undefined
    const search = searchParams.get('search') || undefined
    const tags = searchParams.get('tags')?.split(',') || undefined

    const { page, limit } = getPagination(req)

    const result = await UnifiedInboxService.getConversationsForContext(
      contextType,
      {
        context: contextType,
        channel,
        status,
        assigned_to,
        search,
        tags,
        page,
        limit,
      },
      context.userId,
      context.tenantId
    )

    return successResponse(result)
  } catch (error: any) {
    console.error('Error fetching unified inbox:', error)
    return errorResponse('Failed to fetch conversations', 500, error.message)
  }
}
