/**
 * Sales WebChat Messages API
 * 
 * GET /api/v1/sales-webchat/[id]/messages - Get chat messages
 * POST /api/v1/sales-webchat/[id]/messages - Send chat message
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { SalesWebChatService } from '@/lib/services/sales-webchat-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await SalesWebChatService.getMessages(conversationId, limit)

    return successResponse(messages)
  } catch (error: any) {
    console.error('Error fetching sales chat messages:', error)
    return errorResponse('Failed to fetch messages', 500, error.message)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow both authenticated (agent) and unauthenticated (prospect) requests
    let context: any = null
    try {
      context = await requireAuth(req)
    } catch {
      // Prospect request - no auth required
    }

    const { id: conversationId } = await params
    const body = await req.json()
    const { body: messageBody, from_type } = body

    if (!messageBody) {
      return errorResponse('message body is required', 400)
    }

    // Determine from_type: agent if authenticated, prospect if not
    const finalFromType = from_type || (context?.userId ? 'agent' : 'prospect')

    const message = await SalesWebChatService.sendMessage(
      conversationId,
      finalFromType,
      messageBody,
      context?.userId || undefined
    )

    return successResponse(message)
  } catch (error: any) {
    console.error('Error sending sales chat message:', error)
    return errorResponse('Failed to send message', 500, error.message)
  }
}
