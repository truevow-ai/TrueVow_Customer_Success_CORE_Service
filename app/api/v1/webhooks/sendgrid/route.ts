import { NextRequest } from 'next/server'
import { withApiKey } from '@/lib/middleware/api-key'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { sendGridClient } from '@/lib/integrations/sendgrid'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { EmailThreadingService } from '@/lib/services/email-threading'
import { MultiChannelLinkingService } from '@/lib/services/multi-channel-linking'
import { AutoAssignmentService } from '@/lib/services/auto-assignment-service'
import { AITriageService } from '@/lib/services/ai-triage'
import { ConversationRoutingService } from '@/lib/services/conversation-routing'

/**
 * POST /api/v1/webhooks/sendgrid
 * Handle incoming emails from SendGrid webhook
 */
export const POST = withApiKey(async (req: NextRequest, context) => {
  try {
    const webhookData = await req.json()
    
    // Parse incoming email
    const email = sendGridClient.parseIncomingEmail(webhookData)

    // Find or create ticket based on email threading
    let ticketId: string | null = null
    
    // Try to find existing ticket by email thread
    if (email.inReplyTo || email.references) {
      ticketId = await EmailThreadingService.findTicketByThread({
        messageId: email.messageId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        from: email.from,
        to: email.to,
        subject: email.subject,
      })
    }

    // If no existing ticket, try to find by customer email (recent open tickets)
    if (!ticketId) {
      const recentTickets = await TicketRepository.findByCustomerEmail(email.from)
      const openTicket = recentTickets.find(
        (t) =>
          (t.status === 'open' || t.status === 'in_progress') &&
          t.channel === 'email' &&
          new Date(t.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      )
      ticketId = openTicket?.ticket_id || null
    }

    // If still no ticket, create new one
    if (!ticketId) {
      // TODO: Implement tenant lookup from email domain or customer database
      const tenantId = process.env.DEFAULT_TENANT_ID || null // Allow NULL for pre-sale

      const newTicket = await TicketRepository.create({
        tenant_id: tenantId,
        customer_email: email.from,
        subject: email.subject || 'No Subject',
        message: email.text || email.html || '',
        channel: 'email',
        status: 'open',
        priority: 'medium',
        source: 'customer',
      })

      ticketId = newTicket.ticket_id

      // Log activity
      await ActivityFeedRepository.logTicketCreated(ticketId, 'system', {
        channel: 'email',
        email_from: email.from,
      })
    }

    // Get or create conversation
    const conversationId = await EmailThreadingService.createOrUpdateConversation(
      ticketId,
      {
        messageId: email.messageId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        from: email.from,
        to: email.to,
        subject: email.subject,
      }
    )

    // Auto-assign to context if new conversation
    const conversation = await ConversationRepository.findById(conversationId)
    if (conversation) {
      const existingContexts = await (await import('@/lib/services/unified-inbox-service')).UnifiedInboxService.getConversationContexts(conversationId)
      if (existingContexts.length === 0) {
        // New conversation - auto-assign
        await AutoAssignmentService.assignOnCreation(conversationId, conversation.tenant_id)
      }
    }

    // Find the message we're replying to (if any)
    let inReplyToMessageId: string | null = null
    if (email.inReplyTo) {
      const replyToMessage = await MessageRepository.findByExternalId(email.inReplyTo)
      inReplyToMessageId = replyToMessage?.message_id || null
    }

    // Create message
    const message = await MessageRepository.create({
      ticket_id: ticketId,
      from_type: 'customer',
      sender_id: email.from,
      sender_type: 'customer',
      body: email.text || email.html || '',
      is_internal: false,
      in_reply_to: inReplyToMessageId,
      references_header: email.references,
      attachments: email.attachments || [],
      metadata: {
        email_message_id: email.messageId,
        in_reply_to: email.inReplyTo,
        references: email.references,
        attachments: email.attachments,
      },
    })

    // Link conversation across channels
    try {
      await MultiChannelLinkingService.findOrCreateUnifiedConversation(
        'email',
        {
          email: email.from,
        },
        ticketId
      )
    } catch (linkError) {
      console.warn('Failed to link conversation across channels:', linkError)
      // Continue even if linking fails
    }

    // Log activity
    await ActivityFeedRepository.logMessageSent(ticketId, 'system', {
      message_id: message.message_id,
      channel: 'email',
    })

    // Auto-triage and route (async, don't block webhook response)
    try {
      const triageResult = await AITriageService.analyzeMessage(message)
      
      // Auto-apply tags if suggested
      if (triageResult.suggestedTags && triageResult.suggestedTags.length > 0) {
        const ticket = await TicketRepository.findById(ticketId)
        if (ticket) {
          const currentTags = ticket.tags || []
          const newTags = [...new Set([...currentTags, ...triageResult.suggestedTags])]
          await TicketRepository.update(ticketId, { tags: newTags })
        }
      }

      // Auto-route if enabled
      if (process.env.ENABLE_AUTO_ROUTING === 'true') {
        await ConversationRoutingService.routeConversation(
          ticketId,
          message,
          triageResult
        )
      }
    } catch (triageError) {
      // Don't fail webhook if triage fails
      console.warn('AI triage failed for email webhook:', triageError)
    }

    return successResponse({
      ticket_id: ticketId,
      message_id: message.message_id,
      conversation_id: conversationId,
    })
  } catch (error) {
    console.error('SendGrid webhook error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process email',
      500
    )
  }
})

