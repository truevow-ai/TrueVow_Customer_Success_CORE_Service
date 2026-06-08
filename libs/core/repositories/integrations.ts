import { createServerSupabase } from '@/lib/db/supabase'

export interface Integration {
  integration_id: string
  integration_type: 'sendgrid' | 'twilio' | 'plivo' | 'sales_crm' | 'platform' | 'internal_ops' | 'tenant_service'
  integration_name: string
  status: 'active' | 'inactive' | 'error' | 'testing'
  config: Record<string, any>
  last_sync_at: string | null
  last_error: string | null
  last_error_at: string | null
  health_status: 'healthy' | 'degraded' | 'down' | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface IntegrationInsert {
  integration_id?: string
  integration_type: 'sendgrid' | 'twilio' | 'plivo' | 'sales_crm' | 'platform' | 'internal_ops' | 'tenant_service'
  integration_name: string
  status?: 'active' | 'inactive' | 'error' | 'testing'
  config?: Record<string, any>
  last_sync_at?: string | null
  last_error?: string | null
  last_error_at?: string | null
  health_status?: 'healthy' | 'degraded' | 'down' | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface IntegrationUpdate {
  integration_id?: string
  integration_type?: 'sendgrid' | 'twilio' | 'plivo' | 'sales_crm' | 'platform' | 'internal_ops' | 'tenant_service'
  integration_name?: string
  status?: 'active' | 'inactive' | 'error' | 'testing'
  config?: Record<string, any>
  last_sync_at?: string | null
  last_error?: string | null
  last_error_at?: string | null
  health_status?: 'healthy' | 'degraded' | 'down' | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class IntegrationRepository {
  /**
   * Get all integrations with optional filters
   */
  static async findAll(filters?: {
    integrationType?: Integration['integration_type']
    status?: Integration['status']
    healthStatus?: Integration['health_status']
    limit?: number
    offset?: number
  }): Promise<Integration[]> {
    const supabase = await createServerSupabase()
    let query = supabase.from('cs_integrations').select('*')

    if (filters?.integrationType) {
      query = query.eq('integration_type', filters.integrationType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.healthStatus) {
      query = query.eq('health_status', filters.healthStatus)
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
    return data as Integration[]
  }

  /**
   * Get integration by ID
   */
  static async findById(integrationId: string): Promise<Integration | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_integrations')
      .select('*')
      .eq('integration_id', integrationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Integration
  }

  /**
   * Get integration by type and name
   */
  static async findByTypeAndName(
    type: Integration['integration_type'],
    name: string
  ): Promise<Integration | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_integrations')
      .select('*')
      .eq('integration_type', type)
      .eq('integration_name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Integration
  }

  /**
   * Create a new integration
   */
  static async create(integration: IntegrationInsert): Promise<Integration> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_integrations')
      .insert(integration)
      .select()
      .single()

    if (error) throw error
    return data as Integration
  }

  /**
   * Update an integration
   */
  static async update(
    integrationId: string,
    updates: IntegrationUpdate
  ): Promise<Integration> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_integrations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('integration_id', integrationId)
      .select()
      .single()

    if (error) throw error
    return data as Integration
  }

  /**
   * Delete an integration
   */
  static async delete(integrationId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_integrations')
      .delete()
      .eq('integration_id', integrationId)

    if (error) throw error
  }

  /**
   * Activate an integration
   */
  static async activate(integrationId: string): Promise<Integration> {
    return this.update(integrationId, { status: 'active' })
  }

  /**
   * Deactivate an integration
   */
  static async deactivate(integrationId: string): Promise<Integration> {
    return this.update(integrationId, { status: 'inactive' })
  }

  /**
   * Update integration health status
   */
  static async updateHealthStatus(
    integrationId: string,
    healthStatus: Integration['health_status']
  ): Promise<Integration> {
    return this.update(integrationId, { health_status: healthStatus })
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(integrationId: string): Promise<Integration> {
    return this.update(integrationId, { last_sync_at: new Date().toISOString() })
  }

  /**
   * Record integration error
   */
  static async recordError(
    integrationId: string,
    errorMessage: string
  ): Promise<Integration> {
    return this.update(integrationId, {
      status: 'error',
      last_error: errorMessage,
      last_error_at: new Date().toISOString(),
      health_status: 'down',
    })
  }

  /**
   * Clear integration error
   */
  static async clearError(integrationId: string): Promise<Integration> {
    return this.update(integrationId, {
      last_error: null,
      last_error_at: null,
      health_status: 'healthy',
    })
  }

  /**
   * Update integration config
   */
  static async updateConfig(
    integrationId: string,
    config: Record<string, any>
  ): Promise<Integration> {
    const integration = await this.findById(integrationId)
    if (!integration) {
      throw new Error('Integration not found')
    }

    const updatedConfig = {
      ...(integration.config || {}),
      ...config,
    }

    return this.update(integrationId, { config: updatedConfig })
  }

  /**
   * Get active integrations
   */
  static async findActive(): Promise<Integration[]> {
    return this.findAll({ status: 'active' })
  }

  /**
   * Get integrations by type
   */
  static async findByType(
    type: Integration['integration_type']
  ): Promise<Integration[]> {
    return this.findAll({ integrationType: type })
  }

  /**
   * Get healthy integrations
   */
  static async findHealthy(): Promise<Integration[]> {
    return this.findAll({ healthStatus: 'healthy', status: 'active' })
  }

  /**
   * Get integrations with errors
   */
  static async findWithErrors(): Promise<Integration[]> {
    return this.findAll({ status: 'error' })
  }
}
