/**
 * Onboarding Sequences Service
 * 
 * Manages onboarding sequences, milestones, stage progression, and communication triggers.
 * This service handles the complete onboarding sequence lifecycle.
 * 
 * @module lib/services/onboarding-sequences
 */

import { createServerSupabase } from '@/lib/db/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OnboardingSequence {
  sequence_id: string
  name: string
  description: string | null
  template_key: string | null
  tenant_id: string | null
  is_default: boolean
  is_active: boolean
  stages: Stage[]
  milestones: Milestone[]
  communication_flows: CommunicationFlow[]
  jtbd: string | null
  estimated_duration_days: number | null
  created_at: string
  updated_at: string
}

export interface Stage {
  stage_key: string
  stage_name: string
  milestones: string[] // milestone keys
  order_index: number
}

export interface Milestone {
  milestone_key: string
  milestone_name: string
  description: string | null
  stage: string
  required_actions: any[]
  trigger_conditions: Record<string, any>
  trigger_email: boolean
  trigger_sms: boolean
  trigger_call: boolean
  email_template_id: string | null
  sms_template_id: string | null
  call_script_id: string | null
  days_after_previous: number
  due_days_after_start: number | null
  order_index: number
}

export interface CommunicationFlow {
  flow_id: string
  milestone_key: string
  communication_type: 'email' | 'sms' | 'call'
  template_id: string | null
  delay_hours: number
  conditions: Record<string, any>
}

export interface OnboardingProgress {
  progress_id: string
  tenant_id: string
  customer_email: string
  onboarding_stage: 'not_started' | 'account_setup' | 'initial_config' | 'first_use' | 'training' | 'go_live' | 'completed'
  current_step: string | null
  steps_completed: string[]
  steps_total: number
  completion_percentage: number
  onboarding_phase: string | null
  internal_status: string | null
  onboarding_completion_percentage: number
  sequence_id: string | null
  template_key: string | null
  current_milestone: string | null
  current_milestone_key: string | null
  current_milestone_name: string | null
  milestones_completed: string[]
  milestones_pending: string[]
  next_milestone_due_at: string | null
  started_at: string | null
  completed_at: string | null
  go_live_date: string | null
  assigned_client_onboarding_manager_id: string | null
  assigned_csm_id: string | null
  transferred_to_cs_support_at: string | null
  transfer_status: 'pending' | 'in_progress' | 'completed' | 'failed' | null
  notes: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StartOnboardingRequest {
  tenant_id: string
  customer_email: string
  sequence_id?: string
  template_key?: string
  assigned_client_onboarding_manager_id?: string
  metadata?: Record<string, any>
}

export interface CompleteMilestoneRequest {
  progress_id: string
  milestone_key: string
  completion_method: 'automatic' | 'manual' | 'api' | 'webhook'
  completed_by?: string
  completion_data?: Record<string, any>
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class OnboardingSequencesService {
  private static supabase = createServerSupabase()

  /**
   * Start onboarding sequence for a customer
   * 
   * @param request - Onboarding start request
   * @returns Onboarding progress record
   */
  static async startOnboarding(
    request: StartOnboardingRequest
  ): Promise<OnboardingProgress> {
    const { tenant_id, customer_email, sequence_id, template_key, assigned_client_onboarding_manager_id, metadata } = request

    // Validate: must provide either sequence_id or template_key, not both
    if (sequence_id && template_key) {
      throw new Error('Cannot specify both sequence_id and template_key')
    }
    if (!sequence_id && !template_key) {
      throw new Error('Must specify either sequence_id or template_key')
    }

    // Get sequence
    let sequence: OnboardingSequence | null = null
    if (template_key) {
      sequence = await this.getSequenceByTemplateKey(template_key, tenant_id)
    } else if (sequence_id) {
      const { data, error } = await this.supabase
        .from('cs_onboarding_sequences')
        .select('*')
        .eq('sequence_id', sequence_id)
        .single()
      
      if (error) throw new Error(`Failed to get sequence: ${error.message}`)
      sequence = this.parseSequence(data)
    }

    if (!sequence) {
      throw new Error('Sequence not found')
    }

    // Check if onboarding already exists
    const { data: existing } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('customer_email', customer_email)
      .single()

    if (existing) {
      throw new Error('Onboarding already started for this customer')
    }

    // Parse milestones from sequence
    const milestones = sequence.milestones || []
    const milestoneKeys = milestones.map(m => m.milestone_key)
    const firstMilestone = milestones.find(m => m.order_index === 0) || milestones[0]

    // Create onboarding progress record
    const { data: progress, error: progressError } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .insert({
        tenant_id,
        customer_email,
        onboarding_stage: 'not_started',
        steps_completed: [],
        steps_total: milestones.length,
        completion_percentage: 0,
        sequence_id: sequence.sequence_id,
        template_key: sequence.template_key,
        current_milestone: firstMilestone?.milestone_name || null,
        current_milestone_key: firstMilestone?.milestone_key || null,
        current_milestone_name: firstMilestone?.milestone_name || null,
        milestones_completed: [],
        milestones_pending: milestoneKeys,
        next_milestone_due_at: firstMilestone ? new Date(Date.now() + (firstMilestone.due_days_after_start || 0) * 24 * 60 * 60 * 1000).toISOString() : null,
        started_at: new Date().toISOString(),
        assigned_client_onboarding_manager_id,
        transfer_status: 'pending',
        metadata: metadata || {},
      })
      .select()
      .single()

    if (progressError) {
      throw new Error(`Failed to create onboarding progress: ${progressError.message}`)
    }

    // Trigger first communication if configured
    if (firstMilestone) {
      await this.triggerCommunication(progress.progress_id, firstMilestone.milestone_key, sequence)
    }

    return progress as OnboardingProgress
  }

  /**
   * Complete a milestone for a customer
   * 
   * @param request - Milestone completion request
   * @returns Updated onboarding progress
   */
  static async completeMilestone(
    request: CompleteMilestoneRequest
  ): Promise<OnboardingProgress> {
    const { progress_id, milestone_key, completion_method, completed_by, completion_data } = request

    // Get current progress
    const { data: progress, error: progressError } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .select('*')
      .eq('progress_id', progress_id)
      .single()

    if (progressError || !progress) {
      throw new Error('Onboarding progress not found')
    }

    // Get sequence
    const { data: sequenceData, error: sequenceError } = await this.supabase
      .from('cs_onboarding_sequences')
      .select('*')
      .eq('sequence_id', progress.sequence_id)
      .single()

    if (sequenceError || !sequenceData) {
      throw new Error('Sequence not found')
    }

    const sequence = this.parseSequence(sequenceData)
    const milestone = sequence.milestones.find(m => m.milestone_key === milestone_key)

    if (!milestone) {
      throw new Error('Milestone not found in sequence')
    }

    // Check if already completed
    const milestonesCompleted = progress.milestones_completed || []
    if (milestonesCompleted.includes(milestone_key)) {
      return progress as OnboardingProgress
    }

    // Record milestone completion
    const { error: completionError } = await this.supabase
      .from('cs_onboarding_milestone_completions')
      .insert({
        onboarding_progress_id: progress_id,
        milestone_id: milestone.milestone_id || null, // TODO: Get milestone_id from cs_onboarding_milestones table
        tenant_id: progress.tenant_id,
        customer_email: progress.customer_email,
        milestone_key,
        milestone_name: milestone.milestone_name,
        completion_method,
        completed_by,
        completion_data: completion_data || {},
      })

    if (completionError) {
      throw new Error(`Failed to record milestone completion: ${completionError.message}`)
    }

    // Update progress
    const updatedMilestonesCompleted = [...milestonesCompleted, milestone_key]
    const updatedMilestonesPending = (progress.milestones_pending || []).filter(k => k !== milestone_key)
    
    // Find next milestone
    const nextMilestone = sequence.milestones
      .filter(m => !updatedMilestonesCompleted.includes(m.milestone_key))
      .sort((a, b) => a.order_index - b.order_index)[0]

    // Calculate completion percentage
    const totalMilestones = sequence.milestones.length
    const completionPercentage = (updatedMilestonesCompleted.length / totalMilestones) * 100

    // Determine current stage based on completed milestones
    const currentStage = this.determineCurrentStage(sequence, updatedMilestonesCompleted)

    // Update progress record
    const { data: updatedProgress, error: updateError } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .update({
        milestones_completed: updatedMilestonesCompleted,
        milestones_pending: updatedMilestonesPending,
        current_milestone: nextMilestone?.milestone_name || null,
        current_milestone_key: nextMilestone?.milestone_key || null,
        current_milestone_name: nextMilestone?.milestone_name || null,
        next_milestone_due_at: nextMilestone ? new Date(Date.now() + (nextMilestone.due_days_after_start || 0) * 24 * 60 * 60 * 1000).toISOString() : null,
        completion_percentage: completionPercentage,
        onboarding_stage: currentStage,
        completed_at: updatedMilestonesCompleted.length === totalMilestones ? new Date().toISOString() : null,
      })
      .eq('progress_id', progress_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update progress: ${updateError.message}`)
    }

    // Trigger communication for completed milestone
    await this.triggerCommunication(progress_id, milestone_key, sequence)

    // Trigger communication for next milestone if exists
    if (nextMilestone) {
      await this.triggerCommunication(progress_id, nextMilestone.milestone_key, sequence)
    }

    return updatedProgress as OnboardingProgress
  }

  /**
   * Get sequence by template key
   * 
   * @param templateKey - Template key identifier
   * @param tenantId - Optional tenant ID for tenant-specific templates
   * @returns Onboarding sequence
   */
  static async getSequenceByTemplateKey(
    templateKey: string,
    tenantId?: string
  ): Promise<OnboardingSequence> {
    // Try tenant-specific first, then default
    let query = this.supabase
      .from('cs_onboarding_sequences')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)

    if (tenantId) {
      const { data: tenantSpecific } = await query
        .eq('tenant_id', tenantId)
        .single()

      if (tenantSpecific) {
        return this.parseSequence(tenantSpecific)
      }
    }

    // Fall back to default template
    const { data, error } = await query
      .is('tenant_id', null)
      .eq('is_default', true)
      .single()

    if (error || !data) {
      throw new Error(`Sequence template not found: ${templateKey}`)
    }

    return this.parseSequence(data)
  }

  /**
   * Get onboarding progress for a customer
   * 
   * @param tenantId - Tenant ID
   * @param customerEmail - Customer email
   * @returns Onboarding progress
   */
  static async getProgress(
    tenantId: string,
    customerEmail: string
  ): Promise<OnboardingProgress | null> {
    const { data, error } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .single()

    if (error || !data) {
      return null
    }

    return data as OnboardingProgress
  }

  /**
   * Parse sequence JSON structure
   * 
   * @param sequenceData - Raw sequence data from database
   * @returns Parsed sequence
   */
  static parseSequence(sequenceData: any): OnboardingSequence {
    return {
      ...sequenceData,
      stages: sequenceData.stages || [],
      milestones: sequenceData.milestones || [],
      communication_flows: sequenceData.communication_flows || [],
    }
  }

  /**
   * Trigger communication for a milestone
   * 
   * @param progressId - Progress ID
   * @param milestoneKey - Milestone key
   * @param sequence - Onboarding sequence
   */
  private static async triggerCommunication(
    progressId: string,
    milestoneKey: string,
    sequence: OnboardingSequence
  ): Promise<void> {
    const milestone = sequence.milestones.find(m => m.milestone_key === milestoneKey)
    if (!milestone) return

    // Get progress for customer info
    const { data: progress } = await this.supabase
      .from('cs_customer_onboarding_progress')
      .select('*')
      .eq('progress_id', progressId)
      .single()

    if (!progress) return

    // Trigger email if configured
    if (milestone.trigger_email && milestone.email_template_id) {
      // TODO: Implement email sending via communication service
      await this.logCommunication({
        onboarding_progress_id: progressId,
        milestone_id: null, // TODO: Get milestone_id
        tenant_id: progress.tenant_id,
        customer_email: progress.customer_email,
        communication_type: 'email',
        direction: 'outbound',
        status: 'pending',
        template_id: milestone.email_template_id,
      })
    }

    // Trigger SMS if configured
    if (milestone.trigger_sms && milestone.sms_template_id) {
      // TODO: Implement SMS sending via communication service
      await this.logCommunication({
        onboarding_progress_id: progressId,
        milestone_id: null,
        tenant_id: progress.tenant_id,
        customer_email: progress.customer_email,
        communication_type: 'sms',
        direction: 'outbound',
        status: 'pending',
        template_id: milestone.sms_template_id,
      })
    }

    // Trigger call if configured
    if (milestone.trigger_call && milestone.call_script_id) {
      // TODO: Implement call scheduling via communication service
      await this.logCommunication({
        onboarding_progress_id: progressId,
        milestone_id: null,
        tenant_id: progress.tenant_id,
        customer_email: progress.customer_email,
        communication_type: 'call',
        direction: 'outbound',
        status: 'pending',
        template_id: milestone.call_script_id,
      })
    }
  }

  /**
   * Log communication to database
   * 
   * @param communication - Communication data
   */
  private static async logCommunication(communication: any): Promise<void> {
    const { error } = await this.supabase
      .from('cs_onboarding_communications')
      .insert(communication)

    if (error) {
      console.error('Failed to log communication:', error)
    }
  }

  /**
   * Determine current stage based on completed milestones
   * 
   * @param sequence - Onboarding sequence
   * @param completedMilestones - Array of completed milestone keys
   * @returns Current stage
   */
  private static determineCurrentStage(
    sequence: OnboardingSequence,
    completedMilestones: string[]
  ): OnboardingProgress['onboarding_stage'] {
    // Find highest stage where all milestones are completed
    const stages = sequence.stages || []
    
    for (let i = stages.length - 1; i >= 0; i--) {
      const stage = stages[i]
      const stageMilestones = stage.milestones || []
      const allCompleted = stageMilestones.every(key => completedMilestones.includes(key))
      
      if (allCompleted && stageMilestones.length > 0) {
        return this.mapStageKeyToStage(stage.stage_key)
      }
    }

    return 'not_started'
  }

  /**
   * Map stage key to onboarding stage enum
   * 
   * @param stageKey - Stage key
   * @returns Onboarding stage
   */
  private static mapStageKeyToStage(stageKey: string): OnboardingProgress['onboarding_stage'] {
    const mapping: Record<string, OnboardingProgress['onboarding_stage']> = {
      'account_setup': 'account_setup',
      'initial_config': 'initial_config',
      'first_use': 'first_use',
      'training': 'training',
      'go_live': 'go_live',
      'completed': 'completed',
    }
    return mapping[stageKey] || 'not_started'
  }
}
