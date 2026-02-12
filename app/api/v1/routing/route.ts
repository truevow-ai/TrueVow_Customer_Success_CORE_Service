import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { ConversationRoutingService } from '@/lib/services/conversation-routing'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { AITriageService } from '@/lib/services/ai-triage'
import { z } from 'zod'

const routeSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID'),
  message_id: z.string().uuid('Invalid message ID').optional(),
})

/**
 * POST /api/v1/routing
 * Route a conversation to the appropriate agent
 */
export const POST = withTeamMember(async (req: NextRequest, context) => {
  try {
    const validation = await validateBody(req, routeSchema)
    if (!validation.success) {
      return validation.response
    }

    const { ticket_id, message_id } = validation.data

    // Get ticket
    const ticket = await TicketRepository.findById(ticket_id)
    if (!ticket) {
      return errorResponse('Ticket not found', 404)
    }

    // Get message (if provided, otherwise get last message)
    let message
    if (message_id) {
      message = await MessageRepository.findById(message_id)
    } else {
      const messages = await MessageRepository.findByTicket(ticket_id)
      message = messages[messages.length - 1]
    }

    if (!message) {
      return errorResponse('Message not found', 404)
    }

    // Analyze message for triage
    const triageResult = await AITriageService.analyzeMessage(message)

    // Route conversation
    const routingResult = await ConversationRoutingService.routeConversation(
      ticket_id,
      message,
      triageResult
    )

    // Auto-assign if routing found an agent
    if (routingResult.assignedTo) {
      await TicketRepository.update(ticket_id, {
        assigned_to: routingResult.assignedTo,
        priority: triageResult.priority,
      })

      // Apply suggested tags
      if (triageResult.suggestedTags && triageResult.suggestedTags.length > 0) {
        const currentTags = ticket.tags || []
        const newTags = [...new Set([...currentTags, ...triageResult.suggestedTags])]
        await TicketRepository.update(ticket_id, { tags: newTags })
      }
    }

    return successResponse({
      assigned_to: routingResult.assignedTo,
      reason: routingResult.reason,
      rule_matched: routingResult.ruleMatched,
      triage: triageResult,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to route conversation', 500)
  }
})
