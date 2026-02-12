/**
 * Twilio SMS Webhook Handler
 * Receives incoming SMS messages from Twilio
 * Uses voice provider factory for abstraction
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/middleware/api-key'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { voiceProvider } from '@/lib/integrations/voice-provider-factory'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { SMSThreadingService } from '@/lib/services/sms-threading'
import { MultiChannelLinkingService } from '@/lib/services/multi-channel-linking'
import { AITriageService } from '@/lib/services/ai-triage'
import { ConversationRoutingService } from '@/lib/services/conversation-routing'

/**
 * POST /api/v1/webhooks/twilio/sms
 * Handle incoming SMS from Twilio webhook
 */
export const POST = withApiKey(async (req: NextRequest, context) => {
  try {
    const formData = await req.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Parse SMS using voice provider abstraction
    const smsData = voiceProvider.parseIncomingSMS(webhookData)

    if (!smsData.from || !smsData.message) {
      return errorResponse('Missing required fields', 400)
    }

    // Find or create ticket based on SMS threading
    let ticketId: string | null = await SMSThreadingService.findTicketByThread({
      messageId: smsData.messageId,
      from: smsData.from,
      to: smsData.to || '',
      body: smsData.message,
    })

    // If no existing ticket, create new one
    if (!ticketId) {
      // TODO: Implement tenant lookup from phone number
      const tenantId = process.env.DEFAULT_TENANT_ID || null

      const newTicket = await TicketRepository.create({
        tenant_id: tenantId,
        customer_email: smsData.from, // Use phone number as email
        subject: `SMS from ${smsData.from}`,
        channel: 'sms',
        status: 'open',
        priority: 'medium',
        source: 'customer',
      })

      ticketId = newTicket.ticket_id

      // Log activity
      await ActivityFeedRepository.logTicketCreated(ticketId, 'system', {
        channel: 'sms',
        phone_from: smsData.from,
      })
    }

    // Get or create conversation
    const conversationId = await SMSThreadingService.createOrUpdateConversation(
      ticketId,
      {
        messageId: smsData.messageId,
        from: smsData.from,
        to: smsData.to || '',
        body: smsData.message,
      }
    )

    // Create inbound message in unified messaging service
    const unifiedMessage = await UnifiedMessagingService.createInboundMessage({
      from: smsData.from,
      to: smsData.to || '',
      body: smsData.message,
      channel: 'sms',
      externalMessageId: smsData.messageId,
      ticketId: ticketId,
      serviceType: 'cs_support',
      metadata: {
        provider: process.env.VOICE_PROVIDER || 'twilio',
      },
    })

    // Create message in cs_messages table
    const message = await MessageRepository.create({
      ticket_id: ticketId,
      from_type: 'customer',
      sender_id: smsData.from,
      sender_type: 'customer',
      body: smsData.message,
      is_internal: false,
      metadata: {
        provider: process.env.VOICE_PROVIDER || 'twilio',
        messageId: smsData.messageId,
        unified_message_id: unifiedMessage.message_id,
        channel: 'sms',
        from: smsData.from,
        to: smsData.to,
      },
    })

    // Link conversation across channels
    try {
      await MultiChannelLinkingService.findOrCreateUnifiedConversation(
        'sms',
        {
          phone: smsData.from,
          email: smsData.from, // Use phone as email for SMS
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
      channel: 'sms',
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
      console.warn('AI triage failed for SMS webhook:', triageError)
    }

    return successResponse({
      ticket_id: ticketId,
      message_id: message.message_id,
      conversation_id: conversationId,
    })
  } catch (error) {
    console.error('Error processing SMS webhook:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process SMS',
      500
    )
  }
})
