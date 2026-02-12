/**
 * Send Scheduled Surveys
 * 
 * POST /api/v1/surveys/send-scheduled
 * Called by background job/cron to send scheduled surveys
 * 
 * SECURITY: This endpoint should be protected with API key
 */

import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { CSATNPSSurveyService } from '@/lib/services/csat-nps-survey'

// SECURITY: Verify API key (for cron jobs)
function verifyApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')
  const expectedKey = process.env.CRON_API_KEY || process.env.SURVEY_API_KEY
  
  if (!expectedKey) {
    console.warn('CRON_API_KEY not configured')
    return true // Allow in development
  }
  
  return apiKey === expectedKey
}

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 10, // Lower limit for cron jobs
  },
  async (req: NextRequest) => {
    try {
      // SECURITY: Verify API key
      if (!verifyApiKey(req)) {
        return errorResponse('Invalid API key', 401)
      }

      // Send scheduled surveys
      await CSATNPSSurveyService.sendScheduledSurveys()

      return successResponse({ success: true }, 'Scheduled surveys processed')
    } catch (error) {
      console.error('Send scheduled surveys error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to send scheduled surveys',
        500
      )
    }
  }
)
