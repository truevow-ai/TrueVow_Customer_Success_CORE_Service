/**
 * Survey Response API
 * 
 * POST /api/v1/surveys/response
 * Record a survey response (called by survey form submission)
 */

import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput, sanitizeObject } from '@/lib/utils/input-sanitization'
import { CSATNPSSurveyService } from '@/lib/services/csat-nps-survey'
import { z } from 'zod'

const surveyResponseSchema = z.object({
  surveyId: z.string().uuid('Invalid survey ID'),
  surveyType: z.enum(['csat', 'nps'], { errorMap: () => ({ message: 'Survey type must be csat or nps' }) }),
  score: z.number().int().min(0).max(10, 'Score must be between 0 and 10'),
  feedbackText: z.string().optional(),
  responses: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
}).strict()

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 20, // Lower limit for form submissions
  },
  async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validation = surveyResponseSchema.safeParse(body)
      
      if (!validation.success) {
        return errorResponse('Invalid request data', 400)
      }

      const { surveyId, surveyType, score, feedbackText, responses } = validation.data

      // Validate and sanitize
      const sanitizedSurveyId = validateInput(surveyId, 'uuid')
      const sanitizedFeedbackText = feedbackText ? validateInput(feedbackText, 'text') : undefined
      const sanitizedResponses = responses ? sanitizeObject(responses) : undefined

      // Validate score range based on survey type
      if (surveyType === 'csat' && (score < 1 || score > 5)) {
        return errorResponse('CSAT score must be between 1 and 5', 400)
      }
      if (surveyType === 'nps' && (score < 0 || score > 10)) {
        return errorResponse('NPS score must be between 0 and 10', 400)
      }

      // Record response
      await CSATNPSSurveyService.recordResponse(
        sanitizedSurveyId,
        surveyType,
        score,
        sanitizedFeedbackText,
        sanitizedResponses
      )

      return successResponse({ success: true }, 'Survey response recorded')
    } catch (error) {
      console.error('Survey response error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to record survey response',
        500
      )
    }
  }
)
