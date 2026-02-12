/**
 * WebChat End Session API
 * 
 * POST /api/v1/webchat/[id]/end - End chat session
 */

import { NextRequest, NextResponse } from 'next/server'
import { UnifiedWebChatService } from '@/lib/services/unified-webchat-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params

    await UnifiedWebChatService.endSession(conversationId)

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error ending chat session:', error)
    return errorResponse('Failed to end session', 500, error.message)
  }
}
