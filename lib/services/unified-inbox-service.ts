/**
 * Unified Inbox Service
 * 
 * Multi-context conversation management for unified shared inbox
 * Supports Sales, CS, Ops, Management, and AI contexts
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'

export type InboxContext = 'sales' | 'cs' | 'ops' | 'management' | 'ai'

export interface ConversationFilters {
  context?: InboxContext
  channel?: string
  status?: string
  assigned_to?: string
  search?: string
  tags?: string[]
  page?: number
  limit?: number
}

export interface ConversationResult {
  conversations: any[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface InboxContext {
  context_id: string
  context_type: InboxContext
  name: string
  description?: string
  tenant_id?: string
  is_active: boolean
}

export class UnifiedInboxService {
  /**
   * Get conversations for a specific context
   */
  static async getConversationsForContext(
    contextType: InboxContext,
    filters: ConversationFilters,
    userId: string,
    tenantId?: string
  ): Promise<ConversationResult> {
    const supabase = createServerSupabase()

    // Get context ID for this context type and tenant
    const { data: context } = await supabase
      .from('unified_inbox_contexts')
      .select('context_id')
      .eq('context_type', contextType)
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId || 'null'}`)
      .single()

    if (!context) {
      return {
        conversations: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 50,
        totalPages: 0,
      }
    }

    // Get conversation IDs assigned to this context
    let query = supabase
      .from('unified_conversation_contexts')
      .select('conversation_id')
      .eq('context_id', context.context_id)

    const { data: assignments } = await query

    if (!assignments || assignments.length === 0) {
      return {
        conversations: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 50,
        totalPages: 0,
      }
    }

    const conversationIds = assignments.map((a) => a.conversation_id)

    // Get conversations with filters
    const conversations = await ConversationRepository.findAll({
      conversation_ids: conversationIds,
      channel: filters.channel,
      status: filters.status,
      search: filters.search,
      limit: filters.limit || 50,
      offset: ((filters.page || 1) - 1) * (filters.limit || 50),
    })

    // Get total count
    const total = conversations.length // Simplified - should count all matching

    return {
      conversations,
      total,
      page: filters.page || 1,
      limit: filters.limit || 50,
      totalPages: Math.ceil(total / (filters.limit || 50)),
    }
  }

  /**
   * Get available contexts for a user
   */
  static async getAvailableContexts(
    userId: string,
    tenantId?: string
  ): Promise<InboxContext[]> {
    const supabase = createServerSupabase()

    // Get all active contexts (system-wide + tenant-specific)
    const { data: contexts } = await supabase
      .from('unified_inbox_contexts')
      .select('*')
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId || 'null'}`)
      .order('context_type')

    return (contexts || []) as InboxContext[]
  }

  /**
   * Assign conversation to a context
   */
  static async assignToContext(
    conversationId: string,
    contextId: string,
    assignedTeam?: string,
    priority: number = 0
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get context to get context_type
    const { data: context } = await supabase
      .from('unified_inbox_contexts')
      .select('context_type')
      .eq('context_id', contextId)
      .single()

    if (!context) {
      throw new Error('Context not found')
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('unified_conversation_contexts')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('context_id', contextId)
      .single()

    if (existing) {
      // Update existing assignment
      await supabase
        .from('unified_conversation_contexts')
        .update({
          assigned_team: assignedTeam,
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new assignment
      await supabase.from('unified_conversation_contexts').insert({
        conversation_id: conversationId,
        context_id: contextId,
        context_type: context.context_type,
        assigned_team: assignedTeam,
        priority,
      })
    }
  }

  /**
   * Auto-assign conversation to default CS context
   */
  static async autoAssignContext(
    conversationId: string,
    tenantId?: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get or create CS context for tenant
    let { data: context } = await supabase
      .from('unified_inbox_contexts')
      .select('context_id')
      .eq('context_type', 'cs')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId || 'null'}`)
      .single()

    if (!context) {
      // Create default CS context
      const { data: newContext } = await supabase
        .from('unified_inbox_contexts')
        .insert({
          context_type: 'cs',
          name: 'Customer Support',
          description: 'Default customer support inbox',
          tenant_id: tenantId || null,
          is_active: true,
        })
        .select('context_id')
        .single()

      if (!newContext) {
        throw new Error('Failed to create CS context')
      }

      context = newContext
    }

    // Assign conversation to CS context
    await this.assignToContext(conversationId, context.context_id, 'cs', 0)
  }

  /**
   * Get contexts for a conversation
   */
  static async getConversationContexts(
    conversationId: string
  ): Promise<InboxContext[]> {
    const supabase = createServerSupabase()

    const { data: assignments } = await supabase
      .from('unified_conversation_contexts')
      .select('context_id')
      .eq('conversation_id', conversationId)

    if (!assignments || assignments.length === 0) {
      return []
    }

    const contextIds = assignments.map((a) => a.context_id)

    const { data: contexts } = await supabase
      .from('unified_inbox_contexts')
      .select('*')
      .in('context_id', contextIds)
      .eq('is_active', true)

    return (contexts || []) as InboxContext[]
  }

  /**
   * Remove conversation from a context
   */
  static async removeFromContext(
    conversationId: string,
    contextId: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    await supabase
      .from('unified_conversation_contexts')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('context_id', contextId)
  }

  /**
   * Check if user can access conversation in context
   */
  static async canAccessConversation(
    userId: string,
    conversationId: string,
    contextType?: InboxContext
  ): Promise<boolean> {
    // TODO: Implement role-based access control
    // For now, if conversation is in a context, user can access it
    const contexts = await this.getConversationContexts(conversationId)
    
    if (contextType) {
      return contexts.some((c) => c.context_type === contextType)
    }
    
    return contexts.length > 0
  }
}
