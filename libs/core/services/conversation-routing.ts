/**
 * Conversation Routing Service
 *
 * Deterministic, rules-based routing for incoming conversations and tickets.
 * CS Core is LLM-free — routing uses configurable rules, not AI inference.
 *
 * Routing strategies:
 * - round_robin: Distributes evenly among available agents
 * - skill_match: Matches conversation topic to agent skills
 * - priority_based: Routes based on ticket priority + agent seniority
 * - static_assign: Always assigns to a specific agent/CSM
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface RoutingRule {
  rule_id: string
  tenant_id: string | null
  rule_name: string
  rule_type: 'round_robin' | 'skill_match' | 'priority_based' | 'static_assign'
  rule_config: Record<string, any>
  rule_conditions: Record<string, any>
  rule_priority: number
  is_active: boolean
}

export interface RoutingResult {
  assigned_to: string | null
  rule_applied: string | null
  reason: string
  candidates: string[]
}

export class ConversationRoutingService {
  /**
   * Find the best agent for an incoming conversation
   */
  static async routeConversation(
    tenantId: string,
    ticketData: {
      channel?: string
      priority?: string
      category?: string
      subject?: string
      customer_email?: string
    }
  ): Promise<RoutingResult> {
    const supabase = await createServerSupabase()

    const { data: rules } = await supabase
      .from('cs_conversation_routing_rules')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .eq('is_active', true)
      .order('rule_priority', { ascending: false })

    if (!rules || rules.length === 0) {
      return this.fallbackRoute(tenantId)
    }

    for (const rule of rules) {
      const result = await this.applyRule(rule, tenantId, ticketData)
      if (result.assigned_to) return result
    }

    return this.fallbackRoute(tenantId)
  }

  private static async applyRule(
    rule: RoutingRule,
    tenantId: string,
    ticketData: any
  ): Promise<RoutingResult> {
    switch (rule.rule_type) {
      case 'round_robin':
        return this.roundRobinRoute(rule, tenantId)
      case 'skill_match':
        return this.skillMatchRoute(rule, tenantId, ticketData)
      case 'priority_based':
        return this.priorityBasedRoute(rule, tenantId, ticketData)
      case 'static_assign':
        return this.staticAssignRoute(rule, tenantId)
      default:
        return { assigned_to: null, rule_applied: null, reason: 'Unknown rule type', candidates: [] }
    }
  }

  private static async roundRobinRoute(
    rule: RoutingRule,
    tenantId: string
  ): Promise<RoutingResult> {
    const supabase = await createServerSupabase()

    const { data: agents } = await supabase
      .from('cs_team_members')
      .select('user_id, member_id, clerk_user_id, max_tickets')
      .eq('is_active', true)
      .in('role', rule.rule_config?.roles || ['support_agent', 'csm'])

    if (!agents || agents.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'No available agents', candidates: [] }
    }

    const agentIds = agents.map(a => a.user_id)
    const candidateIds = new Set(agentIds.filter(Boolean))

    const { data: currentLoads } = await supabase
      .from('cs_tickets')
      .select('assigned_to')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'in_progress'])
      .in('assigned_to', Array.from(candidateIds))

    const loadMap = new Map<string, number>()
    for (const agentId of candidateIds) loadMap.set(agentId, 0)
    for (const ticket of currentLoads || []) {
      loadMap.set(ticket.assigned_to, (loadMap.get(ticket.assigned_to) || 0) + 1)
    }

    const { data: lastRobin } = await supabase
      .from('cs_agent_round_robin_state')
      .select('last_assigned_agent_id')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    const lastAssignedId = lastRobin?.last_assigned_agent_id

    let sortedAgents = agents
      .map(a => ({ id: a.user_id, load: loadMap.get(a.user_id) || 0, max: a.max_tickets || 10 }))
      .filter(a => a.load < a.max)
      .sort((a, b) => a.load - b.load)

    if (lastAssignedId && sortedAgents.length > 1) {
      const lastIdx = sortedAgents.findIndex(a => a.id === lastAssignedId)
      if (lastIdx >= 0) {
        sortedAgents = [...sortedAgents.slice(lastIdx + 1), ...sortedAgents.slice(0, lastIdx + 1)]
      }
    }

    if (sortedAgents.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'All agents at capacity', candidates: agentIds }
    }

    const selected = sortedAgents[0]

    await supabase
      .from('cs_agent_round_robin_state')
      .upsert(
        {
          tenant_id: tenantId,
          last_assigned_agent_id: selected.id,
          last_assigned_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      )

    return {
      assigned_to: selected.id,
      rule_applied: rule.rule_id,
      reason: `Round-robin: agent has ${selected.load} open tickets`,
      candidates: sortedAgents.map(a => a.id),
    }
  }

  private static async skillMatchRoute(
    rule: RoutingRule,
    tenantId: string,
    ticketData: any
  ): Promise<RoutingResult> {
    const supabase = await createServerSupabase()

    const keywordMap: Record<string, string[]> = rule.rule_config?.keyword_skill_map || {
      billing: ['billing', 'payment', 'invoice', 'charge', 'subscription'],
      technical: ['bug', 'error', 'broken', 'not working', 'issue'],
      onboarding: ['setup', 'getting started', 'how to', 'configure', 'onboarding'],
      legal: ['compliance', 'contract', 'legal', 'regulatory'],
      general: ['question', 'help', 'support'],
    }

    const conversationText = [
      ticketData.subject || '',
      ticketData.category || '',
      ticketData.channel || '',
    ].join(' ').toLowerCase()

    const matchedSkills: string[] = []
    for (const [skill, keywords] of Object.entries(keywordMap)) {
      if (keywords.some((kw: string) => conversationText.includes(kw.toLowerCase()))) {
        matchedSkills.push(skill)
      }
    }

    if (matchedSkills.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'No skill match found', candidates: [] }
    }

    const { data: agents } = await supabase
      .from('cs_team_members')
      .select('user_id, skills')
      .eq('is_active', true)
      .in('role', ['support_agent', 'csm'])

    const scoredAgents = (agents || [])
      .map(a => {
        const agentSkills: string[] = a.skills || []
        const matchCount = matchedSkills.filter(s => agentSkills.includes(s)).length
        return { id: a.user_id, score: matchCount }
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)

    if (scoredAgents.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'No agents with matching skills', candidates: [] }
    }

    return {
      assigned_to: scoredAgents[0].id,
      rule_applied: rule.rule_id,
      reason: `Skill match: ${matchedSkills.join(', ')}`,
      candidates: scoredAgents.map(a => a.id),
    }
  }

  private static async priorityBasedRoute(
    rule: RoutingRule,
    tenantId: string,
    ticketData: any
  ): Promise<RoutingResult> {
    const supabase = await createServerSupabase()
    const priority = ticketData.priority || 'medium'

    const roleMap: Record<string, string[]> = rule.rule_config?.priority_role_map || {
      urgent: ['head_of_cs', 'support_manager'],
      high: ['support_manager', 'csm'],
      medium: ['support_agent', 'csm'],
      low: ['support_agent'],
    }

    const targetRoles = roleMap[priority] || ['support_agent']

    const { data: agents } = await supabase
      .from('cs_team_members')
      .select('user_id, role, max_tickets')
      .eq('is_active', true)
      .in('role', targetRoles)
      .order('role', { ascending: true })

    if (!agents || agents.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: `No agents for priority ${priority}`, candidates: [] }
    }

    const agentIds = agents.map(a => a.user_id)

    const { data: loads } = await supabase
      .from('cs_tickets')
      .select('assigned_to')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'in_progress'])
      .in('assigned_to', agentIds)

    const loadMap = new Map<string, number>()
    for (const aid of agentIds) loadMap.set(aid, 0)
    for (const t of loads || []) loadMap.set(t.assigned_to, (loadMap.get(t.assigned_to) || 0) + 1)

    const eligible = agents
      .map(a => ({ id: a.user_id, load: loadMap.get(a.user_id) || 0, max: a.max_tickets || 10 }))
      .filter(a => a.load < a.max)
      .sort((a, b) => a.load - b.load)

    if (eligible.length === 0) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'No eligible agents for this priority', candidates: agentIds }
    }

    return {
      assigned_to: eligible[0].id,
      rule_applied: rule.rule_id,
      reason: `Priority (${priority}) routed to ${eligible[0].id}`,
      candidates: eligible.map(a => a.id),
    }
  }

  private static async staticAssignRoute(
    rule: RoutingRule,
    tenantId: string
  ): Promise<RoutingResult> {
    const agentId = rule.rule_config?.agent_user_id
    if (!agentId) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'No agent configured', candidates: [] }
    }

    const supabase = await createServerSupabase()
    const { data: member } = await supabase
      .from('cs_team_members')
      .select('user_id')
      .eq('user_id', agentId)
      .eq('is_active', true)
      .maybeSingle()

    if (!member) {
      return { assigned_to: null, rule_applied: rule.rule_id, reason: 'Assigned agent not available', candidates: [] }
    }

    return {
      assigned_to: agentId,
      rule_applied: rule.rule_id,
      reason: 'Static assignment',
      candidates: [agentId],
    }
  }

  private static async fallbackRoute(tenantId: string): Promise<RoutingResult> {
    const supabase = await createServerSupabase()

    const { data: agents } = await supabase
      .from('cs_team_members')
      .select('user_id')
      .eq('is_active', true)
      .in('role', ['support_agent', 'csm'])
      .limit(1)

    const assigned = agents?.[0]?.user_id || null

    return {
      assigned_to: assigned,
      rule_applied: 'fallback',
      reason: assigned ? 'Fallback: first available agent' : 'No agents available',
      candidates: assigned ? [assigned] : [],
    }
  }

  /**
   * Create a default routing rule for a tenant
   */
  static async seedDefaultRules(tenantId: string): Promise<void> {
    const supabase = await createServerSupabase()

    const defaults = [
      {
        tenant_id: tenantId,
        rule_name: 'Priority-based routing',
        rule_type: 'priority_based',
        rule_config: {},
        rule_conditions: {},
        rule_priority: 10,
        is_active: true,
      },
      {
        tenant_id: tenantId,
        rule_name: 'Round-robin assignment',
        rule_type: 'round_robin',
        rule_config: { roles: ['support_agent'] },
        rule_conditions: {},
        rule_priority: 5,
        is_active: true,
      },
    ]

    for (const rule of defaults) {
      const { count } = await supabase
        .from('cs_conversation_routing_rules')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('rule_name', rule.rule_name)

      if (!count) {
        await supabase.from('cs_conversation_routing_rules').insert(rule)
      }
    }
  }
}
