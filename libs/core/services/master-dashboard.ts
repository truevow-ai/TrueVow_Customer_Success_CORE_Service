/**
 * Master Dashboard Service
 * 
 * Unified dashboard aggregating data from all CS Support modules:
 * - Support Analytics (tickets, response times, CSAT)
 * - Health Scoring (customer health, churn risk)
 * - Usage Analytics (feature adoption, usage patterns)
 * - Renewal Orchestration (renewal tracking, risk scores)
 * - CSAT/NPS Surveys (survey metrics, feedback)
 * - Trend Analysis (pain points, product feedback)
 * - Success Playbooks (playbook execution stats)
 * - Expansion Triggers (expansion opportunities)
 * 
 * Provides AI-powered insights and recommendations for CSMs
 */

import { TIME_DURATIONS, getDateInPast, getUpcomingRenewalsWindowEnd, getDefaultAnalyticsPeriodStart } from '@/lib/config/app-config'

import { createServerSupabase } from '@/lib/db/supabase'
import { AnalyticsService } from './analytics'
import { HealthScoringService } from './health-scoring'
import { UsageAnalyticsService } from './usage-analytics'
import { DashboardMetrics } from './analytics'
import { RenewalOrchestrationService } from './renewal-orchestration'
import { CSATNPSSurveyService } from './csat-nps-survey'
import { TrendAnalysisService } from './trend-analysis'
import { SuccessPlaybooksService } from './success-playbooks'
import { ExpansionTriggersService } from './expansion-triggers'

export interface MasterDashboardData {
  // Summary Metrics
  summary: {
    total_customers: number
    healthy_customers: number
    at_risk_customers: number
    critical_customers: number
    total_tickets: number
    open_tickets: number
    average_response_time: number
    average_resolution_time: number
    average_csat: number
    average_nps: number
    renewal_rate: number
    churn_rate: number
    expansion_rate: number
    response_rate: number
  }

  // Support Analytics
  support: {
    ticket_volume: any
    response_time: any
    resolution_time: any
    csat: any
    agent_performance: any
  }

  // Health Scoring
  health: {
    overall_health_distribution: {
      healthy: number
      at_risk: number
      critical: number
      churned: number
    }
    average_health_score: number
    top_at_risk_customers: Array<{
      customer_email: string
      health_score: number
      churn_risk: number
      recommended_actions: any[]
    }>
    health_trend: 'improving' | 'stable' | 'declining'
  }

  // Usage Analytics
  usage: {
    feature_adoption: any[]
    total_active_users: number
    active_users_7d: number
    active_users_30d: number
    churn_risk_distribution: {
      low: number
      medium: number
      high: number
      critical: number
    }
    top_features: Array<{
      feature_name: string
      adoption_rate: number
      active_users: number
    }>
  }

  // Renewal Orchestration
  renewals: {
    total_renewals: number
    at_risk_renewals: number
    renewed_count: number
    cancelled_count: number
    renewal_rate: number
    average_renewal_probability: number
    upcoming_renewals: Array<{
      customer_email: string
      renewal_date: string
      renewal_probability: number
      renewal_risk_score: number
    }>
    retention_campaigns: {
      active: number
      completed: number
      success_rate: number
    }
  }

  // CSAT/NPS Surveys
  surveys: {
    total_responses: number
    average_csat: number
    average_nps: number
    csat_distribution: Record<string, number>
    nps_distribution: {
      promoters: number
      passives: number
      detractors: number
    }
    response_rate: number
    recent_feedback: Array<{
      customer_email: string
      score: number
      feedback: string
      survey_type: string
      responded_at: string
    }>
  }

  // Trend Analysis
  trends: {
    total_trends: number
    active_trends: number
    top_trends: Array<{
      trend_name: string
      trend_type: string
      occurrence_count: number
      severity: string
    }>
    pain_points: {
      total: number
      active: number
      top_pain_points: Array<{
        pain_point: string
        occurrence_count: number
        affected_customers: number
      }>
    }
    product_feedback: {
      total: number
      top_feedback: Array<{
        feedback_text: string
        feedback_type: string
        upvotes: number
      }>
    }
  }

  // Success Playbooks
  playbooks: {
    total_playbooks: number
    active_executions: number
    completed_executions: number
    success_rate: number
    top_playbooks: Array<{
      playbook_name: string
      execution_count: number
      success_rate: number
    }>
  }

  // Expansion Triggers
  expansion: {
    total_opportunities: number
    high_value_opportunities: number
    detected_spikes: number
    expansion_value_potential: number
    top_opportunities: Array<{
      customer_email: string
      opportunity_type: string
      estimated_value: number
      confidence_score: number
    }>
  }

  // AI Insights
  ai_insights: Array<{
    type: 'warning' | 'opportunity' | 'recommendation' | 'trend'
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    action_items: string[]
    related_metrics: string[]
  }>
}

export class MasterDashboardService {
  /**
   * Get comprehensive master dashboard data
   */
  static async getMasterDashboard(
    tenantId: string,
    timeRange?: { from: string; to: string }
  ): Promise<MasterDashboardData> {
    const defaultTimeRange = {
      from: getDefaultAnalyticsPeriodStart().toISOString(),
      to: new Date().toISOString(),
    }

    const range = timeRange || defaultTimeRange

    // Fetch all data in parallel
    const [
      supportMetrics,
      healthData,
      usageData,
      renewalData,
      surveyData,
      trendData,
      playbookData,
      expansionData,
    ] = await Promise.all([
      this.getSupportMetrics(tenantId, range),
      this.getHealthData(tenantId),
      this.getUsageData(tenantId),
      this.getRenewalData(tenantId, range),
      this.getSurveyData(tenantId, range),
      this.getTrendData(tenantId, range),
      this.getPlaybookData(tenantId, range),
      this.getExpansionData(tenantId),
    ])

    // Calculate summary metrics
    const summary = this.calculateSummary(
      healthData,
      supportMetrics,
      surveyData,
      renewalData,
      expansionData
    )

    // Generate AI insights
    const aiInsights = await this.generateAIInsights(
      tenantId,
      healthData,
      renewalData,
      trendData,
      expansionData
    )

    return {
      summary,
      support: supportMetrics as any,
      health: healthData,
      usage: usageData,
      renewals: renewalData,
      surveys: surveyData,
      trends: trendData,
      playbooks: playbookData,
      expansion: expansionData,
      ai_insights: aiInsights,
    }
  }

  /**
   * Get support analytics metrics
   */
  private static async getSupportMetrics(tenantId: string, timeRange: { from: string; to: string }): Promise<any> {
    return await AnalyticsService.getDashboardMetrics(tenantId, timeRange) as DashboardMetrics;
  }

  /**
   * Get health scoring data
   */
  private static async getHealthData(tenantId: string) {
    const supabase = await createServerSupabase()

    // Get all health scores
    const { data: healthScores } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)

    if (!healthScores || healthScores.length === 0) {
      return {
        overall_health_distribution: {
          healthy: 0,
          at_risk: 0,
          critical: 0,
          churned: 0,
        },
        average_health_score: 0,
        top_at_risk_customers: [],
        health_trend: 'stable' as const,
      }
    }

    // Calculate distribution
    const distribution = {
      healthy: healthScores.filter((h: any) => h.health_level === 'healthy').length,
      at_risk: healthScores.filter((h: any) => h.health_level === 'at_risk').length,
      critical: healthScores.filter((h: any) => h.health_level === 'critical').length,
      churned: healthScores.filter((h: any) => h.health_level === 'churned').length,
    }

    // Calculate average
    const averageHealthScore =
      healthScores.reduce((sum: number, h: any) => sum + (h.health_score || 0), 0) /
      healthScores.length

    // Get top at-risk customers
    const atRiskCustomers = healthScores
      .filter((h: any) => h.health_level === 'at_risk' || h.health_level === 'critical')
      .sort((a: any, b: any) => (b.churn_risk || 0) - (a.churn_risk || 0))
      .slice(0, 10)
      .map((h: any) => ({
        customer_email: h.customer_email,
        health_score: h.health_score,
        churn_risk: h.churn_risk,
        recommended_actions: h.recommended_actions || [],
      }))

    // Determine trend (simplified - compare current vs previous period)
    const healthTrend = this.calculateHealthTrend(healthScores)

    return {
      overall_health_distribution: distribution,
      average_health_score: Math.round(averageHealthScore * 100) / 100,
      top_at_risk_customers: atRiskCustomers,
      health_trend: healthTrend,
    }
  }

  /**
   * Get usage analytics data
   */
  private static async getUsageData(tenantId: string) {
    const supabase = await createServerSupabase()

    // Get feature adoption metrics
    const { data: featureAdoption } = await supabase
      .from('cs_feature_adoption_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('adoption_rate', { ascending: false })
      .limit(20)

    // Get usage patterns
    const { data: usagePatterns } = await supabase
      .from('cs_usage_patterns')
      .select('*')
      .eq('tenant_id', tenantId)

    // Calculate active users
    const activeUsers7d = new Set(
      usagePatterns
        ?.filter((p: any) => p.login_frequency_7d > 0)
        .map((p: any) => p.user_id) || []
    ).size

    const activeUsers30d = new Set(
      usagePatterns?.filter((p: any) => p.login_frequency_30d > 0).map((p: any) => p.user_id) ||
        []
    ).size

    // Calculate churn risk distribution
    const churnRiskDistribution = {
      low: usagePatterns?.filter((p: any) => p.churn_risk_level === 'low').length || 0,
      medium: usagePatterns?.filter((p: any) => p.churn_risk_level === 'medium').length || 0,
      high: usagePatterns?.filter((p: any) => p.churn_risk_level === 'high').length || 0,
      critical: usagePatterns?.filter((p: any) => p.churn_risk_level === 'critical').length || 0,
    }

    // Get top features
    const topFeatures = (featureAdoption || [])
      .slice(0, 10)
      .map((f: any) => ({
        feature_name: f.feature_name,
        adoption_rate: f.adoption_rate,
        active_users: f.active_users_30d,
      }))

    return {
      feature_adoption: featureAdoption || [],
      total_active_users: activeUsers30d,
      active_users_7d: activeUsers7d,
      active_users_30d: activeUsers30d,
      churn_risk_distribution: churnRiskDistribution,
      top_features: topFeatures,
    }
  }

  /**
   * Get renewal orchestration data
   */
  private static async getRenewalData(
    tenantId: string,
    timeRange: { from: string; to: string }
  ) {
    const periodStart = new Date(timeRange.from)
    const periodEnd = new Date(timeRange.to)

    const summary = await RenewalOrchestrationService.getRenewalSummary(
      tenantId,
      periodStart,
      periodEnd
    )

    // Get upcoming renewals (next 90 days)
    const upcomingDate = getUpcomingRenewalsWindowEnd()
    const supabaseRenewals = await createServerSupabase()
    const { data: upcomingRenewals } = await supabaseRenewals
      .from('cs_renewal_tracking')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('renewal_status', ['pending', 'at_risk'])
      .gte('renewal_date', new Date().toISOString().split('T')[0])
      .lte('renewal_date', upcomingDate.toISOString().split('T')[0])
      .order('renewal_date', { ascending: true })
      .limit(20)

    const upcoming = (upcomingRenewals || []).map((r: any) => ({
      customer_email: r.customer_email,
      renewal_date: r.renewal_date,
      renewal_probability: r.renewal_probability,
      renewal_risk_score: r.renewal_risk_score,
    }))

    // Get retention campaign stats
    const supabaseCampaigns = await createServerSupabase()
    const { data: campaigns } = await supabaseCampaigns
      .from('cs_retention_campaign_executions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('started_at', timeRange.from)
      .lte('started_at', timeRange.to)

    const activeCampaigns = campaigns?.filter((c: any) => c.status === 'running').length || 0
    const completedCampaigns = campaigns?.filter((c: any) => c.status === 'completed').length || 0
    const successfulCampaigns =
      campaigns?.filter((c: any) => c.campaign_success === true).length || 0
    const successRate =
      completedCampaigns > 0 ? Math.round((successfulCampaigns / completedCampaigns) * 100) : 0

    return {
      total_renewals: summary.renewals.total,
      at_risk_renewals: summary.renewals.at_risk,
      renewed_count: summary.renewals.renewed,
      cancelled_count: summary.renewals.cancelled,
      renewal_rate: summary.renewals.renewal_rate,
      average_renewal_probability: summary.renewals.average_probability,
      upcoming_renewals: upcoming,
      retention_campaigns: {
        active: activeCampaigns,
        completed: completedCampaigns,
        success_rate: successRate,
      },
    }
  }

  /**
   * Get CSAT/NPS survey data
   */
  private static async getSurveyData(tenantId: string, timeRange: { from: string; to: string }) {
    const supabase = await createServerSupabase()

    // Get all survey responses
    const { data: responses } = await supabase
      .from('cs_survey_responses')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('responded_at', timeRange.from)
      .lte('responded_at', timeRange.to)

    if (!responses || responses.length === 0) {
      return {
        total_responses: 0,
        average_csat: 0,
        average_nps: 0,
        csat_distribution: {},
        nps_distribution: {
          promoters: 0,
          passives: 0,
          detractors: 0,
        },
        response_rate: 0,
        recent_feedback: [],
      }
    }

    // Calculate CSAT
    const csatResponses = responses.filter((r: any) => r.survey_type === 'csat')
    const averageCSAT =
      csatResponses.length > 0
        ? csatResponses.reduce((sum: number, r: any) => sum + r.score, 0) / csatResponses.length
        : 0

    // Calculate NPS
    const npsResponses = responses.filter((r: any) => r.survey_type === 'nps')
    const averageNPS =
      npsResponses.length > 0
        ? npsResponses.reduce((sum: number, r: any) => sum + r.score, 0) / npsResponses.length
        : 0

    // CSAT distribution
    const csatDistribution: Record<string, number> = {}
    for (const response of csatResponses) {
      const score = response.score.toString()
      csatDistribution[score] = (csatDistribution[score] || 0) + 1
    }

    // NPS distribution
    const promoters = npsResponses.filter((r: any) => r.score >= 9).length
    const passives = npsResponses.filter((r: any) => r.score >= 7 && r.score <= 8).length
    const detractors = npsResponses.filter((r: any) => r.score <= 6).length

    // Get recent feedback
    const recentFeedback = responses
      .filter((r: any) => r.feedback_text)
      .sort((a: any, b: any) => new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime())
      .slice(0, 10)
      .map((r: any) => ({
        customer_email: r.customer_email,
        score: r.score,
        feedback: r.feedback_text,
        survey_type: r.survey_type,
        responded_at: r.responded_at,
      }))

    // Calculate total surveys sent across both csat and nps tables for response rate
    const { count: csatSent } = await supabase
      .from('cs_survey_csat')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('auto_sent', true)
      .not('sent_at', 'is', null)
      .gte('sent_at', timeRange.from)
      .lte('sent_at', timeRange.to)

    const { count: npsSent } = await supabase
      .from('cs_survey_nps')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('auto_sent', true)
      .not('sent_at', 'is', null)
      .gte('sent_at', timeRange.from)
      .lte('sent_at', timeRange.to)

    const totalSurveysSent = (csatSent || 0) + (npsSent || 0)
    const responseRate = totalSurveysSent > 0
      ? Math.round((responses.length / totalSurveysSent) * 10000) / 100
      : 0

    return {
      total_responses: responses.length,
      total_surveys_sent: totalSurveysSent,
      average_csat: Math.round(averageCSAT * 100) / 100,
      average_nps: Math.round(averageNPS * 100) / 100,
      csat_distribution: csatDistribution,
      nps_distribution: {
        promoters,
        passives,
        detractors,
      },
      response_rate: responseRate,
      recent_feedback: recentFeedback,
    }
  }

  /**
   * Get trend analysis data
   */
  private static async getTrendData(tenantId: string, timeRange: { from: string; to: string }) {
    const periodStart = new Date(timeRange.from)
    const periodEnd = new Date(timeRange.to)

    const trendSummary = await TrendAnalysisService.getTrendSummary(
      tenantId,
      periodStart,
      periodEnd
    )

    return {
      total_trends: trendSummary.trends.total,
      active_trends: trendSummary.trends.total,
      top_trends: (trendSummary.trends.top_trends || []).slice(0, 10).map((t: any) => ({
        trend_name: t.trend_name || t.trend_key,
        trend_type: t.trend_type,
        occurrence_count: t.occurrence_count,
        severity: t.severity,
      })),
      pain_points: {
        total: trendSummary.pain_points.total,
        active: trendSummary.pain_points.active,
        top_pain_points: (trendSummary.pain_points.top_pain_points || []).slice(0, 10).map((p: any) => ({
          pain_point: p.pain_point,
          occurrence_count: p.occurrence_count,
          affected_customers: p.affected_customers || 0,
        })),
      },
      product_feedback: {
        total: trendSummary.feedback.total,
        top_feedback: (trendSummary.feedback.top_feedback || []).slice(0, 10).map((f: any) => ({
          feedback_text: f.feedback_text,
          feedback_type: f.feedback_type,
          upvotes: f.upvotes || 0,
        })),
      },
    }
  }

  /**
   * Get success playbook data
   */
  private static async getPlaybookData(tenantId: string, timeRange: { from: string; to: string }) {
    const supabase = await createServerSupabase()

    // Get playbooks
    const { data: playbooks } = await supabase
      .from('cs_success_playbooks')
      .select('*')
      .or(`tenant_id.eq.${tenantId},is_default.eq.true`)

    // Get executions
    const { data: executions } = await supabase
      .from('cs_playbook_executions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('started_at', timeRange.from)
      .lte('started_at', timeRange.to)

    const activeExecutions = executions?.filter((e: any) => e.status === 'running').length || 0
    const completedExecutions = executions?.filter((e: any) => e.status === 'completed').length || 0
    const successfulExecutions =
      executions?.filter((e: any) => e.execution_success === true).length || 0
    const successRate =
      completedExecutions > 0 ? Math.round((successfulExecutions / completedExecutions) * 100) : 0

    // Get top playbooks by execution count
    const playbookStats: Record<string, { count: number; success: number }> = {}
    for (const execution of executions || []) {
      const playbookId = execution.playbook_id
      if (!playbookStats[playbookId]) {
        playbookStats[playbookId] = { count: 0, success: 0 }
      }
      playbookStats[playbookId].count++
      if (execution.execution_success) {
        playbookStats[playbookId].success++
      }
    }

    const topPlaybooks = Object.entries(playbookStats)
      .map(([playbookId, stats]) => {
        const playbook = playbooks?.find((p: any) => p.playbook_id === playbookId)
        return {
          playbook_name: playbook?.playbook_name || 'Unknown',
          execution_count: stats.count,
          success_rate: stats.count > 0 ? Math.round((stats.success / stats.count) * 100) : 0,
        }
      })
      .sort((a, b) => b.execution_count - a.execution_count)
      .slice(0, 10)

    return {
      total_playbooks: playbooks?.length || 0,
      active_executions: activeExecutions,
      completed_executions: completedExecutions,
      success_rate: successRate,
      top_playbooks: topPlaybooks,
    }
  }

  /**
   * Get expansion trigger data
   */
  private static async getExpansionData(tenantId: string) {
    const supabase = await createServerSupabase()

    // Get expansion opportunities
    const { data: opportunities } = await supabase
      .from('cs_expansion_opportunities')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'in_progress'])

    const highValueOpportunities =
      opportunities?.filter((o: any) => (o.estimated_value || 0) > 1000).length || 0

    // Get usage spikes
    const { data: spikes } = await supabase
      .from('cs_usage_spike_detections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')

    // Calculate total expansion value potential
    const expansionValuePotential =
      opportunities?.reduce((sum: number, o: any) => sum + (o.estimated_value || 0), 0) || 0

    // Get top opportunities
    const topOpportunities = (opportunities || [])
      .sort((a: any, b: any) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 10)
      .map((o: any) => ({
        customer_email: o.customer_email,
        opportunity_type: o.opportunity_type,
        estimated_value: o.estimated_value || 0,
        confidence_score: o.confidence_score || 0,
      }))

    return {
      total_opportunities: opportunities?.length || 0,
      high_value_opportunities: highValueOpportunities,
      detected_spikes: spikes?.length || 0,
      expansion_value_potential: expansionValuePotential,
      top_opportunities: topOpportunities,
    }
  }

  /**
   * Calculate summary metrics
   */
  private static calculateSummary(
    healthData: any,
    supportMetrics: any,
    surveyData: any,
    renewalData: any,
    expansionData: any
  ) {
    const totalCustomers =
      healthData.overall_health_distribution.healthy +
      healthData.overall_health_distribution.at_risk +
      healthData.overall_health_distribution.critical

    const churnedCount = healthData.overall_health_distribution.churned || 0
    const totalWithChurned = totalCustomers + churnedCount
    const churnRate = totalWithChurned > 0
      ? Math.round((churnedCount / totalWithChurned) * 10000) / 100
      : 0

    const totalOpportunities = expansionData.total_opportunities || 0
    const convertedOpportunities = expansionData.converted_opportunities || 0
    const expansionRate = totalOpportunities > 0
      ? Math.round((convertedOpportunities / totalOpportunities) * 10000) / 100
      : totalCustomers > 0 && convertedOpportunities > 0
        ? Math.round((convertedOpportunities / totalCustomers) * 10000) / 100
        : 0

    const surveysSent = surveyData.total_surveys_sent || surveyData.surveys_sent || 0
    const surveysResponded = surveyData.total_responses || 0
    const responseRate = surveysSent > 0
      ? Math.round((surveysResponded / surveysSent) * 10000) / 100
      : 0

    return {
      total_customers: totalCustomers,
      healthy_customers: healthData.overall_health_distribution.healthy,
      at_risk_customers: healthData.overall_health_distribution.at_risk,
      critical_customers: healthData.overall_health_distribution.critical,
      total_tickets: supportMetrics.summary?.totalTickets || 0,
      open_tickets: supportMetrics.summary?.openTickets || 0,
      average_response_time: supportMetrics.summary?.averageResponseTime || 0,
      average_resolution_time: supportMetrics.summary?.averageResolutionTime || 0,
      average_csat: surveyData.average_csat || 0,
      average_nps: surveyData.average_nps || 0,
      renewal_rate: renewalData.renewal_rate || 0,
      churn_rate: churnRate,
      expansion_rate: expansionRate,
      response_rate: responseRate,
    }
  }

  /**
   * Calculate health trend
   */
  private static calculateHealthTrend(healthScores: any[]): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation
    // In production, would compare current period vs previous period
    const avgScore =
      healthScores.reduce((sum, h) => sum + (h.health_score || 0), 0) / healthScores.length

    if (avgScore >= 70) return 'improving'
    if (avgScore >= 50) return 'stable'
    return 'declining'
  }

  /**
   * Generate AI-powered insights
   */
  private static async generateAIInsights(
    tenantId: string,
    healthData: any,
    renewalData: any,
    trendData: any,
    expansionData: any
  ): Promise<MasterDashboardData['ai_insights']> {
    const insights: MasterDashboardData['ai_insights'] = []

    // Health insights
    if (healthData.overall_health_distribution.critical > 0) {
      insights.push({
        type: 'warning',
        title: 'Critical Customers Detected',
        description: `${healthData.overall_health_distribution.critical} customers are in critical health status and require immediate attention.`,
        priority: 'urgent',
        action_items: [
          'Review critical customer health scores',
          'Initiate retention campaigns for at-risk customers',
          'Schedule success calls with critical customers',
        ],
        related_metrics: ['health_score', 'churn_risk'],
      })
    }

    // Renewal insights
    if (renewalData.at_risk_renewals > 0) {
      insights.push({
        type: 'warning',
        title: 'Renewals at Risk',
        description: `${renewalData.at_risk_renewals} renewals are at high risk. Consider starting retention campaigns.`,
        priority: 'high',
        action_items: [
          'Review at-risk renewals',
          'Start retention campaigns for high-risk renewals',
          'Schedule renewal calls',
        ],
        related_metrics: ['renewal_risk_score', 'renewal_probability'],
      })
    }

    // Expansion insights
    if (expansionData.high_value_opportunities > 0) {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Expansion Opportunities',
        description: `${expansionData.high_value_opportunities} high-value expansion opportunities detected. Total potential value: $${expansionData.expansion_value_potential.toLocaleString()}.`,
        priority: 'medium',
        action_items: [
          'Review expansion opportunities',
          'Prioritize high-value opportunities',
          'Initiate upsell workflows',
        ],
        related_metrics: ['expansion_opportunities', 'usage_spikes'],
      })
    }

    // Trend insights
    if (trendData.pain_points.active > 0) {
      insights.push({
        type: 'trend',
        title: 'Active Pain Points Identified',
        description: `${trendData.pain_points.active} active pain points affecting customers. Address these to improve satisfaction.`,
        priority: 'high',
        action_items: [
          'Review top pain points',
          'Create action plans for each pain point',
          'Track resolution progress',
        ],
        related_metrics: ['pain_points', 'csat', 'nps'],
      })
    }

    // CSAT insights
    if (healthData.average_health_score < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Average Health Score',
        description: `Average customer health score is ${healthData.average_health_score.toFixed(1)}. This indicates potential churn risk.`,
        priority: 'high',
        action_items: [
          'Review customer health scores',
          'Identify common issues affecting health',
          'Implement health improvement initiatives',
        ],
        related_metrics: ['health_score', 'churn_risk', 'usage_score'],
      })
    }

    return insights
  }
}
