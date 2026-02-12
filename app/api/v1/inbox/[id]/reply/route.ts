import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { replySchema } from '@/lib/utils/validation'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { MentionsService } from '@/lib/services/mentions-service'

/**
 * POST /api/v1/inbox/:id/reply
 * Send a reply to a conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, replySchema)
      if (!validation.success) {
        return validation.response
      }

      const { body, is_internal, attachments } = validation.data
      const conversationId = id

    // Get conversation
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return errorResponse('Conversation not found', 404)
    }

    // Get or create ticket
    let ticketId = conversation.ticket_id
    if (!ticketId) {
      // Create ticket for this conversation
      const ticket = await TicketRepository.create({
        tenant_id: conversation.tenant_id,
        customer_email: conversation.customer_email,
        customer_name: conversation.customer_name,
        subject: conversation.subject || 'New conversation',
        channel: conversation.channel,
        status: 'open',
        priority: 'medium',
        source: 'customer',
      })
      ticketId = ticket.ticket_id
      
      // Link conversation to ticket
      await ConversationRepository.update(conversationId, { ticket_id: ticketId })
    }

    // Create message
    const newMessage = await MessageRepository.create({
      ticket_id: ticketId,
      from_type: 'agent',
      from_user_id: context.teamMemberId || context.userId,
      sender_id: context.teamMemberId || context.userId,
      sender_type: 'agent',
      body,
      is_internal: is_internal || false,
      attachments: attachments || [],
    })

    // Log activity
    if (context.teamMemberId) {
      await ActivityFeedRepository.logMessageSent(ticketId, context.teamMemberId, {
        message_id: newMessage.message_id,
        is_internal,
      })
    }

    // Parse and create mentions (async, don't block response)
    try {
      const parsedMentions = MentionsService.parseMentions(body)
      if (parsedMentions.length > 0) {
        const resolvedMentions = await MentionsService.resolveMentions(
          parsedMentions,
          conversation.tenant_id
        )
        if (resolvedMentions.length > 0) {
          await MentionsService.createMentions(
            newMessage.message_id,
            conversationId,
            ticketId,
            resolvedMentions,
            context.teamMemberId || context.userId
          )
        }
      }
    } catch (mentionError) {
      // Don't fail reply if mention processing fails
      console.warn('Failed to process mentions:', mentionError)
    }

    return successResponse(newMessage, 'Reply sent successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to send reply', 500)
    }
  })(req)
}

