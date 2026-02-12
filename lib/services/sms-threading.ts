/**
 * SMS Threading Service
 * Handles SMS threading logic to group related SMS into conversations
 */

import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'

export interface SMSThreadInfo {
  messageId: string
  from: string
  to: string
  body: string
}

export class SMSThreadingService {
  /**
   * Find existing ticket by SMS thread
   * Uses phone number and recent messages to find the conversation
   */
  static async findTicketByThread(
    threadInfo: SMSThreadInfo
  ): Promise<string | null> {
    // Try to find by message ID (if replying to a specific message)
    if (threadInfo.messageId) {
      const message = await MessageRepository.findByExternalId(threadInfo.messageId)
      if (message) {
        return message.ticket_id
      }
    }

    // Try to find by customer phone number (recent open tickets)
    const recentTickets = await TicketRepository.findByCustomerEmail(threadInfo.from)
    const openTicket = recentTickets.find(
      (t) =>
        (t.status === 'open' || t.status === 'in_progress') &&
        t.channel === 'sms' &&
        new Date(t.created_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    )

    return openTicket?.ticket_id || null
  }

  /**
   * Create or update conversation for SMS thread
   */
  static async createOrUpdateConversation(
    ticketId: string,
    threadInfo: SMSThreadInfo
  ): Promise<string> {
    // Find existing conversation for this ticket
    const conversation = await ConversationRepository.findByTicket(ticketId)

    if (conversation) {
      // Update conversation
      await ConversationRepository.update(conversation.conversation_id, {
        last_message_at: new Date().toISOString(),
        message_count: (conversation.message_count || 0) + 1,
      })
      return conversation.conversation_id
    } else {
      // Get ticket to get tenant_id
      const ticket = await TicketRepository.findById(ticketId)
      if (!ticket) {
        throw new Error('Ticket not found')
      }

      // Create new conversation
      const newConversation = await ConversationRepository.create({
        tenant_id: ticket.tenant_id,
        customer_email: threadInfo.from, // Use phone number as email for SMS
        customer_name: ticket.customer_name,
        channel: 'sms',
        status: 'active',
        ticket_id: ticketId,
      })

      return newConversation.conversation_id
    }
  }
}
