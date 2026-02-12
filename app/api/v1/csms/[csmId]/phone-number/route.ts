/**
 * CSM Phone Number Management API
 * 
 * GET /api/v1/csms/[csmId]/phone-number - Get CSM's phone number
 * POST /api/v1/csms/[csmId]/phone-number - Update CSM's phone number
 * 
 * Leverages Sales CRM phone number service
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { salesServiceClient } from '@/lib/integrations/sales-client'
import { z } from 'zod'

const updatePhoneNumberSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required'),
  twilio_number_sid: z.string().optional(),
  virtual_number_provider: z.enum(['twilio', 'other']).optional().default('twilio'),
})

/**
 * GET /api/v1/csms/[csmId]/phone-number
 * Get CSM's phone number from Sales CRM service
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ csmId: string }> }
) {
  const { csmId } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      // Get phone number from Sales CRM service
      const phoneResult = await salesServiceClient.getPhoneNumber({
        user_id: csmId,
        call_type: 'direct_call',
        service: 'cs_support',
      })

      return successResponse({
        phone_number: phoneResult.phone_number,
        number_type: phoneResult.number_type,
        user_id: csmId,
      })
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get phone number',
        500
      )
    }
  })(req)
}

/**
 * POST /api/v1/csms/[csmId]/phone-number
 * Update CSM's phone number via Sales CRM service
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ csmId: string }> }
) {
  const { csmId } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      // Validate request body
      const validation = await validateBody(req, updatePhoneNumberSchema)
      if (!validation.success) {
        return validation.response
      }

      const { phone_number, twilio_number_sid, virtual_number_provider } = validation.data

      // Update phone number via Sales CRM service
      const result = await salesServiceClient.updatePhoneNumber(
        csmId,
        phone_number,
        twilio_number_sid,
        virtual_number_provider
      )

      return successResponse({
        phone_number,
        twilio_number_sid,
        virtual_number_provider,
        user_id: csmId,
        updated: true,
      }, 'Phone number updated successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to update phone number',
        500
      )
    }
  })(req)
}
