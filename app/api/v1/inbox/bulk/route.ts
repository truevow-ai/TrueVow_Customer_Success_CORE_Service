import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { z } from 'zod'

const bulkActionSchema = z.object({
  conversation_ids: z.array(z.string().uuid()).min(1, 'At least one conversation must be selected'),
  action: z.enum(['assign', 'tag', 'status', 'priority']),
  value: z.string().optional(),
})

/**
 * POST /api/v1/inbox/bulk
 * Perform bulk actions on conversations
 */
export const POST = withTeamMember(async (req: NextRequest, context) => {
  try {
    const validation = await validateBody(req, bulkActionSchema)
    if (!validation.success) {
      return validation.response
    }

    const { conversation_ids, action, value } = validation.data

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const conversationId of conversation_ids) {
      try {
        const conversation = await ConversationRepository.findById(conversationId)
        if (!conversation) {
          results.failed++
          results.errors.push(`Conversation ${conversationId} not found`)
          continue
        }

        if (action === 'assign' && value) {
          await ConversationRepository.update(conversationId, { assigned_to: value })
          if (conversation.ticket_id) {
            await TicketRepository.update(conversation.ticket_id, { assigned_to: value })
          }
        } else if (action === 'status' && value) {
          await ConversationRepository.update(conversationId, { status: value as any })
          if (conversation.ticket_id) {
            await TicketRepository.update(conversation.ticket_id, { status: value as any })
          }
        } else if (action === 'priority' && value) {
          if (conversation.ticket_id) {
            await TicketRepository.update(conversation.ticket_id, { priority: value as any })
          }
        } else if (action === 'tag' && value) {
          const currentTags = conversation.tags || []
          if (!currentTags.includes(value)) {
            await ConversationRepository.update(conversationId, {
              tags: [...currentTags, value],
            })
          }
        }

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to update conversation ${conversationId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return successResponse(results, `Bulk action completed: ${results.success} succeeded, ${results.failed} failed`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to perform bulk action', 500)
  }
})
