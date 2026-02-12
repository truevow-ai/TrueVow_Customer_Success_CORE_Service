/**
 * Unified WebChat Service
 * 
 * Live chat service for customer portal and unified inbox
 * Handles real-time chat conversations
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { UnifiedInboxService } from './unified-inbox-service'

export interface ChatMessage {
  message_id: string
  conversation_id: string
  from_type: 'customer' | 'agent'
  from_user_id: string | null
  body: string
  created_at: string
  metadata?: Record<string, any>
}

export interface ChatSession {
  session_id: string
  conversation_id: string
  customer_email?: string
  customer_id?: string
  tenant_id?: string
  is_active: boolean
  last_activity: string
}

export class UnifiedWebChatService {
  /**
   * Create or get chat session
   */
  static async getOrCreateSession(
    customerEmail?: string,
    customerId?: string,
    tenantId?: string
  ): Promise<ChatSession> {
    const supabase = createServerSupabase()

    // Try to find existing active session
    if (customerEmail || customerId) {
      let query = supabase
        .from('cs_conversations')
        .select('conversation_id, customer_email, customer_id, tenant_id, last_message_at')
        .eq('channel', 'chat')
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)

      if (customerEmail) {
        query = query.eq('customer_email', customerEmail)
      }
      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data: existing } = await query.single()

      if (existing) {
        return {
          session_id: existing.conversation_id, // Use conversation_id as session_id
          conversation_id: existing.conversation_id,
          customer_email: existing.customer_email,
          customer_id: existing.customer_id,
          tenant_id: existing.tenant_id,
          is_active: true,
          last_activity: existing.last_message_at,
        }
      }
    }

    // Create new conversation
    const conversation = await ConversationRepository.create({
      tenant_id: tenantId || null,
      customer_id: customerId || null,
      customer_email: customerEmail || 'anonymous@chat',
      customer_name: null,
      channel: 'chat',
      status: 'active',
      metadata: {
        source: 'webchat',              // ← KEY: Identifies as CS webchat
        created_via: 'customer_portal', // ← Additional identifier
      },
    })

    // Auto-assign to CS context
    if (conversation.conversation_id) {
      await UnifiedInboxService.autoAssignContext(conversation.conversation_id, tenantId)
    }

    // Create ticket
    const ticket = await TicketRepository.create({
      tenant_id: tenantId || null,
      customer_email: customerEmail || 'anonymous@chat',
      subject: 'Chat conversation',
      channel: 'chat',
      status: 'open',
      priority: 'medium',
      source: 'customer',
    })

    // Link conversation to ticket
    await ConversationRepository.update(conversation.conversation_id, {
      ticket_id: ticket.ticket_id,
    })

    return {
      session_id: conversation.conversation_id,
      conversation_id: conversation.conversation_id,
      customer_email: customerEmail,
      customer_id: customerId,
      tenant_id: tenantId,
      is_active: true,
      last_activity: new Date().toISOString(),
    }
  }

  /**
   * Send chat message
   */
  static async sendMessage(
    conversationId: string,
    fromType: 'customer' | 'agent',
    body: string,
    fromUserId?: string
  ): Promise<ChatMessage> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Create message
    const message = await MessageRepository.create({
      ticket_id: conversation.ticket_id || undefined,
      from_type: fromType,
      from_user_id: fromUserId || null,
      sender_id: fromUserId || conversation.customer_id || 'system',
      sender_type: fromType === 'customer' ? 'customer' : 'agent',
      body,
      is_internal: false,
      attachments: {},
    })

    // Update conversation last_message_at
    await ConversationRepository.update(conversationId, {
      last_message_at: new Date().toISOString(),
    })

    return {
      message_id: message.message_id,
      conversation_id: conversationId,
      from_type: fromType,
      from_user_id: fromUserId || null,
      body,
      created_at: message.created_at,
      metadata: message.metadata,
    }
  }

  /**
   * Get chat messages for conversation
   */
  static async getMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return []
    }

    const messages = conversation.ticket_id
      ? await MessageRepository.findByTicket(conversation.ticket_id, { limit })
      : []

    return messages.map((m) => ({
      message_id: m.message_id,
      conversation_id: conversationId,
      from_type: m.from_type === 'customer' ? 'customer' : 'agent',
      from_user_id: m.from_user_id,
      body: m.body,
      created_at: m.created_at,
      metadata: m.metadata,
    }))
  }

  /**
   * Mark chat as read
   */
  static async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Update unread count (can be enhanced with read receipts)
    await ConversationRepository.update(conversationId, {
      unread_count: 0,
    })
  }

  /**
   * End chat session
   */
  static async endSession(conversationId: string): Promise<void> {
    await ConversationRepository.update(conversationId, {
      status: 'closed',
    })

    // Close associated ticket
    const conversation = await ConversationRepository.findById(conversationId)
    if (conversation?.ticket_id) {
      await TicketRepository.update(conversation.ticket_id, {
        status: 'closed',
        resolved_at: new Date().toISOString(),
      })
    }
  }
}
