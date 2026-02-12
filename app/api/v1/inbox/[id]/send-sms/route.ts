import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { z } from 'zod'

const sendSMSSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  body: z.string().min(1, 'Message body is required').max(1600, 'SMS too long'),
})

/**
 * POST /api/v1/inbox/:id/send-sms
 * Send an SMS reply to a conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, sendSMSSchema)
      if (!validation.success) {
        return validation.response
      }

      const { to, body } = validation.data

      // Get conversation
      const conversation = await ConversationRepository.findById(id)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Get ticket
      let ticketId = conversation.ticket_id
      if (!ticketId) {
        // Create ticket for this conversation
        const ticket = await TicketRepository.create({
          tenant_id: conversation.tenant_id,
          customer_email: to, // Use phone number as email for SMS
          customer_name: conversation.customer_name,
          subject: `SMS to ${to}`,
          channel: 'sms',
          status: 'open',
          priority: 'medium',
          source: 'customer',
        })
        ticketId = ticket.ticket_id
        await ConversationRepository.update(id, { ticket_id: ticketId })
      }

      // Send SMS via Unified Messaging Service
      const unifiedResult = await UnifiedMessagingService.sendMessage({
        to,
        body,
        channel: 'sms',
        userId: context.userId,
        ticketId: ticketId,
        serviceType: 'cs_support',
        metadata: {
          conversation_id: id,
          team_member_id: context.teamMemberId,
        },
      })

      // Create message record
      const message = await MessageRepository.create({
        ticket_id: ticketId,
        from_type: 'agent',
        from_user_id: context.teamMemberId || context.userId,
        sender_id: context.teamMemberId || context.userId,
        sender_type: 'agent',
        body: body,
        is_internal: false,
        metadata: {
          sms_message_id: unifiedResult.externalMessageId,
          unified_message_id: unifiedResult.messageId,
          sent_via: 'unified_messaging',
          status: unifiedResult.status,
          to: to,
          channel: unifiedResult.channel,
        },
      })

      // Update conversation
      await ConversationRepository.update(id, {
        last_message_at: new Date().toISOString(),
        message_count: (conversation.message_count || 0) + 1,
      })

      // Log activity
      if (context.teamMemberId) {
        await ActivityFeedRepository.logMessageSent(ticketId, context.teamMemberId, {
          message_id: message.message_id,
          channel: 'sms',
        })
      }

      return successResponse({
        message_id: message.message_id,
        unified_message_id: unifiedResult.messageId,
        sms_message_id: unifiedResult.externalMessageId,
        status: unifiedResult.status,
        channel: unifiedResult.channel,
      }, 'SMS sent successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to send SMS', 500)
    }
  })(req)
}
