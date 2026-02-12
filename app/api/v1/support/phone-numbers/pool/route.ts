/**
 * Support Pool Phone Numbers API
 * 
 * GET /api/v1/support/phone-numbers/pool - Get pool phone number for support team
 * 
 * Leverages Sales CRM phone number service for pool number assignment
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { salesServiceClient } from '@/lib/integrations/sales-client'

/**
 * GET /api/v1/support/phone-numbers/pool
 * Get pool phone number for support team calls
 */
export async function GET(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const campaignId = searchParams.get('campaign_id') || undefined
      const userId = context.userId || context.teamMemberId || ''

      // Get pool phone number from Sales CRM service
      const phoneResult = await salesServiceClient.getPhoneNumber({
        user_id: userId,
        call_type: 'parallel_dialing',
        service: 'cs_support',
        campaign_id: campaignId,
      })

      return successResponse({
        phone_number: phoneResult.phone_number,
        number_type: phoneResult.number_type,
        campaign_id: campaignId,
        service: 'cs_support',
      })
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get pool phone number',
        500
      )
    }
  })(req)
}
