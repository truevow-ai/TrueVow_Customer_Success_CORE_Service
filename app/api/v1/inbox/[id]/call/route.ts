import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { voiceProvider } from '@/lib/integrations/voice-provider-factory'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { ActivityFeedRepository } from '@/lib/repositories/activity-feed'
import { UnifiedDialerService } from '@/lib/services/unified-dialer-service'
import { z } from 'zod'

const initiateCallSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  from: z.string().optional(),
  record: z.boolean().optional().default(true),
  notes: z.string().optional(),
})

/**
 * POST /api/v1/inbox/[id]/call
 * Initiate a call to a customer from a conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, initiateCallSchema)
      if (!validation.success) {
        return validation.response
      }

      const { to, from, record, notes } = validation.data

      // Get conversation
      const conversation = await ConversationRepository.findById(id)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Get ticket
      let ticketId = conversation.ticket_id
      if (!ticketId) {
        // Create ticket for this conversation
        const ticket = await TicketRepository.create({
          tenant_id: conversation.tenant_id,
          customer_email: to, // Use phone number as email for calls
          customer_name: conversation.customer_name,
          subject: `Call to ${to}`,
          channel: 'call',
          status: 'open',
          priority: 'medium',
          source: 'agent',
        })
        ticketId = ticket.ticket_id
        await ConversationRepository.update(id, { ticket_id: ticketId })
      }

      // Get phone number using unified dialer service
      let fromPhoneNumber = from || process.env.TWILIO_PHONE_NUMBER || ''
      let phoneNumberSource = 'default'
      
      // Try to get phone number from unified dialer service
      if (context.userId || context.teamMemberId) {
        try {
          const phoneResult = await UnifiedDialerService.getPhoneNumber({
            user_id: context.userId || context.teamMemberId || '',
            department: 'customer_support',
            call_type: 'outbound',
          })
          if (phoneResult?.phone_number) {
            fromPhoneNumber = phoneResult.phone_number
            phoneNumberSource = phoneResult.source
          }
        } catch (error) {
          console.warn(`Failed to get phone number from unified dialer:`, error)
          // Fallback to provided number or default
        }
      }

      // Get TwiML URL for call handling
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callHandlerUrl = `${baseUrl}/api/v1/webhooks/twilio/call/handle?ticket_id=${ticketId}&agent_id=${context.teamMemberId || context.userId}`

      // Initiate call via Twilio
      const callResponse = await voiceProvider.makeCall({
        to,
        from: fromPhoneNumber,
        url: callHandlerUrl,
        record: record || true,
      })

      // Create message record for the call
      const message = await MessageRepository.create({
        ticket_id: ticketId,
        from_type: 'agent',
        from_user_id: context.teamMemberId || context.userId,
        sender_id: context.teamMemberId || context.userId,
        sender_type: 'agent',
        body: notes || `Outbound call initiated to ${to}`,
        is_internal: false,
        metadata: {
          call_id: callResponse.callId,
          call_type: 'outbound',
          call_status: 'initiated',
          to: to,
          from: fromPhoneNumber,
          record: record,
          number_source: phoneNumberSource,
        },
      })

      // Update conversation
      await ConversationRepository.update(id, {
        last_message_at: new Date().toISOString(),
        message_count: (conversation.message_count || 0) + 1,
      })

      // Log activity
      if (context.teamMemberId) {
        await ActivityFeedRepository.logMessageSent(ticketId, context.teamMemberId, {
          message_id: message.message_id,
          channel: 'call',
          call_id: callResponse.callId,
        })
      }

      return successResponse({
        call_id: callResponse.callId,
        message_id: message.message_id,
        status: 'initiated',
      }, 'Call initiated successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to initiate call', 500)
    }
  })(req)
}
