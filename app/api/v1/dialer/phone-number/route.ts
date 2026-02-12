/**
 * Dialer Phone Number API
 * 
 * GET /api/v1/dialer/phone-number - Get phone number for outbound call
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { UnifiedDialerService } from '@/lib/services/unified-dialer-service'

/**
 * GET /api/v1/dialer/phone-number
 * Get phone number for outbound call
 */
export async function GET(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const userId = context.userId || context.teamMemberId || ''
      const searchParams = req.nextUrl.searchParams

      if (!userId) {
        return errorResponse('User ID not found', 401)
      }

      const callType = (searchParams.get('call_type') || 'outbound') as 'inbound' | 'outbound'
      const campaignId = searchParams.get('campaign_id') || undefined
      const department = 'customer_support' // CS Support department

      // Get phone number using unified dialer service
      const phoneResult = await UnifiedDialerService.getPhoneNumber({
        user_id: userId,
        department,
        call_type: callType,
        campaign_id: campaignId,
      })

      return successResponse({
        phone_number: phoneResult.phone_number,
        twilio_number_sid: phoneResult.twilio_number_sid,
        assignment_type: phoneResult.assignment_type,
        source: phoneResult.source,
      })
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get phone number',
        500
      )
    }
  })(req)
}
