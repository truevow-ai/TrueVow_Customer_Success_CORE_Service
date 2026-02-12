import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { sendGridClient } from '@/lib/integrations/sendgrid'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { z } from 'zod'

const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  body: z.string().min(1, 'Body is required').max(10000, 'Body too long'),
  html: z.string().optional(),
  attachments: z.array(z.any()).optional().default([]),
})

/**
 * POST /api/v1/inbox/:id/send-email
 * Send an email reply to a conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, sendEmailSchema)
      if (!validation.success) {
        return validation.response
      }

      const { to, subject, body, html, attachments } = validation.data

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
          customer_email: to,
          customer_name: conversation.customer_name,
          subject: subject,
          channel: 'email',
          status: 'open',
          priority: 'medium',
          source: 'customer',
        })
        ticketId = ticket.ticket_id
        await ConversationRepository.update(id, { ticket_id: ticketId })
      }

      // Get previous message for threading
      const previousMessages = await MessageRepository.findByTicket(ticketId)
      const lastMessage = previousMessages[previousMessages.length - 1]
      const inReplyTo = lastMessage?.metadata?.email_message_id
      const references = lastMessage?.references_header || []

      // Send email via SendGrid
      const emailResponse = await sendGridClient.sendEmail({
        to,
        subject,
        text: body,
        html: html || body,
        replyTo: process.env.SENDGRID_FROM_EMAIL,
        inReplyTo: inReplyTo,
        references: inReplyTo ? [...references, inReplyTo] : references,
        attachments: attachments?.map((att: any) => ({
          content: att.content || att.url,
          filename: att.filename,
          type: att.type,
        })),
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
        in_reply_to: lastMessage?.message_id || null,
        references_header: inReplyTo ? [...references, inReplyTo] : references,
        attachments: attachments || [],
        metadata: {
          email_message_id: emailResponse.messageId,
          sent_via: 'sendgrid',
          status: emailResponse.status,
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
          channel: 'email',
        })
      }

      return successResponse({
        message_id: message.message_id,
        email_message_id: emailResponse.messageId,
        status: emailResponse.status,
      }, 'Email sent successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to send email', 500)
    }
  })(req)
}
