/**
 * WebChat Read API
 * 
 * POST /api/v1/webchat/[id]/read - Mark chat as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { UnifiedWebChatService } from '@/lib/services/unified-webchat-service'
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

    await UnifiedWebChatService.markAsRead(conversationId, context.userId)

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error marking chat as read:', error)
    return errorResponse('Failed to mark as read', 500, error.message)
  }
}
