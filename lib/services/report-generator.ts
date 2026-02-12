import { createServerSupabase } from '@/lib/db/supabase'
import { AnalyticsService } from './analytics'
import { AgentPerformanceService } from './agent-performance'
import { UsageAnalyticsService } from './usage-analytics'
import { HealthScoringService } from './health-scoring'
import { CSATNPSSurveyService } from './csat-nps-survey'

export interface ReportTemplate {
  template_id: string
  template_name: string
  template_type: string
  description?: string
  report_config: ReportConfig
  schedule_type?: 'daily' | 'weekly' | 'monthly' | 'none'
  schedule_config?: ScheduleConfig
  is_active: boolean
  is_default: boolean
}

export interface ReportConfig {
  sections: ReportSection[]
  format: 'pdf' | 'json' | 'csv'
  include_charts?: boolean
  include_tables?: boolean
  filters?: Record<string, any>
}

export interface ReportSection {
  name: string
  data_source: string
  filters?: Record<string, any>
  metrics: string[]
  chart_type?: 'bar' | 'line' | 'pie' | 'table'
}

export interface ScheduleConfig {
  day_of_week?: number // 0-6 (Sunday=0)
  day_of_month?: number // 1-31
  time: string // HH:MM format
  timezone?: string
  recipients: string[]
}

export interface GeneratedReport {
  report_id: string
  report_name: string
  report_type: string
  report_data: any
  report_config: ReportConfig
  period_start: string
  period_end: string
  status: 'generating' | 'completed' | 'failed' | 'expired'
  file_path?: string
  file_url?: string
  generated_at: string
}

export class ReportGeneratorService {
  /**
   * Generate a report from a template
   */
  static async generateReport(
    templateId: string,
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    userId?: string,
    customConfig?: Partial<ReportConfig>
  ): Promise<GeneratedReport> {
    const startTime = Date.now()
    const supabase = createServerSupabase()

    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('cs_report_templates')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (templateError || !template) {
        throw new Error(`Template not found: ${templateId}`)
      }

      // Merge custom config if provided
      const reportConfig: ReportConfig = customConfig
        ? { ...template.report_config, ...customConfig }
        : template.report_config

      // Generate report data for each section
      const reportData: any = {
        report_name: template.template_name,
        report_type: template.template_type,
        period_start: periodStart,
        period_end: periodEnd,
        generated_at: new Date().toISOString(),
        sections: [],
      }

      for (const section of reportConfig.sections) {
        const sectionData = await this.generateSectionData(
          section,
          tenantId,
          periodStart,
          periodEnd
        )
        reportData.sections.push({
          name: section.name,
          data: sectionData,
          metrics: section.metrics,
          chart_type: section.chart_type,
        })
      }

      // Create report record
      const { data: report, error: reportError } = await supabase
        .from('cs_reports')
        .insert({
          tenant_id: tenantId,
          template_id: templateId,
          report_name: template.template_name,
          report_type: template.template_type,
          report_data: reportData,
          report_config: reportConfig,
          period_start: periodStart,
          period_end: periodEnd,
          generated_by: userId,
          status: 'completed',
          generation_duration_ms: Date.now() - startTime,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        })
        .select()
        .single()

      if (reportError) {
        throw reportError
      }

      // TODO: Generate PDF file if format is 'pdf'
      // For now, we'll just store the JSON data

      return {
        report_id: report.report_id,
        report_name: report.report_name,
        report_type: report.report_type,
        report_data: report.report_data,
        report_config: report.report_config,
        period_start: report.period_start,
        period_end: report.period_end,
        status: report.status,
        file_path: report.file_path,
        file_url: report.file_url,
        generated_at: report.generated_at,
      }
    } catch (error: any) {
      // Create failed report record
      await supabase.from('cs_reports').insert({
        tenant_id: tenantId,
        template_id: templateId,
        report_name: 'Failed Report',
        report_type: 'unknown',
        report_data: {},
        report_config: {},
        period_start: periodStart,
        period_end: periodEnd,
        generated_by: userId,
        status: 'failed',
        error_message: error.message,
        generation_duration_ms: Date.now() - startTime,
      })

      throw error
    }
  }

  /**
   * Generate data for a report section
   */
  private static async generateSectionData(
    section: ReportSection,
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    switch (section.data_source) {
      case 'tickets':
        return await this.getTicketData(tenantId, periodStart, periodEnd, section.filters)

      case 'agent_performance':
        return await this.getAgentPerformanceData(tenantId, periodStart, periodEnd, section.filters)

      case 'team_performance':
        return await this.getTeamPerformanceData(tenantId, periodStart, periodEnd)

      case 'usage_analytics':
        return await this.getUsageAnalyticsData(tenantId, periodStart, periodEnd, section.filters)

      case 'health_scores':
        return await this.getHealthScoresData(tenantId, periodStart, periodEnd)

      case 'customer_satisfaction':
        return await this.getCustomerSatisfactionData(tenantId, periodStart, periodEnd)

      case 'sla_compliance':
        return await this.getSlaComplianceData(tenantId, periodStart, periodEnd)

      default:
        return {}
    }
  }

  /**
   * Get ticket data for reports
   */
  private static async getTicketData(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const analytics = await AnalyticsService.getTicketAnalytics(tenantId, {
      from: periodStart,
      to: periodEnd,
    })

    return {
      total_tickets: analytics.totalTickets,
      resolved_tickets: analytics.resolvedTickets,
      open_tickets: analytics.openTickets,
      resolution_rate: analytics.resolutionRate,
      avg_resolution_time: analytics.averageResolutionTime,
      by_channel: analytics.byChannel,
      by_status: analytics.byStatus,
      by_priority: analytics.byPriority,
    }
  }

  /**
   * Get agent performance data
   */
  private static async getAgentPerformanceData(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const teamMetrics = await AgentPerformanceService.getTeamMetrics(
      tenantId,
      periodStart,
      periodEnd
    )

    return {
      total_agents: teamMetrics.total_agents,
      active_agents: teamMetrics.active_agents,
      total_tickets: teamMetrics.total_tickets,
      total_resolved: teamMetrics.total_resolved,
      avg_resolution_rate: teamMetrics.avg_resolution_rate,
      avg_response_time: teamMetrics.avg_response_time,
      avg_resolution_time: teamMetrics.avg_resolution_time,
      avg_csat_score: teamMetrics.avg_csat_score,
      avg_sla_compliance: teamMetrics.avg_sla_compliance,
      top_performers: teamMetrics.top_performers,
      needs_improvement: teamMetrics.needs_improvement,
    }
  }

  /**
   * Get team performance data
   */
  private static async getTeamPerformanceData(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    return await this.getAgentPerformanceData(tenantId, periodStart, periodEnd)
  }

  /**
   * Get usage analytics data
   */
  private static async getUsageAnalyticsData(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    filters?: Record<string, any>
  ): Promise<any> {
    const summary = await UsageAnalyticsService.getAnalyticsSummary(tenantId, {
      from: periodStart,
      to: periodEnd,
    })

    return {
      active_users_7d: summary.activeUsers7d,
      active_users_30d: summary.activeUsers30d,
      feature_adoption: summary.featureAdoption,
      usage_trends: summary.usageTrends,
      at_risk_users: summary.atRiskUsers,
    }
  }

  /**
   * Get health scores data
   */
  private static async getHealthScoresData(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    // Get health scores for the period
    const supabase = createServerSupabase()
    const { data: healthScores } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('calculated_at', periodStart)
      .lte('calculated_at', periodEnd)
      .order('calculated_at', { ascending: false })

    if (!healthScores || healthScores.length === 0) {
      return {
        total_customers: 0,
        healthy: 0,
        at_risk: 0,
        critical: 0,
        avg_health_score: 0,
      }
    }

    const healthy = healthScores.filter((h) => h.health_level === 'healthy').length
    const atRisk = healthScores.filter((h) => h.health_level === 'at_risk').length
    const critical = healthScores.filter((h) => h.health_level === 'critical').length
    const avgScore =
      healthScores.reduce((sum, h) => sum + h.health_score, 0) / healthScores.length

    return {
      total_customers: healthScores.length,
      healthy,
      at_risk: atRisk,
      critical,
      avg_health_score: avgScore,
      distribution: {
        healthy: (healthy / healthScores.length) * 100,
        at_risk: (atRisk / healthScores.length) * 100,
        critical: (critical / healthScores.length) * 100,
      },
    }
  }

  /**
   * Get customer satisfaction data
   */
  private static async getCustomerSatisfactionData(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    const stats = await CSATNPSSurveyService.getSurveyStats(tenantId, {
      from: periodStart,
      to: periodEnd,
    })

    return {
      csat_score: stats.csatScore,
      csat_count: stats.csatCount,
      nps_score: stats.npsScore,
      nps_count: stats.npsCount,
      response_rate: stats.responseRate,
      trends: stats.trends,
    }
  }

  /**
   * Get SLA compliance data
   */
  private static async getSlaComplianceData(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    const supabase = createServerSupabase()

    // Get SLA tracking data
    const { data: slaTracking } = await supabase
      .from('cs_sla_tracking')
      .select('*, cs_tickets(tenant_id)')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)

    if (!slaTracking || slaTracking.length === 0) {
      return {
        total_tickets: 0,
        compliant: 0,
        breached: 0,
        compliance_rate: 0,
      }
    }

    // Filter by tenant
    const tenantSla = slaTracking.filter(
      (sla) => (sla.cs_tickets as any)?.tenant_id === tenantId
    )

    const compliant = tenantSla.filter(
      (sla) => !sla.first_response_breached && !sla.resolution_breached
    ).length
    const breached = tenantSla.filter(
      (sla) => sla.first_response_breached || sla.resolution_breached
    ).length

    return {
      total_tickets: tenantSla.length,
      compliant,
      breached,
      compliance_rate: tenantSla.length > 0 ? (compliant / tenantSla.length) * 100 : 0,
      first_response_breaches: tenantSla.filter((sla) => sla.first_response_breached).length,
      resolution_breaches: tenantSla.filter((sla) => sla.resolution_breached).length,
    }
  }

  /**
   * Get report by ID
   */
  static async getReport(reportId: string): Promise<GeneratedReport | null> {
    const supabase = createServerSupabase()
    const { data: report, error } = await supabase
      .from('cs_reports')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error || !report) {
      return null
    }

    return {
      report_id: report.report_id,
      report_name: report.report_name,
      report_type: report.report_type,
      report_data: report.report_data,
      report_config: report.report_config,
      period_start: report.period_start,
      period_end: report.period_end,
      status: report.status,
      file_path: report.file_path,
      file_url: report.file_url,
      generated_at: report.generated_at,
    }
  }

  /**
   * Get all reports for a tenant
   */
  static async getReports(
    tenantId: string,
    filters?: {
      report_type?: string
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<GeneratedReport[]> {
    const supabase = createServerSupabase()
    let query = supabase
      .from('cs_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('generated_at', { ascending: false })

    if (filters?.report_type) {
      query = query.eq('report_type', filters.report_type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data: reports, error } = await query

    if (error) {
      throw error
    }

    return (reports || []).map((report) => ({
      report_id: report.report_id,
      report_name: report.report_name,
      report_type: report.report_type,
      report_data: report.report_data,
      report_config: report.report_config,
      period_start: report.period_start,
      period_end: report.period_end,
      status: report.status,
      file_path: report.file_path,
      file_url: report.file_url,
      generated_at: report.generated_at,
    }))
  }

  /**
   * Log report access
   */
  static async logReportAccess(
    reportId: string,
    userId: string,
    accessType: 'viewed' | 'downloaded' | 'shared',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const supabase = createServerSupabase()
    await supabase.from('cs_report_access_logs').insert({
      report_id: reportId,
      user_id: userId,
      access_type: accessType,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
  }
}
