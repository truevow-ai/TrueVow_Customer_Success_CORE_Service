import { createServerSupabase } from '@/lib/db/supabase'

export interface Conversation {
  conversation_id: string
  tenant_id: string
  customer_id: string | null
  customer_email: string
  customer_name: string | null
  channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
  status: 'active' | 'archived' | 'closed'
  ticket_id: string | null
  first_message_at: string
  last_message_at: string
  message_count: number
  unread_count: number
  assigned_to: string | null
  tags: string[] | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConversationInsert {
  conversation_id?: string
  tenant_id: string
  customer_id?: string | null
  customer_email: string
  customer_name?: string | null
  channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
  status?: 'active' | 'archived' | 'closed'
  ticket_id?: string | null
  first_message_at?: string
  last_message_at?: string
  message_count?: number
  unread_count?: number
  assigned_to?: string | null
  tags?: string[] | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ConversationUpdate {
  conversation_id?: string
  tenant_id?: string
  customer_id?: string | null
  customer_email?: string
  customer_name?: string | null
  channel?: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
  status?: 'active' | 'archived' | 'closed'
  ticket_id?: string | null
  first_message_at?: string
  last_message_at?: string
  message_count?: number
  unread_count?: number
  assigned_to?: string | null
  tags?: string[] | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class ConversationRepository {
  /**
   * Get all conversations with optional filters
   */
  static async findAll(filters?: {
    tenantId?: string
    customerEmail?: string
    status?: Conversation['status']
    channel?: Conversation['channel']
    assignedTo?: string
    limit?: number
    offset?: number
  }): Promise<Conversation[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_conversations').select('*')

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }
    if (filters?.customerEmail) {
      query = query.eq('customer_email', filters.customerEmail)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel)
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    query = query.order('last_message_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Conversation[]
  }

  /**
   * Get conversation by ID
   */
  static async findById(conversationId: string): Promise<Conversation | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Conversation
  }

  /**
   * Find conversations by ticket ID
   */
  static async findByTicketId(ticketId: string): Promise<Conversation[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Conversation[]
  }

  /**
   * Create a new conversation
   */
  static async create(conversation: ConversationInsert): Promise<Conversation> {
    const supabase = createServerSupabase()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('cs_conversations')
      .insert({
        ...conversation,
        first_message_at: conversation.first_message_at || now,
        last_message_at: conversation.last_message_at || now,
        message_count: conversation.message_count || 0,
        unread_count: conversation.unread_count || 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as Conversation
  }

  /**
   * Update a conversation
   */
  static async update(
    conversationId: string,
    updates: ConversationUpdate
  ): Promise<Conversation> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .select()
      .single()

    if (error) throw error
    return data as Conversation
  }

  /**
   * Delete a conversation
   */
  static async delete(conversationId: string): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('cs_conversations')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) throw error
  }

  /**
   * Get conversation by customer email
   */
  static async findByCustomerEmail(
    email: string,
    tenantId?: string
  ): Promise<Conversation[]> {
    const supabase = createServerSupabase()
    let query = supabase
      .from('cs_conversations')
      .select('*')
      .eq('customer_email', email)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    query = query.order('last_message_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data as Conversation[]
  }

  /**
   * Get conversation by ticket ID
   */
  static async findByTicket(ticketId: string): Promise<Conversation | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .select('*')
      .eq('ticket_id', ticketId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Conversation
  }

  /**
   * Update last message timestamp and increment message count
   */
  static async updateLastMessage(
    conversationId: string,
    incrementUnread: boolean = false
  ): Promise<Conversation> {
    const supabase = createServerSupabase()
    const now = new Date().toISOString()

    // Get current values
    const current = await this.findById(conversationId)
    if (!current) {
      throw new Error('Conversation not found')
    }

    const updates: ConversationUpdate = {
      last_message_at: now,
      message_count: (current.message_count || 0) + 1,
    }

    if (incrementUnread) {
      updates.unread_count = (current.unread_count || 0) + 1
    }

    return this.update(conversationId, updates)
  }

  /**
   * Mark conversation as read (reset unread count)
   */
  static async markAsRead(conversationId: string): Promise<Conversation> {
    return this.update(conversationId, { unread_count: 0 })
  }

  /**
   * Assign conversation to user
   */
  static async assign(
    conversationId: string,
    userId: string
  ): Promise<Conversation> {
    return this.update(conversationId, { assigned_to: userId })
  }

  /**
   * Update conversation status
   */
  static async updateStatus(
    conversationId: string,
    status: Conversation['status']
  ): Promise<Conversation> {
    return this.update(conversationId, { status })
  }

  /**
   * Link conversation to ticket
   */
  static async linkToTicket(
    conversationId: string,
    ticketId: string
  ): Promise<Conversation> {
    return this.update(conversationId, { ticket_id: ticketId })
  }

  /**
   * Get active conversations for tenant
   */
  static async findActive(tenantId: string): Promise<Conversation[]> {
    return this.findAll({ tenantId, status: 'active' })
  }

  /**
   * Get unread conversations for user
   */
  static async findUnread(
    tenantId: string,
    assignedTo?: string
  ): Promise<Conversation[]> {
    const supabase = createServerSupabase()
    let query = supabase
      .from('cs_conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('unread_count', 0)
      .eq('status', 'active')

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    query = query.order('last_message_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data as Conversation[]
  }
}
