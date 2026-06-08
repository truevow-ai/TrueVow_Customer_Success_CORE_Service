import { createServerSupabase } from '@/lib/db/supabase'

export interface Conversation {
  conversation_id: string
  tenant_id: string
  customer_email: string
  customer_name: string | null
  channel: string
  status: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  last_message_at: string | null
  metadata: Record<string, any>
}

export interface ConversationInsert {
  tenant_id: string
  customer_email: string
  customer_name?: string
  channel: string
  status?: string
  assigned_to?: string
  metadata?: Record<string, any>
}

export class ConversationRepository {
  /**
   * Get all conversations for a tenant
   */
  static async findByTenant(tenantId: string): Promise<Conversation[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Conversation[]
  }

  /**
   * Get conversation by ID
   */
  static async findById(conversationId: string): Promise<Conversation | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Conversation
  }

  /**
   * Create a new conversation
   */
  static async create(conversation: ConversationInsert): Promise<Conversation> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .insert({
        ...conversation,
        status: conversation.status || 'active',
        last_message_at: new Date().toISOString(),
        first_message_at: new Date().toISOString(),
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
    updates: Partial<Omit<Conversation, 'conversation_id' | 'created_at'>>
  ): Promise<Conversation> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .select()
      .single()

    if (error) throw error
    return data as Conversation
  }
}
