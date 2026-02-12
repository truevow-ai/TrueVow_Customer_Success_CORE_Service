import { createServerSupabase } from '@/lib/db/supabase'

export interface AgentExecution {
  execution_id: string
  agent_id: string
  ticket_id: string | null
  conversation_id: string | null
  execution_type: 'chat' | 'suggest' | 'analyze' | 'escalate' | 'other'
  input_text: string | null
  output_text: string | null
  llm_provider: string | null
  llm_model: string | null
  tokens_input: number | null
  tokens_output: number | null
  tokens_total: number | null
  cost_usd: number | null
  execution_time_ms: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface AgentExecutionInsert {
  execution_id?: string
  agent_id: string
  ticket_id?: string | null
  conversation_id?: string | null
  execution_type: 'chat' | 'suggest' | 'analyze' | 'escalate' | 'other'
  input_text?: string | null
  output_text?: string | null
  llm_provider?: string | null
  llm_model?: string | null
  tokens_input?: number | null
  tokens_output?: number | null
  tokens_total?: number | null
  cost_usd?: number | null
  execution_time_ms?: number | null
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export interface AgentExecutionUpdate {
  execution_id?: string
  agent_id?: string
  ticket_id?: string | null
  conversation_id?: string | null
  execution_type?: 'chat' | 'suggest' | 'analyze' | 'escalate' | 'other'
  input_text?: string | null
  output_text?: string | null
  llm_provider?: string | null
  llm_model?: string | null
  tokens_input?: number | null
  tokens_output?: number | null
  tokens_total?: number | null
  cost_usd?: number | null
  execution_time_ms?: number | null
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export class AgentExecutionRepository {
  /**
   * Get all executions with optional filters
   */
  static async findAll(filters?: {
    agentId?: string
    ticketId?: string
    conversationId?: string
    executionType?: AgentExecution['execution_type']
    status?: AgentExecution['status']
    limit?: number
    offset?: number
  }): Promise<AgentExecution[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_agent_executions').select('*')

    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId)
    }
    if (filters?.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }
    if (filters?.conversationId) {
      query = query.eq('conversation_id', filters.conversationId)
    }
    if (filters?.executionType) {
      query = query.eq('execution_type', filters.executionType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as AgentExecution[]
  }

  /**
   * Get execution by ID
   */
  static async findById(executionId: string): Promise<AgentExecution | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_agent_executions')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as AgentExecution
  }

  /**
   * Create a new execution
   */
  static async create(execution: AgentExecutionInsert): Promise<AgentExecution> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_agent_executions')
      .insert(execution)
      .select()
      .single()

    if (error) throw error
    return data as AgentExecution
  }

  /**
   * Update an execution
   */
  static async update(
    executionId: string,
    updates: AgentExecutionUpdate
  ): Promise<AgentExecution> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_agent_executions')
      .update(updates)
      .eq('execution_id', executionId)
      .select()
      .single()

    if (error) throw error
    return data as AgentExecution
  }

  /**
   * Update execution status
   */
  static async updateStatus(
    executionId: string,
    status: AgentExecution['status'],
    errorMessage?: string
  ): Promise<AgentExecution> {
    const updates: AgentExecutionUpdate = { status }
    if (errorMessage) {
      updates.error_message = errorMessage
    }
    return this.update(executionId, updates)
  }

  /**
   * Mark execution as completed
   */
  static async markCompleted(
    executionId: string,
    outputText: string,
    tokens: { input: number; output: number; total: number },
    cost: number,
    executionTimeMs: number
  ): Promise<AgentExecution> {
    return this.update(executionId, {
      status: 'completed',
      output_text: outputText,
      tokens_input: tokens.input,
      tokens_output: tokens.output,
      tokens_total: tokens.total,
      cost_usd: cost,
      execution_time_ms: executionTimeMs,
    })
  }

  /**
   * Mark execution as failed
   */
  static async markFailed(
    executionId: string,
    errorMessage: string
  ): Promise<AgentExecution> {
    return this.update(executionId, {
      status: 'failed',
      error_message: errorMessage,
    })
  }

  /**
   * Get executions for an agent
   */
  static async findByAgent(agentId: string): Promise<AgentExecution[]> {
    return this.findAll({ agentId })
  }

  /**
   * Get executions for a ticket
   */
  static async findByTicket(ticketId: string): Promise<AgentExecution[]> {
    return this.findAll({ ticketId })
  }

  /**
   * Get executions for a conversation
   */
  static async findByConversation(conversationId: string): Promise<AgentExecution[]> {
    return this.findAll({ conversationId })
  }

  /**
   * Get failed executions
   */
  static async findFailed(limit?: number): Promise<AgentExecution[]> {
    return this.findAll({ status: 'failed', limit })
  }

  /**
   * Get pending executions
   */
  static async findPending(limit?: number): Promise<AgentExecution[]> {
    return this.findAll({ status: 'pending', limit })
  }
}
