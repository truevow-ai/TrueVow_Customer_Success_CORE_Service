/**
 * Send WhatsApp Message API
 * 
 * Sends WhatsApp messages via Twilio WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { CommunicationSenderService } from '@/lib/services/communication-sender'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'
import { z } from 'zod'

const sendWhatsAppSchema = z.object({
  templateKey: z.string().optional(),
  to: z.union([z.string(), z.array(z.string())]),
  message: z.string().optional(),
  variables: z.record(z.any()).optional(),
  tenantId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = sendWhatsAppSchema.parse(body)

    // If templateKey is provided, use template-based sending
    if (validated.templateKey) {
      const result = await CommunicationSenderService.sendWhatsApp({
        templateKey: validated.templateKey,
        to: validated.to,
        variables: validated.variables || {},
        tenantId: validated.tenantId,
        customerEmail: validated.customerEmail,
        metadata: validated.metadata,
      })

      if (result.status === 'failed') {
        return NextResponse.json(
          { error: result.error || 'Failed to send WhatsApp' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        communicationId: result.communicationId,
        messageId: result.messageId,
      })
    }

    // Direct message sending (without template) via Unified Messaging Service
    if (!validated.message) {
      return NextResponse.json(
        { error: 'Either templateKey or message is required' },
        { status: 400 }
      )
    }

    // Send direct WhatsApp message via Unified Messaging Service
    const unifiedResult = await UnifiedMessagingService.sendMessage({
      to: Array.isArray(validated.to) ? validated.to[0] : validated.to,
      body: validated.message,
      channel: 'whatsapp',
      userId: context.userId,
      serviceType: 'cs_support',
      metadata: {
        ...validated.metadata,
        tenant_id: validated.tenantId,
        customer_email: validated.customerEmail,
      },
    })

    return NextResponse.json({
      success: true,
      messageId: unifiedResult.messageId,
      externalMessageId: unifiedResult.externalMessageId,
      channel: unifiedResult.channel,
      status: unifiedResult.status,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Send WhatsApp error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
