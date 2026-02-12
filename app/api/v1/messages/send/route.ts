/**
 * Unified Messaging API - Send Message
 * 
 * POST /api/v1/messages/send
 * 
 * Sends SMS or WhatsApp messages via the unified messaging service.
 * Can be used by both Sales CRM and CS-Support services.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { UnifiedMessagingService } from '@/lib/services/unified-messaging-service'

const sendMessageSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  body: z.string().min(1).max(4096),
  channel: z.enum(['sms', 'whatsapp']).optional(),
  hasWhatsApp: z.boolean().optional(),
  contactPreference: z.enum(['sms', 'whatsapp']).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  templateName: z.string().optional(),
  templateParams: z.record(z.string()).optional(),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  ticketId: z.string().uuid().optional(),
  serviceType: z.enum(['sales_crm', 'cs_support']).optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = sendMessageSchema.parse(body)

    // Send message via unified messaging service
    const result = await UnifiedMessagingService.sendMessage({
      to: validatedData.to,
      body: validatedData.body,
      channel: validatedData.channel,
      hasWhatsApp: validatedData.hasWhatsApp,
      contactPreference: validatedData.contactPreference,
      mediaUrls: validatedData.mediaUrls,
      templateName: validatedData.templateName,
      templateParams: validatedData.templateParams,
      userId,
      leadId: validatedData.leadId,
      contactId: validatedData.contactId,
      ticketId: validatedData.ticketId,
      serviceType: validatedData.serviceType,
      metadata: validatedData.metadata,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      externalMessageId: result.externalMessageId,
      channel: result.channel,
      status: result.status,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
