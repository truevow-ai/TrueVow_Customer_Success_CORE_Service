/**
 * Expansion Triggers Service
 * 
 * Usage spikes detection, upsell workflows, and expansion opportunity identification:
 * - Usage spike detection
 * - Expansion trigger evaluation
 * - Opportunity identification
 * - Automated upsell workflows
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { UsageAnalyticsService } from './usage-analytics'
import { TIME_DURATIONS, BUSINESS_THRESHOLDS, DEFAULT_LIMITS, getDateInPast, getDefaultAnalyticsPeriodStart } from '@/lib/config/app-config'

export interface ExpansionTrigger {
  trigger_id: string
  trigger_name: string
  trigger_description?: string
  trigger_category: 'usage_spike' | 'feature_adoption' | 'engagement' | 'revenue' | 'custom'
  condition_type: 'usage_threshold' | 'feature_adoption' | 'engagement_score' | 'revenue_milestone' | 'custom'
  condition_config: Record<string, any>
  action_type: 'playbook' | 'notification' | 'task' | 'workflow' | 'custom'
  action_config: Record<string, any>
  cooldown_days: number
  max_triggers_per_customer: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  is_default: boolean
}

export interface UsageSpike {
  detection_id: string
  tenant_id: string
  customer_email: string
  spike_type: 'feature_usage' | 'login_frequency' | 'session_duration' | 'data_volume' | 'api_calls'
  feature_name?: string
  baseline_value: number
  spike_value: number
  percentage_increase: number
  spike_duration_days?: number
  confidence_score: number
  status: 'detected' | 'analyzed' | 'actioned' | 'resolved' | 'false_positive'
}

export interface ExpansionOpportunity {
  opportunity_id: string
  tenant_id: string
  customer_email: string
  opportunity_type: 'upsell' | 'addon' | 'upgrade' | 'feature_unlock' | 'seat_expansion'
  opportunity_category: 'usage_based' | 'feature_based' | 'engagement_based' | 'revenue_based'
  opportunity_name: string
  opportunity_description?: string
  confidence_score: number
  estimated_value?: number
  estimated_probability: number
  status: 'identified' | 'in_progress' | 'won' | 'lost' | 'deferred' | 'closed'
  assigned_to?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export class ExpansionTriggersService {
  /**
   * Detect usage spikes for a customer
   */
  static async detectUsageSpikes(
    tenantId: string,
    customerEmail: string,
    periodDays: number = 7
  ): Promise<UsageSpike[]> {
    const supabase = await createServerSupabase()

    const now = new Date()
    const spikePeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const baselinePeriodStart = new Date(now.getTime() - (periodDays * 2) * 24 * 60 * 60 * 1000)
    const baselinePeriodEnd = spikePeriodStart

    // Get usage patterns
    const { data: recentPattern } = await supabase
      .from('cs_usage_patterns')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', customerEmail)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    // Get usage events for spike period
    const { data: spikeEvents } = await supabase
      .from('cs_usage_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', customerEmail)
      .gte('event_timestamp', spikePeriodStart.toISOString())
      .lte('event_timestamp', now.toISOString())

    // Get usage events for baseline period
    const { data: baselineEvents } = await supabase
      .from('cs_usage_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', customerEmail)
      .gte('event_timestamp', baselinePeriodStart.toISOString())
      .lt('event_timestamp', baselinePeriodEnd.toISOString())

    const spikes: UsageSpike[] = []

    // Detect feature usage spikes
    const spikeFeatureCounts = this.countByFeature(spikeEvents || [])
    const baselineFeatureCounts = this.countByFeature(baselineEvents || [])

    for (const [feature, spikeCount] of Object.entries(spikeFeatureCounts)) {
      const baselineCount = baselineFeatureCounts[feature] || 0
      
      if (baselineCount === 0 && spikeCount > 0) {
        // New feature usage
        const percentageIncrease = 100
        const confidenceScore = 80

        const { data: detection } = await supabase
          .from('cs_usage_spike_detections')
          .insert({
            tenant_id: tenantId,
            customer_email: customerEmail,
            spike_type: 'feature_usage',
            feature_name: feature,
            baseline_value: baselineCount,
            spike_value: spikeCount,
            percentage_increase: percentageIncrease,
            baseline_period_start: baselinePeriodStart.toISOString().split('T')[0],
            baseline_period_end: baselinePeriodEnd.toISOString().split('T')[0],
            spike_period_start: spikePeriodStart.toISOString().split('T')[0],
            spike_period_end: now.toISOString().split('T')[0],
            detection_method: 'statistical',
            confidence_score: confidenceScore,
            status: 'detected',
          })
          .select()
          .single()

        if (detection) {
          spikes.push(this.mapToSpike(detection))
        }
      } else if (baselineCount > 0) {
        const percentageIncrease = ((spikeCount - baselineCount) / baselineCount) * 100
        
        // Detect spike if increase > 50%
        if (percentageIncrease > 50) {
          const confidenceScore = Math.min(100, 60 + (percentageIncrease / 2))

          const { data: detection } = await supabase
            .from('cs_usage_spike_detections')
            .insert({
              tenant_id: tenantId,
              customer_email: customerEmail,
              spike_type: 'feature_usage',
              feature_name: feature,
              baseline_value: baselineCount,
              spike_value: spikeCount,
              percentage_increase: Math.round(percentageIncrease * 100) / 100,
              baseline_period_start: baselinePeriodStart.toISOString().split('T')[0],
              baseline_period_end: baselinePeriodEnd.toISOString().split('T')[0],
              spike_period_start: spikePeriodStart.toISOString().split('T')[0],
              spike_period_end: now.toISOString().split('T')[0],
              detection_method: 'statistical',
              confidence_score: Math.round(confidenceScore * 100) / 100,
              status: 'detected',
            })
            .select()
            .single()

          if (detection) {
            spikes.push(this.mapToSpike(detection))
          }
        }
      }
    }

    // Detect login frequency spike
    if (recentPattern) {
      const loginSpike = recentPattern.login_frequency_7d
      const loginBaseline = recentPattern.login_frequency_30d / 4 // Approximate weekly baseline

      if (loginBaseline > 0 && loginSpike > loginBaseline * 1.5) {
        const percentageIncrease = ((loginSpike - loginBaseline) / loginBaseline) * 100

        const { data: detection } = await supabase
          .from('cs_usage_spike_detections')
          .insert({
            tenant_id: tenantId,
            customer_email: customerEmail,
            spike_type: 'login_frequency',
            baseline_value: loginBaseline,
            spike_value: loginSpike,
            percentage_increase: Math.round(percentageIncrease * 100) / 100,
            baseline_period_start: baselinePeriodStart.toISOString().split('T')[0],
            baseline_period_end: baselinePeriodEnd.toISOString().split('T')[0],
            spike_period_start: spikePeriodStart.toISOString().split('T')[0],
            spike_period_end: now.toISOString().split('T')[0],
            detection_method: 'statistical',
            confidence_score: 70,
            status: 'detected',
          })
          .select()
          .single()

        if (detection) {
          spikes.push(this.mapToSpike(detection))
        }
      }
    }

    return spikes
  }

  /**
   * Count events by feature
   */
  private static countByFeature(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      const feature = event.feature_name || 'unknown'
      acc[feature] = (acc[feature] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Evaluate expansion triggers for a customer
   */
  static async evaluateTriggers(
    tenantId: string,
    customerEmail: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Get active triggers for tenant (including defaults)
    const { data: triggers } = await supabase
      .from('cs_expansion_triggers')
      .select('*')
      .eq('is_active', true)
      .or(`tenant_id.eq.${tenantId},is_default.eq.true`)

    if (!triggers || triggers.length === 0) {
      return
    }

    // Detect usage spikes first
    const spikes = await this.detectUsageSpikes(tenantId, customerEmail)

    // Evaluate each trigger
    for (const trigger of triggers) {
      // Check cooldown
      const { data: recentExecution } = await supabase
        .from('cs_expansion_trigger_executions')
        .select('triggered_at')
        .eq('trigger_id', trigger.trigger_id)
        .eq('tenant_id', tenantId)
        .eq('customer_email', customerEmail)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single()

      if (recentExecution && trigger.cooldown_days > 0) {
        const lastTrigger = new Date(recentExecution.triggered_at)
        const daysSince = Math.floor((Date.now() - lastTrigger.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSince < trigger.cooldown_days) {
          continue // Skip, still in cooldown
        }
      }

      // Check max triggers
      const { count: triggerCount } = await supabase
        .from('cs_expansion_trigger_executions')
        .select('*', { count: 'exact', head: true })
        .eq('trigger_id', trigger.trigger_id)
        .eq('tenant_id', tenantId)
        .eq('customer_email', customerEmail)

      if (triggerCount && triggerCount >= trigger.max_triggers_per_customer) {
        continue // Skip, max triggers reached
      }

      // Evaluate condition
      const conditionMet = await this.evaluateCondition(trigger, tenantId, customerEmail, spikes)

      if (conditionMet.met) {
        // Execute trigger
        await this.executeTrigger(trigger, tenantId, customerEmail, conditionMet.metricValue ?? 0, conditionMet.metricType || 'unknown')
      }
    }
  }

  /**
   * Evaluate trigger condition
   */
  private static async evaluateCondition(
    trigger: any,
    tenantId: string,
    customerEmail: string,
    spikes: UsageSpike[]
  ): Promise<{ met: boolean; metricValue?: number; metricType?: string }> {
    const conditionType = trigger.condition_type
    const config = trigger.condition_config || {}

    switch (conditionType) {
      case 'usage_threshold':
        return await this.evaluateUsageThreshold(config, tenantId, customerEmail)

      case 'feature_adoption':
        return await this.evaluateFeatureAdoption(config, tenantId, customerEmail)

      case 'engagement_score':
        return await this.evaluateEngagementScore(config, tenantId, customerEmail)

      case 'usage_spike':
        return this.evaluateUsageSpike(config, spikes)

      default:
        return { met: false }
    }
  }

  /**
   * Evaluate usage threshold condition
   */
  private static async evaluateUsageThreshold(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string
  ): Promise<{ met: boolean; metricValue?: number; metricType?: string }> {
    const supabase = await createServerSupabase()

    const metric = config.metric || 'feature_usage'
    const featureName = config.feature_name
    const threshold = config.threshold || 0
    const timeWindowDays = config.time_window_days || 7

    const windowStart = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000)

    if (metric === 'feature_usage' && featureName) {
      const { count } = await supabase
        .from('cs_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', customerEmail)
        .eq('feature_name', featureName)
        .gte('event_timestamp', windowStart.toISOString())

      const comparison = config.comparison || 'greater_than'
      const met = comparison === 'greater_than'
        ? (count || 0) > threshold
        : (count || 0) >= threshold

      return {
        met,
        metricValue: count || 0,
        metricType: 'feature_usage',
      }
    }

    return { met: false }
  }

  /**
   * Evaluate feature adoption condition
   */
  private static async evaluateFeatureAdoption(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string
  ): Promise<{ met: boolean; metricValue?: number; metricType?: string }> {
    const supabase = await createServerSupabase()

    const featureName = config.feature_name
    const adoptionThreshold = config.adoption_threshold || 0

    // Get feature adoption metrics
    const { data: metrics } = await supabase
      .from('cs_feature_adoption_metrics')
      .select('adoption_rate')
      .eq('tenant_id', tenantId)
      .eq('feature_name', featureName)
      .order('period_start', { ascending: false })
      .limit(1)
      .single()

    if (!metrics) {
      return { met: false }
    }

    const met = metrics.adoption_rate >= adoptionThreshold

    return {
      met,
      metricValue: metrics.adoption_rate,
      metricType: 'feature_adoption',
    }
  }

  /**
   * Evaluate engagement score condition
   */
  private static async evaluateEngagementScore(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string
  ): Promise<{ met: boolean; metricValue?: number; metricType?: string }> {
    const supabase = await createServerSupabase()

    const scoreThreshold = config.score_threshold || 0

    const { data: pattern } = await supabase
      .from('cs_usage_patterns')
      .select('engagement_score')
      .eq('tenant_id', tenantId)
      .eq('user_id', customerEmail)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    if (!pattern) {
      return { met: false }
    }

    const comparison = config.comparison || 'greater_than'
    const met = comparison === 'greater_than'
      ? pattern.engagement_score > scoreThreshold
      : pattern.engagement_score >= scoreThreshold

    return {
      met,
      metricValue: pattern.engagement_score,
      metricType: 'engagement_score',
    }
  }

  /**
   * Evaluate usage spike condition
   */
  private static evaluateUsageSpike(
    config: Record<string, any>,
    spikes: UsageSpike[]
  ): { met: boolean; metricValue?: number; metricType?: string } {
    const percentageThreshold = config.percentage_increase || 50
    const spikeType = config.spike_type

    const relevantSpikes = spikeType
      ? spikes.filter(s => s.spike_type === spikeType)
      : spikes

    if (relevantSpikes.length === 0) {
      return { met: false }
    }

    // Check if any spike meets threshold
    const matchingSpike = relevantSpikes.find(s => s.percentage_increase >= percentageThreshold)

    if (matchingSpike) {
      return {
        met: true,
        metricValue: matchingSpike.percentage_increase,
        metricType: 'usage_spike',
      }
    }

    return { met: false }
  }

  /**
   * Execute expansion trigger
   */
  private static async executeTrigger(
    trigger: any,
    tenantId: string,
    customerEmail: string,
    metricValue: number,
    metricType: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Create execution record
    const { data: execution } = await supabase
      .from('cs_expansion_trigger_executions')
      .insert({
        trigger_id: trigger.trigger_id,
        tenant_id: tenantId,
        customer_email: customerEmail,
        status: 'processing',
        trigger_metric_value: metricValue,
        trigger_metric_type: metricType,
        trigger_context: {
          trigger_name: trigger.trigger_name,
          trigger_category: trigger.trigger_category,
        },
      })
      .select()
      .single()

    if (!execution) {
      return
    }

    // Execute action based on action_type
    try {
      switch (trigger.action_type) {
        case 'playbook':
          await this.executePlaybookAction(trigger.action_config, tenantId, customerEmail, execution.execution_id)
          break
        case 'notification':
          await this.executeNotificationAction(trigger.action_config, tenantId, customerEmail, execution.execution_id)
          break
        case 'task':
          await this.executeTaskAction(trigger.action_config, tenantId, customerEmail, execution.execution_id)
          break
        default:
          console.warn(`Unknown action type: ${trigger.action_type}`)
      }

      // Mark execution as completed
      await supabase
        .from('cs_expansion_trigger_executions')
        .update({
          status: 'completed',
          action_executed: true,
          action_executed_at: new Date().toISOString(),
        })
        .eq('execution_id', execution.execution_id)

      // Create expansion opportunity if configured
      if (trigger.action_config?.create_opportunity !== false) {
        await this.createExpansionOpportunity(trigger, tenantId, customerEmail, metricValue, metricType)
      }
    } catch (error) {
      // Mark execution as failed
      await supabase
        .from('cs_expansion_trigger_executions')
        .update({
          status: 'failed',
          action_result: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .eq('execution_id', execution.execution_id)
    }
  }

  /**
   * Execute playbook action
   */
  private static async executePlaybookAction(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string,
    executionId: string
  ): Promise<void> {
    const playbookId = config.playbook_id
    if (!playbookId) {
      throw new Error('Playbook ID not provided')
    }

    // Import and execute playbook
    const { SuccessPlaybooksService } = await import('./success-playbooks')
    await SuccessPlaybooksService.executePlaybook(
      playbookId,
      tenantId,
      customerEmail,
      'system',
      { expansion_trigger_execution_id: executionId }
    )
  }

  /**
   * Execute notification action
   */
  private static async executeNotificationAction(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string,
    executionId: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Create notification for CSM
    const notificationType = config.notification_type || 'email'
    const recipients = config.recipients || ['csm']

    const { data: csmsForTenant } = await supabase
      .from('cs_team_members')
      .select('user_id, clerk_user_id, metadata')
      .eq('role', 'csm')
      .eq('is_active', true)
      .maybeSingle()

    const csmUserId = csmsForTenant?.user_id || null
    await supabase.from('cs_notifications').insert({
      user_id: csmUserId,
      ticket_id: null,
      type: 'expansion_opportunity',
      title: 'Expansion Opportunity Detected',
      message: `Customer ${customerEmail} has triggered an expansion opportunity.`,
      metadata: {
        expansion_trigger_execution_id: executionId,
        customer_email: customerEmail,
        tenant_id: tenantId,
      },
    })
  }

  /**
   * Execute task action
   */
  private static async executeTaskAction(
    config: Record<string, any>,
    tenantId: string,
    customerEmail: string,
    executionId: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: tenantId,
      customer_email: customerEmail,
      subject: config.task_subject || 'Expansion Opportunity - Follow Up',
      description: config.task_description || `Follow up on expansion opportunity for ${customerEmail}`,
      status: 'open',
      priority: config.priority || 'medium',
      channel: 'internal',
      source: 'internal',
      metadata: {
        expansion_trigger_execution_id: executionId,
        expansion_task: true,
      },
    })
  }

  /**
   * Create expansion opportunity
   */
  private static async createExpansionOpportunity(
    trigger: any,
    tenantId: string,
    customerEmail: string,
    metricValue: number,
    metricType: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Determine opportunity type based on trigger category
    let opportunityType: ExpansionOpportunity['opportunity_type'] = 'upsell'
    let opportunityCategory: ExpansionOpportunity['opportunity_category'] = 'usage_based'

    if (trigger.trigger_category === 'usage_spike') {
      opportunityType = 'upgrade'
      opportunityCategory = 'usage_based'
    } else if (trigger.trigger_category === 'feature_adoption') {
      opportunityType = 'feature_unlock'
      opportunityCategory = 'feature_based'
    } else if (trigger.trigger_category === 'engagement') {
      opportunityType = 'addon'
      opportunityCategory = 'engagement_based'
    }

    // Calculate confidence and estimated value
    const confidenceScore = this.calculateOpportunityConfidence(metricValue, metricType)
    const estimatedValue = this.estimateOpportunityValue(opportunityType, metricValue)
    const estimatedProbability = confidenceScore * 0.8 // Probability is lower than confidence

    const opportunityName = `${opportunityType.charAt(0).toUpperCase() + opportunityType.slice(1)} Opportunity - ${customerEmail}`

    await supabase.from('cs_expansion_opportunities').insert({
      tenant_id: tenantId,
      customer_email: customerEmail,
      opportunity_type: opportunityType,
      opportunity_category: opportunityCategory,
      opportunity_name: opportunityName,
      opportunity_description: `Expansion opportunity identified via ${trigger.trigger_name}`,
      confidence_score: Math.round(confidenceScore * 100) / 100,
      estimated_value: estimatedValue,
      estimated_probability: Math.round(estimatedProbability * 100) / 100,
      triggering_signals: [
        {
          signal_type: metricType,
          signal_value: metricValue,
          signal_description: `${metricType}: ${metricValue}`,
        },
      ],
      recommended_playbook_id: trigger.action_config?.playbook_id,
      status: 'identified',
      priority: trigger.priority || 'medium',
    })
  }

  /**
   * Calculate opportunity confidence score
   */
  private static calculateOpportunityConfidence(
    metricValue: number,
    metricType: string
  ): number {
    // Base confidence on metric value
    let confidence = 50

    if (metricType === 'usage_spike') {
      // Higher spike = higher confidence
      confidence = Math.min(100, 50 + (metricValue / 2))
    } else if (metricType === 'feature_usage') {
      // More usage = higher confidence
      confidence = Math.min(100, 40 + (metricValue / 10))
    } else if (metricType === 'engagement_score') {
      // Higher engagement = higher confidence
      confidence = metricValue
    }

    return Math.round(confidence)
  }

  /**
   * Estimate opportunity value
   */
  private static estimateOpportunityValue(
    opportunityType: ExpansionOpportunity['opportunity_type'],
    metricValue: number
  ): number {
    // Base estimates (in dollars)
    const baseValues: Record<string, number> = {
      upsell: 500,
      upgrade: 1000,
      addon: 300,
      feature_unlock: 200,
      seat_expansion: 50,
    }

    const baseValue = baseValues[opportunityType] || 500

    // Adjust based on metric value
    if (opportunityType === 'upgrade' || opportunityType === 'upsell') {
      return baseValue * (1 + metricValue / 100)
    }

    return baseValue
  }

  /**
   * Get expansion opportunities
   */
  static async getOpportunities(
    tenantId?: string,
    status?: string,
    limit: number = 50
  ): Promise<ExpansionOpportunity[]> {
    const supabase = await createServerSupabase()

    let query = supabase
      .from('cs_expansion_opportunities')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(limit)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapToOpportunity)
  }

  /**
   * Get usage spikes
   */
  static async getUsageSpikes(
    tenantId?: string,
    status?: string,
    limit: number = 50
  ): Promise<UsageSpike[]> {
    const supabase = await createServerSupabase()

    let query = supabase
      .from('cs_usage_spike_detections')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapToSpike)
  }

  /**
   * Get expansion summary
   */
  static async getExpansionSummary(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get opportunities
    const { data: opportunities } = await supabase
      .from('cs_expansion_opportunities')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .gte('identified_at', start.toISOString())
      .lte('identified_at', end.toISOString())

    // Get trigger executions
    const { data: executions } = await supabase
      .from('cs_expansion_trigger_executions')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .gte('triggered_at', start.toISOString())
      .lte('triggered_at', end.toISOString())

    // Get usage spikes
    const { data: spikes } = await supabase
      .from('cs_usage_spike_detections')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .gte('detected_at', start.toISOString())
      .lte('detected_at', end.toISOString())

    const totalOpportunities = opportunities?.length || 0
    const wonOpportunities = opportunities?.filter(o => o.status === 'won').length || 0
    const totalValue = opportunities?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0
    const wonValue = opportunities?.filter(o => o.status === 'won').reduce((sum, o) => sum + (o.actual_value || o.estimated_value || 0), 0) || 0

    return {
      opportunities: {
        total: totalOpportunities,
        won: wonOpportunities,
        win_rate: totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0,
        total_estimated_value: totalValue,
        total_won_value: wonValue,
        by_type: this.groupBy(opportunities || [], 'opportunity_type'),
        by_status: this.groupBy(opportunities || [], 'status'),
      },
      trigger_executions: {
        total: executions?.length || 0,
        completed: executions?.filter(e => e.status === 'completed').length || 0,
        by_category: this.groupBy(executions || [], 'trigger_context->trigger_category'),
      },
      usage_spikes: {
        total: spikes?.length || 0,
        by_type: this.groupBy(spikes || [], 'spike_type'),
        top_spikes: (spikes || []).sort((a, b) => b.percentage_increase - a.percentage_increase).slice(0, 10),
      },
    }
  }

  /**
   * Group array by key
   */
  private static groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      let value = item[key]
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value)
      }
      value = value || 'unknown'
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  /**
   * Map database row to UsageSpike
   */
  private static mapToSpike(row: any): UsageSpike {
    return {
      detection_id: row.detection_id,
      tenant_id: row.tenant_id,
      customer_email: row.customer_email,
      spike_type: row.spike_type,
      feature_name: row.feature_name,
      baseline_value: row.baseline_value,
      spike_value: row.spike_value,
      percentage_increase: row.percentage_increase,
      spike_duration_days: row.spike_duration_days,
      confidence_score: row.confidence_score,
      status: row.status,
    }
  }

  /**
   * Map database row to ExpansionOpportunity
   */
  private static mapToOpportunity(row: any): ExpansionOpportunity {
    return {
      opportunity_id: row.opportunity_id,
      tenant_id: row.tenant_id,
      customer_email: row.customer_email,
      opportunity_type: row.opportunity_type,
      opportunity_category: row.opportunity_category,
      opportunity_name: row.opportunity_name,
      opportunity_description: row.opportunity_description,
      confidence_score: row.confidence_score,
      estimated_value: row.estimated_value,
      estimated_probability: row.estimated_probability,
      status: row.status,
      assigned_to: row.assigned_to,
      priority: row.priority,
    }
  }
}
