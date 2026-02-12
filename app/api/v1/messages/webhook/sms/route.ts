/**
 * Unified Messaging API - SMS Webhook
 * 
 * POST /api/v1/messages/webhook/sms
 * 
 * Handles incoming SMS messages and status updates from Twilio.
 */

import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/integrations/twilio'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { withApiKey } from '@/lib/middleware/api-key'

export const POST = withApiKey(async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Parse SMS using Twilio client
    const smsData = twilioClient.parseIncomingSMS(webhookData)

    if (!smsData.from || !smsData.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if this is a status update or a new message
    const messageStatus = webhookData.MessageStatus as string

    if (messageStatus && messageStatus !== 'received') {
      // This is a status update for an outbound message
      let status: 'sent' | 'delivered' | 'failed' = 'sent'
      if (messageStatus === 'delivered') {
        status = 'delivered'
      } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        status = 'failed'
      }

      await UnifiedMessagingService.updateMessageStatus(
        smsData.messageId,
        status
      )

      return NextResponse.json({ success: true })
    }

    // This is a new inbound message
    // TODO: Find or create lead/contact based on phone number
    // For now, create inbound message record
    await UnifiedMessagingService.createInboundMessage({
      from: smsData.from,
      to: smsData.to,
      body: smsData.message,
      channel: 'sms',
      externalMessageId: smsData.messageId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing SMS webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
})
