/**
 * Usage Analytics Service
 * 
 * Tracks feature adoption, usage patterns, and predicts churn:
 * - Feature usage events tracking
 * - Feature adoption metrics (7d, 30d)
 * - User behavior patterns
 * - Churn risk prediction
 * - Usage trend analysis
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface UsageEvent {
  tenant_id: string
  user_id: string
  event_type: string
  feature_name: string
  event_data?: Record<string, any>
  session_id?: string
  ip_address?: string
  user_agent?: string
}

export interface FeatureAdoptionMetrics {
  feature_name: string
  total_users: number
  active_users_7d: number
  active_users_30d: number
  total_events: number
  events_7d: number
  events_30d: number
  adoption_rate: number
  growth_rate: number
}

export interface UsagePattern {
  user_id: string
  login_frequency_7d: number
  login_frequency_30d: number
  session_duration_avg: number
  features_used_count: number
  features_used_list: string[]
  engagement_score: number
  engagement_level: 'high' | 'medium' | 'low' | 'inactive'
  churn_risk_score: number
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical'
  usage_trend: 'increasing' | 'stable' | 'decreasing' | 'inactive'
  days_since_last_activity: number
}

export class UsageAnalyticsService {
  /**
   * Record a usage event
   */
  static async recordEvent(event: UsageEvent): Promise<void> {
    const supabase = createServerSupabase()

    await supabase.from('cs_usage_events').insert({
      tenant_id: event.tenant_id,
      user_id: event.user_id,
      event_type: event.event_type,
      feature_name: event.feature_name,
      event_data: event.event_data || {},
      session_id: event.session_id,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      event_timestamp: new Date().toISOString(),
    })
  }

  /**
   * Calculate feature adoption metrics for a tenant
   */
  static async calculateFeatureAdoption(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<FeatureAdoptionMetrics[]> {
    const supabase = createServerSupabase()

    // Get all features used in this period
    const { data: features } = await supabase
      .from('cs_usage_events')
      .select('feature_name')
      .eq('tenant_id', tenantId)
      .gte('event_timestamp', periodStart.toISOString())
      .lte('event_timestamp', periodEnd.toISOString())

    const uniqueFeatures = [...new Set(features?.map(f => f.feature_name) || [])]

    const metrics: FeatureAdoptionMetrics[] = []

    for (const featureName of uniqueFeatures) {
      // Get total users who have used this feature
      const { data: totalUsersData } = await supabase
        .from('cs_usage_events')
        .select('user_id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .not('user_id', 'is', null)

      const totalUsers = new Set(totalUsersData?.map(u => u.user_id) || []).size

      // Get active users in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: active7dData } = await supabase
        .from('cs_usage_events')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .gte('event_timestamp', sevenDaysAgo.toISOString())
        .not('user_id', 'is', null)

      const activeUsers7d = new Set(active7dData?.map(u => u.user_id) || []).size

      // Get active users in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: active30dData } = await supabase
        .from('cs_usage_events')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .gte('event_timestamp', thirtyDaysAgo.toISOString())
        .not('user_id', 'is', null)

      const activeUsers30d = new Set(active30dData?.map(u => u.user_id) || []).size

      // Get total events
      const { count: totalEvents } = await supabase
        .from('cs_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)

      // Get events in last 7 days
      const { count: events7d } = await supabase
        .from('cs_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .gte('event_timestamp', sevenDaysAgo.toISOString())

      // Get events in last 30 days
      const { count: events30d } = await supabase
        .from('cs_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .gte('event_timestamp', thirtyDaysAgo.toISOString())

      // Get total tenant users (for adoption rate calculation)
      // TODO: Get from tenant service or user mapping service
      const totalTenantUsers = 100 // Placeholder - should come from actual tenant data

      const adoptionRate = totalTenantUsers > 0
        ? Math.round((totalUsers / totalTenantUsers) * 100)
        : 0

      // Calculate growth rate (compare 7d to previous 7d)
      const previous7dStart = new Date(sevenDaysAgo)
      previous7dStart.setDate(previous7dStart.getDate() - 7)
      const previous7dEnd = sevenDaysAgo

      const { count: previousEvents7d } = await supabase
        .from('cs_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('feature_name', featureName)
        .gte('event_timestamp', previous7dStart.toISOString())
        .lt('event_timestamp', previous7dEnd.toISOString())

      const growthRate = previousEvents7d && previousEvents7d > 0
        ? Math.round(((events7d || 0) - previousEvents7d) / previousEvents7d * 100)
        : 0

      metrics.push({
        feature_name: featureName,
        total_users: totalUsers,
        active_users_7d: activeUsers7d,
        active_users_30d: activeUsers30d,
        total_events: totalEvents || 0,
        events_7d: events7d || 0,
        events_30d: events30d || 0,
        adoption_rate: adoptionRate,
        growth_rate: growthRate,
      })
    }

    // Store metrics
    for (const metric of metrics) {
      await supabase
        .from('cs_feature_adoption_metrics')
        .upsert(
          {
            tenant_id: tenantId,
            feature_name: metric.feature_name,
            total_users: metric.total_users,
            active_users_7d: metric.active_users_7d,
            active_users_30d: metric.active_users_30d,
            total_events: metric.total_events,
            events_7d: metric.events_7d,
            events_30d: metric.events_30d,
            adoption_rate: metric.adoption_rate,
            growth_rate: metric.growth_rate,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
          },
          {
            onConflict: 'tenant_id,feature_name,period_start,period_end',
          }
        )
    }

    return metrics
  }

  /**
   * Calculate usage patterns and churn risk for a user
   */
  static async calculateUsagePattern(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsagePattern> {
    const supabase = createServerSupabase()

    // Get login frequency (7d, 30d)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: logins7d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('event_type', 'login')
      .gte('event_timestamp', sevenDaysAgo.toISOString())

    const { count: logins30d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('event_type', 'login')
      .gte('event_timestamp', thirtyDaysAgo.toISOString())

    // Get unique features used
    const { data: features } = await supabase
      .from('cs_usage_events')
      .select('feature_name')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .gte('event_timestamp', periodStart.toISOString())
      .lte('event_timestamp', periodEnd.toISOString())

    const featuresUsed = [...new Set(features?.map(f => f.feature_name) || [])]

    // Calculate average session duration (placeholder - would need session tracking)
    const sessionDurationAvg = 15.0 // TODO: Calculate from actual session data

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore(
      logins7d || 0,
      logins30d || 0,
      featuresUsed.length,
      sessionDurationAvg
    )

    const engagementLevel = this.determineEngagementLevel(engagementScore)

    // Calculate churn risk (0-100)
    const churnRiskScore = this.calculateChurnRisk(
      logins7d || 0,
      logins30d || 0,
      featuresUsed.length,
      engagementScore
    )

    const churnRiskLevel = this.determineChurnRiskLevel(churnRiskScore)

    // Determine usage trend
    const usageTrend = await this.determineUsageTrend(tenantId, userId)

    // Days since last activity
    const { data: lastEvent } = await supabase
      .from('cs_usage_events')
      .select('event_timestamp')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('event_timestamp', { ascending: false })
      .limit(1)
      .single()

    const daysSinceLastActivity = lastEvent
      ? Math.floor((Date.now() - new Date(lastEvent.event_timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Predict churn date (if high risk)
    const churnPredictionDate = churnRiskScore > 70
      ? new Date(Date.now() + (30 - churnRiskScore) * 24 * 60 * 60 * 1000)
      : null

    const pattern: UsagePattern = {
      user_id: userId,
      login_frequency_7d: logins7d || 0,
      login_frequency_30d: logins30d || 0,
      session_duration_avg: sessionDurationAvg,
      features_used_count: featuresUsed.length,
      features_used_list: featuresUsed,
      engagement_score: engagementScore,
      engagement_level: engagementLevel,
      churn_risk_score: churnRiskScore,
      churn_risk_level: churnRiskLevel,
      usage_trend: usageTrend,
      days_since_last_activity: daysSinceLastActivity,
    }

    // Store pattern
    await supabase
      .from('cs_usage_patterns')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          login_frequency_7d: pattern.login_frequency_7d,
          login_frequency_30d: pattern.login_frequency_30d,
          session_duration_avg: pattern.session_duration_avg,
          features_used_count: pattern.features_used_count,
          features_used_list: pattern.features_used_list,
          engagement_score: pattern.engagement_score,
          engagement_level: pattern.engagement_level,
          churn_risk_score: pattern.churn_risk_score,
          churn_risk_level: pattern.churn_risk_level,
          churn_prediction_date: churnPredictionDate?.toISOString().split('T')[0] || null,
          usage_trend: pattern.usage_trend,
          days_since_last_activity: pattern.days_since_last_activity,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
        },
        {
          onConflict: 'tenant_id,user_id,period_start,period_end',
        }
      )

    return pattern
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static calculateEngagementScore(
    logins7d: number,
    logins30d: number,
    featuresUsed: number,
    sessionDuration: number
  ): number {
    // Weighted factors:
    // - Login frequency (40%)
    // - Feature usage (30%)
    // - Session duration (30%)

    const loginScore = Math.min(100, (logins7d / 7) * 100) // Normalize to 7 days
    const featureScore = Math.min(100, (featuresUsed / 10) * 100) // Normalize to 10 features
    const durationScore = Math.min(100, (sessionDuration / 60) * 100) // Normalize to 60 minutes

    return Math.round(
      loginScore * 0.4 +
      featureScore * 0.3 +
      durationScore * 0.3
    )
  }

  /**
   * Determine engagement level
   */
  private static determineEngagementLevel(score: number): 'high' | 'medium' | 'low' | 'inactive' {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    if (score >= 20) return 'low'
    return 'inactive'
  }

  /**
   * Calculate churn risk (0-100)
   */
  private static calculateChurnRisk(
    logins7d: number,
    logins30d: number,
    featuresUsed: number,
    engagementScore: number
  ): number {
    // Churn risk factors:
    // - Low login frequency = high risk
    // - Low feature usage = high risk
    // - Low engagement = high risk

    let risk = 100 - engagementScore // Base risk from engagement

    // Adjust based on login frequency
    if (logins7d === 0) {
      risk += 20 // +20% risk for no logins in 7 days
    } else if (logins7d < 3) {
      risk += 10 // +10% risk for low logins
    }

    // Adjust based on feature usage
    if (featuresUsed === 0) {
      risk += 15 // +15% risk for no feature usage
    } else if (featuresUsed < 3) {
      risk += 5 // +5% risk for low feature usage
    }

    return Math.min(100, Math.max(0, Math.round(risk)))
  }

  /**
   * Determine churn risk level
   */
  private static determineChurnRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 70) return 'critical'
    if (score >= 50) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
  }

  /**
   * Determine usage trend
   */
  private static async determineUsageTrend(
    tenantId: string,
    userId: string
  ): Promise<'increasing' | 'stable' | 'decreasing' | 'inactive'> {
    const supabase = createServerSupabase()

    // Compare last 7 days to previous 7 days
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { count: recentEvents } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .gte('event_timestamp', sevenDaysAgo.toISOString())

    const { count: previousEvents } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .gte('event_timestamp', fourteenDaysAgo.toISOString())
      .lt('event_timestamp', sevenDaysAgo.toISOString())

    if ((recentEvents || 0) === 0) {
      return 'inactive'
    }

    if ((previousEvents || 0) === 0) {
      return 'increasing' // New activity
    }

    const change = ((recentEvents || 0) - (previousEvents || 0)) / (previousEvents || 1)

    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  /**
   * Generate usage analytics summary for dashboard
   */
  static async generateAnalyticsSummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any> {
    const supabase = createServerSupabase()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get active users
    const { data: activeUsers7d } = await supabase
      .from('cs_usage_events')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('event_timestamp', sevenDaysAgo.toISOString())
      .not('user_id', 'is', null)

    const { data: activeUsers30d } = await supabase
      .from('cs_usage_events')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('event_timestamp', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null)

    const totalActiveUsers7d = new Set(activeUsers7d?.map(u => u.user_id) || []).size
    const totalActiveUsers30d = new Set(activeUsers30d?.map(u => u.user_id) || []).size

    // Get login counts
    const { count: logins7d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'login')
      .gte('event_timestamp', sevenDaysAgo.toISOString())

    const { count: logins30d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'login')
      .gte('event_timestamp', thirtyDaysAgo.toISOString())

    // Get feature usage counts
    const { count: featureUses7d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'feature_used')
      .gte('event_timestamp', sevenDaysAgo.toISOString())

    const { count: featureUses30d } = await supabase
      .from('cs_usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'feature_used')
      .gte('event_timestamp', thirtyDaysAgo.toISOString())

    // Get top features
    const { data: topFeatures7d } = await supabase
      .from('cs_usage_events')
      .select('feature_name')
      .eq('tenant_id', tenantId)
      .gte('event_timestamp', sevenDaysAgo.toISOString())
      .eq('event_type', 'feature_used')

    const featureCounts7d = (topFeatures7d || []).reduce((acc, f) => {
      acc[f.feature_name] = (acc[f.feature_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topFeatures7dList = Object.entries(featureCounts7d)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const { data: topFeatures30d } = await supabase
      .from('cs_usage_events')
      .select('feature_name')
      .eq('tenant_id', tenantId)
      .gte('event_timestamp', thirtyDaysAgo.toISOString())
      .eq('event_type', 'feature_used')

    const featureCounts30d = (topFeatures30d || []).reduce((acc, f) => {
      acc[f.feature_name] = (acc[f.feature_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topFeatures30dList = Object.entries(featureCounts30d)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Get adoption rates
    const { data: adoptionMetrics } = await supabase
      .from('cs_feature_adoption_metrics')
      .select('feature_name, adoption_rate')
      .eq('tenant_id', tenantId)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])

    const adoptionRates = (adoptionMetrics || []).reduce((acc, m) => {
      acc[m.feature_name] = m.adoption_rate
      return acc
    }, {} as Record<string, number>)

    // Get churn indicators
    const { data: atRiskUsers } = await supabase
      .from('cs_usage_patterns')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .in('churn_risk_level', ['high', 'critical'])
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])

    const { data: inactiveUsers } = await supabase
      .from('cs_usage_patterns')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('days_since_last_activity', 30)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])

    const { data: churnPredicted } = await supabase
      .from('cs_usage_patterns')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('churn_risk_score', 70)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])

    // Calculate new users (placeholder - would need user creation tracking)
    const newUsers7d = 0 // TODO: Get from user creation events
    const newUsers30d = 0 // TODO: Get from user creation events

    const summary = {
      total_active_users_7d: totalActiveUsers7d,
      total_active_users_30d: totalActiveUsers30d,
      total_logins_7d: logins7d || 0,
      total_logins_30d: logins30d || 0,
      total_feature_uses_7d: featureUses7d || 0,
      total_feature_uses_30d: featureUses30d || 0,
      top_features_7d: topFeatures7dList,
      top_features_30d: topFeatures30dList,
      adoption_rates: adoptionRates,
      at_risk_users_count: new Set(atRiskUsers?.map(u => u.user_id) || []).size,
      inactive_users_count: new Set(inactiveUsers?.map(u => u.user_id) || []).size,
      churn_prediction_count: new Set(churnPredicted?.map(u => u.user_id) || []).size,
      new_users_7d,
      new_users_30d,
      user_growth_rate: 0, // TODO: Calculate growth rate
    }

    // Store summary
    await supabase
      .from('cs_usage_analytics_summary')
      .upsert(
        {
          tenant_id: tenantId,
          ...summary,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
        },
        {
          onConflict: 'tenant_id,period_start,period_end',
        }
      )

    return summary
  }

  /**
   * Get usage analytics summary
   */
  static async getAnalyticsSummary(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = createServerSupabase()

    const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = periodEnd || new Date()

    const { data } = await supabase
      .from('cs_usage_analytics_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_start', start.toISOString().split('T')[0])
      .eq('period_end', end.toISOString().split('T')[0])
      .single()

    return data
  }

  /**
   * Get users at risk of churn
   */
  static async getAtRiskUsers(
    tenantId: string,
    riskLevel: 'high' | 'critical' = 'high',
    limit: number = 50
  ): Promise<UsagePattern[]> {
    const supabase = createServerSupabase()

    const { data } = await supabase
      .from('cs_usage_patterns')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('churn_risk_level', riskLevel === 'high' ? ['high', 'critical'] : ['critical'])
      .order('churn_risk_score', { ascending: false })
      .limit(limit)

    return (data || []) as UsagePattern[]
  }
}
