import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { AITriageService } from '@/lib/services/ai-triage'
import { MessageRepository } from '@/lib/repositories/messages'
import { z } from 'zod'

const triageSchema = z.object({
  message_id: z.string().uuid('Invalid message ID'),
})

/**
 * POST /api/v1/ai/triage
 * Analyze a message and provide triage result with AI suggestions
 */
export const POST = withTeamMember(async (req: NextRequest, context) => {
  try {
    const validation = await validateBody(req, triageSchema)
    if (!validation.success) {
      return validation.response
    }

    const { message_id } = validation.data

    // Get message
    const message = await MessageRepository.findById(message_id)
    if (!message) {
      return errorResponse('Message not found', 404)
    }

    // Analyze message
    const triageResult = await AITriageService.analyzeMessage(message)

    // Generate suggestion
    const suggestion = await AITriageService.generateSuggestion(message, triageResult)

    return successResponse({
      triage: triageResult,
      suggestion,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to analyze message', 500)
  }
})
