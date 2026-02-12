/**
 * Health Scoring Service
 * 
 * Calculates customer health scores using ML signals:
 * - Engagement score (login frequency, feature usage)
 * - Usage score (active features, adoption rate)
 * - Support score (ticket volume, resolution time, CSAT)
 * - Billing score (payment history, tier usage)
 * - Product fit score (feature alignment, success metrics)
 * 
 * Generates personalized nudges and recommendations for CSMs
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'

export interface HealthScore {
  health_id: string
  tenant_id: string
  customer_email: string
  health_score: number
  health_level: 'healthy' | 'at_risk' | 'critical' | 'churned'
  engagement_score: number
  usage_score: number
  support_score: number
  billing_score: number
  product_fit_score: number
  churn_risk: number
  expansion_probability: number
  renewal_probability: number
  score_trend: 'improving' | 'stable' | 'declining' | null
  recommended_actions: Array<{
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }>
  calculated_at: string
  updated_at: string
}

export interface HealthSignal {
  signal_type: 'engagement' | 'usage' | 'support' | 'billing' | 'product_fit'
  signal_name: string
  signal_value: number
  impact: 'positive' | 'negative' | 'neutral'
  detected_at: string
}

export class HealthScoringService {
  /**
   * Calculate health score for a customer
   */
  static async calculateHealthScore(
    tenantId: string,
    customerEmail: string
  ): Promise<HealthScore> {
    const supabase = createServerSupabase()

    // Get existing health score if any
    const { data: existing } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .single()

    // Calculate component scores
    const engagementScore = await this.calculateEngagementScore(tenantId, customerEmail)
    const usageScore = await this.calculateUsageScore(tenantId, customerEmail)
    const supportScore = await this.calculateSupportScore(tenantId, customerEmail)
    const billingScore = await this.calculateBillingScore(tenantId, customerEmail)
    const productFitScore = await this.calculateProductFitScore(tenantId, customerEmail)

    // Calculate weighted overall score
    const weights = {
      engagement: 0.20,
      usage: 0.25,
      support: 0.20,
      billing: 0.15,
      product_fit: 0.20,
    }

    const overallScore = Math.round(
      engagementScore * weights.engagement +
      usageScore * weights.usage +
      supportScore * weights.support +
      billingScore * weights.billing +
      productFitScore * weights.product_fit
    )

    // Determine health level
    const healthLevel = this.determineHealthLevel(overallScore)

    // Calculate ML predictions
    const churnRisk = await this.calculateChurnRisk(tenantId, customerEmail, overallScore)
    const expansionProbability = await this.calculateExpansionProbability(tenantId, customerEmail, overallScore)
    const renewalProbability = await this.calculateRenewalProbability(tenantId, customerEmail, overallScore)

    // Determine trend
    const scoreTrend = existing
      ? this.determineTrend(existing.health_score, overallScore)
      : null

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      overallScore,
      healthLevel,
      {
        engagement: engagementScore,
        usage: usageScore,
        support: supportScore,
        billing: billingScore,
        product_fit: productFitScore,
      },
      churnRisk
    )

    // Prepare health score data
    const healthScoreData = {
      tenant_id: tenantId,
      customer_email: customerEmail,
      health_score: overallScore,
      health_level: healthLevel,
      engagement_score: engagementScore,
      usage_score: usageScore,
      support_score: supportScore,
      billing_score: billingScore,
      product_fit_score: productFitScore,
      churn_risk: churnRisk,
      expansion_probability: expansionProbability,
      renewal_probability: renewalProbability,
      score_trend: scoreTrend,
      recommended_actions: recommendedActions,
      calculation_metadata: {
        weights,
        calculated_at: new Date().toISOString(),
      },
      calculated_at: new Date().toISOString(),
    }

    // Upsert health score
    const { data: healthScore, error } = await supabase
      .from('cs_customer_health_scores')
      .upsert(healthScoreData, {
        onConflict: 'tenant_id,customer_email',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save health score: ${error.message}`)
    }

    // Save to history
    if (existing) {
      await supabase.from('cs_health_score_history').insert({
        health_id: healthScore.health_id,
        tenant_id: tenantId,
        customer_email: customerEmail,
        health_score: existing.health_score,
        health_level: existing.health_level,
        churn_risk: existing.churn_risk,
        score_components: {
          engagement: existing.engagement_score,
          usage: existing.usage_score,
          support: existing.support_score,
          billing: existing.billing_score,
          product_fit: existing.product_fit_score,
        },
        calculation_metadata: existing.calculation_metadata,
      })
    }

    // Detect and store signals
    await this.detectSignals(tenantId, customerEmail, healthScore.health_id, {
      engagement: engagementScore,
      usage: usageScore,
      support: supportScore,
      billing: billingScore,
      product_fit: productFitScore,
    })

    return healthScore as HealthScore
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static async calculateEngagementScore(
    tenantId: string,
    customerEmail: string
  ): Promise<number> {
    // TODO: Integrate with platform service to get login frequency, session duration
    // For now, use ticket/message activity as proxy
    
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    const recentTickets = tenantTickets.filter(
      (t) => t.created_at && new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    // Engagement based on recent activity
    const activityScore = Math.min(100, recentTickets.length * 10) // 10 points per ticket, max 100

    // If no recent activity, score is low
    if (recentTickets.length === 0) {
      return 20 // Low engagement
    }

    return Math.round(activityScore)
  }

  /**
   * Calculate usage score (0-100)
   */
  private static async calculateUsageScore(
    tenantId: string,
    customerEmail: string
  ): Promise<number> {
    // TODO: Integrate with platform service to get feature adoption
    // For now, use ticket volume and resolution as proxy
    
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    const resolvedTickets = tenantTickets.filter((t) => t.status === 'resolved' || t.status === 'closed')

    // Usage based on ticket resolution (customers using the product generate tickets)
    const resolutionRate = tenantTickets.length > 0 ? (resolvedTickets.length / tenantTickets.length) * 100 : 0

    return Math.round(resolutionRate)
  }

  /**
   * Calculate support score (0-100)
   */
  private static async calculateSupportScore(
    tenantId: string,
    customerEmail: string
  ): Promise<number> {
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    
    if (tenantTickets.length === 0) {
      return 100 // No tickets = good support experience
    }

    // Factors:
    // - Low ticket volume = higher score
    // - Fast resolution = higher score
    // - High CSAT = higher score (if available)

    const recentTickets = tenantTickets.filter(
      (t) => t.created_at && new Date(t.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    )

    // Volume score (fewer tickets = better)
    const volumeScore = Math.max(0, 100 - recentTickets.length * 5) // -5 points per ticket

    // Resolution score (faster = better)
    let resolutionScore = 50 // Default
    const resolvedTickets = recentTickets.filter((t) => t.resolved_at)
    if (resolvedTickets.length > 0) {
      const avgResolutionTime = resolvedTickets.reduce((sum, t) => {
        if (t.created_at && t.resolved_at) {
          const created = new Date(t.created_at)
          const resolved = new Date(t.resolved_at)
          return sum + (resolved.getTime() - created.getTime())
        }
        return sum
      }, 0) / resolvedTickets.length

      // Score based on resolution time (24 hours = 100, 7 days = 0)
      const hoursToResolve = avgResolutionTime / (1000 * 60 * 60)
      resolutionScore = Math.max(0, Math.min(100, 100 - (hoursToResolve / 24) * 100))
    }

    // Combined score
    return Math.round((volumeScore * 0.6 + resolutionScore * 0.4))
  }

  /**
   * Calculate billing score (0-100)
   */
  private static async calculateBillingScore(
    tenantId: string,
    customerEmail: string
  ): Promise<number> {
    // TODO: Integrate with billing service to get payment history
    // For now, default to neutral score
    
    // Factors:
    // - On-time payments = higher score
    // - No payment issues = higher score
    // - Appropriate tier usage = higher score

    return 75 // Default neutral score (will be improved with billing integration)
  }

  /**
   * Calculate product fit score (0-100)
   */
  private static async calculateProductFitScore(
    tenantId: string,
    customerEmail: string
  ): Promise<number> {
    // TODO: Integrate with platform service to get feature usage
    // For now, use ticket patterns as proxy
    
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    
    // Product fit based on:
    // - Feature-related tickets (questions = engagement, bugs = issues)
    // - Service stage alignment

    // If customer has tickets but they're resolved, that's good (using the product)
    const resolvedTickets = tenantTickets.filter((t) => t.status === 'resolved' || t.status === 'closed')
    const fitScore = tenantTickets.length > 0 ? (resolvedTickets.length / tenantTickets.length) * 100 : 50

    return Math.round(fitScore)
  }

  /**
   * Calculate churn risk (0-100)
   */
  private static async calculateChurnRisk(
    tenantId: string,
    customerEmail: string,
    healthScore: number
  ): Promise<number> {
    // Churn risk factors:
    // - Low health score = high risk
    // - Declining trend = high risk
    // - Support issues = high risk
    // - Low engagement = high risk

    let risk = 100 - healthScore // Base risk from health score

    // Adjust based on support issues
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    const openTickets = tenantTickets.filter((t) => t.status === 'open' || t.status === 'in_progress')
    if (openTickets.length > 3) {
      risk += 10 // +10% risk for multiple open tickets
    }

    // Adjust based on engagement
    const recentTickets = tenantTickets.filter(
      (t) => t.created_at && new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    if (recentTickets.length === 0) {
      risk += 15 // +15% risk for no recent activity
    }

    return Math.min(100, Math.max(0, Math.round(risk)))
  }

  /**
   * Calculate expansion probability (0-100)
   */
  private static async calculateExpansionProbability(
    tenantId: string,
    customerEmail: string,
    healthScore: number
  ): Promise<number> {
    // Expansion probability factors:
    // - High health score = high probability
    // - High usage = high probability
    // - Feature requests = high probability

    let probability = healthScore * 0.7 // Base from health score

    // Adjust based on usage
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    const recentTickets = tenantTickets.filter(
      (t) => t.created_at && new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    if (recentTickets.length > 5) {
      probability += 10 // High usage = expansion potential
    }

    return Math.min(100, Math.max(0, Math.round(probability)))
  }

  /**
   * Calculate renewal probability (0-100)
   */
  private static async calculateRenewalProbability(
    tenantId: string,
    customerEmail: string,
    healthScore: number
  ): Promise<number> {
    // Renewal probability factors:
    // - High health score = high probability
    // - Stable/improving trend = high probability
    // - Good support experience = high probability

    let probability = healthScore * 0.8 // Base from health score

    // Adjust based on support
    const tickets = await TicketRepository.findByCustomerEmail(customerEmail)
    const tenantTickets = tickets.filter(t => !tenantId || t.tenant_id === tenantId)
    const resolvedTickets = tenantTickets.filter((t) => t.status === 'resolved' || t.status === 'closed')
    if (tenantTickets.length > 0 && resolvedTickets.length / tenantTickets.length > 0.8) {
      probability += 10 // Good resolution rate = higher renewal
    }

    return Math.min(100, Math.max(0, Math.round(probability)))
  }

  /**
   * Determine health level from score
   */
  private static determineHealthLevel(score: number): 'healthy' | 'at_risk' | 'critical' | 'churned' {
    if (score >= 70) return 'healthy'
    if (score >= 50) return 'at_risk'
    if (score >= 30) return 'critical'
    return 'churned'
  }

  /**
   * Determine trend from previous score
   */
  private static determineTrend(
    previousScore: number,
    currentScore: number
  ): 'improving' | 'stable' | 'declining' {
    const diff = currentScore - previousScore
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  /**
   * Generate recommended actions based on health score
   */
  private static generateRecommendedActions(
    healthScore: number,
    healthLevel: string,
    componentScores: {
      engagement: number
      usage: number
      support: number
      billing: number
      product_fit: number
    },
    churnRisk: number
  ): Array<{
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }> {
    const actions: Array<{
      type: string
      title: string
      message: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
    }> = []

    // High churn risk actions
    if (churnRisk > 70) {
      actions.push({
        type: 'check_in',
        title: 'Urgent: High Churn Risk',
        message: `Customer has ${churnRisk}% churn risk. Schedule immediate check-in call.`,
        priority: 'urgent',
      })
    }

    // Low engagement actions
    if (componentScores.engagement < 50) {
      actions.push({
        type: 'engagement',
        title: 'Low Engagement Detected',
        message: 'Customer engagement is low. Consider feature training or check-in.',
        priority: componentScores.engagement < 30 ? 'high' : 'medium',
      })
    }

    // Low usage actions
    if (componentScores.usage < 50) {
      actions.push({
        type: 'feature_training',
        title: 'Low Feature Usage',
        message: 'Customer is not using key features. Offer training session.',
        priority: componentScores.usage < 30 ? 'high' : 'medium',
      })
    }

    // Support issues
    if (componentScores.support < 50) {
      actions.push({
        type: 'support_review',
        title: 'Support Issues Detected',
        message: 'Customer has support concerns. Review open tickets and follow up.',
        priority: componentScores.support < 30 ? 'high' : 'medium',
      })
    }

    // Billing concerns
    if (componentScores.billing < 50) {
      actions.push({
        type: 'billing_review',
        title: 'Billing Concerns',
        message: 'Review billing status and consider discount or tier adjustment.',
        priority: 'medium',
      })
    }

    // Expansion opportunities
    if (healthScore > 70 && componentScores.usage > 70) {
      actions.push({
        type: 'upsell',
        title: 'Expansion Opportunity',
        message: 'Customer is highly engaged. Consider upsell to higher tier.',
        priority: 'low',
      })
    }

    return actions
  }

  /**
   * Detect and store health signals
   */
  private static async detectSignals(
    tenantId: string,
    customerEmail: string,
    healthId: string,
    componentScores: {
      engagement: number
      usage: number
      support: number
      billing: number
      product_fit: number
    }
  ): Promise<void> {
    const supabase = createServerSupabase()
    const signals = []

    // Engagement signals
    if (componentScores.engagement < 40) {
      signals.push({
        health_id: healthId,
        tenant_id: tenantId,
        customer_email: customerEmail,
        signal_type: 'engagement',
        signal_name: 'low_engagement',
        signal_value: componentScores.engagement,
        impact: 'negative',
      })
    }

    // Usage signals
    if (componentScores.usage < 40) {
      signals.push({
        health_id: healthId,
        tenant_id: tenantId,
        customer_email: customerEmail,
        signal_type: 'usage',
        signal_name: 'low_usage',
        signal_value: componentScores.usage,
        impact: 'negative',
      })
    }

    // Support signals
    if (componentScores.support < 40) {
      signals.push({
        health_id: healthId,
        tenant_id: tenantId,
        customer_email: customerEmail,
        signal_type: 'support',
        signal_name: 'support_issues',
        signal_value: componentScores.support,
        impact: 'negative',
      })
    }

    // Positive signals
    if (componentScores.engagement > 80) {
      signals.push({
        health_id: healthId,
        tenant_id: tenantId,
        customer_email: customerEmail,
        signal_type: 'engagement',
        signal_name: 'high_engagement',
        signal_value: componentScores.engagement,
        impact: 'positive',
      })
    }

    if (signals.length > 0) {
      await supabase.from('cs_health_signals').insert(signals)
    }
  }

  /**
   * Get health score for a customer
   */
  static async getHealthScore(
    tenantId: string,
    customerEmail: string
  ): Promise<HealthScore | null> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .single()

    if (error || !data) {
      return null
    }

    return data as HealthScore
  }

  /**
   * Get health score history
   */
  static async getHealthScoreHistory(
    tenantId: string,
    customerEmail: string,
    limit: number = 30
  ): Promise<any[]> {
    const supabase = createServerSupabase()

    const { data } = await supabase
      .from('cs_health_score_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .order('calculated_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  /**
   * Get recent health signals
   */
  static async getRecentSignals(
    tenantId: string,
    customerEmail: string,
    limit: number = 20
  ): Promise<HealthSignal[]> {
    const supabase = createServerSupabase()

    const { data } = await supabase
      .from('cs_health_signals')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .order('detected_at', { ascending: false })
      .limit(limit)

    return (data || []) as HealthSignal[]
  }
}
