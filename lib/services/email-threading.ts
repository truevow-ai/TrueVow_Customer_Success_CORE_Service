/**
 * Email Threading Service
 * Handles email threading logic to group related emails into conversations
 */

import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'

export interface EmailThreadInfo {
  messageId: string
  inReplyTo?: string
  references?: string[]
  from: string
  to: string
  subject: string
}

export class EmailThreadingService {
  /**
   * Find existing ticket by email thread
   * Uses In-Reply-To and References headers to find the original conversation
   */
  static async findTicketByThread(
    threadInfo: EmailThreadInfo
  ): Promise<string | null> {
    // Try to find by In-Reply-To header
    if (threadInfo.inReplyTo) {
      const message = await MessageRepository.findByExternalId(threadInfo.inReplyTo)
      if (message) {
        return message.ticket_id
      }
    }

    // Try to find by References header (check all references)
    if (threadInfo.references && threadInfo.references.length > 0) {
      for (const ref of threadInfo.references) {
        const message = await MessageRepository.findByExternalId(ref)
        if (message) {
          return message.ticket_id
        }
      }
    }

    // Try to find by subject line (Re: or Fwd: patterns)
    const subjectMatch = threadInfo.subject.match(/^(Re|Fwd?):\s*(.+)/i)
    if (subjectMatch) {
      const originalSubject = subjectMatch[2].trim()
      const tickets = await TicketRepository.findBySubject(originalSubject)
      if (tickets.length > 0) {
        // Find ticket with matching customer email
        const matchingTicket = tickets.find(
          (t) => t.customer_email === threadInfo.from
        )
        if (matchingTicket) {
          return matchingTicket.ticket_id
        }
      }
    }

    // Try to find by customer email (recent open tickets)
    const recentTickets = await TicketRepository.findByCustomerEmail(threadInfo.from)
    const openTicket = recentTickets.find(
      (t) =>
        (t.status === 'open' || t.status === 'in_progress') &&
        t.channel === 'email' &&
        t.created_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
    )

    return openTicket?.ticket_id || null
  }

  /**
   * Create or update conversation for email thread
   */
  static async createOrUpdateConversation(
    ticketId: string,
    threadInfo: EmailThreadInfo
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
        customer_email: threadInfo.from,
        customer_name: ticket.customer_name,
        channel: 'email',
        status: 'active',
        ticket_id: ticketId,
      })

      return newConversation.conversation_id
    }
  }
}
