/**
 * Process Ticket Resolution for Survey
 * 
 * POST /api/v1/surveys/process-resolution
 * Called when a ticket is resolved to queue surveys
 * 
 * SECURITY: This endpoint should be protected with API key or webhook signature
 */

import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { CSATNPSSurveyService } from '@/lib/services/csat-nps-survey'
import { z } from 'zod'

// SECURITY: Verify API key (for service-to-service calls)
function verifyApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')
  const expectedKey = process.env.SURVEY_API_KEY
  
  if (!expectedKey) {
    console.warn('SURVEY_API_KEY not configured')
    return true // Allow in development
  }
  
  return apiKey === expectedKey
}

const processResolutionSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
}).strict()

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 50,
  },
  async (req: NextRequest) => {
    try {
      // SECURITY: Verify API key
      if (!verifyApiKey(req)) {
        return errorResponse('Invalid API key', 401)
      }

      const body = await req.json()
      const validation = processResolutionSchema.safeParse(body)
      
      if (!validation.success) {
        return errorResponse('Invalid request data', 400)
      }

      const { ticketId } = validation.data

      // Validate ticket ID
      const sanitizedTicketId = validateInput(ticketId, 'uuid')

      // Process ticket resolution
      await CSATNPSSurveyService.processTicketResolution(sanitizedTicketId)

      return successResponse({ success: true }, 'Survey queued for ticket resolution')
    } catch (error) {
      console.error('Process resolution error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to process ticket resolution',
        500
      )
    }
  }
)



