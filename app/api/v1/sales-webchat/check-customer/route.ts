/**
 * Sales WebChat - Check Customer API
 * 
 * POST /api/v1/sales-webchat/check-customer - Check if visitor is existing customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { SalesWebChatService } from '@/lib/services/sales-webchat-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, phone } = body

    const result = await SalesWebChatService.checkIfCustomer(email, phone)

    return successResponse(result)
  } catch (error: any) {
    console.error('Error checking customer status:', error)
    return errorResponse('Failed to check customer status', 500, error.message)
  }
}
