import { createServerSupabase } from '@/lib/db/supabase'

export interface CustomerHealthScore {
  health_id: string
  tenant_id: string
  health_score: number
  health_level: 'healthy' | 'at_risk' | 'critical'
  factors: Record<string, number>
  calculated_at: string
  previous_score: number | null
  trend: 'improving' | 'stable' | 'declining' | null
  metadata: Record<string, any>
}

export interface CustomerHealthScoreInsert {
  tenant_id: string
  health_score: number
  health_level: 'healthy' | 'at_risk' | 'critical'
  factors: Record<string, number>
  previous_score?: number | null
  trend?: 'improving' | 'stable' | 'declining' | null
  metadata?: Record<string, any>
}

export class CustomerHealthRepository {
  /**
   * Get health score for a tenant
   */
  static async findByTenant(tenantId: string): Promise<CustomerHealthScore | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CustomerHealthScore
  }

  /**
   * Get health score history for a tenant
   */
  static async getHistory(tenantId: string, limit: number = 30): Promise<CustomerHealthScore[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('calculated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as CustomerHealthScore[]
  }

  /**
   * Create or update health score
   */
  static async create(healthScore: CustomerHealthScoreInsert): Promise<CustomerHealthScore> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .insert({
        ...healthScore,
        metadata: healthScore.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as CustomerHealthScore
  }

  /**
   * Get all at-risk customers
   */
  static async getAtRiskCustomers(): Promise<CustomerHealthScore[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('health_level', 'at_risk')
      .order('calculated_at', { ascending: false })

    if (error) throw error
    return data as CustomerHealthScore[]
  }

  /**
   * Get all critical customers
   */
  static async getCriticalCustomers(): Promise<CustomerHealthScore[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('health_level', 'critical')
      .order('calculated_at', { ascending: false })

    if (error) throw error
    return data as CustomerHealthScore[]
  }

  /**
   * Calculate health score (business logic)
   * This is a placeholder - actual calculation should be in a service layer
   */
  static calculateHealthScore(factors: Record<string, number>): {
    score: number
    level: 'healthy' | 'at_risk' | 'critical'
    trend?: 'improving' | 'stable' | 'declining'
  } {
    // Simple calculation: sum of all factors (assuming they're already weighted)
    const score = Object.values(factors).reduce((sum, value) => sum + value, 0)
    
    let level: 'healthy' | 'at_risk' | 'critical'
    if (score >= 70) {
      level = 'healthy'
    } else if (score >= 40) {
      level = 'at_risk'
    } else {
      level = 'critical'
    }

    return { score, level }
  }
}

