import { createServerSupabase } from '@/lib/db/supabase'

export interface LLMAgent {
  agent_id: string
  agent_name: string
  agent_type: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
  status: 'active' | 'inactive' | 'testing' | 'maintenance' | null
  is_active: boolean
  service_stage: 'Pre-sale' | 'Post-sale' | 'Retention' | null
  truevow_service: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
  role_responsibilities: Record<string, any> | null
  brief_config: Record<string, any>
  knowledge_base: Record<string, any> | null
  llm_config: Record<string, any>
  performance_metrics: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface LLMAgentInsert {
  agent_id?: string
  agent_name: string
  agent_type: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
  status?: 'active' | 'inactive' | 'testing' | 'maintenance' | null
  is_active?: boolean
  service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
  truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
  role_responsibilities?: Record<string, any> | null
  brief_config: Record<string, any>
  knowledge_base?: Record<string, any> | null
  llm_config: Record<string, any>
  performance_metrics?: Record<string, any> | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface LLMAgentUpdate {
  agent_id?: string
  agent_name?: string
  agent_type?: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
  status?: 'active' | 'inactive' | 'testing' | 'maintenance' | null
  is_active?: boolean
  service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
  truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
  role_responsibilities?: Record<string, any> | null
  brief_config?: Record<string, any>
  knowledge_base?: Record<string, any> | null
  llm_config?: Record<string, any>
  performance_metrics?: Record<string, any> | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export class LLMAgentRepository {
  /**
   * Get all agents with optional filters
   */
  static async findAll(filters?: {
    agentType?: LLMAgent['agent_type']
    status?: LLMAgent['status']
    isActive?: boolean
    truevowService?: LLMAgent['truevow_service']
    serviceStage?: LLMAgent['service_stage']
    limit?: number
    offset?: number
  }): Promise<LLMAgent[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_llm_agents').select('*')

    if (filters?.agentType) {
      query = query.eq('agent_type', filters.agentType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.truevowService) {
      query = query.eq('truevow_service', filters.truevowService)
    }
    if (filters?.serviceStage) {
      query = query.eq('service_stage', filters.serviceStage)
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
    return data as LLMAgent[]
  }

  /**
   * Get agent by ID
   */
  static async findById(agentId: string): Promise<LLMAgent | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_llm_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as LLMAgent
  }

  /**
   * Get agent by name
   */
  static async findByName(agentName: string): Promise<LLMAgent | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_llm_agents')
      .select('*')
      .eq('agent_name', agentName)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as LLMAgent
  }

  /**
   * Create a new agent
   */
  static async create(agent: LLMAgentInsert): Promise<LLMAgent> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_llm_agents')
      .insert(agent)
      .select()
      .single()

    if (error) throw error
    return data as LLMAgent
  }

  /**
   * Update an agent
   */
  static async update(agentId: string, updates: LLMAgentUpdate): Promise<LLMAgent> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_llm_agents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) throw error
    return data as LLMAgent
  }

  /**
   * Delete an agent
   */
  static async delete(agentId: string): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('cs_llm_agents')
      .delete()
      .eq('agent_id', agentId)

    if (error) throw error
  }

  /**
   * Activate an agent
   */
  static async activate(agentId: string): Promise<LLMAgent> {
    return this.update(agentId, { is_active: true, status: 'active' })
  }

  /**
   * Deactivate an agent
   */
  static async deactivate(agentId: string): Promise<LLMAgent> {
    return this.update(agentId, { is_active: false, status: 'inactive' })
  }

  /**
   * Update agent status
   */
  static async updateStatus(
    agentId: string,
    status: LLMAgent['status']
  ): Promise<LLMAgent> {
    return this.update(agentId, { status })
  }

  /**
   * Update agent performance metrics
   */
  static async updatePerformanceMetrics(
    agentId: string,
    metrics: Record<string, any>
  ): Promise<LLMAgent> {
    const agent = await this.findById(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    const updatedMetrics = {
      ...(agent.performance_metrics || {}),
      ...metrics,
    }

    return this.update(agentId, { performance_metrics: updatedMetrics })
  }

  /**
   * Update agent brief config
   */
  static async updateBriefConfig(
    agentId: string,
    briefConfig: Record<string, any>
  ): Promise<LLMAgent> {
    return this.update(agentId, { brief_config: briefConfig })
  }

  /**
   * Update agent LLM config
   */
  static async updateLLMConfig(
    agentId: string,
    llmConfig: Record<string, any>
  ): Promise<LLMAgent> {
    return this.update(agentId, { llm_config: llmConfig })
  }

  /**
   * Get active agents
   */
  static async findActive(): Promise<LLMAgent[]> {
    return this.findAll({ isActive: true, status: 'active' })
  }

  /**
   * Get agents by service
   */
  static async findByService(
    service: LLMAgent['truevow_service']
  ): Promise<LLMAgent[]> {
    return this.findAll({ truevowService: service, isActive: true })
  }

  /**
   * Get agents by service stage
   */
  static async findByServiceStage(
    stage: LLMAgent['service_stage']
  ): Promise<LLMAgent[]> {
    return this.findAll({ serviceStage: stage, isActive: true })
  }

  /**
   * Get agents by type
   */
  static async findByType(
    agentType: LLMAgent['agent_type']
  ): Promise<LLMAgent[]> {
    return this.findAll({ agentType, isActive: true })
  }
}
