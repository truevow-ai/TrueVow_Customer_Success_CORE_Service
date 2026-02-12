/**
 * Auto-Assignment Service
 * 
 * Automatically assigns conversations to contexts and triggers workflows
 */

import { UnifiedInboxService } from './unified-inbox-service'
import { WorkflowEngine } from './workflow-engine'
import { ConversationRepository } from '@/lib/repositories/conversations'

export class AutoAssignmentService {
  /**
   * Auto-assign conversation to context on creation
   */
  static async assignOnCreation(conversationId: string, tenantId?: string): Promise<void> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return
    }

    // Auto-assign to appropriate context based on channel and metadata
    let contextType: 'sales' | 'cs' | 'ops' | 'management' | 'ai' = 'cs'

    // Determine context based on channel
    switch (conversation.channel) {
      case 'email':
      case 'sms':
      case 'whatsapp':
      case 'chat':
        // Customer support channels -> CS context
        contextType = 'cs'
        break
      case 'call':
        // Calls can be sales or support
        // Check metadata for hints
        if (conversation.metadata?.source === 'sales' || conversation.metadata?.call_type === 'sales') {
          contextType = 'sales'
        } else {
          contextType = 'cs'
        }
        break
      case 'form':
        // Forms can be sales inquiries or support
        if (conversation.metadata?.form_type === 'sales' || conversation.metadata?.inquiry_type === 'sales') {
          contextType = 'sales'
        } else {
          contextType = 'cs'
        }
        break
      default:
        contextType = 'cs'
    }

    // Auto-assign to context
    await UnifiedInboxService.autoAssignContext(conversationId, tenantId)

    // Trigger automatic workflows
    await this.triggerAutomaticWorkflows(conversationId, 'conversation_created')
  }

  /**
   * Trigger automatic workflows for conversation events
   */
  static async triggerAutomaticWorkflows(
    conversationId: string,
    trigger: 'conversation_created' | 'message_received' | 'status_changed' | 'tag_added'
  ): Promise<void> {
    try {
      await WorkflowEngine.executeAutomatic(conversationId, trigger)
    } catch (error) {
      console.error('Error triggering automatic workflows:', error)
      // Don't throw - workflow execution is non-critical
    }
  }

  /**
   * Auto-assign based on message content (AI-powered)
   */
  static async assignBasedOnContent(conversationId: string): Promise<void> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return
    }

    // Get first message to analyze
    const messages = conversation.ticket_id
      ? await (await import('@/lib/repositories/messages')).MessageRepository.findByTicket(
          conversation.ticket_id,
          { limit: 1 }
        )
      : []

    if (messages.length === 0) {
      return
    }

    const firstMessage = messages[0]
    const messageText = firstMessage.body.toLowerCase()

    // Simple keyword-based assignment (can be enhanced with AI)
    if (
      messageText.includes('purchase') ||
      messageText.includes('buy') ||
      messageText.includes('demo') ||
      messageText.includes('pricing') ||
      messageText.includes('quote')
    ) {
      // Sales inquiry
      // Note: Sales context should be created per-tenant
      // For now, assign to CS and let manual reassignment handle it
    } else if (
      messageText.includes('bug') ||
      messageText.includes('error') ||
      messageText.includes('issue') ||
      messageText.includes('problem')
    ) {
      // Technical support -> CS context (already default)
    }

    // Auto-assign to CS context (default)
    await UnifiedInboxService.autoAssignContext(conversationId, conversation.tenant_id)
  }
}
