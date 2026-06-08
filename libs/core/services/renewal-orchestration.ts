/**
 * Renewal Orchestration Service
 * 
 * Risk scoring, retention campaigns, and renewal tracking:
 * - Renewal risk scoring
 * - Risk signal detection
 * - Retention campaign management
 * - Renewal probability forecasting
 * - Renewal outcome tracking
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { HealthScoringService } from './health-scoring'
import { UsageAnalyticsService } from './usage-analytics'
import { TIME_DURATIONS, BUSINESS_THRESHOLDS, DEFAULT_LIMITS, getDateInPast, getDateFromNow, getDefaultAnalyticsPeriodStart } from '@/lib/config/app-config'

export interface RenewalTracking {
  renewal_id: string
  tenant_id: string
  customer_email: string
  subscription_tier: string
  subscription_start_date: string
  subscription_end_date: string
  renewal_date: string
  renewal_type: 'monthly' | 'quarterly' | 'annual' | 'custom'
  renewal_status: 'pending' | 'at_risk' | 'in_progress' | 'renewed' | 'cancelled' | 'expired' | 'churned'
  renewal_probability: number
  renewal_risk_score: number
  risk_factors: Array<{
    factor_type: string
    factor_description: string
    risk_contribution: number
    detected_at: string
  }>
}

export interface RetentionCampaign {
  campaign_id: string
  campaign_name: string
  campaign_description?: string
  campaign_type: 'risk_based' | 'time_based' | 'engagement' | 'custom'
  target_risk_score_min: number
  target_risk_score_max: number
  days_before_renewal: number
  campaign_duration_days: number
  campaign_steps: Array<{
    step_id: string
    step_order: number
    step_type: 'email' | 'sms' | 'call' | 'discount' | 'task'
    step_name: string
    step_config: Record<string, any>
    step_delay_days: number
  }>
  is_active: boolean
  is_default: boolean
}

export interface RenewalRiskSignal {
  signal_id: string
  renewal_id: string
  signal_type: 'usage_drop' | 'support_issues' | 'payment_failure' | 'engagement_low' | 'competitor_mention' | 'custom'
  signal_severity: 'low' | 'medium' | 'high' | 'critical'
  signal_description: string
  signal_value: number
  risk_contribution: number
  detected_at: string
  status: 'active' | 'mitigated' | 'resolved' | 'false_positive'
}

export interface RenewalForecast {
  forecast_id: string
  tenant_id: string
  customer_email: string
  forecast_date: string
  renewal_probability: number
  renewal_risk_score: number
  churn_probability: number
  confidence_score: number
  model_version?: string
  model_type?: string
}

export class RenewalOrchestrationService {
  /**
   * Calculate renewal risk score for a customer
   */
  static async calculateRenewalRisk(
    tenantId: string,
    customerEmail: string,
    renewalId?: string
  ): Promise<number> {
    const supabase = await createServerSupabase()

    // Get or create renewal tracking
    let renewal = renewalId
      ? await this.getRenewalById(renewalId)
      : await this.getRenewalByCustomer(tenantId, customerEmail)

    if (!renewal) {
      // Create renewal tracking if doesn't exist
      renewal = await this.createRenewalTracking(tenantId, customerEmail)
    }

    // Get health score
    const healthScore = await HealthScoringService.getHealthScore(tenantId, customerEmail)
    const healthScoreValue = healthScore?.health_score || 50

    // Get usage patterns
    const { data: usagePattern } = await supabase
      .from('cs_usage_patterns')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', customerEmail)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    // Get support tickets in last 30 days
    const thirtyDaysAgo = getDateInPast(TIME_DURATIONS.DEFAULT_ANALYTICS_PERIOD_DAYS)
    const { count: recentTickets } = await supabase
      .from('cs_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get CSAT scores
    const { data: recentCSAT } = await supabase
      .from('cs_survey_responses')
      .select('score')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .eq('survey_type', 'csat')
      .order('responded_at', { ascending: false })
      .limit(5)

    const avgCSAT = recentCSAT && recentCSAT.length > 0
      ? recentCSAT.reduce((sum, r) => sum + r.score, 0) / recentCSAT.length
      : null

    // Calculate risk score components
    let riskScore = 0
    const riskFactors: RenewalTracking['risk_factors'] = []

    // Health score component (inverse - lower health = higher risk)
    const healthRisk = 100 - healthScoreValue
    riskScore += healthRisk * 0.3
    if (healthRisk > 30) {
      riskFactors.push({
        factor_type: 'low_health_score',
        factor_description: `Health score is ${healthScoreValue} (low)`,
        risk_contribution: healthRisk * 0.3,
        detected_at: new Date().toISOString(),
      })
    }

    // Usage drop component
    if (usagePattern) {
      const usageDrop = usagePattern.usage_trend === 'decreasing' ? 30 : 0
      riskScore += usageDrop * 0.2
      if (usageDrop > 0) {
        riskFactors.push({
          factor_type: 'usage_drop',
          factor_description: 'Usage trend is decreasing',
          risk_contribution: usageDrop * 0.2,
          detected_at: new Date().toISOString(),
        })
      }

      // Churn risk component
      const churnRisk = usagePattern.churn_risk_score || 0
      riskScore += churnRisk * 0.3
      if (churnRisk > 50) {
        riskFactors.push({
          factor_type: 'high_churn_risk',
          factor_description: `Churn risk score is ${churnRisk} (high)`,
          risk_contribution: churnRisk * 0.3,
          detected_at: new Date().toISOString(),
        })
      }
    }

    // Support issues component
    const supportRisk = Math.min(30, (recentTickets || 0) * 5)
    riskScore += supportRisk * 0.1
    if (recentTickets && recentTickets > 3) {
      riskFactors.push({
        factor_type: 'support_issues',
        factor_description: `${recentTickets} support tickets in last 30 days`,
        risk_contribution: supportRisk * 0.1,
        detected_at: new Date().toISOString(),
      })
    }

    // CSAT component
    if (avgCSAT !== null) {
      const csatRisk = avgCSAT < 3 ? 20 : 0
      riskScore += csatRisk * 0.1
      if (csatRisk > 0) {
        riskFactors.push({
          factor_type: 'low_csat',
          factor_description: `Average CSAT score is ${avgCSAT.toFixed(1)} (low)`,
          risk_contribution: csatRisk * 0.1,
          detected_at: new Date().toISOString(),
        })
      }
    }

    // Cap risk score at 100
    riskScore = Math.min(100, Math.round(riskScore))

    // Calculate renewal probability (inverse of risk)
    const renewalProbability = Math.max(0, 100 - riskScore)

    // Update renewal tracking
    await supabase
      .from('cs_renewal_tracking')
      .update({
        renewal_risk_score: riskScore,
        renewal_probability: renewalProbability,
        risk_factors: riskFactors,
        renewal_status: riskScore > 70 ? 'at_risk' : riskScore > 40 ? 'pending' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('renewal_id', renewal.renewal_id)

    // Create risk signals for high-risk factors
    for (const factor of riskFactors) {
      if (factor.risk_contribution > 10) {
        await this.createRiskSignal(
          renewal.renewal_id,
          tenantId,
          customerEmail,
          factor.factor_type,
          factor.factor_description,
          factor.risk_contribution
        )
      }
    }

    return riskScore
  }

  /**
   * Get renewal by ID
   */
  static async getRenewalById(renewalId: string): Promise<RenewalTracking | null> {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('cs_renewal_tracking')
      .select('*')
      .eq('renewal_id', renewalId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToRenewal(data)
  }

  /**
   * Get renewal by customer
   */
  static async getRenewalByCustomer(
    tenantId: string,
    customerEmail: string
  ): Promise<RenewalTracking | null> {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('cs_renewal_tracking')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .order('renewal_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToRenewal(data)
  }

  /**
   * Create renewal tracking
   */
  static async createRenewalTracking(
    tenantId: string,
    customerEmail: string,
    subscriptionData?: {
      subscription_id?: string
      tier?: string
      start_date?: string
      end_date?: string
      renewal_date?: string
      renewal_type?: 'monthly' | 'quarterly' | 'annual' | 'custom'
    }
  ): Promise<RenewalTracking> {
    const supabase = await createServerSupabase()

    // Default to annual renewal if not provided
    const renewalDate = subscriptionData?.renewal_date
      ? new Date(subscriptionData.renewal_date)
      : getDateFromNow(TIME_DURATIONS.ANNUAL_PERIOD_DAYS)

    const { data, error } = await supabase
      .from('cs_renewal_tracking')
      .insert({
        tenant_id: tenantId,
        customer_email: customerEmail,
        current_subscription_id: subscriptionData?.subscription_id,
        subscription_tier: subscriptionData?.tier || 'standard',
        subscription_start_date: subscriptionData?.start_date || new Date().toISOString().split('T')[0],
        subscription_end_date: subscriptionData?.end_date || renewalDate.toISOString().split('T')[0],
        renewal_date: renewalDate.toISOString().split('T')[0],
        renewal_type: subscriptionData?.renewal_type || 'annual',
        renewal_status: 'pending',
        renewal_probability: 50, // Default, will be calculated
        renewal_risk_score: 50, // Default, will be calculated
      })
      .select()
      .single()

    if (error) throw error

    return this.mapToRenewal(data)
  }

  /**
   * Create risk signal
   */
  private static async createRiskSignal(
    renewalId: string,
    tenantId: string,
    customerEmail: string,
    signalType: string,
    description: string,
    riskContribution: number
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Check if signal already exists
    const { data: existing } = await supabase
      .from('cs_renewal_risk_signals')
      .select('signal_id')
      .eq('renewal_id', renewalId)
      .eq('signal_type', signalType)
      .eq('status', 'active')
      .single()

    if (existing) {
      return // Signal already exists
    }

    // Determine severity
    let severity: RenewalRiskSignal['signal_severity'] = 'low'
    if (riskContribution > 20) {
      severity = 'critical'
    } else if (riskContribution > 15) {
      severity = 'high'
    } else if (riskContribution > 10) {
      severity = 'medium'
    }

    await supabase.from('cs_renewal_risk_signals').insert({
      renewal_id: renewalId,
      tenant_id: tenantId,
      customer_email: customerEmail,
      signal_type: signalType,
      signal_severity: severity,
      signal_description: description,
      signal_value: riskContribution,
      signal_threshold: 10,
      risk_contribution: Math.round(riskContribution * 100) / 100,
      detection_method: 'automated',
      status: 'active',
    })
  }

  /**
   * Generate renewal forecast
   */
  static async generateForecast(
    tenantId: string,
    customerEmail: string,
    renewalId?: string
  ): Promise<RenewalForecast> {
    const supabase = await createServerSupabase()

    // Get renewal tracking
    const renewal = renewalId
      ? await this.getRenewalById(renewalId)
      : await this.getRenewalByCustomer(tenantId, customerEmail)

    if (!renewal) {
      throw new Error('Renewal tracking not found')
    }

    // Calculate current risk and probability
    const riskScore = await this.calculateRenewalRisk(tenantId, customerEmail, renewal.renewal_id)
    const renewalProbability = renewal.renewal_probability
    const churnProbability = 100 - renewalProbability

    // Get historical data for confidence
    const { data: historicalForecasts } = await supabase
      .from('cs_renewal_forecasts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .order('forecast_date', { ascending: false })
      .limit(10)

    // Calculate confidence based on data availability
    let confidenceScore = 60 // Base confidence
    if (historicalForecasts && historicalForecasts.length > 0) {
      confidenceScore = Math.min(100, 60 + (historicalForecasts.length * 5))
    }

    // Create forecast
    const { data: forecast, error } = await supabase
      .from('cs_renewal_forecasts')
      .insert({
        tenant_id: tenantId,
        customer_email: customerEmail,
        renewal_id: renewal.renewal_id,
        forecast_date: new Date().toISOString().split('T')[0],
        forecast_period_start: new Date().toISOString().split('T')[0],
        forecast_period_end: renewal.renewal_date,
        renewal_probability: Math.round(renewalProbability * 100) / 100,
        renewal_risk_score: Math.round(riskScore * 100) / 100,
        churn_probability: Math.round(churnProbability * 100) / 100,
        forecast_factors: {
          health_score: renewal.risk_factors.find(f => f.factor_type === 'low_health_score')?.risk_contribution || 0,
          usage_trend: renewal.risk_factors.find(f => f.factor_type === 'usage_drop')?.risk_contribution || 0,
          churn_risk: renewal.risk_factors.find(f => f.factor_type === 'high_churn_risk')?.risk_contribution || 0,
        },
        confidence_score: Math.round(confidenceScore * 100) / 100,
        model_type: 'statistical',
      })
      .select()
      .single()

    if (error) throw error

    return this.mapToForecast(forecast)
  }

  /**
   * Start retention campaign for a renewal
   */
  static async startRetentionCampaign(
    renewalId: string,
    campaignId?: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Get renewal
    const renewal = await this.getRenewalById(renewalId)
    if (!renewal) {
      throw new Error('Renewal not found')
    }

    // Get appropriate campaign
    let campaign: RetentionCampaign | null = null

    if (campaignId) {
      const { data } = await supabase
        .from('cs_retention_campaigns')
        .select('*')
        .eq('campaign_id', campaignId)
        .single()

      if (data) {
        campaign = this.mapToCampaign(data)
      }
    }

    // If no campaign specified, find matching campaign
    if (!campaign) {
      const { data: campaigns } = await supabase
        .from('cs_retention_campaigns')
        .select('*')
        .eq('is_active', true)
        .or(`tenant_id.eq.${renewal.tenant_id},is_default.eq.true`)
        .gte('target_risk_score_min', renewal.renewal_risk_score)
        .lte('target_risk_score_max', renewal.renewal_risk_score)
        .order('created_at', { ascending: false })
        .limit(1)

      if (campaigns && campaigns.length > 0) {
        campaign = this.mapToCampaign(campaigns[0])
      }
    }

    if (!campaign) {
      throw new Error('No matching retention campaign found')
    }

    // Check if campaign should start (days before renewal)
    const renewalDate = new Date(renewal.renewal_date)
    const daysUntilRenewal = Math.floor((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilRenewal > campaign.days_before_renewal) {
      // Too early, don't start yet
      return
    }

    // Check if campaign already running
    const { data: existingExecution } = await supabase
      .from('cs_retention_campaign_executions')
      .select('execution_id')
      .eq('renewal_id', renewalId)
      .eq('campaign_id', campaign.campaign_id)
      .in('status', ['pending', 'running'])
      .single()

    if (existingExecution) {
      return // Campaign already running
    }

    // Create campaign execution
    const { data: execution } = await supabase
      .from('cs_retention_campaign_executions')
      .insert({
        campaign_id: campaign.campaign_id,
        renewal_id: renewalId,
        tenant_id: renewal.tenant_id,
        customer_email: renewal.customer_email,
        status: 'pending',
        current_step_order: 0,
        steps_completed: 0,
        steps_total: campaign.campaign_steps.length,
        completion_percentage: 0,
        renewal_probability_before: renewal.renewal_probability,
      })
      .select()
      .single()

    if (!execution) {
      throw new Error('Failed to create campaign execution')
    }

    // Update renewal tracking
    await supabase
      .from('cs_renewal_tracking')
      .update({
        retention_campaign_id: campaign.campaign_id,
        retention_campaign_status: 'running',
      })
      .eq('renewal_id', renewalId)

    // Start campaign (process first step)
    await this.processCampaignStep(execution.execution_id)
  }

  /**
   * Process next step in retention campaign
   */
  static async processCampaignStep(executionId: string): Promise<void> {
    const supabase = await createServerSupabase()

    // Get execution
    const { data: execution } = await supabase
      .from('cs_retention_campaign_executions')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    if (!execution || execution.status !== 'running' && execution.status !== 'pending') {
      return
    }

    // Get campaign
    const { data: campaignData } = await supabase
      .from('cs_retention_campaigns')
      .select('*')
      .eq('campaign_id', execution.campaign_id)
      .single()

    if (!campaignData) {
      await supabase
        .from('cs_retention_campaign_executions')
        .update({ status: 'failed' })
        .eq('execution_id', executionId)
      return
    }

    const campaign = this.mapToCampaign(campaignData)

    // Update execution status
    if (execution.status === 'pending') {
      await supabase
        .from('cs_retention_campaign_executions')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('execution_id', executionId)
    }

    // Get current step
    const currentStepOrder = execution.current_step_order || 0
    const currentStep = campaign.campaign_steps.find(s => s.step_order === currentStepOrder)

    if (!currentStep) {
      // No more steps, complete campaign
      await this.completeCampaign(executionId, execution)
      return
    }

    // Execute step
    try {
      await this.executeCampaignStep(currentStep, execution)
    } catch (error) {
      console.error('Campaign step execution error:', error)
      // Continue to next step or mark as failed based on config
    }

    // Update progress
    const newStepOrder = currentStepOrder + 1
    const stepsCompleted = execution.steps_completed + 1
    const completionPercentage = Math.round((stepsCompleted / campaign.campaign_steps.length) * 100)

    await supabase
      .from('cs_retention_campaign_executions')
      .update({
        current_step_order: newStepOrder,
        steps_completed: stepsCompleted,
        completion_percentage: completionPercentage,
      })
      .eq('execution_id', executionId)

    // Schedule next step if exists
    const nextStep = campaign.campaign_steps.find(s => s.step_order === newStepOrder)
    if (nextStep) {
      const delayDays = nextStep.step_delay_days || 0
      // Next step will be processed by background job after delay
    } else {
      // No more steps, complete campaign
      await this.completeCampaign(executionId, execution)
    }
  }

  /**
   * Execute a campaign step
   */
  private static async executeCampaignStep(
    step: RetentionCampaign['campaign_steps'][0],
    execution: any
  ): Promise<void> {
    const supabase = await createServerSupabase()

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
      case 'discount':
        await this.executeDiscountStep(step, execution)
        break
      case 'task':
        await this.executeTaskStep(step, execution)
        break
    }
  }

  /**
   * Execute email step
   */
  private static async executeEmailStep(step: any, execution: any): Promise<void> {
    const { EnhancedEmailService } = await import('./enhanced-email-service')
    const supabase = await createServerSupabase()

    const templateId = step.step_config?.template_id
    let subject = step.step_config?.subject || 'Renewal Reminder'
    let htmlBody = step.step_config?.body_html || step.step_config?.body || ''
    let textBody = step.step_config?.body_text || step.step_config?.body || ''

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

    try {
      // Send email via Resend
      const emailResult = await EnhancedEmailService.sendEmail({
        to: execution.customer_email,
        subject,
        html: htmlBody,
        text: textBody,
        tags: [
          { name: 'campaign_type', value: 'retention' },
          { name: 'execution_id', value: execution.execution_id },
          { name: 'step_id', value: step.step_id },
          { name: 'renewal_id', value: execution.renewal_id },
        ],
      })

      // Email record is already created in cs_email_sends by EnhancedEmailService
      // Update it with renewal campaign metadata if needed
      if (emailResult.id) {
        await supabase
          .from('cs_email_sends')
          .update({
            metadata: {
              retention_campaign_execution_id: execution.execution_id,
              step_id: step.step_id,
              template_id: templateId,
            },
          })
          .eq('email_id', emailResult.id)
      }
    } catch (error: any) {
      console.error('Error sending retention campaign email:', error)
      // EnhancedEmailService handles error logging in cs_email_sends
      throw error
    }
  }

  /**
   * Execute SMS step
   */
  private static async executeSMSStep(step: any, execution: any): Promise<void> {
    const supabase = await createServerSupabase()

    const templateId = step.step_config?.template_id
    let body = step.step_config?.body || ''

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

    const twilioAccountSid = process.env.Twilio_Account_SID
    const twilioAuthToken = process.env.Twilio_Auth_Token
    const twilioFrom = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER

    if (twilioAccountSid && twilioAuthToken && twilioFrom) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')

      try {
        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: execution.customer_phone || '', From: twilioFrom, Body: body }),
        })

        if (res.ok) {
          await supabase.from('cs_sms_logs').insert({
            tenant_id: execution.tenant_id,
            customer_email: execution.customer_email,
            body,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              retention_campaign_execution_id: execution.execution_id,
              step_id: step.step_id,
              template_id: templateId,
            },
          })
        }
      } catch (err: any) {
        console.error('SMS retention step error:', err.message)
      }
    } else {
      await supabase.from('cs_sms_logs').insert({
        tenant_id: execution.tenant_id,
        customer_email: execution.customer_email,
        body,
        status: 'pending_sms_config',
        created_at: new Date().toISOString(),
        metadata: {
          retention_campaign_execution_id: execution.execution_id,
          step_id: step.step_id,
          template_id: templateId,
        },
      })
    }
  }

  /**
   * Execute call step
   */
  private static async executeCallStep(step: any, execution: any): Promise<void> {
    const supabase = await createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      subject: `Retention Call: ${step.step_name}`,
      description: step.step_config?.description || `Scheduled retention call as part of retention campaign.`,
      status: 'open',
      priority: step.step_config?.priority || 'high',
      channel: 'call',
      source: 'internal',
      metadata: {
        retention_campaign_execution_id: execution.execution_id,
        step_id: step.step_id,
        retention_call: true,
      },
    })
  }

  /**
   * Execute discount step
   */
  private static async executeDiscountStep(step: any, execution: any): Promise<void> {
    // Create a task for CSM to apply discount
    const supabase = await createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      subject: `Apply Retention Discount: ${step.step_config?.discount_percentage || 0}%`,
      description: `Apply discount as part of retention campaign. Discount: ${step.step_config?.discount_percentage || 0}%`,
      status: 'open',
      priority: 'high',
      channel: 'internal',
      source: 'internal',
      metadata: {
        retention_campaign_execution_id: execution.execution_id,
        step_id: step.step_id,
        discount_percentage: step.step_config?.discount_percentage,
        retention_discount: true,
      },
    })
  }

  /**
   * Execute task step
   */
  private static async executeTaskStep(step: any, execution: any): Promise<void> {
    const supabase = await createServerSupabase()

    await supabase.from('cs_tickets').insert({
      tenant_id: execution.tenant_id,
      customer_email: execution.customer_email,
      subject: `Retention Task: ${step.step_name}`,
      description: step.step_config?.description || `Task from retention campaign: ${step.step_name}`,
      status: 'open',
      priority: step.step_config?.priority || 'medium',
      channel: 'internal',
      source: 'internal',
      metadata: {
        retention_campaign_execution_id: execution.execution_id,
        step_id: step.step_id,
        retention_task: true,
      },
    })
  }

  /**
   * Complete retention campaign
   */
  private static async completeCampaign(executionId: string, execution: any): Promise<void> {
    const supabase = await createServerSupabase()

    // Get current renewal probability
    const { data: renewal } = await supabase
      .from('cs_renewal_tracking')
      .select('renewal_probability')
      .eq('renewal_id', execution.renewal_id)
      .single()

    const renewalProbabilityAfter = renewal?.renewal_probability || execution.renewal_probability_before
    const renewalProbabilityDelta = renewalProbabilityAfter - execution.renewal_probability_before

    // Determine success (probability increased)
    const campaignSuccess = renewalProbabilityDelta > 0

    await supabase
      .from('cs_retention_campaign_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        renewal_probability_after: Math.round(renewalProbabilityAfter * 100) / 100,
        renewal_probability_delta: Math.round(renewalProbabilityDelta * 100) / 100,
        campaign_success: campaignSuccess,
      })
      .eq('execution_id', executionId)
  }

  /**
   * Get renewals at risk
   */
  static async getRenewalsAtRisk(
    tenantId?: string,
    riskThreshold: number = 70,
    limit: number = 50
  ): Promise<RenewalTracking[]> {
    const supabase = await createServerSupabase()

    let query = supabase
      .from('cs_renewal_tracking')
      .select('*')
      .gte('renewal_risk_score', riskThreshold)
      .in('renewal_status', ['pending', 'at_risk'])
      .order('renewal_risk_score', { ascending: false })
      .limit(limit)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(this.mapToRenewal)
  }

  /**
   * Get renewal summary
   */
  static async getRenewalSummary(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get renewals
    let renewalsQuery = supabase
      .from('cs_renewal_tracking')
      .select('*')
      .gte('renewal_date', start.toISOString().split('T')[0])
      .lte('renewal_date', end.toISOString().split('T')[0])

    if (tenantId) {
      renewalsQuery = renewalsQuery.eq('tenant_id', tenantId)
    }

    const { data: renewals } = await renewalsQuery

    // Get campaign executions
    let executionsQuery = supabase
      .from('cs_retention_campaign_executions')
      .select('*')
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())

    if (tenantId) {
      executionsQuery = executionsQuery.eq('tenant_id', tenantId)
    }

    const { data: executions } = await executionsQuery

    const totalRenewals = renewals?.length || 0
    const atRiskRenewals = renewals?.filter(r => r.renewal_risk_score >= 70).length || 0
    const renewedCount = renewals?.filter(r => r.renewal_status === 'renewed').length || 0
    const cancelledCount = renewals?.filter(r => r.renewal_status === 'cancelled').length || 0

    const avgRenewalProbability = renewals && renewals.length > 0
      ? renewals.reduce((sum, r) => sum + r.renewal_probability, 0) / renewals.length
      : 0

    const totalRenewalValue = renewals?.filter(r => r.renewal_status === 'renewed')
      .reduce((sum, r) => sum + (r.renewal_value || 0), 0) || 0

    return {
      renewals: {
        total: totalRenewals,
        at_risk: atRiskRenewals,
        renewed: renewedCount,
        cancelled: cancelledCount,
        renewal_rate: totalRenewals > 0 ? Math.round((renewedCount / totalRenewals) * 100) : 0,
        average_probability: Math.round(avgRenewalProbability * 100) / 100,
        total_renewal_value: totalRenewalValue,
        by_status: this.groupBy(renewals || [], 'renewal_status'),
      },
      campaigns: {
        total_executions: executions?.length || 0,
        completed: executions?.filter(e => e.status === 'completed').length || 0,
        successful: executions?.filter(e => e.campaign_success === true).length || 0,
        success_rate: executions && executions.length > 0
          ? Math.round((executions.filter(e => e.campaign_success === true).length / executions.length) * 100)
          : 0,
      },
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
   * Map database row to RenewalTracking
   */
  private static mapToRenewal(row: any): RenewalTracking {
    return {
      renewal_id: row.renewal_id,
      tenant_id: row.tenant_id,
      customer_email: row.customer_email,
      subscription_tier: row.subscription_tier,
      subscription_start_date: row.subscription_start_date,
      subscription_end_date: row.subscription_end_date,
      renewal_date: row.renewal_date,
      renewal_type: row.renewal_type,
      renewal_status: row.renewal_status,
      renewal_probability: row.renewal_probability,
      renewal_risk_score: row.renewal_risk_score,
      risk_factors: row.risk_factors || [],
    }
  }

  /**
   * Map database row to RetentionCampaign
   */
  private static mapToCampaign(row: any): RetentionCampaign {
    return {
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      campaign_description: row.campaign_description,
      campaign_type: row.campaign_type,
      target_risk_score_min: row.target_risk_score_min,
      target_risk_score_max: row.target_risk_score_max,
      days_before_renewal: row.days_before_renewal,
      campaign_duration_days: row.campaign_duration_days,
      campaign_steps: row.campaign_steps || [],
      is_active: row.is_active,
      is_default: row.is_default,
    }
  }

  /**
   * Map database row to RenewalForecast
   */
  private static mapToForecast(row: any): RenewalForecast {
    return {
      forecast_id: row.forecast_id,
      tenant_id: row.tenant_id,
      customer_email: row.customer_email,
      forecast_date: row.forecast_date,
      renewal_probability: row.renewal_probability,
      renewal_risk_score: row.renewal_risk_score,
      churn_probability: row.churn_probability,
      confidence_score: row.confidence_score,
      model_version: row.model_version,
      model_type: row.model_type,
    }
  }
}
