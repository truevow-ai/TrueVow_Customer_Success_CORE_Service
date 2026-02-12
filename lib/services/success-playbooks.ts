/**
 * Success Playbooks Service
 * 
 * Template sequences for legal upsell, automated workflows, and customer success actions:
 * - Playbook creation and management
 * - Playbook execution engine
 * - Step-by-step workflow automation
 * - Outcome tracking and attribution
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface PlaybookStep {
  step_id: string
  step_order: number
  step_type: 'email' | 'sms' | 'call' | 'task' | 'wait' | 'condition'
  step_name: string
  step_config: Record<string, any>
  step_conditions?: Record<string, any>
  step_actions?: Record<string, any>
}

export interface SuccessPlaybook {
  playbook_id: string
  playbook_name: string
  playbook_description?: string
  playbook_category: 'upsell' | 'onboarding' | 'retention' | 'expansion' | 'renewal' | 'custom'
  trigger_type: 'manual' | 'health_score' | 'usage_pattern' | 'milestone' | 'event' | 'schedule'
  trigger_conditions: Record<string, any>
  steps: PlaybookStep[]
  max_executions_per_customer: number
  execution_window_days?: number
  cooldown_days: number
  is_active: boolean
  is_default: boolean
}

export interface PlaybookExecution {
  execution_id: string
  playbook_id: string
  tenant_id: string
  customer_email: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'
  current_step_id?: string
  current_step_order: number
  steps_completed: number
  steps_total: number
  completion_percentage: number
  started_at?: string
  completed_at?: string
}

export class SuccessPlaybooksService {
  /**
   * Create a new playbook
   */
  static async createPlaybook(
    playbook: Omit<SuccessPlaybook, 'playbook_id'>
  ): Promise<SuccessPlaybook> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('cs_success_playbooks')
      .insert({
        tenant_id: playbook.is_default ? null : undefined, // Will be set by RLS
        playbook_name: playbook.playbook_name,
        playbook_description: playbook.playbook_description,
        playbook_category: playbook.playbook_category,
        trigger_type: playbook.trigger_type,
        trigger_conditions: playbook.trigger_conditions,
        steps: playbook.steps,
        max_executions_per_customer: playbook.max_executions_per_customer,
        execution_window_days: playbook.execution_window_days,
        cooldown_days: playbook.cooldown_days,
        is_active: playbook.is_active,
        is_default: playbook.is_default,
      })
      .select()
      .single()

    if (error) throw error

    return this.mapToPlaybook(data)
  }

  /**
   * Get playbooks
   */
  static async getPlaybooks(
    tenantId?: string,
    category?: string,
    includeDefaults: boolean = true
  ): Promise<SuccessPlaybook[]> {
    const supabase = createServerSupabase()

    let query = supabase
      .from('cs_success_playbooks')
      .select('*')
      .eq('is_active', true)

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},is_default.eq.true`)
    } else if (includeDefaults) {
      query = query.eq('is_default', true)
    }

    if (category) {
      query = query.eq('playbook_category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapToPlaybook)
  }

  /**
   * Get playbook by ID
   */
  static async getPlaybookById(playbookId: string): Promise<SuccessPlaybook | null> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('cs_success_playbooks')
      .select('*')
      .eq('playbook_id', playbookId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToPlaybook(data)
  }

  /**
   * Execute a playbook for a customer
   */
  static async executePlaybook(
    playbookId: string,
    tenantId: string,
    customerEmail: string,
    triggeredBy: 'manual' | 'system' | 'event' | 'schedule' = 'manual',
    triggerData?: Record<string, any>
  ): Promise<PlaybookExecution> {
    const supabase = createServerSupabase()

    // Get playbook
    const playbook = await this.getPlaybookById(playbookId)
    if (!playbook) {
      throw new Error('Playbook not found')
    }

    if (!playbook.is_active) {
      throw new Error('Playbook is not active')
    }

    // Check cooldown
    const { data: recentExecutions } = await supabase
      .from('cs_playbook_executions')
      .select('started_at')
      .eq('playbook_id', playbookId)
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .order('started_at', { ascending: false })
      .limit(1)

    if (recentExecutions && recentExecutions.length > 0 && playbook.cooldown_days > 0) {
      const lastExecution = new Date(recentExecutions[0].started_at)
      const daysSince = Math.floor((Date.now() - lastExecution.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince < playbook.cooldown_days) {
        throw new Error(`Playbook is in cooldown. Last executed ${daysSince} days ago.`)
      }
    }

    // Check max executions
    const { count: executionCount } = await supabase
      .from('cs_playbook_executions')
      .select('*', { count: 'exact', head: true })
      .eq('playbook_id', playbookId)
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)

    if (executionCount && executionCount >= playbook.max_executions_per_customer) {
      throw new Error(`Maximum executions (${playbook.max_executions_per_customer}) reached for this customer`)
    }

    // Create execution
    const { data: execution, error } = await supabase
      .from('cs_playbook_executions')
      .insert({
        playbook_id: playbookId,
        tenant_id: tenantId,
        customer_email: customerEmail,
        status: 'pending',
        current_step_order: 0,
        steps_completed: 0,
        steps_total: playbook.steps.length,
        completion_percentage: 0,
        triggered_by: triggeredBy,
        trigger_data: triggerData || {},
      })
      .select()
      .single()

    if (error) throw error

    // Create step executions
    const stepExecutions = playbook.steps.map((step, index) => ({
      execution_id: execution.execution_id,
      step_id: step.step_id,
      step_order: step.step_order,
      step_type: step.step_type,
      step_name: step.step_name,
      step_config: step.step_config,
      status: index === 0 ? 'scheduled' : 'pending',
      scheduled_at: index === 0 ? new Date().toISOString() : null,
    }))

    await supabase.from('cs_playbook_step_executions').insert(stepExecutions)

    // Start execution (process first step)
    await this.processNextStep(execution.execution_id)

    return this.mapToExecution(execution)
  }

  /**
   * Process next step in execution
   */
  static async processNextStep(executionId: string): Promise<void> {
    const supabase = createServerSupabase()

    // Get execution
    const { data: execution } = await supabase
      .from('cs_playbook_executions')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    if (!execution || execution.status !== 'running' && execution.status !== 'pending') {
      return
    }

    // Get playbook
    const playbook = await this.getPlaybookById(execution.playbook_id)
    if (!playbook) {
      await supabase
        .from('cs_playbook_executions')
        .update({ status: 'failed', execution_result: 'failed' })
        .eq('execution_id', executionId)
      return
    }

    // Update execution status
    if (execution.status === 'pending') {
      await supabase
        .from('cs_playbook_executions')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('execution_id', executionId)
    }

    // Get current step
    const currentStepOrder = execution.current_step_order || 0
    const currentStep = playbook.steps.find(s => s.step_order === currentStepOrder)

    if (!currentStep) {
      // No more steps, mark as completed
      await supabase
        .from('cs_playbook_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_result: 'success',
          completion_percentage: 100,
        })
        .eq('execution_id', executionId)
      return
    }

    // Get step execution
    const { data: stepExecution } = await supabase
      .from('cs_playbook_step_executions')
      .select('*')
      .eq('execution_id', executionId)
      .eq('step_order', currentStepOrder)
      .single()

    if (!stepExecution) {
      return
    }

    // Execute step based on type
    try {
      await this.executeStep(stepExecution, execution, playbook)
    } catch (error) {
      // Mark step as failed
      await supabase
        .from('cs_playbook_step_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('step_execution_id', stepExecution.step_execution_id)

      // Check if we should continue or fail
      const shouldContinue = currentStep.step_config?.continue_on_error !== false
      if (!shouldContinue) {
        await supabase
          .from('cs_playbook_executions')
          .update({
            status: 'failed',
            execution_result: 'failed',
          })
          .eq('execution_id', executionId)
        return
      }
    }

    // Mark step as completed
    await supabase
      .from('cs_playbook_step_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('step_execution_id', stepExecution.step_execution_id)

    // Update execution progress
    const newStepOrder = currentStepOrder + 1
    const stepsCompleted = execution.steps_completed + 1
    const completionPercentage = Math.round((stepsCompleted / playbook.steps.length) * 100)

    await supabase
      .from('cs_playbook_executions')
      .update({
        current_step_order: newStepOrder,
        current_step_id: playbook.steps.find(s => s.step_order === newStepOrder)?.step_id,
        steps_completed: stepsCompleted,
        completion_percentage: completionPercentage,
      })
      .eq('execution_id', executionId)

    // Schedule next step if exists
    const nextStep = playbook.steps.find(s => s.step_order === newStepOrder)
    if (nextStep) {
      const delayHours = nextStep.step_config?.delay_hours || 0
      const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

      await supabase
        .from('cs_playbook_step_executions')
        .update({
          status: 'scheduled',
          scheduled_at: scheduledAt.toISOString(),
        })
        .eq('execution_id', executionId)
        .eq('step_order', newStepOrder)
    } else {
      // No more steps, mark as completed
      await supabase
        .from('cs_playbook_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_result: 'success',
          completion_percentage: 100,
        })
        .eq('execution_id', executionId)
    }
  }

  /**
   * Execute a single step
   */
  private static async executeStep(
    stepExecution: any,
    execution: any,
    playbook: SuccessPlaybook
  ): Promise<void> {
    const step = playbook.steps.find(s => s.step_id === stepExecution.step_id)
    if (!step) {
      throw new Error('Step not found')
    }

    switch (step.step_type) {
      case 'email':
        await this.executeEmailStep(step, execution)
        break
      case 'sms':
        await this.executeSMSStep(step, execution)
        break
      case 'call':
        await this.executeCallStep(step, execution)
        break
      case 'task':
        await this.executeTaskStep(step, execution)
        break
      case 'wait':
        // Wait step - just schedule for later
        break
      case 'condition':
        await this.executeConditionStep(step, execution)
        break
      default:
        throw new Error(`Unknown step type: ${step.step_type}`)
    }
  }

  /**
   * Execute email step
   */
  private static async executeEmailStep(step: PlaybookStep, execution: any): Promise<void> {
    const { EnhancedEmailService } = await import('./enhanced-email-service')
    const supabase = createServerSupabase()

    const templateId = step.step_config?.template_id
    let subject = step.step_config?.subject || 'Message from TrueVow'
    let htmlBody = step.step_config?.body_html || step.step_config?.body || ''
    let textBody = step.step_config?.body_text || step.step_config?.body || ''

    // Get template if provided
    if (templateId) {
      const { data: template } = await supabase
        .from('cs_playbook_templates')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (template) {
        subject = template.subject || subject
        htmlBody = template.body_html || htmlBody
        textBody = template.body_text || textBody
      }
    }

    // Personalize content
    htmlBody = await this.personalizeContent(htmlBody, execution)
    textBody = await this.personalizeContent(textBody, execution)

    try {
      // Send email via Resend
      const emailResult = await EnhancedEmailService.sendEmail({
        to: execution.customer_email,
        subject,
        html: htmlBody,
        text: textBody,
        utmSource: 'cs-support',
        utmMedium: 'email',
        utmCampaign: 'success-playbook',
        sequenceId: execution.execution_id,
        leadId: execution.customer_email,
        personalize: true,
        customerEmail: execution.customer_email,
        jurisdiction: 'US',
        metadata: {
          playbook_id: execution.playbook_id,
          execution_id: execution.execution_id,
          step_id: step.step_id,
        },
      })

      // Email record is already created in cs_email_sends by EnhancedEmailService
      // Update it with playbook metadata if needed
      if (emailResult.emailId) {
        await supabase
          .from('cs_email_sends')
          .update({
            metadata: {
              playbook_id: execution.playbook_id,
              execution_id: execution.execution_id,
              step_id: step.step_id,
              template_id: templateId,
            },
          })
          .eq('email_id', emailResult.emailId)
      }
    } catch (error: any) {
      console.error('Error sending playbook email:', error)
      // EnhancedEmailService handles error logging in cs_email_sends
      throw error
    }
  }

  /**
   * Execute SMS step
   */
  private static async executeSMSStep(step: PlaybookStep, execution: any): Promise<void> {
    // TODO: Integrate with Twilio
    // For now, create communication record
    const supabase = createServerSupabase()

    const templateId = step.step_config?.template_id
    let body = step.step_config?.body || ''

    // Get template if provided
    if (templateId) {
      const { data: template } = await supabase
        .from('cs_playbook_templates')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (template) {
        body = template.body_text || body
      }
    }

    // Personalize content
    body = await this.personalizeContent(body, execution)

    // SMS record will be created by UnifiedMessagingService in cs_sms_logs
    // For now, just log (TODO: Integrate with UnifiedMessagingService)
    console.log('SMS step execution:', {
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      body,
      template_id: templateId,
      metadata: {
        playbook_id: execution.playbook_id,
        execution_id: execution.execution_id,
        step_id: step.step_id,
      },
    })
  }

  /**
   * Execute call step
   */
  private static async executeCallStep(step: PlaybookStep, execution: any): Promise<void> {
    // TODO: Integrate with Twilio for outbound calls
    // For now, create a task for CSM to make the call
    const supabase = createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      subject: `Playbook Call: ${step.step_name}`,
      description: `Scheduled call as part of playbook execution. Step: ${step.step_name}`,
      status: 'open',
      priority: step.step_config?.priority || 'medium',
      channel: 'call',
      source: 'internal',
      metadata: {
        playbook_id: execution.playbook_id,
        execution_id: execution.execution_id,
        step_id: step.step_id,
        playbook_call: true,
      },
    })
  }

  /**
   * Execute task step
   */
  private static async executeTaskStep(step: PlaybookStep, execution: any): Promise<void> {
    // Create a task/ticket for CSM
    const supabase = createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      subject: `Playbook Task: ${step.step_name}`,
      description: step.step_config?.description || `Task from playbook: ${step.step_name}`,
      status: 'open',
      priority: step.step_config?.priority || 'medium',
      channel: 'internal',
      source: 'internal',
      metadata: {
        playbook_id: execution.playbook_id,
        execution_id: execution.execution_id,
        step_id: step.step_id,
        playbook_task: true,
      },
    })
  }

  /**
   * Execute condition step
   */
  private static async executeConditionStep(step: PlaybookStep, execution: any): Promise<void> {
    // Evaluate condition and determine next step
    const condition = step.step_config?.condition
    if (!condition) {
      return
    }

    // TODO: Implement condition evaluation
    // For now, always proceed to next step
  }

  /**
   * Personalize content with variables
   */
  private static async personalizeContent(content: string, execution: any): Promise<string> {
    // Get customer data for personalization
    const supabase = createServerSupabase()

    // Get customer health score
    const { data: healthScore } = await supabase
      .from('cs_customer_health_scores')
      .select('overall_score')
      .eq('tenant_id', execution.tenant_id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    // Replace variables
    content = content.replace(/\{\{customer_email\}\}/g, execution.customer_email)
    content = content.replace(/\{\{health_score\}\}/g, healthScore?.overall_score?.toString() || 'N/A')

    return content
  }

  /**
   * Get playbook executions
   */
  static async getExecutions(
    tenantId?: string,
    playbookId?: string,
    status?: string
  ): Promise<PlaybookExecution[]> {
    const supabase = createServerSupabase()

    let query = supabase.from('cs_playbook_executions').select('*')

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    if (playbookId) {
      query = query.eq('playbook_id', playbookId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('started_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapToExecution)
  }

  /**
   * Record playbook outcome
   */
  static async recordOutcome(
    executionId: string,
    outcomeType: string,
    outcomeValue?: number,
    outcomeDescription?: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get execution
    const { data: execution } = await supabase
      .from('cs_playbook_executions')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    if (!execution) {
      throw new Error('Execution not found')
    }

    await supabase.from('cs_playbook_outcomes').insert({
      execution_id: executionId,
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      outcome_type: outcomeType,
      outcome_value: outcomeValue,
      outcome_description: outcomeDescription,
      outcome_date: new Date().toISOString().split('T')[0],
      attributed_to_playbook: true,
      confidence_score: 80, // TODO: Calculate based on timing and other factors
    })
  }

  /**
   * Get playbook statistics
   */
  static async getPlaybookStats(
    playbookId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = createServerSupabase()

    const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = periodEnd || new Date()

    // Get executions
    const { data: executions } = await supabase
      .from('cs_playbook_executions')
      .select('*')
      .eq('playbook_id', playbookId)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())

    // Get outcomes
    const { data: outcomes } = await supabase
      .from('cs_playbook_outcomes')
      .select('*')
      .in('execution_id', (executions || []).map(e => e.execution_id))
      .gte('outcome_date', start.toISOString().split('T')[0])
      .lte('outcome_date', end.toISOString().split('T')[0])

    const totalExecutions = executions?.length || 0
    const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0
    const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0

    const totalOutcomeValue = (outcomes || []).reduce((sum, o) => sum + (o.outcome_value || 0), 0)

    return {
      total_executions: totalExecutions,
      completed_executions: completedExecutions,
      success_rate: Math.round(successRate * 100) / 100,
      total_outcomes: outcomes?.length || 0,
      total_outcome_value: totalOutcomeValue,
      outcomes_by_type: this.groupBy(outcomes || [], 'outcome_type'),
    }
  }

  /**
   * Group array by key
   */
  private static groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'unknown'
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  /**
   * Map database row to Playbook
   */
  private static mapToPlaybook(row: any): SuccessPlaybook {
    return {
      playbook_id: row.playbook_id,
      playbook_name: row.playbook_name,
      playbook_description: row.playbook_description,
      playbook_category: row.playbook_category,
      trigger_type: row.trigger_type,
      trigger_conditions: row.trigger_conditions || {},
      steps: row.steps || [],
      max_executions_per_customer: row.max_executions_per_customer,
      execution_window_days: row.execution_window_days,
      cooldown_days: row.cooldown_days,
      is_active: row.is_active,
      is_default: row.is_default,
    }
  }

  /**
   * Map database row to Execution
   */
  private static mapToExecution(row: any): PlaybookExecution {
    return {
      execution_id: row.execution_id,
      playbook_id: row.playbook_id,
      tenant_id: row.tenant_id,
      customer_email: row.customer_email,
      status: row.status,
      current_step_id: row.current_step_id,
      current_step_order: row.current_step_order,
      steps_completed: row.steps_completed,
      steps_total: row.steps_total,
      completion_percentage: row.completion_percentage,
      started_at: row.started_at,
      completed_at: row.completed_at,
    }
  }
}
