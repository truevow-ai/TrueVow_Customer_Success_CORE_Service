/**
 * Analytics Service
 * Provides metrics and analytics for CS Support dashboard
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

export interface TimeRange {
  from: string
  to: string
}

export interface TicketVolumeMetrics {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  byChannel: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  trend: Array<{ date: string; count: number }>
}

export interface ResponseTimeMetrics {
  average: number // in minutes
  median: number
  p95: number
  p99: number
  byChannel: Record<string, number>
  byPriority: Record<string, number>
  trend: Array<{ date: string; avgMinutes: number }>
}

export interface ResolutionTimeMetrics {
  average: number // in hours
  median: number
  p95: number
  p99: number
  byChannel: Record<string, number>
  byPriority: Record<string, number>
  trend: Array<{ date: string; avgHours: number }>
}

export interface CSATMetrics {
  average: number // 0-100
  count: number
  distribution: Record<string, number> // 1-5 stars
  trend: Array<{ date: string; average: number; count: number }>
  byChannel: Record<string, number>
  byAgent: Record<string, number>
}

export interface NPSMetrics {
  score: number // -100 to 100
  count: number
  promoters: number // 9-10
  passives: number // 7-8
  detractors: number // 0-6
  trend: Array<{ date: string; score: number; count: number }>
  byChannel: Record<string, number>
  byAgent: Record<string, number>
}

export interface SLAMetrics {
  complianceRate: number // percentage
  totalTickets: number
  compliantTickets: number
  breachedTickets: number
  warningTickets: number
  firstResponseCompliance: number
  resolutionCompliance: number
  trend: Array<{ date: string; complianceRate: number; breaches: number }>
}

export interface AgentPerformanceMetrics {
  agentId: string
  agentName: string
  ticketsAssigned: number
  ticketsResolved: number
  averageResponseTime: number // minutes
  averageResolutionTime: number // hours
  csatScore: number
  customerSatisfaction: number
  firstContactResolution: number // percentage
}

export interface DashboardMetrics {
  ticketVolume: TicketVolumeMetrics
  responseTime: ResponseTimeMetrics
  resolutionTime: ResolutionTimeMetrics
  csat: CSATMetrics
  nps: NPSMetrics
  sla: SLAMetrics
  agentPerformance: AgentPerformanceMetrics[]
  summary: {
    totalTickets: number
    openTickets: number
    averageResponseTime: number
    averageResolutionTime: number
    averageCSAT: number
    npsScore: number
    slaComplianceRate: number
    activeAgents: number
  }
}

export class AnalyticsService {
  /**
   * Get comprehensive dashboard metrics
   */
  static async getDashboardMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<DashboardMetrics> {
    const [ticketVolume, responseTime, resolutionTime, csat, nps, sla, agentPerformance] = await Promise.all([
      this.getTicketVolumeMetrics(tenantId, timeRange),
      this.getResponseTimeMetrics(tenantId, timeRange),
      this.getResolutionTimeMetrics(tenantId, timeRange),
      this.getCSATMetrics(tenantId, timeRange),
      this.getNPSMetrics(tenantId, timeRange),
      this.getSLAMetrics(tenantId, timeRange),
      this.getAgentPerformanceMetrics(tenantId, timeRange),
    ])

    return {
      ticketVolume,
      responseTime,
      resolutionTime,
      csat,
      nps,
      sla,
      agentPerformance,
      summary: {
        totalTickets: ticketVolume.total,
        openTickets: ticketVolume.open + ticketVolume.in_progress,
        averageResponseTime: responseTime.average,
        averageResolutionTime: resolutionTime.average,
        averageCSAT: csat.average,
        npsScore: nps.score,
        slaComplianceRate: sla.complianceRate,
        activeAgents: agentPerformance.length,
      },
    }
  }

  /**
   * Get ticket volume metrics
   */
  static async getTicketVolumeMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<TicketVolumeMetrics> {
    const supabase = await createServerSupabase()

    // Get all tickets in time range
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to)

    if (!tickets) {
      return this.getEmptyTicketVolumeMetrics()
    }

    const byChannel: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    let open = 0
    let in_progress = 0
    let resolved = 0
    let closed = 0

    // Group by date for trend
    const dateMap = new Map<string, number>()

    for (const ticket of tickets) {
      // Count by status
      if (ticket.status === 'open') open++
      else if (ticket.status === 'in_progress') in_progress++
      else if (ticket.status === 'resolved') resolved++
      else if (ticket.status === 'closed') closed++

      // Count by channel
      const channel = ticket.channel || 'unknown'
      byChannel[channel] = (byChannel[channel] || 0) + 1

      // Count by priority
      const priority = ticket.priority || 'medium'
      byPriority[priority] = (byPriority[priority] || 0) + 1

      // Count by status
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1

      // Trend data
      const date = ticket.created_at.split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    }

    const trend = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total: tickets.length,
      open,
      in_progress,
      resolved,
      closed,
      byChannel,
      byPriority,
      byStatus,
      trend,
    }
  }

  /**
   * Get response time metrics
   */
  static async getResponseTimeMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<ResponseTimeMetrics> {
    const supabase = await createServerSupabase()

    // Get tickets with first response time
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('ticket_id, created_at, channel, priority, metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to)
      .not('metadata->first_response_at', 'is', null)

    if (!tickets || tickets.length === 0) {
      return this.getEmptyResponseTimeMetrics()
    }

    // Get first messages for each ticket
    const responseTimes: number[] = []
    const byChannel: Record<string, number[]> = {}
    const byPriority: Record<string, number[]> = {}
    const dateMap = new Map<string, number[]>()

    for (const ticket of tickets) {
      const firstResponseAt = ticket.metadata?.first_response_at
      if (!firstResponseAt) continue

      const created = new Date(ticket.created_at).getTime()
      const responded = new Date(firstResponseAt).getTime()
      const minutes = (responded - created) / (1000 * 60)

      responseTimes.push(minutes)

      // Group by channel
      const channel = ticket.channel || 'unknown'
      if (!byChannel[channel]) byChannel[channel] = []
      byChannel[channel].push(minutes)

      // Group by priority
      const priority = ticket.priority || 'medium'
      if (!byPriority[priority]) byPriority[priority] = []
      byPriority[priority].push(minutes)

      // Trend data
      const date = ticket.created_at.split('T')[0]
      if (!dateMap.has(date)) dateMap.set(date, [])
      dateMap.get(date)!.push(minutes)
    }

    const sorted = [...responseTimes].sort((a, b) => a - b)
    const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    const byChannelAvg: Record<string, number> = {}
    for (const [channel, times] of Object.entries(byChannel)) {
      byChannelAvg[channel] = times.reduce((a, b) => a + b, 0) / times.length
    }

    const byPriorityAvg: Record<string, number> = {}
    for (const [priority, times] of Object.entries(byPriority)) {
      byPriorityAvg[priority] = times.reduce((a, b) => a + b, 0) / times.length
    }

    const trend = Array.from(dateMap.entries())
      .map(([date, times]) => ({
        date,
        avgMinutes: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      average,
      median,
      p95,
      p99,
      byChannel: byChannelAvg,
      byPriority: byPriorityAvg,
      trend,
    }
  }

  /**
   * Get resolution time metrics
   */
  static async getResolutionTimeMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<ResolutionTimeMetrics> {
    const supabase = await createServerSupabase()

    // Get resolved/closed tickets
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('ticket_id, created_at, resolved_at, channel, priority')
      .eq('tenant_id', tenantId)
      .in('status', ['resolved', 'closed'])
      .not('resolved_at', 'is', null)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to)

    if (!tickets || tickets.length === 0) {
      return this.getEmptyResolutionTimeMetrics()
    }

    const resolutionTimes: number[] = []
    const byChannel: Record<string, number[]> = {}
    const byPriority: Record<string, number[]> = {}
    const dateMap = new Map<string, number[]>()

    for (const ticket of tickets) {
      if (!ticket.resolved_at) continue

      const created = new Date(ticket.created_at).getTime()
      const resolved = new Date(ticket.resolved_at).getTime()
      const hours = (resolved - created) / (1000 * 60 * 60)

      resolutionTimes.push(hours)

      const channel = ticket.channel || 'unknown'
      if (!byChannel[channel]) byChannel[channel] = []
      byChannel[channel].push(hours)

      const priority = ticket.priority || 'medium'
      if (!byPriority[priority]) byPriority[priority] = []
      byPriority[priority].push(hours)

      const date = ticket.resolved_at.split('T')[0]
      if (!dateMap.has(date)) dateMap.set(date, [])
      dateMap.get(date)!.push(hours)
    }

    const sorted = [...resolutionTimes].sort((a, b) => a - b)
    const average = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    const byChannelAvg: Record<string, number> = {}
    for (const [channel, times] of Object.entries(byChannel)) {
      byChannelAvg[channel] = times.reduce((a, b) => a + b, 0) / times.length
    }

    const byPriorityAvg: Record<string, number> = {}
    for (const [priority, times] of Object.entries(byPriority)) {
      byPriorityAvg[priority] = times.reduce((a, b) => a + b, 0) / times.length
    }

    const trend = Array.from(dateMap.entries())
      .map(([date, times]) => ({
        date,
        avgHours: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      average,
      median,
      p95,
      p99,
      byChannel: byChannelAvg,
      byPriority: byPriorityAvg,
      trend,
    }
  }

  /**
   * Get CSAT metrics
   */
  static async getCSATMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<CSATMetrics> {
    const supabase = await createServerSupabase()

    // Get tickets with CSAT scores
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('ticket_id, csat_score, resolved_at, channel, assigned_to')
      .eq('tenant_id', tenantId)
      .not('csat_score', 'is', null)
      .gte('resolved_at', timeRange.from)
      .lte('resolved_at', timeRange.to)

    if (!tickets || tickets.length === 0) {
      return this.getEmptyCSATMetrics()
    }

    const scores: number[] = []
    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    const byChannel: Record<string, number[]> = {}
    const byAgent: Record<string, number[]> = {}
    const dateMap = new Map<string, { sum: number; count: number }>()

    for (const ticket of tickets) {
      const score = ticket.csat_score
      if (!score || score < 1 || score > 5) continue

      scores.push(score)
      distribution[score.toString()] = (distribution[score.toString()] || 0) + 1

      const channel = ticket.channel || 'unknown'
      if (!byChannel[channel]) byChannel[channel] = []
      byChannel[channel].push(score)

      if (ticket.assigned_to) {
        if (!byAgent[ticket.assigned_to]) byAgent[ticket.assigned_to] = []
        byAgent[ticket.assigned_to].push(score)
      }

      if (ticket.resolved_at) {
        const date = ticket.resolved_at.split('T')[0]
        const existing = dateMap.get(date) || { sum: 0, count: 0 }
        dateMap.set(date, { sum: existing.sum + score, count: existing.count + 1 })
      }
    }

    const average = scores.reduce((a, b) => a + b, 0) / scores.length

    const byChannelAvg: Record<string, number> = {}
    for (const [channel, channelScores] of Object.entries(byChannel)) {
      byChannelAvg[channel] = channelScores.reduce((a, b) => a + b, 0) / channelScores.length
    }

    const byAgentAvg: Record<string, number> = {}
    for (const [agent, agentScores] of Object.entries(byAgent)) {
      byAgentAvg[agent] = agentScores.reduce((a, b) => a + b, 0) / agentScores.length
    }

    const trend = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        average: data.sum / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      average,
      count: scores.length,
      distribution,
      trend,
      byChannel: byChannelAvg,
      byAgent: byAgentAvg,
    }
  }

  /**
   * Get agent performance metrics
   */
  static async getAgentPerformanceMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<AgentPerformanceMetrics[]> {
    const supabase = await createServerSupabase()

    // Get all team members (we'll filter by tickets assigned to them)
    const teamMembers = await TeamMemberRepository.findAll({ isActive: true })

    // Get tickets for this tenant assigned to any team member
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('assigned_to', 'is', null)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to)

    if (!tickets || tickets.length === 0) {
      return []
    }

    // Get unique assigned agent IDs from tickets
    const assignedAgentIds = [...new Set(tickets.map((t: any) => t.assigned_to).filter(Boolean))]
    
    // Filter team members to only those who have assigned tickets
    const tenantMembers = teamMembers.filter((m) => assignedAgentIds.includes(m.member_id))

    if (!tickets) {
      return []
    }

    // Group tickets by agent
    const agentMap = new Map<string, any[]>()

    for (const ticket of tickets) {
      if (!ticket.assigned_to) continue
      if (!agentMap.has(ticket.assigned_to)) {
        agentMap.set(ticket.assigned_to, [])
      }
      agentMap.get(ticket.assigned_to)!.push(ticket)
    }

    // Only process agents that have tickets
    const agentsWithTickets = tenantMembers.filter((m) => agentMap.has(m.member_id))

    // Calculate metrics for each agent
    const metrics: AgentPerformanceMetrics[] = []

    for (const member of agentsWithTickets) {
      const agentTickets = agentMap.get(member.member_id) || []
      const resolvedTickets = agentTickets.filter((t) => t.status === 'resolved' || t.status === 'closed')

      // Calculate response times
      const responseTimes: number[] = []
      const resolutionTimes: number[] = []
      const csatScores: number[] = []

      for (const ticket of agentTickets) {
        if (ticket.metadata?.first_response_at) {
          const created = new Date(ticket.created_at).getTime()
          const responded = new Date(ticket.metadata.first_response_at).getTime()
          responseTimes.push((responded - created) / (1000 * 60))
        }

        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at).getTime()
          const resolved = new Date(ticket.resolved_at).getTime()
          resolutionTimes.push((resolved - created) / (1000 * 60 * 60))
        }

        if (ticket.csat_score) {
          csatScores.push(ticket.csat_score)
        }
      }

      // First contact resolution (tickets resolved without reopening)
      const supabase = await createServerSupabase()

      const ticketIds = resolvedTickets.map((t: any) => t.ticket_id)
      const { data: activityLogs } = await supabase
        .from('cs_ticket_activity_log')
        .select('ticket_id, old_status, new_status')
        .in('ticket_id', ticketIds)
        .eq('activity_type', 'status_changed')

      const reopenedTicketIds = new Set(
        (activityLogs || [])
          .filter((entry: any) => entry.old_status === 'closed' && entry.new_status === 'open')
          .map((entry: any) => entry.ticket_id)
      )

      const fcrTickets = resolvedTickets.filter((ticket: any) => !reopenedTicketIds.has(ticket.ticket_id))
      const firstContactResolution = resolvedTickets.length > 0
        ? (fcrTickets.length / resolvedTickets.length) * 100
        : 0

      const agentName = member.metadata?.name || 
        `${member.metadata?.first_name || ''} ${member.metadata?.last_name || ''}`.trim() ||
        member.metadata?.email ||
        member.clerk_user_id ||
        'Unknown'

      metrics.push({
        agentId: member.member_id,
        agentName,
        ticketsAssigned: agentTickets.length,
        ticketsResolved: resolvedTickets.length,
        averageResponseTime: responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
        averageResolutionTime: resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0,
        csatScore: csatScores.length > 0
          ? csatScores.reduce((a, b) => a + b, 0) / csatScores.length
          : 0,
        customerSatisfaction: csatScores.length > 0
          ? (csatScores.filter((s) => s >= 4).length / csatScores.length) * 100
          : 0,
        firstContactResolution,
      })
    }

    return metrics.sort((a, b) => b.ticketsResolved - a.ticketsResolved)
  }

  /**
   * Get NPS (Net Promoter Score) metrics
   */
  static async getNPSMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<NPSMetrics> {
    const supabase = await createServerSupabase()

    // Get NPS survey responses
    const { data: responses } = await supabase
      .from('cs_survey_responses')
      .select('score, ticket_id, responded_at')
      .eq('tenant_id', tenantId)
      .eq('survey_type', 'nps')
      .gte('responded_at', timeRange.from)
      .lte('responded_at', timeRange.to)
      .not('score', 'is', null)

    if (!responses || responses.length === 0) {
      return this.getEmptyNPSMetrics()
    }

    const scores = responses.map((r: any) => parseInt(r.score) || 0)
    const promoters = scores.filter((s) => s >= 9).length
    const passives = scores.filter((s) => s >= 7 && s <= 8).length
    const detractors = scores.filter((s) => s <= 6).length
    const total = scores.length

    // Calculate NPS score: ((Promoters - Detractors) / Total) * 100
    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0

    // Get tickets for channel/agent breakdown
    const ticketIds = [...new Set(responses.map((r: any) => r.ticket_id).filter(Boolean))]
    const { data: tickets } = ticketIds.length > 0
      ? await supabase
          .from('cs_tickets')
          .select('ticket_id, channel, assigned_to')
          .in('ticket_id', ticketIds)
      : { data: [] }

    const ticketMap = new Map((tickets || []).map((t: any) => [t.ticket_id, t]))

    // Group by channel and agent
    const byChannel: Record<string, number[]> = {}
    const byAgent: Record<string, number[]> = {}
    const dateMap = new Map<string, number[]>()

    for (const response of responses) {
      const score = parseInt(response.score) || 0
      const ticket = ticketMap.get(response.ticket_id)

      if (ticket) {
        const channel = ticket.channel || 'unknown'
        if (!byChannel[channel]) byChannel[channel] = []
        byChannel[channel].push(score)

        if (ticket.assigned_to) {
          if (!byAgent[ticket.assigned_to]) byAgent[ticket.assigned_to] = []
          byAgent[ticket.assigned_to].push(score)
        }
      }

      // Trend data
      const date = response.responded_at?.split('T')[0]
      if (date) {
        if (!dateMap.has(date)) dateMap.set(date, [])
        dateMap.get(date)!.push(score)
      }
    }

    // Calculate averages
    const byChannelAvg: Record<string, number> = {}
    for (const [channel, channelScores] of Object.entries(byChannel)) {
      const channelPromoters = channelScores.filter((s) => s >= 9).length
      const channelDetractors = channelScores.filter((s) => s <= 6).length
      byChannelAvg[channel] = channelScores.length > 0
        ? Math.round(((channelPromoters - channelDetractors) / channelScores.length) * 100)
        : 0
    }

    const byAgentAvg: Record<string, number> = {}
    for (const [agent, agentScores] of Object.entries(byAgent)) {
      const agentPromoters = agentScores.filter((s) => s >= 9).length
      const agentDetractors = agentScores.filter((s) => s <= 6).length
      byAgentAvg[agent] = agentScores.length > 0
        ? Math.round(((agentPromoters - agentDetractors) / agentScores.length) * 100)
        : 0
    }

    // Trend
    const trend = Array.from(dateMap.entries())
      .map(([date, dateScores]) => {
        const datePromoters = dateScores.filter((s) => s >= 9).length
        const dateDetractors = dateScores.filter((s) => s <= 6).length
        return {
          date,
          score: dateScores.length > 0
            ? Math.round(((datePromoters - dateDetractors) / dateScores.length) * 100)
            : 0,
          count: dateScores.length,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      score: npsScore,
      count: total,
      promoters,
      passives,
      detractors,
      trend,
      byChannel: byChannelAvg,
      byAgent: byAgentAvg,
    }
  }

  /**
   * Get SLA compliance metrics
   */
  static async getSLAMetrics(
    tenantId: string,
    timeRange: TimeRange
  ): Promise<SLAMetrics> {
    const supabase = await createServerSupabase()

    // Get tickets with SLA tracking
    const { data: tickets } = await supabase
      .from('cs_tickets')
      .select('ticket_id, created_at, metadata, sla_first_response_target, sla_resolution_target, resolved_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to)

    if (!tickets || tickets.length === 0) {
      return this.getEmptySLAMetrics()
    }

    let compliantTickets = 0
    let breachedTickets = 0
    let warningTickets = 0
    let firstResponseCompliant = 0
    let firstResponseTotal = 0
    let resolutionCompliant = 0
    let resolutionTotal = 0
    const dateMap = new Map<string, { compliant: number; breaches: number }>()

    for (const ticket of tickets) {
      const slaTracking = ticket.metadata?.sla_tracking || {}
      const firstResponseBreached = slaTracking.first_response_breached || false
      const resolutionBreached = slaTracking.resolution_breached || false
      const warningSent = slaTracking.warning_sent || false

      // Check first response SLA
      if (ticket.metadata?.first_response_at && ticket.sla_first_response_target) {
        firstResponseTotal++
        const responded = new Date(ticket.metadata.first_response_at).getTime()
        const target = new Date(ticket.sla_first_response_target).getTime()
        if (responded <= target && !firstResponseBreached) {
          firstResponseCompliant++
        }
      }

      // Check resolution SLA
      if (ticket.resolved_at && ticket.sla_resolution_target) {
        resolutionTotal++
        const resolved = new Date(ticket.resolved_at).getTime()
        const target = new Date(ticket.sla_resolution_target).getTime()
        if (resolved <= target && !resolutionBreached) {
          resolutionCompliant++
        }
      }

      // Overall compliance
      if (firstResponseBreached || resolutionBreached) {
        breachedTickets++
      } else if (warningSent) {
        warningTickets++
      } else {
        compliantTickets++
      }

      // Trend data
      const date = ticket.created_at.split('T')[0]
      const existing = dateMap.get(date) || { compliant: 0, breaches: 0 }
      if (firstResponseBreached || resolutionBreached) {
        existing.breaches++
      } else {
        existing.compliant++
      }
      dateMap.set(date, existing)
    }

    const totalTickets = tickets.length
    const complianceRate = totalTickets > 0
      ? (compliantTickets / totalTickets) * 100
      : 0

    const firstResponseCompliance = firstResponseTotal > 0
      ? (firstResponseCompliant / firstResponseTotal) * 100
      : 0

    const resolutionCompliance = resolutionTotal > 0
      ? (resolutionCompliant / resolutionTotal) * 100
      : 0

    const trend = Array.from(dateMap.entries())
      .map(([date, data]) => {
        const total = data.compliant + data.breaches
        return {
          date,
          complianceRate: total > 0 ? (data.compliant / total) * 100 : 0,
          breaches: data.breaches,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      complianceRate,
      totalTickets,
      compliantTickets,
      breachedTickets,
      warningTickets,
      firstResponseCompliance,
      resolutionCompliance,
      trend,
    }
  }

  // Helper methods for empty metrics
  private static getEmptyTicketVolumeMetrics(): TicketVolumeMetrics {
    return {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      byChannel: {},
      byPriority: {},
      byStatus: {},
      trend: [],
    }
  }

  private static getEmptyResponseTimeMetrics(): ResponseTimeMetrics {
    return {
      average: 0,
      median: 0,
      p95: 0,
      p99: 0,
      byChannel: {},
      byPriority: {},
      trend: [],
    }
  }

  private static getEmptyResolutionTimeMetrics(): ResolutionTimeMetrics {
    return {
      average: 0,
      median: 0,
      p95: 0,
      p99: 0,
      byChannel: {},
      byPriority: {},
      trend: [],
    }
  }

  private static getEmptyCSATMetrics(): CSATMetrics {
    return {
      average: 0,
      count: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      trend: [],
      byChannel: {},
      byAgent: {},
    }
  }

  private static getEmptyNPSMetrics(): NPSMetrics {
    return {
      score: 0,
      count: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      trend: [],
      byChannel: {},
      byAgent: {},
    }
  }

  private static getEmptySLAMetrics(): SLAMetrics {
    return {
      complianceRate: 0,
      totalTickets: 0,
      compliantTickets: 0,
      breachedTickets: 0,
      warningTickets: 0,
      firstResponseCompliance: 0,
      resolutionCompliance: 0,
      trend: [],
    }
  }
}
