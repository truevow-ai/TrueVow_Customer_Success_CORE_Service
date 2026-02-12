import { createServerSupabase } from '@/lib/db/supabase'

export interface CustomerSuccessMetric {
  metric_id: string
  tenant_id: string
  period_start: string
  period_end: string
  mrr: number | null
  arr: number | null
  churn_rate: number | null
  expansion_revenue: number | null
  contraction_revenue: number | null
  net_revenue_retention: number | null
  active_users: number | null
  feature_adoption_rate: number | null
  support_ticket_count: number
  avg_ticket_resolution_time: string | null
  nps_score: number | null
  csat_score: number | null
  created_at: string
  updated_at: string
}

export interface CustomerSuccessMetricInsert {
  metric_id?: string
  tenant_id: string
  period_start: string
  period_end: string
  mrr?: number | null
  arr?: number | null
  churn_rate?: number | null
  expansion_revenue?: number | null
  contraction_revenue?: number | null
  net_revenue_retention?: number | null
  active_users?: number | null
  feature_adoption_rate?: number | null
  support_ticket_count?: number
  avg_ticket_resolution_time?: string | null
  nps_score?: number | null
  csat_score?: number | null
  created_at?: string
  updated_at?: string
}

export interface CustomerSuccessMetricUpdate {
  metric_id?: string
  tenant_id?: string
  period_start?: string
  period_end?: string
  mrr?: number | null
  arr?: number | null
  churn_rate?: number | null
  expansion_revenue?: number | null
  contraction_revenue?: number | null
  net_revenue_retention?: number | null
  active_users?: number | null
  feature_adoption_rate?: number | null
  support_ticket_count?: number
  avg_ticket_resolution_time?: string | null
  nps_score?: number | null
  csat_score?: number | null
  created_at?: string
  updated_at?: string
}

export class CustomerSuccessMetricRepository {
  /**
   * Get all metrics with optional filters
   */
  static async findAll(filters?: {
    tenantId?: string
    periodStart?: string
    periodEnd?: string
    limit?: number
    offset?: number
  }): Promise<CustomerSuccessMetric[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_customer_success_metrics').select('*')

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }
    if (filters?.periodStart) {
      query = query.gte('period_start', filters.periodStart)
    }
    if (filters?.periodEnd) {
      query = query.lte('period_end', filters.periodEnd)
    }

    query = query.order('period_start', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as CustomerSuccessMetric[]
  }

  /**
   * Get metric by ID
   */
  static async findById(metricId: string): Promise<CustomerSuccessMetric | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_success_metrics')
      .select('*')
      .eq('metric_id', metricId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CustomerSuccessMetric
  }

  /**
   * Get metric for tenant and period
   */
  static async findByTenantAndPeriod(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<CustomerSuccessMetric | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_success_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CustomerSuccessMetric
  }

  /**
   * Create a new metric
   */
  static async create(
    metric: CustomerSuccessMetricInsert
  ): Promise<CustomerSuccessMetric> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_success_metrics')
      .insert(metric)
      .select()
      .single()

    if (error) throw error
    return data as CustomerSuccessMetric
  }

  /**
   * Update a metric
   */
  static async update(
    metricId: string,
    updates: CustomerSuccessMetricUpdate
  ): Promise<CustomerSuccessMetric> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_success_metrics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('metric_id', metricId)
      .select()
      .single()

    if (error) throw error
    return data as CustomerSuccessMetric
  }

  /**
   * Upsert a metric (create or update)
   */
  static async upsert(
    metric: CustomerSuccessMetricInsert
  ): Promise<CustomerSuccessMetric> {
    const existing = await this.findByTenantAndPeriod(
      metric.tenant_id,
      metric.period_start,
      metric.period_end
    )

    if (existing) {
      return this.update(existing.metric_id, metric)
    } else {
      return this.create(metric)
    }
  }

  /**
   * Delete a metric
   */
  static async delete(metricId: string): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('cs_customer_success_metrics')
      .delete()
      .eq('metric_id', metricId)

    if (error) throw error
  }

  /**
   * Get metrics for a tenant
   */
  static async findByTenant(tenantId: string): Promise<CustomerSuccessMetric[]> {
    return this.findAll({ tenantId })
  }

  /**
   * Get latest metric for a tenant
   */
  static async findLatest(tenantId: string): Promise<CustomerSuccessMetric | null> {
    const metrics = await this.findAll({ tenantId, limit: 1 })
    return metrics[0] || null
  }
}
