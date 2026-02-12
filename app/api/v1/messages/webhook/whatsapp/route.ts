/**
 * Unified Messaging API - WhatsApp Webhook
 * 
 * POST /api/v1/messages/webhook/whatsapp
 * 
 * Handles incoming WhatsApp messages and status updates from Twilio.
 */

import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/integrations/twilio'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { withApiKey } from '@/lib/middleware/api-key'

export const POST = withApiKey(async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Parse WhatsApp message using Twilio client
    const whatsappData = twilioClient.parseIncomingWhatsApp(webhookData)

    if (!whatsappData.from || !whatsappData.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if this is a status update or a new message
    const messageStatus = webhookData.MessageStatus as string

    if (messageStatus && messageStatus !== 'received') {
      // This is a status update for an outbound message
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
    // TODO: Find or create lead/contact based on phone number
    // For now, create inbound message record
    await UnifiedMessagingService.createInboundMessage({
      from: whatsappData.from,
      to: whatsappData.to,
      body: whatsappData.message,
      channel: 'whatsapp',
      externalMessageId: whatsappData.messageId,
      mediaUrls: whatsappData.mediaUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
})
