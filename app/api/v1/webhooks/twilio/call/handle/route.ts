import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/helpers'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'

/**
 * GET /api/v1/webhooks/twilio/call/handle
 * TwiML handler for outbound calls
 * Returns TwiML instructions for Twilio to handle the call
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ticketId = searchParams.get('ticket_id')
    const agentId = searchParams.get('agent_id')

    if (!ticketId) {
      return new Response('Missing ticket_id', { status: 400 })
    }

    // Get ticket to find customer phone
    const ticket = await TicketRepository.findById(ticketId)
    if (!ticket) {
      return new Response('Ticket not found', { status: 404 })
    }

    // Generate TwiML for the call
    // This will connect the agent to the customer
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the customer now.</Say>
  <Dial record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/webhooks/twilio/call/recording?ticket_id=${ticketId}">
    <Number>${ticket.customer_email}</Number>
  </Dial>
</Response>`

    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Error handling call:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

/**
 * POST /api/v1/webhooks/twilio/call/handle
 * Handle call status updates from Twilio
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const duration = formData.get('Duration') as string
    const ticketId = formData.get('ticket_id') as string

    if (!ticketId) {
      return successResponse({ received: true })
    }

    // Update call status in ticket metadata or create activity log
    const ticket = await TicketRepository.findById(ticketId)
    if (ticket) {
      // Find conversation
      const conversation = await ConversationRepository.findByTicket(ticketId)
      
      if (conversation) {
        // Update conversation with call status
        await ConversationRepository.update(conversation.conversation_id, {
          last_message_at: new Date().toISOString(),
        })
      }

      // Create or update message with call status
      const messages = await MessageRepository.findByTicket(ticketId)
      const callMessage = messages.find((m) => m.metadata?.call_id === callSid)
      
      if (callMessage) {
        await MessageRepository.update(callMessage.message_id, {
          metadata: {
            ...callMessage.metadata,
            call_status: callStatus,
            call_duration: duration ? parseInt(duration) : null,
            call_from: from,
            call_to: to,
          },
        })
      }
    }

    return successResponse({ received: true })
  } catch (error) {
    console.error('Error handling call status:', error)
    return successResponse({ received: true }) // Always return success to Twilio
  }
}
