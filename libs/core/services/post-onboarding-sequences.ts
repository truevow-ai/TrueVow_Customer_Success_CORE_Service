/**
 * Post-Onboarding Sequences Service
 * 
 * Manages the 90-day post-onboarding automation sequence for customers
 * transferred from SaaS Admin after go-live.
 * 
 * Sequence Schedule:
 * - Day 1: Welcome call/email
 * - Day 3: Quick check-in email/SMS
 * - Day 7: First week review call (30 min)
 * - Day 14: Mid-month check-in email
 * - Day 30: First month review call (45 min)
 * - Day 60: Quarterly check-in call (60 min)
 * - Day 90: End of quarter review + health gate
 * 
 * Day 90 Health Gate:
 * - health_score >= 70 AND feature_adoption >= 60% => value_achieved
 * - Otherwise => CSM escalation
 */

import { createServerSupabase } from '@/lib/db/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SequencePhase = 'immediate' | 'early_adoption' | 'established' | 'long_term'
export type ActionType = 'email' | 'sms' | 'call' | 'health_check' | 'task' | 'gate'

export interface PostOnboardingSequence {
  sequence_id: string
  customer_id: string
  tenant_id: string
  phase: SequencePhase
  day_number: number
  action_type: ActionType
  action_name: string
  action_description: string | null
  action_due_at: string
  completed_at: string | null
  skipped: boolean
  skip_reason: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StartSequenceRequest {
  customer_id: string
  tenant_id: string
  go_live_date: string
  tier?: 'premium' | 'standard' | 'free'
}

export interface CompleteActionRequest {
  sequence_id: string
  completed_at?: string
  metadata?: Record<string, any>
}

export interface SkipActionRequest {
  sequence_id: string
  reason: string
}

// ============================================================================
// 90-DAY SEQUENCE TEMPLATE
// ============================================================================

const SEQUENCE_TEMPLATE: Array<{
  day: number
  phase: SequencePhase
  action_type: ActionType
  action_name: string
  action_description: string
}> = [
  // Phase 1: Immediate Post-Onboarding (Days 1-7)
  {
    day: 1,
    phase: 'immediate',
    action_type: 'email',
    action_name: 'Welcome Email',
    action_description: 'Welcome call/email confirming go-live',
  },
  {
    day: 1,
    phase: 'immediate',
    action_type: 'call',
    action_name: 'Welcome Call',
    action_description: 'Welcome call confirming go-live (optional for premium)',
  },
  {
    day: 3,
    phase: 'immediate',
    action_type: 'email',
    action_name: 'Quick Check-in',
    action_description: 'Quick check-in email - "How\'s it going?"',
  },
  {
    day: 3,
    phase: 'immediate',
    action_type: 'sms',
    action_name: 'Quick Check-in SMS',
    action_description: 'Quick check-in SMS',
  },
  {
    day: 7,
    phase: 'immediate',
    action_type: 'call',
    action_name: 'First Week Review',
    action_description: 'First week review call (30 min)',
  },
  
  // Phase 2: Early Adoption (Days 8-30)
  {
    day: 14,
    phase: 'early_adoption',
    action_type: 'email',
    action_name: 'Mid-Month Check-in',
    action_description: 'Mid-month check-in email',
  },
  {
    day: 30,
    phase: 'early_adoption',
    action_type: 'call',
    action_name: 'First Month Review',
    action_description: 'First month review call (45 min)',
  },
  
  // Phase 3: Established Customer (Days 31-90)
  {
    day: 60,
    phase: 'established',
    action_type: 'call',
    action_name: 'Quarterly Check-in',
    action_description: 'Quarterly check-in call (60 min)',
  },
  {
    day: 90,
    phase: 'established',
    action_type: 'gate',
    action_name: 'Day 90 Health Gate',
    action_description: 'End of quarter review + health gate check',
  },
  {
    day: 90,
    phase: 'established',
    action_type: 'call',
    action_name: 'End of Quarter Review',
    action_description: 'End of quarter review call (60 min)',
  },
]

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class PostOnboardingSequencesService {
  /**
   * Start 90-day post-onboarding sequence for a customer
   * 
   * Called by CustomerTransferService after creating cs_customer_post_onboarding record.
   */
  static async startSequence(request: StartSequenceRequest): Promise<PostOnboardingSequence[]> {
    const supabase = await createServerSupabase()
    const { customer_id, tenant_id, go_live_date, tier } = request

    // Check if sequence already exists for this customer
    const { data: existing } = await supabase
      .from('cs_post_onboarding_sequences')
      .select('sequence_id')
      .eq('customer_id', customer_id)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`Sequence already exists for customer ${customer_id}`)
      return []
    }

    // Calculate due dates based on go_live_date
    const goLiveDate = new Date(go_live_date)
    const sequences: Array<Omit<PostOnboardingSequence, 'sequence_id' | 'created_at' | 'updated_at'>> = []

    for (const template of SEQUENCE_TEMPLATE) {
      // Skip SMS for premium customers (they get calls instead)
      if (tier === 'premium' && template.action_type === 'sms') {
        continue
      }

      const actionDueAt = new Date(goLiveDate)
      actionDueAt.setDate(actionDueAt.getDate() + template.day)
      // Set time to 10:00 AM for calls, 9:00 AM for emails
      if (template.action_type === 'call') {
        actionDueAt.setHours(10, 0, 0, 0)
      } else {
        actionDueAt.setHours(9, 0, 0, 0)
      }

      sequences.push({
        customer_id,
        tenant_id,
        phase: template.phase,
        day_number: template.day,
        action_type: template.action_type,
        action_name: template.action_name,
        action_description: template.action_description,
        action_due_at: actionDueAt.toISOString(),
        completed_at: null,
        skipped: false,
        skip_reason: null,
        metadata: {
          tier: tier || 'standard',
          template_day: template.day,
        },
      })
    }

    // Insert all sequence items
    const { data, error } = await supabase
      .from('cs_post_onboarding_sequences')
      .insert(sequences)
      .select()

    if (error) {
      console.error('Failed to create post-onboarding sequence:', error)
      throw new Error(`Failed to create post-onboarding sequence: ${error.message}`)
    }

    console.log(`Created ${data.length} sequence items for customer ${customer_id}`)
    return data as PostOnboardingSequence[]
  }

  /**
   * Get pending actions (due today or overdue)
   */
  static async getPendingActions(limit: number = 50): Promise<PostOnboardingSequence[]> {
    const supabase = await createServerSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('cs_post_onboarding_sequences')
      .select(`
        *,
        cs_customer_post_onboarding (
          customer_email,
          assigned_csm_id,
          health_score,
          tier
        )
      `)
      .is('completed_at', null)
      .eq('skipped', false)
      .lte('action_due_at', now)
      .order('action_due_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get pending actions: ${error.message}`)
    }

    return data as PostOnboardingSequence[]
  }

  /**
   * Get upcoming actions for a customer
   */
  static async getCustomerSequence(customerId: string): Promise<PostOnboardingSequence[]> {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('cs_post_onboarding_sequences')
      .select('*')
      .eq('customer_id', customerId)
      .order('day_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to get customer sequence: ${error.message}`)
    }

    return data as PostOnboardingSequence[]
  }

  /**
   * Complete a sequence action
   */
  static async completeAction(request: CompleteActionRequest): Promise<PostOnboardingSequence> {
    const supabase = await createServerSupabase()
    const { sequence_id, completed_at, metadata } = request

    const { data, error } = await supabase
      .from('cs_post_onboarding_sequences')
      .update({
        completed_at: completed_at || new Date().toISOString(),
        metadata: metadata ? { metadata } : undefined,
      })
      .eq('sequence_id', sequence_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to complete action: ${error.message}`)
    }

    return data as PostOnboardingSequence
  }

  /**
   * Skip a sequence action
   */
  static async skipAction(request: SkipActionRequest): Promise<PostOnboardingSequence> {
    const supabase = await createServerSupabase()
    const { sequence_id, reason } = request

    const { data, error } = await supabase
      .from('cs_post_onboarding_sequences')
      .update({
        skipped: true,
        skip_reason: reason,
      })
      .eq('sequence_id', sequence_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to skip action: ${error.message}`)
    }

    return data as PostOnboardingSequence
  }

  /**
   * Process Day 90 Health Gate
   * 
   * Checks if customer meets the criteria:
   * - health_score >= 70
   * - feature_adoption >= 60%
   * 
   * Returns true if gate passed, false otherwise.
   */
  static async processDay90Gate(customerId: string): Promise<{
    passed: boolean
    health_score: number
    reason: string
  }> {
    const supabase = await createServerSupabase()

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('cs_customer_post_onboarding')
      .select('health_score, metadata')
      .eq('customer_id', customerId)
      .single()

    if (customerError || !customer) {
      return {
        passed: false,
        health_score: 0,
        reason: 'Customer not found',
      }
    }

    const healthScore = customer.health_score || 0
    const featureAdoption = customer.metadata?.feature_adoption || 0

    // Check gate criteria
    const healthScorePassed = healthScore >= 70
    const featureAdoptionPassed = featureAdoption >= 60

    if (healthScorePassed && featureAdoptionPassed) {
      // Update customer record
      await supabase
        .from('cs_customer_post_onboarding')
        .update({
          day_90_gate_passed: true,
          day_90_gate_at: new Date().toISOString(),
          value_achieved: true,
          value_achieved_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)

      // Mark gate action as completed
      await supabase
        .from('cs_post_onboarding_sequences')
        .update({ completed_at: new Date().toISOString() })
        .eq('customer_id', customerId)
        .eq('action_type', 'gate')

      return {
        passed: true,
        health_score: healthScore,
        reason: `Health score: ${healthScore} (>= 70), Feature adoption: ${featureAdoption}% (>= 60%)`,
      }
    }

    // Gate not passed - trigger escalation
    const reasons: string[] = []
    if (!healthScorePassed) {
      reasons.push(`health_score ${healthScore} < 70`)
    }
    if (!featureAdoptionPassed) {
      reasons.push(`feature_adoption ${featureAdoption}% < 60%`)
    }

    // Mark gate as completed with failure
    await supabase
      .from('cs_post_onboarding_sequences')
      .update({
        completed_at: new Date().toISOString(),
        metadata: { gate_failed: true, reasons },
      })
      .eq('customer_id', customerId)
      .eq('action_type', 'gate')

    return {
      passed: false,
      health_score: healthScore,
      reason: `Gate criteria not met: ${reasons.join(', ')}`,
    }
  }

  /**
   * Get sequence statistics for a customer
   */
  static async getSequenceStats(customerId: string): Promise<{
    total_actions: number
    completed_actions: number
    skipped_actions: number
    pending_actions: number
    completion_percentage: number
    current_phase: SequencePhase | null
    next_action: PostOnboardingSequence | null
  }> {
    const supabase = await createServerSupabase()

    const { data: sequences } = await supabase
      .from('cs_post_onboarding_sequences')
      .select('*')
      .eq('customer_id', customerId)

    if (!sequences || sequences.length === 0) {
      return {
        total_actions: 0,
        completed_actions: 0,
        skipped_actions: 0,
        pending_actions: 0,
        completion_percentage: 0,
        current_phase: null,
        next_action: null,
      }
    }

    const total = sequences.length
    const completed = sequences.filter(s => s.completed_at).length
    const skipped = sequences.filter(s => s.skipped).length
    const pending = total - completed - skipped

    // Find current phase (highest phase with incomplete actions)
    const phaseOrder: SequencePhase[] = ['immediate', 'early_adoption', 'established', 'long_term']
    let currentPhase: SequencePhase | null = null
    for (const phase of phaseOrder.reverse()) {
      if (sequences.some(s => s.phase === phase && !s.completed_at && !s.skipped)) {
        currentPhase = phase
        break
      }
    }

    // Find next pending action
    const now = new Date().toISOString()
    const nextAction = sequences
      .filter(s => !s.completed_at && !s.skipped)
      .sort((a, b) => new Date(a.action_due_at).getTime() - new Date(b.action_due_at).getTime())[0] as PostOnboardingSequence | undefined

    return {
      total_actions: total,
      completed_actions: completed,
      skipped_actions: skipped,
      pending_actions: pending,
      completion_percentage: Math.round((completed / total) * 100),
      current_phase: currentPhase,
      next_action: nextAction || null,
    }
  }
}
