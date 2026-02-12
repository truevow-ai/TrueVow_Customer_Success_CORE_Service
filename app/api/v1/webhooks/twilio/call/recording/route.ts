import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/helpers'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'

/**
 * POST /api/v1/webhooks/twilio/call/recording
 * Handle call recording webhook from Twilio
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const recordingSid = formData.get('RecordingSid') as string
    const recordingDuration = formData.get('RecordingDuration') as string
    const ticketId = req.nextUrl.searchParams.get('ticket_id')

    if (!ticketId) {
      return successResponse({ received: true })
    }

    // Find the call message and update with recording URL
    const messages = await MessageRepository.findByTicket(ticketId)
    const callMessage = messages.find((m) => m.metadata?.call_id === callSid)

    if (callMessage) {
      await MessageRepository.update(callMessage.message_id, {
        metadata: {
          ...callMessage.metadata,
          recording_url: recordingUrl,
          recording_sid: recordingSid,
          recording_duration: recordingDuration ? parseInt(recordingDuration) : null,
        },
      })
    }

    return successResponse({ received: true })
  } catch (error) {
    console.error('Error handling recording:', error)
    return successResponse({ received: true }) // Always return success to Twilio
  }
}
