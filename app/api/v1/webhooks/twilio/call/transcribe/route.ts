import { NextRequest } from 'next/server'
import { withApiKey } from '@/lib/middleware/api-key'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { speechProvider } from '@/lib/integrations/speech-provider-factory'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'

/**
 * POST /api/v1/webhooks/twilio/call/transcribe
 * Manually transcribe a call recording
 */
export const POST = withApiKey(async (req: NextRequest, context) => {
  try {
    const body = await req.json()
    const { recordingUrl, ticketId, messageId } = body

    if (!recordingUrl) {
      return errorResponse('Recording URL is required', 400)
    }

    // Transcribe recording
    const transcription = await speechProvider.transcribe({
      audio: recordingUrl,
      punctuate: true,
      diarize: true, // Speaker diarization
    })

    // Update message with transcription
    if (messageId) {
      const message = await MessageRepository.findById(messageId)
      if (message) {
        await MessageRepository.update(messageId, {
          body: transcription.text, // Update body with transcription
          metadata: {
            ...message.metadata,
            transcription: {
              confidence: transcription.confidence,
              duration: transcription.duration,
              speakers: transcription.speakers,
              words: transcription.words,
            },
          },
        })
      }
    } else if (ticketId) {
      // Find or create message for this ticket
      const messages = await MessageRepository.findByTicket(ticketId)
      const callMessage = messages.find(
        (m) => m.metadata?.recordingUrl === recordingUrl || m.metadata?.recording_url === recordingUrl
      )

      if (callMessage) {
        await MessageRepository.update(callMessage.message_id, {
          body: transcription.text,
          metadata: {
            ...callMessage.metadata,
            transcription: {
              confidence: transcription.confidence,
              duration: transcription.duration,
              speakers: transcription.speakers,
              words: transcription.words,
            },
          },
        })
      } else {
        // Create new message with transcription
        const ticket = await TicketRepository.findById(ticketId)
        if (ticket) {
          await MessageRepository.create({
            ticket_id: ticketId,
            from_type: 'customer',
            sender_id: ticket.customer_email,
            sender_type: 'customer',
            body: transcription.text,
            is_internal: false,
            metadata: {
              recordingUrl: recordingUrl,
              transcription: {
                confidence: transcription.confidence,
                duration: transcription.duration,
                speakers: transcription.speakers,
                words: transcription.words,
              },
            },
          })

          // Update conversation
          const conversation = await ConversationRepository.findByTicket(ticketId)
          if (conversation) {
            await ConversationRepository.update(conversation.conversation_id, {
              last_message_at: new Date().toISOString(),
            })
          }
        }
      }
    }

    return successResponse({
      transcription: {
        text: transcription.text,
        confidence: transcription.confidence,
        duration: transcription.duration,
        speakers: transcription.speakers,
      },
    })
  } catch (error) {
    console.error('Error transcribing call:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to transcribe call',
      500
    )
  }
})
