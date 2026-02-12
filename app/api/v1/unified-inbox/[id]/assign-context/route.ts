/**
 * Assign Conversation to Context API
 * 
 * POST /api/v1/unified-inbox/[id]/assign-context - Assign conversation to context
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { UnifiedInboxService } from '@/lib/services/unified-inbox-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: conversationId } = await params
    const body = await req.json()
    const { context_id, assigned_team, priority } = body

    if (!context_id) {
      return errorResponse('context_id is required', 400)
    }

    await UnifiedInboxService.assignToContext(
      conversationId,
      context_id,
      assigned_team,
      priority || 0
    )

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error assigning conversation to context:', error)
    return errorResponse('Failed to assign conversation', 500, error.message)
  }
}
