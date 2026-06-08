/**
 * Trend Analysis Service
 * 
 * Analyzes common pain points, product feedback aggregation, and trend detection:
 * - Pain point identification and tracking
 * - Product feedback aggregation
 * - Trend pattern detection (seasonal, cyclical, correlations)
 * - Sentiment analysis aggregation
 * - Impact analysis (churn, CSAT, NPS)
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'
import { TIME_DURATIONS, DEFAULT_LIMITS, getDateInPast, getDefaultAnalyticsPeriodStart } from '@/lib/config/app-config'

export interface TrendAnalysis {
  trend_id: string
  trend_type: 'pain_point' | 'feature_request' | 'bug_report' | 'usage_pattern' | 'sentiment'
  trend_category: string
  trend_keyword: string
  occurrence_count: number
  affected_customers_count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  trend_direction: 'increasing' | 'stable' | 'decreasing' | 'new'
  trend_velocity: number
  impact_score: number
  churn_risk_contribution: number
  status: 'active' | 'resolved' | 'monitoring' | 'escalated'
}

export interface ProductFeedback {
  feedback_id: string
  feedback_type: 'feature_request' | 'bug_report' | 'improvement' | 'complaint' | 'praise' | 'question'
  feedback_category: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'reviewed' | 'in_progress' | 'planned' | 'completed' | 'rejected' | 'duplicate'
  upvotes: number
}

export interface PainPoint {
  pain_point_id: string
  pain_point_name: string
  pain_point_category: string
  occurrence_count: number
  affected_customers_count: number
  average_customer_impact_score: number
  trend_direction: 'increasing' | 'stable' | 'decreasing'
  churn_contribution: number
  csat_impact: number
  nps_impact: number
  status: 'active' | 'mitigated' | 'resolved' | 'monitoring'
}

export class TrendAnalysisService {
  /**
   * Analyze tickets for trends
   */
  static async analyzeTickets(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<TrendAnalysis[]> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get tickets in period
    const tickets = await TicketRepository.findAll({
      tenantId,
      limit: 1000, // Adjust as needed
    })

    // Filter by date range
    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at)
      return ticketDate >= start && ticketDate <= end
    })

    // Analyze for trends
    const trends = await this.detectTrends(filteredTickets, tenantId)

    return trends
  }

  /**
   * Detect trends from tickets
   */
  private static async detectTrends(
    tickets: any[],
    tenantId?: string
  ): Promise<TrendAnalysis[]> {
    const supabase = await createServerSupabase()

    // Group tickets by keywords/categories
    const keywordMap = new Map<string, any[]>()
    const categoryMap = new Map<string, any[]>()

    for (const ticket of tickets) {
      // Extract keywords from subject and description
      const text = `${ticket.subject} ${ticket.message || ''}`.toLowerCase()
      
      // Common keywords to detect
      const keywords = [
        'billing', 'payment', 'invoice', 'charge',
        'onboarding', 'setup', 'configuration',
        'integration', 'api', 'webhook',
        'performance', 'slow', 'lag', 'timeout',
        'bug', 'error', 'broken', 'not working',
        'feature', 'request', 'missing', 'need',
        'confused', 'unclear', 'documentation',
      ]

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, [])
          }
          keywordMap.get(keyword)!.push(ticket)
        }
      }

      // Categorize by ticket category/channel
      const category = ticket.channel || 'general'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(ticket)
    }

    const trends: TrendAnalysis[] = []

    // Create trend analysis for each keyword
    for (const [keyword, relatedTickets] of keywordMap.entries()) {
      if (relatedTickets.length < 3) continue // Minimum threshold

      const uniqueCustomers = new Set(relatedTickets.map(t => t.customer_email))
      
      // Determine trend type
      let trendType: TrendAnalysis['trend_type'] = 'pain_point'
      if (keyword.includes('feature') || keyword.includes('request') || keyword.includes('missing')) {
        trendType = 'feature_request'
      } else if (keyword.includes('bug') || keyword.includes('error') || keyword.includes('broken')) {
        trendType = 'bug_report'
      } else if (keyword.includes('slow') || keyword.includes('performance')) {
        trendType = 'usage_pattern'
      }

      // Determine severity
      let severity: TrendAnalysis['severity'] = 'low'
      if (relatedTickets.length > 20) {
        severity = 'critical'
      } else if (relatedTickets.length > 10) {
        severity = 'high'
      } else if (relatedTickets.length > 5) {
        severity = 'medium'
      }

      // Calculate trend direction
      const recentTickets = relatedTickets.filter(t => {
        const ticketDate = new Date(t.created_at)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return ticketDate >= sevenDaysAgo
      })

      const olderTickets = relatedTickets.filter(t => {
        const ticketDate = new Date(t.created_at)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        return ticketDate >= fourteenDaysAgo && ticketDate < sevenDaysAgo
      })

      let trendDirection: TrendAnalysis['trend_direction'] = 'stable'
      if (recentTickets.length > olderTickets.length * 1.2) {
        trendDirection = 'increasing'
      } else if (recentTickets.length < olderTickets.length * 0.8) {
        trendDirection = 'decreasing'
      } else if (olderTickets.length === 0 && recentTickets.length > 0) {
        trendDirection = 'new'
      }

      // Calculate trend velocity (occurrences per day)
      const daysDiff = Math.max(1, Math.floor((Date.now() - new Date(relatedTickets[0].created_at).getTime()) / (1000 * 60 * 60 * 24)))
      const trendVelocity = relatedTickets.length / daysDiff

      // Calculate impact score
      const impactScore = this.calculateImpactScore(relatedTickets.length, uniqueCustomers.size, severity)

      // Calculate churn risk contribution
      const churnRiskContribution = this.calculateChurnRiskContribution(relatedTickets, uniqueCustomers.size)

      // Check if trend already exists
      const { data: existingTrend } = await supabase
        .from('cs_trend_analysis')
        .select('trend_id')
        .eq('tenant_id', tenantId || null)
        .eq('trend_keyword', keyword)
        .eq('trend_type', trendType)
        .single()

      if (existingTrend) {
        // Update existing trend
        await supabase
          .from('cs_trend_analysis')
          .update({
            occurrence_count: relatedTickets.length,
            affected_customers_count: uniqueCustomers.size,
            last_seen_at: new Date().toISOString(),
            severity,
            trend_direction: trendDirection,
            trend_velocity: Math.round(trendVelocity * 100) / 100,
            impact_score: Math.round(impactScore * 100) / 100,
            churn_risk_contribution: Math.round(churnRiskContribution * 100) / 100,
            source_ticket_ids: relatedTickets.map(t => t.ticket_id),
            updated_at: new Date().toISOString(),
          })
          .eq('trend_id', existingTrend.trend_id)

        trends.push({
          trend_id: existingTrend.trend_id,
          trend_type: trendType,
          trend_category: this.categorizeKeyword(keyword),
          trend_keyword: keyword,
          occurrence_count: relatedTickets.length,
          affected_customers_count: uniqueCustomers.size,
          severity,
          trend_direction: trendDirection,
          trend_velocity: Math.round(trendVelocity * 100) / 100,
          impact_score: Math.round(impactScore * 100) / 100,
          churn_risk_contribution: Math.round(churnRiskContribution * 100) / 100,
          status: 'active',
        })
      } else {
        // Create new trend
        const { data: newTrend } = await supabase
          .from('cs_trend_analysis')
          .insert({
            tenant_id: tenantId || null,
            trend_type: trendType,
            trend_category: this.categorizeKeyword(keyword),
            trend_keyword: keyword,
            occurrence_count: relatedTickets.length,
            affected_customers_count: uniqueCustomers.size,
            first_seen_at: new Date(relatedTickets[0].created_at).toISOString(),
            last_seen_at: new Date().toISOString(),
            severity,
            trend_direction: trendDirection,
            trend_velocity: Math.round(trendVelocity * 100) / 100,
            impact_score: Math.round(impactScore * 100) / 100,
            churn_risk_contribution: Math.round(churnRiskContribution * 100) / 100,
            source_channels: ['ticket'],
            source_ticket_ids: relatedTickets.map(t => t.ticket_id),
            trend_description: `Trend detected: ${keyword} (${relatedTickets.length} occurrences)`,
            sample_quotes: relatedTickets.slice(0, 5).map(t => t.subject || t.description?.substring(0, 200)),
            status: 'active',
          })
          .select()
          .single()

        if (newTrend) {
          trends.push({
            trend_id: newTrend.trend_id,
            trend_type: trendType,
            trend_category: newTrend.trend_category,
            trend_keyword: newTrend.trend_keyword,
            occurrence_count: newTrend.occurrence_count,
            affected_customers_count: newTrend.affected_customers_count,
            severity: newTrend.severity,
            trend_direction: newTrend.trend_direction,
            trend_velocity: newTrend.trend_velocity,
            impact_score: newTrend.impact_score,
            churn_risk_contribution: newTrend.churn_risk_contribution,
            status: newTrend.status,
          })
        }
      }
    }

    return trends
  }

  /**
   * Categorize keyword into category
   */
  private static categorizeKeyword(keyword: string): string {
    if (keyword.includes('billing') || keyword.includes('payment') || keyword.includes('invoice')) {
      return 'billing'
    }
    if (keyword.includes('onboarding') || keyword.includes('setup') || keyword.includes('configuration')) {
      return 'onboarding'
    }
    if (keyword.includes('integration') || keyword.includes('api') || keyword.includes('webhook')) {
      return 'integration'
    }
    if (keyword.includes('performance') || keyword.includes('slow') || keyword.includes('lag')) {
      return 'performance'
    }
    if (keyword.includes('bug') || keyword.includes('error') || keyword.includes('broken')) {
      return 'bugs'
    }
    if (keyword.includes('feature') || keyword.includes('request') || keyword.includes('missing')) {
      return 'features'
    }
    return 'general'
  }

  /**
   * Calculate impact score (0-100)
   */
  private static calculateImpactScore(
    occurrenceCount: number,
    affectedCustomers: number,
    severity: TrendAnalysis['severity']
  ): number {
    const severityWeight = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    }

    const occurrenceScore = Math.min(100, (occurrenceCount / 50) * 100)
    const customerScore = Math.min(100, (affectedCustomers / 20) * 100)
    const severityMultiplier = severityWeight[severity]

    return Math.round(((occurrenceScore + customerScore) / 2) * severityMultiplier)
  }

  /**
   * Calculate churn risk contribution
   */
  private static calculateChurnRiskContribution(
    tickets: any[],
    affectedCustomers: number
  ): number {
    // Higher churn risk if:
    // - More tickets per customer
    // - Recent tickets (within 7 days)
    // - High priority tickets

    const ticketsPerCustomer = tickets.length / Math.max(1, affectedCustomers)
    const recentTickets = tickets.filter(t => {
      const ticketDate = new Date(t.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return ticketDate >= sevenDaysAgo
    }).length

    const highPriorityTickets = tickets.filter(t => 
      ['high', 'urgent'].includes(t.priority)
    ).length

    const riskScore = (
      (ticketsPerCustomer * 10) +
      (recentTickets * 5) +
      (highPriorityTickets * 15)
    )

    return Math.min(100, Math.round(riskScore))
  }

  /**
   * Extract product feedback from tickets and surveys
   */
  static async extractProductFeedback(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ProductFeedback[]> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get tickets with feedback keywords
    const tickets = await TicketRepository.findAll({
      tenantId,
      limit: 1000,
    })

    const feedbackItems: ProductFeedback[] = []

    for (const ticket of tickets) {
      const ticketDate = new Date(ticket.created_at)
      if (ticketDate < start || ticketDate > end) continue

      const text = `${ticket.subject} ${ticket.message || ''}`.toLowerCase()

      // Detect feedback type
      let feedbackType: ProductFeedback['feedback_type'] = 'question'
      if (text.includes('feature') || text.includes('add') || text.includes('request')) {
        feedbackType = 'feature_request'
      } else if (text.includes('bug') || text.includes('error') || text.includes('broken')) {
        feedbackType = 'bug_report'
      } else if (text.includes('improve') || text.includes('better') || text.includes('enhance')) {
        feedbackType = 'improvement'
      } else if (text.includes('complaint') || text.includes('disappointed') || text.includes('frustrated')) {
        feedbackType = 'complaint'
      } else if (text.includes('great') || text.includes('love') || text.includes('excellent')) {
        feedbackType = 'praise'
      }

      // Only extract if it's actual feedback (not just a question)
      if (feedbackType === 'question' && !text.includes('?')) {
        continue
      }

      // Determine priority
      let priority: ProductFeedback['priority'] = 'medium'
      if (ticket.priority === 'urgent') {
        priority = 'urgent'
      } else if (ticket.priority === 'high') {
        priority = 'high'
      } else if (ticket.priority === 'low') {
        priority = 'low'
      }

      // Create feedback record
      const { data: feedback } = await supabase
        .from('cs_product_feedback')
        .insert({
          tenant_id: tenantId || null,
          customer_email: ticket.customer_email,
          feedback_type: feedbackType,
          feedback_category: this.categorizeKeyword(text),
          title: ticket.subject || 'Feedback from ticket',
          description: ticket.message || ticket.subject || '',
          priority,
          source_type: 'ticket',
          source_id: ticket.ticket_id,
          status: 'new',
        })
        .select()
        .single()

      if (feedback) {
        feedbackItems.push({
          feedback_id: feedback.feedback_id,
          feedback_type: feedback.feedback_type,
          feedback_category: feedback.feedback_category,
          title: feedback.title,
          description: feedback.description,
          priority: feedback.priority,
          status: feedback.status,
          upvotes: feedback.upvotes || 0,
        })
      }
    }

    return feedbackItems
  }

  /**
   * Identify pain points from trends
   */
  static async identifyPainPoints(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<PainPoint[]> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get active trends
    const { data: trends } = await supabase
      .from('cs_trend_analysis')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .eq('status', 'active')
      .gte('last_seen_at', start.toISOString())
      .lte('last_seen_at', end.toISOString())

    if (!trends || trends.length === 0) {
      return []
    }

    const painPoints: PainPoint[] = []

    // Group trends by category to identify pain points
    const categoryMap = new Map<string, any[]>()
    for (const trend of trends) {
      if (!categoryMap.has(trend.trend_category)) {
        categoryMap.set(trend.trend_category, [])
      }
      categoryMap.get(trend.trend_category)!.push(trend)
    }

    for (const [category, categoryTrends] of categoryMap.entries()) {
      const totalOccurrences = categoryTrends.reduce((sum, t) => sum + t.occurrence_count, 0)
      const totalCustomers = new Set(
        categoryTrends.flatMap(t => t.source_ticket_ids || [])
      ).size

      if (totalOccurrences < 5) continue // Minimum threshold

      // Check if pain point already exists
      const { data: existingPainPoint } = await supabase
        .from('cs_pain_points')
        .select('pain_point_id')
        .eq('tenant_id', tenantId || null)
        .eq('pain_point_category', category)
        .single()

      // Calculate CSAT/NPS impact from survey data
      const affectedCustomerEmails = categoryTrends.flatMap(t => t.source_customer_emails || []).filter(Boolean)
      let csatImpact = 0
      let npsImpact = 0

      if (affectedCustomerEmails.length > 0) {
        const { data: affectedSurveys } = await supabase
          .from('cs_survey_responses')
          .select('survey_type, score')
          .in('customer_email', affectedCustomerEmails)
          .gte('responded_at', (periodStart || new Date(Date.now() - 30*24*60*60*1000)).toISOString())
          .lte('responded_at', (periodEnd || new Date()).toISOString())

        if (affectedSurveys) {
          const csatScores = affectedSurveys.filter((s: any) => s.survey_type === 'csat').map((s: any) => s.score)
          const npsScores = affectedSurveys.filter((s: any) => s.survey_type === 'nps').map((s: any) => s.score)
          csatImpact = csatScores.length > 0
            ? Math.round((csatScores.reduce((a: number, b: number) => a + b, 0) / csatScores.length) * 10) / 10
            : 0
          npsImpact = npsScores.length > 0
            ? Math.round((npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length) * 10) / 10
            : 0
        }
      }

      const painPointName = `${category.charAt(0).toUpperCase() + category.slice(1)} Issues`
      const avgImpactScore = categoryTrends.reduce((sum, t) => sum + (t.impact_score || 0), 0) / categoryTrends.length
      const churnContribution = categoryTrends.reduce((sum, t) => sum + (t.churn_risk_contribution || 0), 0) / categoryTrends.length

      // Determine trend direction
      const increasingTrends = categoryTrends.filter(t => t.trend_direction === 'increasing').length
      let trendDirection: PainPoint['trend_direction'] = 'stable'
      if (increasingTrends > categoryTrends.length * 0.5) {
        trendDirection = 'increasing'
      } else if (categoryTrends.filter(t => t.trend_direction === 'decreasing').length > categoryTrends.length * 0.5) {
        trendDirection = 'decreasing'
      }

      if (existingPainPoint) {
        // Update existing pain point
        await supabase
          .from('cs_pain_points')
          .update({
            occurrence_count: totalOccurrences,
            affected_customers_count: totalCustomers,
            average_customer_impact_score: Math.round(avgImpactScore * 100) / 100,
            trend_direction: trendDirection,
            churn_contribution: Math.round(churnContribution * 100) / 100,
            related_trend_ids: categoryTrends.map(t => t.trend_id),
            updated_at: new Date().toISOString(),
          })
          .eq('pain_point_id', existingPainPoint.pain_point_id)

        painPoints.push({
          pain_point_id: existingPainPoint.pain_point_id,
          pain_point_name: painPointName,
          pain_point_category: category,
          occurrence_count: totalOccurrences,
          affected_customers_count: totalCustomers,
          average_customer_impact_score: Math.round(avgImpactScore * 100) / 100,
          trend_direction: trendDirection,
          churn_contribution: Math.round(churnContribution * 100) / 100,
          csat_impact: csatImpact,
          nps_impact: npsImpact,
          status: 'active',
        })
      } else {
        // Create new pain point
        const { data: newPainPoint } = await supabase
          .from('cs_pain_points')
          .insert({
            tenant_id: tenantId || null,
            pain_point_name: painPointName,
            pain_point_category: category,
            pain_point_description: `Common issues related to ${category}`,
            occurrence_count: totalOccurrences,
            affected_customers_count: totalCustomers,
            average_customer_impact_score: Math.round(avgImpactScore * 100) / 100,
            trend_direction: trendDirection,
            churn_contribution: Math.round(churnContribution * 100) / 100,
            related_trend_ids: categoryTrends.map(t => t.trend_id),
            status: 'active',
          })
          .select()
          .single()

        if (newPainPoint) {
          painPoints.push({
            pain_point_id: newPainPoint.pain_point_id,
            pain_point_name: newPainPoint.pain_point_name,
            pain_point_category: newPainPoint.pain_point_category,
            occurrence_count: newPainPoint.occurrence_count,
            affected_customers_count: newPainPoint.affected_customers_count,
            average_customer_impact_score: newPainPoint.average_customer_impact_score,
            trend_direction: newPainPoint.trend_direction,
            churn_contribution: newPainPoint.churn_contribution,
            csat_impact: 0,
            nps_impact: 0,
            status: newPainPoint.status,
          })
        }
      }
    }

    return painPoints
  }

  /**
   * Get trend summary for dashboard
   */
  static async getTrendSummary(
    tenantId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = await createServerSupabase()

    const start = periodStart || getDefaultAnalyticsPeriodStart()
    const end = periodEnd || new Date()

    // Get trends
    const { data: trends } = await supabase
      .from('cs_trend_analysis')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .gte('last_seen_at', start.toISOString())
      .lte('last_seen_at', end.toISOString())

    // Get pain points
    const { data: painPoints } = await supabase
      .from('cs_pain_points')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .eq('status', 'active')

    // Get product feedback
    const { data: feedback } = await supabase
      .from('cs_product_feedback')
      .select('*')
      .eq('tenant_id', tenantId || null)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    return {
      trends: {
        total: trends?.length || 0,
        by_type: this.groupBy(trends || [], 'trend_type'),
        by_severity: this.groupBy(trends || [], 'severity'),
        top_trends: (trends || []).sort((a, b) => b.occurrence_count - a.occurrence_count).slice(0, 10),
      },
      pain_points: {
        total: painPoints?.length || 0,
        active: painPoints?.filter(p => p.status === 'active').length || 0,
        top_pain_points: (painPoints || []).sort((a, b) => b.occurrence_count - a.occurrence_count).slice(0, 10),
      },
      feedback: {
        total: feedback?.length || 0,
        by_type: this.groupBy(feedback || [], 'feedback_type'),
        by_status: this.groupBy(feedback || [], 'status'),
        top_feedback: (feedback || []).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 10),
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
}
