/**
 * Sales WebChat Session API
 * 
 * POST /api/v1/sales-webchat/session - Create or get sales chat session (prospects only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { SalesWebChatService } from '@/lib/services/sales-webchat-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospect_email, prospect_name, prospect_phone } = body

    const session = await SalesWebChatService.getOrCreateSalesSession(
      prospect_email,
      prospect_name,
      prospect_phone
    )

    return successResponse(session)
  } catch (error: any) {
    if (error.message === 'EXISTING_CUSTOMER_REDIRECT') {
      return errorResponse(
        'Existing customers should use the customer support portal',
        302,
        { redirect_url: '/customer-portal/support' }
      )
    }
    console.error('Error creating sales webchat session:', error)
    return errorResponse('Failed to create chat session', 500, error.message)
  }
}
