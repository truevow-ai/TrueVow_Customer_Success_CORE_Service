/**
 * Advanced Search Service
 * Provides semantic search, AI-powered suggestions, and advanced filtering
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { Conversation } from '@/lib/repositories/conversations'

export interface SearchFilters {
  query?: string
  channel?: string[]
  status?: string[]
  priority?: string[]
  assignedTo?: string[]
  tags?: string[]
  dateRange?: {
    from: string
    to: string
  }
  customerEmail?: string
  tenantId?: string
}

export interface SearchResult {
  conversation_id: string
  ticket_id: string | null
  channel: string
  customer_email: string
  customer_name: string | null
  subject: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  status: string
  priority: string
  assigned_to: string | null
  tags: string[] | null
  relevance_score?: number
}

export interface SearchSuggestion {
  type: 'query' | 'filter' | 'tag' | 'customer'
  text: string
  count?: number
}

export class AdvancedSearchService {
  /**
   * Perform advanced search with filters
   */
  static async search(
    filters: SearchFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ results: SearchResult[]; total: number }> {
    const supabase = createServerSupabase()

    // Build base query - use simpler select to avoid join issues
    let query = supabase
      .from('cs_conversations')
      .select('*')

    // Apply filters
    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }

    if (filters.channel && filters.channel.length > 0) {
      query = query.in('channel', filters.channel)
    }

    // Note: Status filtering will be done after fetching tickets

    if (filters.assignedTo && filters.assignedTo.length > 0) {
      if (filters.assignedTo.includes('unassigned')) {
        query = query.is('assigned_to', null)
      } else {
        query = query.in('assigned_to', filters.assignedTo)
      }
    }

    if (filters.customerEmail) {
      query = query.ilike('customer_email', `%${filters.customerEmail}%`)
    }

    if (filters.tags && filters.tags.length > 0) {
      // Filter by tags (array contains)
      for (const tag of filters.tags) {
        query = query.contains('tags', [tag])
      }
    }

    if (filters.dateRange) {
      query = query
        .gte('last_message_at', filters.dateRange.from)
        .lte('last_message_at', filters.dateRange.to)
    }

    // Full-text search on query string
    if (filters.query) {
      const searchQuery = filters.query.trim()
      
      // Try PostgreSQL full-text search first
      // If that doesn't work, fall back to ILIKE
      query = query.or(
        `customer_email.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,cs_tickets.subject.ilike.%${searchQuery}%`
      )
    }

    // Order by last message (most recent first)
    query = query.order('last_message_at', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    // Fetch tickets for conversations
    const conversations = data || []
    const ticketIds = conversations
      .map((c: any) => c.ticket_id)
      .filter((id: string | null) => id !== null)

    let tickets: any[] = []
    if (ticketIds.length > 0) {
      const { data: ticketsData } = await supabase
        .from('cs_tickets')
        .select('*')
        .in('ticket_id', ticketIds)

      tickets = ticketsData || []
    }

    // Create ticket map
    const ticketMap = new Map(tickets.map((t) => [t.ticket_id, t]))

    // Transform results and apply status/priority filters
    const results: SearchResult[] = conversations
      .map((item: any) => {
        const ticket = item.ticket_id ? ticketMap.get(item.ticket_id) : null

        // Apply status filter if set
        if (filters.status && filters.status.length > 0) {
          const ticketStatus = ticket?.status || 'open'
          if (!filters.status.includes(ticketStatus)) {
            return null
          }
        }

        // Apply priority filter if set
        if (filters.priority && filters.priority.length > 0) {
          const ticketPriority = ticket?.priority || 'medium'
          if (!filters.priority.includes(ticketPriority)) {
            return null
          }
        }

        return {
          conversation_id: item.conversation_id,
          ticket_id: item.ticket_id,
          channel: item.channel,
          customer_email: item.customer_email,
          customer_name: item.customer_name,
          subject: ticket?.subject || null,
          last_message_at: item.last_message_at,
          last_message_preview: item.metadata?.last_message_preview || null,
          unread_count: item.unread_count || 0,
          status: ticket?.status || 'open',
          priority: ticket?.priority || 'medium',
          assigned_to: ticket?.assigned_to || item.assigned_to,
          tags: item.tags,
        }
      })
      .filter((r: any) => r !== null)

    // Get total count (without pagination)
    const countQuery = supabase
      .from('cs_conversations')
      .select('conversation_id', { count: 'exact', head: true })

    // Apply same filters for count
    if (filters.tenantId) {
      countQuery.eq('tenant_id', filters.tenantId)
    }
    if (filters.channel && filters.channel.length > 0) {
      countQuery.in('channel', filters.channel)
    }

    const { count } = await countQuery

    return {
      results,
      total: count || 0,
    }
  }

  /**
   * Get search suggestions based on query
   */
  static async getSuggestions(
    partialQuery: string,
    tenantId?: string
  ): Promise<SearchSuggestion[]> {
    if (!partialQuery || partialQuery.length < 2) {
      return []
    }

    const supabase = createServerSupabase()
    const suggestions: SearchSuggestion[] = []

    // Customer email suggestions
    const { data: customers } = await supabase
      .from('cs_conversations')
      .select('customer_email, customer_name')
      .ilike('customer_email', `%${partialQuery}%`)
      .limit(5)

    if (customers) {
      for (const customer of customers) {
        suggestions.push({
          type: 'customer',
          text: customer.customer_email,
        })
      }
    }

    // Tag suggestions
    const { data: conversations } = await supabase
      .from('cs_conversations')
      .select('tags')
      .not('tags', 'is', null)
      .limit(100)

    if (conversations) {
      const tagCounts: Record<string, number> = {}
      for (const conv of conversations) {
        if (conv.tags) {
          for (const tag of conv.tags) {
            if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1
            }
          }
        }
      }

      for (const [tag, count] of Object.entries(tagCounts)) {
        suggestions.push({
          type: 'tag',
          text: tag,
          count,
        })
      }
    }

    // Common query suggestions
    const commonQueries = [
      { type: 'query' as const, text: 'billing issue' },
      { type: 'query' as const, text: 'technical problem' },
      { type: 'query' as const, text: 'feature request' },
      { type: 'query' as const, text: 'bug report' },
    ]

    for (const query of commonQueries) {
      if (query.text.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.push(query)
      }
    }

    return suggestions.slice(0, 10)
  }

  /**
   * Search messages within conversations (deep search)
   */
  static async searchMessages(
    query: string,
    filters?: {
      conversationId?: string
      ticketId?: string
      fromDate?: string
      toDate?: string
    },
    limit: number = 20
  ): Promise<any[]> {
    const supabase = createServerSupabase()

    let messageQuery = supabase
      .from('cs_messages')
      .select('*')
      .ilike('body', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filters?.conversationId) {
      // Get ticket ID from conversation
      const { data: conv } = await supabase
        .from('cs_conversations')
        .select('ticket_id')
        .eq('conversation_id', filters.conversationId)
        .single()

      if (conv?.ticket_id) {
        messageQuery = messageQuery.eq('ticket_id', conv.ticket_id)
      }
    }

    if (filters?.ticketId) {
      messageQuery = messageQuery.eq('ticket_id', filters.ticketId)
    }

    if (filters?.fromDate) {
      messageQuery = messageQuery.gte('created_at', filters.fromDate)
    }

    if (filters?.toDate) {
      messageQuery = messageQuery.lte('created_at', filters.toDate)
    }

    const { data, error } = await messageQuery

    if (error) throw error
    return data || []
  }
}
