import { createServerSupabase } from '@/lib/db/supabase'

export interface CustomerChurnRisk {
  risk_id: string
  tenant_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Record<string, any>
  predicted_churn_date: string | null
  intervention_required: boolean
  intervention_notes: string | null
  intervention_taken: string | null
  calculated_at: string
  previous_score: number | null
  trend: 'improving' | 'stable' | 'declining' | null
  metadata: Record<string, any>
}

export interface CustomerChurnRiskInsert {
  risk_id?: string
  tenant_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Record<string, any>
  predicted_churn_date?: string | null
  intervention_required?: boolean
  intervention_notes?: string | null
  intervention_taken?: string | null
  calculated_at?: string
  previous_score?: number | null
  trend?: 'improving' | 'stable' | 'declining' | null
  metadata?: Record<string, any>
}

export interface CustomerChurnRiskUpdate {
  risk_id?: string
  tenant_id?: string
  risk_score?: number
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  risk_factors?: Record<string, any>
  predicted_churn_date?: string | null
  intervention_required?: boolean
  intervention_notes?: string | null
  intervention_taken?: string | null
  calculated_at?: string
  previous_score?: number | null
  trend?: 'improving' | 'stable' | 'declining' | null
  metadata?: Record<string, any>
}

export class CustomerChurnRiskRepository {
  /**
   * Get all churn risks with optional filters
   */
  static async findAll(filters?: {
    tenantId?: string
    riskLevel?: CustomerChurnRisk['risk_level']
    interventionRequired?: boolean
    limit?: number
    offset?: number
  }): Promise<CustomerChurnRisk[]> {
    const supabase = await createServerSupabase()
    let query = supabase.from('cs_customer_churn_risk').select('*')

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }
    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel)
    }
    if (filters?.interventionRequired !== undefined) {
      query = query.eq('intervention_required', filters.interventionRequired)
    }

    query = query.order('calculated_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as CustomerChurnRisk[]
  }

  /**
   * Get churn risk by ID
   */
  static async findById(riskId: string): Promise<CustomerChurnRisk | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_churn_risk')
      .select('*')
      .eq('risk_id', riskId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CustomerChurnRisk
  }

  /**
   * Get latest churn risk for a tenant
   */
  static async findLatest(tenantId: string): Promise<CustomerChurnRisk | null> {
    const risks = await this.findAll({ tenantId, limit: 1 })
    return risks[0] || null
  }

  /**
   * Create a new churn risk record
   */
  static async create(risk: CustomerChurnRiskInsert): Promise<CustomerChurnRisk> {
    const supabase = await createServerSupabase()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('cs_customer_churn_risk')
      .insert({
        ...risk,
        calculated_at: risk.calculated_at || now,
      })
      .select()
      .single()

    if (error) throw error
    return data as CustomerChurnRisk
  }

  /**
   * Update a churn risk record
   */
  static async update(
    riskId: string,
    updates: CustomerChurnRiskUpdate
  ): Promise<CustomerChurnRisk> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_churn_risk')
      .update(updates)
      .eq('risk_id', riskId)
      .select()
      .single()

    if (error) throw error
    return data as CustomerChurnRisk
  }

  /**
   * Delete a churn risk record
   */
  static async delete(riskId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_customer_churn_risk')
      .delete()
      .eq('risk_id', riskId)

    if (error) throw error
  }

  /**
   * Calculate and create/update churn risk for a tenant
   */
  static async calculateRisk(
    tenantId: string,
    riskScore: number,
    riskFactors: Record<string, any>
  ): Promise<CustomerChurnRisk> {
    // Get previous risk score
    const previous = await this.findLatest(tenantId)

    // Determine risk level
    let riskLevel: CustomerChurnRisk['risk_level'] = 'low'
    if (riskScore >= 80) riskLevel = 'critical'
    else if (riskScore >= 60) riskLevel = 'high'
    else if (riskScore >= 40) riskLevel = 'medium'

    // Determine trend
    let trend: CustomerChurnRisk['trend'] = 'stable'
    if (previous) {
      if (riskScore > previous.risk_score) trend = 'declining'
      else if (riskScore < previous.risk_score) trend = 'improving'
    }

    // Determine if intervention is required
    const interventionRequired = riskLevel === 'high' || riskLevel === 'critical'

    // Calculate predicted churn date (if high risk)
    let predictedChurnDate: string | null = null
    if (riskLevel === 'high' || riskLevel === 'critical') {
      const daysUntilChurn = riskLevel === 'critical' ? 30 : 60
      const date = new Date()
      date.setDate(date.getDate() + daysUntilChurn)
      predictedChurnDate = date.toISOString().split('T')[0]
    }

    const risk: CustomerChurnRiskInsert = {
      tenant_id: tenantId,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      predicted_churn_date: predictedChurnDate,
      intervention_required: interventionRequired,
      previous_score: previous?.risk_score || null,
      trend,
    }

    return this.create(risk)
  }

  /**
   * Mark intervention as taken
   */
  static async recordIntervention(
    riskId: string,
    interventionTaken: string
  ): Promise<CustomerChurnRisk> {
    return this.update(riskId, {
      intervention_taken: interventionTaken,
      intervention_required: false,
    })
  }

  /**
   * Get high-risk tenants
   */
  static async findHighRisk(): Promise<CustomerChurnRisk[]> {
    return this.findAll({ riskLevel: 'high', interventionRequired: true })
  }

  /**
   * Get critical-risk tenants
   */
  static async findCriticalRisk(): Promise<CustomerChurnRisk[]> {
    return this.findAll({ riskLevel: 'critical', interventionRequired: true })
  }

  /**
   * Get tenants requiring intervention
   */
  static async findRequiringIntervention(): Promise<CustomerChurnRisk[]> {
    return this.findAll({ interventionRequired: true })
  }

  /**
   * Get churn risks for a tenant
   */
  static async findByTenant(tenantId: string): Promise<CustomerChurnRisk[]> {
    return this.findAll({ tenantId })
  }
}
