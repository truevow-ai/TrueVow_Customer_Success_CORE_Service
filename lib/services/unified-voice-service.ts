/**
 * Unified Voice Service
 * 
 * Unified voice call handling for inbound and outbound calls
 * Integrates with existing call infrastructure
 */

import { UnifiedDialerService } from './unified-dialer-service'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { UnifiedInboxService } from './unified-inbox-service'

export interface CallMetadata {
  call_id: string
  call_type: 'inbound' | 'outbound'
  call_status: string
  to: string
  from: string
  duration?: number
  recording_url?: string
  transcription?: string
}

export class UnifiedVoiceService {
  /**
   * Initiate outbound call
   */
  static async initiateCall(
    conversationId: string,
    to: string,
    userId: string,
    notes?: string
  ): Promise<{ call_id: string; phone_number: string }> {
    // Get phone number from unified dialer
    const phoneResult = await UnifiedDialerService.getPhoneNumber({
      user_id: userId,
      department: 'customer_support',
      call_type: 'outbound',
    })

    // Create message record (call will be initiated via existing API)
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // The actual call initiation is handled by /api/v1/inbox/[id]/call
    // This service just provides the phone number
    return {
      call_id: '', // Will be set by call API
      phone_number: phoneResult.phone_number,
    }
  }

  /**
   * Handle inbound call
   */
  static async handleInboundCall(
    from: string,
    to: string,
    callId: string,
    tenantId?: string
  ): Promise<string> {
    // Find or create conversation
    const existingConversations = await ConversationRepository.findAll({
      channel: 'call',
      limit: 1,
    })

    let conversationId: string

    // Try to find existing active conversation
    const activeConversation = existingConversations.find(
      (c) => c.customer_email === from && c.status === 'active'
    )

    if (activeConversation) {
      conversationId = activeConversation.conversation_id
    } else {
      // Create new conversation
      const conversation = await ConversationRepository.create({
        tenant_id: tenantId || null,
        customer_email: from,
        customer_name: null,
        channel: 'call',
        status: 'active',
        metadata: {
          source: 'inbound_call',
          call_id: callId,
        },
      })

      conversationId = conversation.conversation_id

      // Auto-assign to CS context
      await UnifiedInboxService.autoAssignContext(conversationId, tenantId)

      // Create ticket
      const ticket = await TicketRepository.create({
        tenant_id: tenantId || null,
        customer_email: from,
        subject: `Inbound call from ${from}`,
        channel: 'call',
        status: 'open',
        priority: 'medium',
        source: 'customer',
      })

      // Link conversation to ticket
      await ConversationRepository.update(conversationId, {
        ticket_id: ticket.ticket_id,
      })
    }

    return conversationId
  }

  /**
   * Update call status
   */
  static async updateCallStatus(
    conversationId: string,
    callMetadata: CallMetadata
  ): Promise<void> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return
    }

    // Update conversation metadata with call info
    await ConversationRepository.update(conversationId, {
      metadata: {
        ...conversation.metadata,
        call: callMetadata,
      },
    })

    // If call completed, create message with transcription
    if (callMetadata.call_status === 'completed' && callMetadata.transcription) {
      await MessageRepository.create({
        ticket_id: conversation.ticket_id || undefined,
        from_type: 'customer',
        from_user_id: null,
        sender_id: conversation.customer_id || 'system',
        sender_type: 'customer',
        body: callMetadata.transcription,
        is_internal: false,
        attachments: {},
        metadata: {
          call_id: callMetadata.call_id,
          call_type: callMetadata.call_type,
          duration: callMetadata.duration,
          recording_url: callMetadata.recording_url,
        },
      })
    }
  }
}
