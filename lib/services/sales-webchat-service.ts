/**
 * Sales WebChat Service
 * 
 * Sales-focused webchat for marketing website
 * Purpose: Convert prospects to leads (NOT customer support)
 * 
 * SEPARATION: Assigns to SALES context (not CS context)
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { UnifiedInboxService } from './unified-inbox-service'

export interface SalesChatSession {
  session_id: string
  conversation_id: string
  prospect_email?: string
  prospect_name?: string
  is_existing_customer: boolean
  tenant_id?: string
  is_active: boolean
  last_activity: string
}

export interface CustomerCheckResult {
  is_customer: boolean
  customer_id?: string
  tenant_id?: string
  redirect_url?: string
}

export class SalesWebChatService {
  /**
   * Check if visitor is an existing customer
   */
  static async checkIfCustomer(
    email?: string,
    phone?: string
  ): Promise<CustomerCheckResult> {
    if (!email && !phone) {
      return { is_customer: false }
    }

    const supabase = createServerSupabase()

    // Check if email exists in conversations (indicates existing customer)
    if (email) {
      const { data: conversations } = await supabase
        .from('cs_conversations')
        .select('tenant_id, customer_id')
        .eq('customer_email', email)
        .limit(1)
        .single()

      if (conversations) {
        return {
          is_customer: true,
          customer_id: conversations.customer_id,
          tenant_id: conversations.tenant_id,
          redirect_url: '/customer-portal/support',
        }
      }
    }

    // Check by phone if provided
    if (phone) {
      const { data: conversations } = await supabase
        .from('cs_conversations')
        .select('tenant_id, customer_id')
        .or(`customer_email.ilike.%${phone}%,metadata->>phone.eq.${phone}`)
        .limit(1)
        .single()

      if (conversations) {
        return {
          is_customer: true,
          customer_id: conversations.customer_id,
          tenant_id: conversations.tenant_id,
          redirect_url: '/customer-portal/support',
        }
      }
    }

    return { is_customer: false }
  }

  /**
   * Create or get sales chat session (for prospects only)
   * 
   * KEY SEPARATION: Assigns to SALES context, NOT CS context
   */
  static async getOrCreateSalesSession(
    prospectEmail?: string,
    prospectName?: string,
    prospectPhone?: string
  ): Promise<SalesChatSession> {
    // First, check if this is an existing customer
    const customerCheck = await this.checkIfCustomer(prospectEmail, prospectPhone)

    if (customerCheck.is_customer) {
      // Existing customer - should be redirected
      throw new Error('EXISTING_CUSTOMER_REDIRECT')
    }

    const supabase = createServerSupabase()

    // Try to find existing active sales session
    if (prospectEmail) {
      const { data: existing } = await supabase
        .from('cs_conversations')
        .select('conversation_id, customer_email, customer_name, tenant_id, last_message_at')
        .eq('channel', 'chat')
        .eq('status', 'active')
        .eq('customer_email', prospectEmail)
        .or('metadata->>source.eq.sales,metadata->>source.eq.marketing_website')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        return {
          session_id: existing.conversation_id,
          conversation_id: existing.conversation_id,
          prospect_email: existing.customer_email,
          prospect_name: existing.customer_name,
          is_existing_customer: false,
          tenant_id: existing.tenant_id,
          is_active: true,
          last_activity: existing.last_message_at,
        }
      }
    }

    // Create new sales conversation with SALES metadata
    const conversation = await ConversationRepository.create({
      tenant_id: null, // No tenant yet - this is a prospect
      customer_id: null,
      customer_email: prospectEmail || 'prospect@marketing',
      customer_name: prospectName,
      channel: 'chat',
      status: 'active',
      metadata: {
        source: 'marketing_website',        // ← KEY: Identifies as sales webchat
        created_via: 'sales_webchat',       // ← Additional identifier
        is_prospect: true,                  // ← Prospect flag
        prospect_phone: prospectPhone,
      },
    })

    // SEPARATION: Auto-assign to SALES context (NOT CS)
    if (conversation.conversation_id) {
      // Get or create sales context
      const supabase = createServerSupabase()
      let { data: salesContext } = await supabase
        .from('unified_inbox_contexts')
        .select('context_id')
        .eq('context_type', 'sales')
        .is('tenant_id', null) // System-wide sales context
        .single()

      if (!salesContext) {
        // Create sales context
        const { data: newContext } = await supabase
          .from('unified_inbox_contexts')
          .insert({
            context_type: 'sales',
            name: 'Sales Inbox',
            description: 'Sales inquiries from marketing website',
            tenant_id: null,
            is_active: true,
          })
          .select('context_id')
          .single()

        salesContext = newContext
      }

      if (salesContext) {
        // Explicitly assign to SALES context (not CS)
        await UnifiedInboxService.assignToContext(
          conversation.conversation_id,
          salesContext.context_id,
          'sales',  // ← Assigned to SALES team (not CS)
          5         // ← Higher priority for sales leads
        )
      }
    }

    return {
      session_id: conversation.conversation_id,
      conversation_id: conversation.conversation_id,
      prospect_email: prospectEmail,
      prospect_name: prospectName,
      is_existing_customer: false,
      tenant_id: null,
      is_active: true,
      last_activity: new Date().toISOString(),
    }
  }

  /**
   * Send message in sales chat
   */
  static async sendMessage(
    conversationId: string,
    fromType: 'prospect' | 'agent',
    body: string,
    fromUserId?: string
  ): Promise<any> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Create message
    const message = await MessageRepository.create({
      ticket_id: conversation.ticket_id || undefined,
      from_type: fromType === 'prospect' ? 'customer' : 'agent',
      from_user_id: fromUserId || null,
      sender_id: conversation.customer_id || conversation.customer_email || 'system',
      sender_type: fromType === 'prospect' ? 'customer' : 'agent',
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
   * Get messages for sales conversation
   */
  static async getMessages(conversationId: string, limit: number = 50): Promise<any[]> {
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
      from_type: m.from_type === 'customer' ? 'prospect' : 'agent',
      from_user_id: m.from_user_id,
      body: m.body,
      created_at: m.created_at,
      metadata: m.metadata,
    }))
  }
}
