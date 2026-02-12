import { createServerSupabase } from '@/lib/db/supabase'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

export interface AgentPerformanceMetrics {
  agent_id: string
  agent_name: string
  agent_email: string
  period_start: string
  period_end: string
  
  // Ticket Metrics
  tickets_assigned: number
  tickets_resolved: number
  tickets_closed: number
  resolution_rate: number // Percentage of assigned tickets resolved
  
  // Time Metrics (in seconds)
  avg_response_time: number
  avg_resolution_time: number
  first_response_time_p95: number // 95th percentile
  resolution_time_p95: number // 95th percentile
  
  // Quality Metrics
  csat_score: number | null
  csat_count: number
  nps_score: number | null
  nps_count: number
  
  // SLA Metrics
  sla_compliance_rate: number // Percentage of tickets within SLA
  sla_breaches: number
  sla_warnings: number
  
  // Additional Metrics
  reopened_tickets: number
  escalated_tickets: number
  avg_tickets_per_day: number
  active_days: number
}

export interface TeamPerformanceMetrics {
  total_agents: number
  active_agents: number
  total_tickets: number
  total_resolved: number
  avg_resolution_rate: number
  avg_response_time: number
  avg_resolution_time: number
  avg_csat_score: number
  avg_sla_compliance: number
  top_performers: AgentPerformanceMetrics[]
  needs_improvement: AgentPerformanceMetrics[]
}

export interface PerformanceComparison {
  agent_id: string
  agent_name: string
  metrics: AgentPerformanceMetrics
  vs_team_avg: {
    resolution_rate_diff: number
    response_time_diff: number
    resolution_time_diff: number
    csat_diff: number
    sla_compliance_diff: number
  }
  rank: number
  percentile: number
}

export class AgentPerformanceService {
  /**
   * Calculate and get agent performance metrics for a specific agent
   */
  static async getAgentMetrics(
    agentId: string,
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<AgentPerformanceMetrics | null> {
    const supabase = createServerSupabase()

    // Get agent info - need to query by member_id
    const { data: teamMember, error: memberError } = await supabase
      .from('cs_team_members')
      .select('*')
      .eq('member_id', agentId)
      .single()

    if (memberError || !teamMember) {
      return null
    }

    // Get user info from Clerk (we'll use metadata or clerk_user_id)
    // For now, use clerk_user_id as email/name placeholder

    // Get all tickets assigned to this agent in the period
    const { data: tickets, error } = await supabase
      .from('cs_tickets')
      .select('*, cs_survey_responses(survey_type, response_value), cs_sla_tracking(*)')
      .eq('tenant_id', tenantId)
      .eq('assigned_to', agentId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      throw error
    }

    if (!tickets || tickets.length === 0) {
      return this.createEmptyMetrics(agentId, teamMember, periodStart, periodEnd)
    }

    // Calculate metrics
    const metrics = await this.calculateMetrics(tickets, agentId, teamMember, periodStart, periodEnd)

    return metrics
  }

  /**
   * Get performance metrics for all agents in a team
   */
  static async getTeamMetrics(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TeamPerformanceMetrics> {
    const supabase = createServerSupabase()

    // Get all active team members
    // Note: We'll filter by tickets assigned to them in the tenant
    const teamMembers = await TeamMemberRepository.findAll({ isActive: true })

    // Get metrics for each agent (only those with tickets in this tenant)
    const agentMetrics: AgentPerformanceMetrics[] = []
    for (const member of teamMembers) {
      const metrics = await this.getAgentMetrics(member.member_id, tenantId, periodStart, periodEnd)
      if (metrics && metrics.tickets_assigned > 0) {
        agentMetrics.push(metrics)
      }
    }

    // Calculate team averages
    const totalTickets = agentMetrics.reduce((sum, m) => sum + m.tickets_assigned, 0)
    const totalResolved = agentMetrics.reduce((sum, m) => sum + m.tickets_resolved, 0)
    const avgResolutionRate = totalTickets > 0 ? (totalResolved / totalTickets) * 100 : 0

    const activeAgentsCount = agentMetrics.filter((m) => m.tickets_assigned > 0).length

    const responseTimes = agentMetrics
      .filter((m) => m.avg_response_time > 0)
      .map((m) => m.avg_response_time)
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0

    const resolutionTimes = agentMetrics
      .filter((m) => m.avg_resolution_time > 0)
      .map((m) => m.avg_resolution_time)
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
      : 0

    const csatScores = agentMetrics
      .filter((m) => m.csat_score !== null)
      .map((m) => m.csat_score!)
    const avgCsatScore = csatScores.length > 0
      ? csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length
      : 0

    const slaComplianceRates = agentMetrics
      .filter((m) => m.sla_compliance_rate > 0)
      .map((m) => m.sla_compliance_rate)
    const avgSlaCompliance = slaComplianceRates.length > 0
      ? slaComplianceRates.reduce((sum, r) => sum + r, 0) / slaComplianceRates.length
      : 0

    // Sort by performance (resolution rate + CSAT + SLA compliance)
    const sortedMetrics = [...agentMetrics].sort((a, b) => {
      const scoreA = a.resolution_rate * 0.4 + (a.csat_score || 0) * 0.3 + a.sla_compliance_rate * 0.3
      const scoreB = b.resolution_rate * 0.4 + (b.csat_score || 0) * 0.3 + b.sla_compliance_rate * 0.3
      return scoreB - scoreA
    })

    const topPerformers = sortedMetrics.slice(0, 3)
    const needsImprovement = sortedMetrics.slice(-3).reverse()

    return {
      total_agents: teamMembers.length,
      active_agents: activeAgentsCount,
      total_tickets: totalTickets,
      total_resolved: totalResolved,
      avg_resolution_rate: avgResolutionRate,
      avg_response_time: avgResponseTime,
      avg_resolution_time: avgResolutionTime,
      avg_csat_score: avgCsatScore,
      avg_sla_compliance: avgSlaCompliance,
      top_performers: topPerformers,
      needs_improvement: needsImprovement,
    }
  }

  /**
   * Compare agent performance against team average
   */
  static async getAgentComparison(
    agentId: string,
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<PerformanceComparison | null> {
    const agentMetrics = await this.getAgentMetrics(agentId, tenantId, periodStart, periodEnd)
    if (!agentMetrics) {
      return null
    }

    const teamMetrics = await this.getTeamMetrics(tenantId, periodStart, periodEnd)

    // Calculate differences
    const vsTeamAvg = {
      resolution_rate_diff: agentMetrics.resolution_rate - teamMetrics.avg_resolution_rate,
      response_time_diff: agentMetrics.avg_response_time - teamMetrics.avg_response_time,
      resolution_time_diff: agentMetrics.avg_resolution_time - teamMetrics.avg_resolution_time,
      csat_diff: (agentMetrics.csat_score || 0) - teamMetrics.avg_csat_score,
      sla_compliance_diff: agentMetrics.sla_compliance_rate - teamMetrics.avg_sla_compliance,
    }

    // Calculate rank and percentile
    const allAgents = await this.getAllAgentMetrics(tenantId, periodStart, periodEnd)
    const sortedByPerformance = allAgents.sort((a, b) => {
      const scoreA = a.resolution_rate * 0.4 + (a.csat_score || 0) * 0.3 + a.sla_compliance_rate * 0.3
      const scoreB = b.resolution_rate * 0.4 + (b.csat_score || 0) * 0.3 + b.sla_compliance_rate * 0.3
      return scoreB - scoreA
    })

    const rank = sortedByPerformance.findIndex((a) => a.agent_id === agentId) + 1
    const percentile = allAgents.length > 0 ? ((allAgents.length - rank + 1) / allAgents.length) * 100 : 0

    return {
      agent_id: agentId,
      agent_name: agentMetrics.agent_name,
      metrics: agentMetrics,
      vs_team_avg: vsTeamAvg,
      rank,
      percentile,
    }
  }

  /**
   * Calculate metrics from tickets
   */
  private static async calculateMetrics(
    tickets: any[],
    agentId: string,
    teamMember: any,
    periodStart: string,
    periodEnd: string
  ): Promise<AgentPerformanceMetrics> {
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed')
    const closedTickets = tickets.filter((t) => t.status === 'closed')
    const reopenedTickets = tickets.filter((t) => t.metadata?.reopened_count > 0)
    const escalatedTickets = tickets.filter((t) => t.metadata?.escalated === true)

    // Calculate response times
    const responseTimes: number[] = []
    const resolutionTimes: number[] = []

    for (const ticket of tickets) {
      if (ticket.metadata?.first_response_at) {
        const firstResponseTime = new Date(ticket.metadata.first_response_at).getTime()
        const createdTime = new Date(ticket.created_at).getTime()
        const responseTimeSeconds = (firstResponseTime - createdTime) / 1000
        if (responseTimeSeconds > 0) {
          responseTimes.push(responseTimeSeconds)
        }
      }

      if (ticket.resolved_at) {
        const resolvedTime = new Date(ticket.resolved_at).getTime()
        const createdTime = new Date(ticket.created_at).getTime()
        const resolutionTimeSeconds = (resolvedTime - createdTime) / 1000
        if (resolutionTimeSeconds > 0) {
          resolutionTimes.push(resolutionTimeSeconds)
        }
      }
    }

    // Calculate percentiles
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b)
    const sortedResolutionTimes = [...resolutionTimes].sort((a, b) => a - b)
    const p95Index = (arr: number[]) => Math.floor(arr.length * 0.95)

    // Get CSAT and NPS scores
    const csatResponses: number[] = []
    const npsResponses: number[] = []

    for (const ticket of tickets) {
      if (ticket.cs_survey_responses) {
        for (const response of ticket.cs_survey_responses) {
          if (response.survey_type === 'csat' && response.response_value) {
            csatResponses.push(parseFloat(response.response_value))
          } else if (response.survey_type === 'nps' && response.response_value) {
            npsResponses.push(parseInt(response.response_value))
          }
        }
      }
    }

    // Calculate SLA metrics
    let slaCompliant = 0
    let slaBreaches = 0
    let slaWarnings = 0

    for (const ticket of tickets) {
      if (ticket.cs_sla_tracking && ticket.cs_sla_tracking.length > 0) {
        const tracking = ticket.cs_sla_tracking[0]
        if (tracking.first_response_breached || tracking.resolution_breached) {
          slaBreaches++
        } else if (tracking.warning_sent) {
          slaWarnings++
        } else {
          slaCompliant++
        }
      }
    }

    const totalSlaTickets = slaCompliant + slaBreaches + slaWarnings
    const slaComplianceRate = totalSlaTickets > 0 ? (slaCompliant / totalSlaTickets) * 100 : 0

    // Calculate active days
    const uniqueDays = new Set(
      tickets.map((t) => new Date(t.created_at).toISOString().split('T')[0])
    ).size

    return {
      agent_id: agentId,
      agent_name: teamMember.name || teamMember.email || 'Unknown',
      agent_email: teamMember.email || '',
      period_start: periodStart,
      period_end: periodEnd,
      tickets_assigned: tickets.length,
      tickets_resolved: resolvedTickets.length,
      tickets_closed: closedTickets.length,
      resolution_rate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
      avg_response_time: responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0,
      avg_resolution_time: resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
        : 0,
      first_response_time_p95: sortedResponseTimes.length > 0
        ? sortedResponseTimes[p95Index(sortedResponseTimes)]
        : 0,
      resolution_time_p95: sortedResolutionTimes.length > 0
        ? sortedResolutionTimes[p95Index(sortedResolutionTimes)]
        : 0,
      csat_score: csatResponses.length > 0
        ? csatResponses.reduce((sum, s) => sum + s, 0) / csatResponses.length
        : null,
      csat_count: csatResponses.length,
      nps_score: npsResponses.length > 0
        ? npsResponses.reduce((sum, s) => sum + s, 0) / npsResponses.length
        : null,
      nps_count: npsResponses.length,
      sla_compliance_rate: slaComplianceRate,
      sla_breaches: slaBreaches,
      sla_warnings: slaWarnings,
      reopened_tickets: reopenedTickets.length,
      escalated_tickets: escalatedTickets.length,
      avg_tickets_per_day: uniqueDays > 0 ? tickets.length / uniqueDays : 0,
      active_days: uniqueDays,
    }
  }

  /**
   * Create empty metrics for agent with no tickets
   */
  private static createEmptyMetrics(
    agentId: string,
    teamMember: any,
    periodStart: string,
    periodEnd: string
  ): AgentPerformanceMetrics {
    // Use metadata or clerk_user_id for name/email
    const userName = (teamMember.metadata as any)?.name || teamMember.clerk_user_id || 'Unknown'
    const userEmail = (teamMember.metadata as any)?.email || teamMember.clerk_user_id || ''

    return {
      agent_id: agentId,
      agent_name: userName,
      agent_email: userEmail,
      period_start: periodStart,
      period_end: periodEnd,
      tickets_assigned: 0,
      tickets_resolved: 0,
      tickets_closed: 0,
      resolution_rate: 0,
      avg_response_time: 0,
      avg_resolution_time: 0,
      first_response_time_p95: 0,
      resolution_time_p95: 0,
      csat_score: null,
      csat_count: 0,
      nps_score: null,
      nps_count: 0,
      sla_compliance_rate: 0,
      sla_breaches: 0,
      sla_warnings: 0,
      reopened_tickets: 0,
      escalated_tickets: 0,
      avg_tickets_per_day: 0,
      active_days: 0,
    }
  }

  /**
   * Get metrics for all agents
   */
  private static async getAllAgentMetrics(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<AgentPerformanceMetrics[]> {
    const teamMembers = await TeamMemberRepository.findAll({ isActive: true })

    const allMetrics: AgentPerformanceMetrics[] = []
    for (const member of teamMembers) {
      const metrics = await this.getAgentMetrics(member.member_id, tenantId, periodStart, periodEnd)
      if (metrics && metrics.tickets_assigned > 0) {
        allMetrics.push(metrics)
      }
    }

    return allMetrics
  }
}
