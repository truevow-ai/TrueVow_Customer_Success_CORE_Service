/**
 * WebChat Session API
 * 
 * POST /api/v1/webchat/session - Create or get chat session
 */

import { NextRequest, NextResponse } from 'next/server'
import { UnifiedWebChatService } from '@/lib/services/unified-webchat-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_email, customer_id, tenant_id } = body

    const session = await UnifiedWebChatService.getOrCreateSession(
      customer_email,
      customer_id,
      tenant_id
    )

    return successResponse(session)
  } catch (error: any) {
    console.error('Error creating webchat session:', error)
    return errorResponse('Failed to create chat session', 500, error.message)
  }
}
