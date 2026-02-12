/**
 * Multi-Channel Conversation Linking Service
 * 
 * Links conversations across different channels (email, SMS, WhatsApp, calls)
 * to create a unified customer conversation view.
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'

export type Channel = 'email' | 'sms' | 'whatsapp' | 'call' | 'chat' | 'facebook' | 'form'

export interface ChannelIdentifier {
  email?: string
  phone?: string
  customerId?: string
  contactId?: string
}

export interface ConversationLink {
  conversation_id: string
  channel: Channel
  customer_email: string
  customer_phone?: string
  ticket_id: string
  linked_at: string
}

/**
 * Multi-Channel Conversation Linking Service
 */
export class MultiChannelLinkingService {
  /**
   * Find or create a unified conversation across channels
   * Links conversations by customer email, phone, or customer ID
   */
  static async findOrCreateUnifiedConversation(
    channel: Channel,
    identifier: ChannelIdentifier,
    ticketId: string
  ): Promise<string> {
    const supabase = createServerSupabase()

    // Try to find existing conversation by customer identifier
    let existingConversation = null

    // First, try to find by customer email
    if (identifier.email) {
      const { data: conversations } = await supabase
        .from('cs_conversations')
        .select('*')
        .eq('customer_email', identifier.email)
        .in('status', ['active', 'archived'])
        .order('last_message_at', { ascending: false })
        .limit(1)

      if (conversations && conversations.length > 0) {
        existingConversation = conversations[0]
      }
    }

    // If not found by email, try by phone number
    if (!existingConversation && identifier.phone) {
      const { data: conversations } = await supabase
        .from('cs_conversations')
        .select('*')
        .or(`customer_email.eq.${identifier.phone},metadata->>phone.eq.${identifier.phone}`)
        .in('status', ['active', 'archived'])
        .order('last_message_at', { ascending: false })
        .limit(1)

      if (conversations && conversations.length > 0) {
        existingConversation = conversations[0]
      }
    }

    // If found existing conversation, link this ticket to it
    if (existingConversation) {
      // Update conversation to include this channel if not already present
      const existingChannels = existingConversation.metadata?.channels || [existingConversation.channel]
      if (!existingChannels.includes(channel)) {
        existingChannels.push(channel)
        await ConversationRepository.update(existingConversation.conversation_id, {
          metadata: {
            ...existingConversation.metadata,
            channels: existingChannels,
            linked_channels: existingChannels,
          },
        })
      }

      // Link ticket to existing conversation if not already linked
      if (existingConversation.ticket_id !== ticketId) {
        // Create link record in metadata
        const links = existingConversation.metadata?.linked_tickets || []
        if (!links.includes(ticketId)) {
          links.push(ticketId)
          await ConversationRepository.update(existingConversation.conversation_id, {
            metadata: {
              ...existingConversation.metadata,
              linked_tickets: links,
            },
          })
        }
      }

      return existingConversation.conversation_id
    }

    // No existing conversation found, check if ticket already has a conversation
    const ticketConversation = await ConversationRepository.findByTicket(ticketId)
    if (ticketConversation) {
      // Update existing conversation with channel info
      const existingChannels = ticketConversation.metadata?.channels || [ticketConversation.channel]
      if (!existingChannels.includes(channel)) {
        existingChannels.push(channel)
        await ConversationRepository.update(ticketConversation.conversation_id, {
          metadata: {
            ...ticketConversation.metadata,
            channels: existingChannels,
            phone: identifier.phone || ticketConversation.metadata?.phone,
            customer_id: identifier.customerId || ticketConversation.metadata?.customer_id,
            contact_id: identifier.contactId || ticketConversation.metadata?.contact_id,
          },
        })
      }
      return ticketConversation.conversation_id
    }

    // No existing conversation found, create new one
    const ticket = await TicketRepository.findById(ticketId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const newConversation = await ConversationRepository.create({
      tenant_id: ticket.tenant_id,
      customer_email: identifier.email || identifier.phone || ticket.customer_email || '',
      customer_name: ticket.customer_name,
      channel: channel,
      status: 'active',
      ticket_id: ticketId,
      metadata: {
        channels: [channel],
        phone: identifier.phone,
        customer_id: identifier.customerId,
        contact_id: identifier.contactId,
      },
    })

    return newConversation.conversation_id
  }

  /**
   * Link conversations across channels
   * Creates a link between conversations from different channels for the same customer
   */
  static async linkConversations(
    conversationId1: string,
    conversationId2: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get both conversations
    const conv1 = await ConversationRepository.findById(conversationId1)
    const conv2 = await ConversationRepository.findById(conversationId2)

    if (!conv1 || !conv2) {
      throw new Error('One or both conversations not found')
    }

    // Merge channels
    const channels1 = conv1.metadata?.channels || [conv1.channel]
    const channels2 = conv2.metadata?.channels || [conv2.channel]
    const allChannels = [...new Set([...channels1, ...channels2])]

    // Merge linked tickets
    const linkedTickets1 = conv1.metadata?.linked_tickets || []
    const linkedTickets2 = conv2.metadata?.linked_tickets || []
    const allLinkedTickets = [...new Set([...linkedTickets1, ...linkedTickets2])]

    // Update both conversations with merged data
    await ConversationRepository.update(conversationId1, {
      metadata: {
        ...conv1.metadata,
        channels: allChannels,
        linked_tickets: allLinkedTickets,
        linked_conversations: [
          ...(conv1.metadata?.linked_conversations || []),
          conversationId2,
        ],
      },
    })

    await ConversationRepository.update(conversationId2, {
      metadata: {
        ...conv2.metadata,
        channels: allChannels,
        linked_tickets: allLinkedTickets,
        linked_conversations: [
          ...(conv2.metadata?.linked_conversations || []),
          conversationId1,
        ],
      },
    })
  }

  /**
   * Get all linked conversations for a customer
   */
  static async getLinkedConversations(
    customerEmail: string,
    customerPhone?: string
  ): Promise<any[]> {
    const supabase = createServerSupabase()

    // Find all conversations for this customer
    let query = supabase
      .from('cs_conversations')
      .select('*')
      .or(`customer_email.eq.${customerEmail}${customerPhone ? `,customer_email.eq.${customerPhone}` : ''}`)
      .order('last_message_at', { ascending: false })

    const { data: conversations, error } = await query

    if (error) {
      throw new Error(`Failed to get linked conversations: ${error.message}`)
    }

    return conversations || []
  }

  /**
   * Get unified conversation view (all channels for a customer)
   */
  static async getUnifiedConversationView(
    identifier: ChannelIdentifier
  ): Promise<{
    conversations: any[]
    tickets: any[]
    messages: any[]
    channels: Channel[]
  }> {
    // Get all linked conversations
    const conversations = await this.getLinkedConversations(
      identifier.email || '',
      identifier.phone
    )

    // Get all tickets from conversations
    const ticketIds = conversations
      .map((c) => c.ticket_id)
      .filter(Boolean) as string[]

    const tickets = ticketIds.length > 0
      ? await Promise.all(
          ticketIds.map((id) => TicketRepository.findById(id))
        )
      : []

    // Get all messages from conversations
    const messageIds = conversations.flatMap((c) => c.metadata?.message_ids || [])
    const messages = messageIds.length > 0
      ? await Promise.all(
          messageIds.map((id) => MessageRepository.findById(id))
        )
      : []

    // Get all channels
    const channels = [
      ...new Set(
        conversations.flatMap((c) => c.metadata?.channels || [c.channel])
      ),
    ] as Channel[]

    return {
      conversations,
      tickets: tickets.filter(Boolean),
      messages: messages.filter(Boolean),
      channels,
    }
  }
}
