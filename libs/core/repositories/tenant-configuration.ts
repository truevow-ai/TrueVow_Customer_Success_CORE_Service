/**
 * Tenant Configuration Repository
 * 
 * Manages tenant-specific configurations for CS-Support service
 * including intake questions, screening rules, and settings.
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface TenantConfiguration {
  id: string
  tenant_id: string
  config_key: string
  config_value: Record<string, any>
  created_at: string
  updated_at: string
}

export interface IntakeQuestion {
  id: string
  tenant_id: string
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'checkbox' | 'dropdown'
  options?: string[]
  required: boolean
  order_index: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ScreeningRule {
  id: string
  tenant_id: string
  rule_name: string
  rule_type: 'auto_approve' | 'auto_reject' | 'flag_for_review' | 'assign_to_csm'
  conditions: Record<string, any>
  priority: number
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Tenant Configuration Repository
 * Handles CRUD operations for tenant-specific configurations
 */
export class TenantConfigurationRepository {
  // ==================== Configuration ====================

  /**
   * Get all configurations for a tenant
   */
  async getConfigurations(tenantId: string): Promise<TenantConfiguration[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tenant_configurations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tenant configurations:', error)
      throw error
    }

    return data || []
  }

  /**
   * Get a specific configuration by key
   */
  async getConfiguration(tenantId: string, key: string): Promise<TenantConfiguration | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tenant_configurations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('config_key', key)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching tenant configuration:', error)
      throw error
    }

    return data
  }

  /**
   * Set a configuration value
   */
  async setConfiguration(
    tenantId: string,
    key: string,
    value: Record<string, any>
  ): Promise<TenantConfiguration> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tenant_configurations')
      .upsert(
        {
          tenant_id: tenantId,
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'tenant_id,config_key',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error setting tenant configuration:', error)
      throw error
    }

    return data
  }

  /**
   * Delete a configuration
   */
  async deleteConfiguration(tenantId: string, key: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_tenant_configurations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('config_key', key)

    if (error) {
      console.error('Error deleting tenant configuration:', error)
      throw error
    }
  }

  // ==================== Intake Questions ====================

  /**
   * Get all intake questions for a tenant
   */
  async getIntakeQuestions(tenantId: string): Promise<IntakeQuestion[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_intake_questions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching intake questions:', error)
      throw error
    }

    return data || []
  }

  /**
   * Create an intake question
   */
  async createIntakeQuestion(question: Omit<IntakeQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<IntakeQuestion> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_intake_questions')
      .insert(question)
      .select()
      .single()

    if (error) {
      console.error('Error creating intake question:', error)
      throw error
    }

    return data
  }

  /**
   * Update an intake question
   */
  async updateIntakeQuestion(id: string, updates: Partial<IntakeQuestion>): Promise<IntakeQuestion> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_intake_questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating intake question:', error)
      throw error
    }

    return data
  }

  /**
   * Delete an intake question (soft delete)
   */
  async deleteIntakeQuestion(id: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_intake_questions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting intake question:', error)
      throw error
    }
  }

  /**
   * Reorder intake questions
   */
  async reorderIntakeQuestions(tenantId: string, questionIds: string[]): Promise<void> {
    const supabase = await createServerSupabase()
    const updates = questionIds.map((id, index) => ({
      id,
      order_index: index,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('cs_intake_questions')
      .upsert(updates)

    if (error) {
      console.error('Error reordering intake questions:', error)
      throw error
    }
  }

  // ==================== Screening Rules ====================

  /**
   * Get all screening rules for a tenant
   */
  async getScreeningRules(tenantId: string): Promise<ScreeningRule[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_screening_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching screening rules:', error)
      throw error
    }

    return data || []
  }

  /**
   * Create a screening rule
   */
  async createScreeningRule(rule: Omit<ScreeningRule, 'id' | 'created_at' | 'updated_at'>): Promise<ScreeningRule> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_screening_rules')
      .insert(rule)
      .select()
      .single()

    if (error) {
      console.error('Error creating screening rule:', error)
      throw error
    }

    return data
  }

  /**
   * Update a screening rule
   */
  async updateScreeningRule(id: string, updates: Partial<ScreeningRule>): Promise<ScreeningRule> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_screening_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating screening rule:', error)
      throw error
    }

    return data
  }

  /**
   * Delete a screening rule (soft delete)
   */
  async deleteScreeningRule(id: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_screening_rules')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting screening rule:', error)
      throw error
    }
  }

  /**
   * Evaluate screening rules against customer data
   */
  async evaluateScreeningRules(tenantId: string, customerData: Record<string, any>): Promise<{
    action: 'approve' | 'reject' | 'flag' | 'assign'
    matchedRules: ScreeningRule[]
  }> {
    const rules = await this.getScreeningRules(tenantId)
    const matchedRules: ScreeningRule[] = []

    for (const rule of rules) {
      if (this.matchesConditions(rule.conditions, customerData)) {
        matchedRules.push(rule)
      }
    }

    // Determine action based on highest priority matched rule
    if (matchedRules.length === 0) {
      return { action: 'approve', matchedRules: [] }
    }

    const highestPriorityRule = matchedRules[0]
    const actionMap: Record<string, 'approve' | 'reject' | 'flag' | 'assign'> = {
      auto_approve: 'approve',
      auto_reject: 'reject',
      flag_for_review: 'flag',
      assign_to_csm: 'assign',
    }

    return {
      action: actionMap[highestPriorityRule.rule_type] || 'approve',
      matchedRules,
    }
  }

  /**
   * Check if customer data matches rule conditions
   */
  private matchesConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, condition] of Object.entries(conditions)) {
      const value = data[key]

      if (typeof condition === 'object' && condition !== null) {
        // Handle complex conditions
        if (condition.equals !== undefined && value !== condition.equals) return false
        if (condition.notEquals !== undefined && value === condition.notEquals) return false
        if (condition.greaterThan !== undefined && !(value > condition.greaterThan)) return false
        if (condition.lessThan !== undefined && !(value < condition.lessThan)) return false
        if (condition.in !== undefined && !condition.in.includes(value)) return false
        if (condition.notIn !== undefined && condition.notIn.includes(value)) return false
        if (condition.contains !== undefined && !String(value).includes(condition.contains)) return false
      } else {
        // Simple equality check
        if (value !== condition) return false
      }
    }

    return true
  }
}

// Export singleton instance
export const tenantConfigRepository = new TenantConfigurationRepository()
