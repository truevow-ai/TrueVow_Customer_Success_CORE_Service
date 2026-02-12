/**
 * Twilio Call Webhook Handler
 * Receives call status updates and recordings from Twilio
 * Uses voice provider factory for abstraction
 */

import { NextRequest, NextResponse } from 'next/server'
import { voiceProvider } from '@/lib/integrations/voice-provider-factory'
import { speechProvider } from '@/lib/integrations/speech-provider-factory'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { MultiChannelLinkingService } from '@/lib/services/multi-channel-linking'
import { withApiKey } from '@/lib/middleware/api-key'

export const POST = withApiKey(async (request: NextRequest, context) => {
  try {
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Parse call status using voice provider abstraction
    const callData = voiceProvider.parseCallStatus(webhookData)

    if (!callData.callId) {
      return NextResponse.json(
        { error: 'Missing call ID' },
        { status: 400 }
      )
    }

    // Only process completed calls with recordings
    if (callData.status === 'completed' && callData.recordingUrl) {
      // Transcribe recording using speech provider abstraction
      try {
        const transcription = await speechProvider.transcribe({
          audio: callData.recordingUrl,
          punctuate: true,
          diarize: true, // Speaker diarization
        })

        // Find or create ticket
        const existingTickets = await TicketRepository.findByCustomerEmail(callData.from)
        const openTicket = existingTickets.find(t => 
          t.status === 'open' || t.status === 'in_progress'
        )

        let ticketId: string

        if (openTicket) {
          ticketId = openTicket.ticket_id
        } else {
          // TODO: Implement tenant lookup from phone number or customer email
          const tenantId = process.env.DEFAULT_TENANT_ID || null
          
          const newTicket = await TicketRepository.create({
            tenant_id: tenantId,
            customer_email: callData.from,
            subject: `Call from ${callData.from}`,
            channel: 'call',
            status: 'open',
            priority: 'medium',
            source: 'customer',
          })
          ticketId = newTicket.ticket_id

          // Log activity
          await ActivityFeedRepository.logTicketCreated(ticketId, 'system', {
            channel: 'call',
            phone_from: callData.from,
          })
        }

        // Get or create conversation
        let conversationId: string | null = null
        try {
          conversationId = await MultiChannelLinkingService.findOrCreateUnifiedConversation(
            'call',
            {
              phone: callData.from,
              email: callData.from, // Use phone as email for calls
            },
            ticketId
          )
        } catch (linkError) {
          console.warn('Failed to link conversation across channels:', linkError)
          // Continue even if linking fails
        }

        // Create message with transcription
        const message = await MessageRepository.create({
          ticket_id: ticketId,
          from_type: 'customer',
          sender_id: callData.from,
          sender_type: 'customer',
          body: transcription.text, // Store transcription text in body
          metadata: {
            provider: process.env.VOICE_PROVIDER || 'twilio',
            callId: callData.callId,
            duration: callData.duration,
            recordingUrl: callData.recordingUrl,
            recording_url: callData.recordingUrl, // Also store as recording_url for consistency
            channel: 'call',
            transcription: {
              text: transcription.text,
              confidence: transcription.confidence,
              duration: transcription.duration,
              speakers: transcription.speakers,
              words: transcription.words,
            },
          },
        })

        // Log activity
        await ActivityFeedRepository.logMessageSent(ticketId, 'system', {
          message_id: message.message_id,
          channel: 'call',
        })

        // Update ticket
        await TicketRepository.update(ticketId, {
          updated_at: new Date().toISOString(),
        })

        return NextResponse.json({
          success: true,
          ticket_id: ticketId,
          message_id: message.message_id,
          conversation_id: conversationId,
        })
      } catch (transcriptionError: any) {
        console.error('Error transcribing call:', transcriptionError)
        // Return error but don't fail the webhook
        return NextResponse.json(
          { 
            success: false, 
            error: `Transcription failed: ${transcriptionError.message}` 
          },
          { status: 500 }
        )
      }
    }

    // For non-completed calls or calls without recordings, just acknowledge
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing call webhook:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
})
