/**
 * WhatsApp Webhook Handler
 * 
 * Receives incoming WhatsApp messages from Twilio
 * Creates conversations/tickets in the shared inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/integrations/twilio'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { MultiChannelLinkingService } from '@/lib/services/multi-channel-linking'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { SMSThreadingService } from '@/lib/services/sms-threading'
import { withApiKey } from '@/lib/middleware/api-key'

export const POST = withApiKey(async (req: NextRequest, context) => {
  try {
    const formData = await req.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Check if this is a status update or a new message
    const messageStatus = webhookData.MessageStatus as string

    if (messageStatus && messageStatus !== 'received') {
      // This is a status update for an outbound message
      const whatsappData = twilioClient.parseIncomingWhatsApp(webhookData)
      
      let status: 'sent' | 'delivered' | 'read' | 'failed' = 'sent'
      if (messageStatus === 'delivered') {
        status = 'delivered'
      } else if (messageStatus === 'read') {
        status = 'read'
      } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        status = 'failed'
      }

      const readAt = messageStatus === 'read' ? new Date().toISOString() : undefined

      await UnifiedMessagingService.updateMessageStatus(
        whatsappData.messageId,
        status,
        readAt
      )

      return NextResponse.json({ success: true })
    }

    // This is a new inbound message
    const whatsappMessage = twilioClient.parseIncomingWhatsApp(webhookData)

    if (!whatsappMessage.from || !whatsappMessage.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find or create ticket based on SMS threading (WhatsApp uses same logic)
    let ticketId: string | null = await SMSThreadingService.findTicketByThread({
      messageId: whatsappMessage.messageId,
      from: whatsappMessage.from,
      to: whatsappMessage.to || '',
      body: whatsappMessage.message,
    })

    // If no existing ticket, create new one
    if (!ticketId) {
      const tenantId = process.env.DEFAULT_TENANT_ID || null

      const newTicket = await TicketRepository.create({
        tenant_id: tenantId,
        customer_email: whatsappMessage.from, // Use phone number as email
        subject: `WhatsApp from ${whatsappMessage.from}`,
        channel: 'whatsapp',
        status: 'open',
        priority: 'medium',
        source: 'customer',
      })

      ticketId = newTicket.ticket_id

      // Log activity
      await ActivityFeedRepository.logTicketCreated(ticketId, 'system', {
        channel: 'whatsapp',
        phone_from: whatsappMessage.from,
      })
    }

    // Get or create conversation
    const conversationId = await SMSThreadingService.createOrUpdateConversation(
      ticketId,
      {
        messageId: whatsappMessage.messageId,
        from: whatsappMessage.from,
        to: whatsappMessage.to || '',
        body: whatsappMessage.message,
      }
    )

    // Create inbound message in unified messaging service
    const unifiedMessage = await UnifiedMessagingService.createInboundMessage({
      from: whatsappMessage.from,
      to: whatsappMessage.to || '',
      body: whatsappMessage.message,
      channel: 'whatsapp',
      externalMessageId: whatsappMessage.messageId,
      mediaUrls: whatsappMessage.mediaUrl,
      ticketId: ticketId,
      serviceType: 'cs_support',
      metadata: {
        provider: 'twilio',
      },
    })

    // Create message in cs_messages table
    const message = await MessageRepository.create({
      ticket_id: ticketId,
      from_type: 'customer',
      sender_id: whatsappMessage.from,
      sender_type: 'customer',
      body: whatsappMessage.message,
      is_internal: false,
      attachments: whatsappMessage.mediaUrl ? whatsappMessage.mediaUrl.map((url) => ({ url, type: 'media' })) : [],
      metadata: {
        provider: 'twilio',
        messageId: whatsappMessage.messageId,
        unified_message_id: unifiedMessage.message_id,
        channel: 'whatsapp',
        from: whatsappMessage.from,
        to: whatsappMessage.to,
        media_urls: whatsappMessage.mediaUrl || [],
      },
    })

    // Link conversation across channels
    try {
      await MultiChannelLinkingService.findOrCreateUnifiedConversation(
        'whatsapp',
        {
          phone: whatsappMessage.from,
          email: whatsappMessage.from, // Use phone as email for WhatsApp
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
      channel: 'whatsapp',
    })

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      message_id: message.message_id,
      conversation_id: conversationId,
    })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
})
