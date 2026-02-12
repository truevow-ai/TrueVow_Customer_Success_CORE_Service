/**
 * Conversation Routing Service
 * Handles intelligent routing of conversations to agents based on rules, skills, and workload
 */

import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { TicketRepository } from '@/lib/repositories/tickets'
import { AITriageService } from './ai-triage'
import { Message } from '@/types/database'

export interface RoutingRule {
  id: string
  name: string
  priority: number // Higher = more important
  conditions: {
    category?: string[]
    priority?: string[]
    customerTier?: string[]
    serviceType?: string[]
    tags?: string[]
  }
  action: {
    assignTo?: string // Team member ID
    assignToRole?: string // Role name
    assignToSkill?: string // Skill name
    roundRobin?: boolean
  }
}

export interface RoutingResult {
  assignedTo: string | null
  reason: string
  ruleMatched?: string
}

export class ConversationRoutingService {
  private static routingRules: RoutingRule[] = [
    {
      id: 'billing-to-csm',
      name: 'Billing Issues → CSM',
      priority: 100,
      conditions: {
        category: ['billing'],
      },
      action: {
        assignToRole: 'csm',
      },
    },
    {
      id: 'technical-to-se',
      name: 'Technical Issues → Solutions Engineer',
      priority: 90,
      conditions: {
        category: ['technical'],
      },
      action: {
        assignToRole: 'solutions_engineer',
      },
    },
    {
      id: 'urgent-to-manager',
      name: 'Urgent Issues → Support Manager',
      priority: 95,
      conditions: {
        priority: ['urgent'],
      },
      action: {
        assignToRole: 'support_manager',
      },
    },
    {
      id: 'round-robin-default',
      name: 'Default Round-Robin',
      priority: 10,
      conditions: {},
      action: {
        roundRobin: true,
      },
    },
  ]

  /**
   * Route a conversation based on rules and AI triage
   */
  static async routeConversation(
    ticketId: string,
    message: Message,
    triageResult?: any
  ): Promise<RoutingResult> {
    // Get all active team members
    const teamMembers = await TeamMemberRepository.findAll({ isActive: true })

    // If no triage result, analyze the message
    if (!triageResult) {
      triageResult = await AITriageService.analyzeMessage(message)
    }

    // Get ticket for additional context
    const ticket = await TicketRepository.findById(ticketId)
    if (!ticket) {
      return { assignedTo: null, reason: 'Ticket not found' }
    }

    // Try to match routing rules
    for (const rule of this.routingRules.sort((a, b) => b.priority - a.priority)) {
      if (this.matchesRule(rule, triageResult, ticket)) {
        const assignment = await this.executeRule(rule, teamMembers, ticket)
        if (assignment) {
          return {
            assignedTo: assignment,
            reason: `Matched rule: ${rule.name}`,
            ruleMatched: rule.id,
          }
        }
      }
    }

    // Fallback: Round-robin
    return await this.roundRobinAssignment(teamMembers, ticket)
  }

  /**
   * Check if a rule matches the conversation
   */
  private static matchesRule(
    rule: RoutingRule,
    triageResult: any,
    ticket: any
  ): boolean {
    const { conditions } = rule

    if (conditions.category && !conditions.category.includes(triageResult.category)) {
      return false
    }

    if (conditions.priority && !conditions.priority.includes(triageResult.priority)) {
      return false
    }

    if (conditions.serviceType && ticket.truevow_service) {
      if (!conditions.serviceType.includes(ticket.truevow_service)) {
        return false
      }
    }

    if (conditions.tags && ticket.tags) {
      const hasMatchingTag = conditions.tags.some((tag) => ticket.tags.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    return true
  }

  /**
   * Execute a routing rule
   */
  private static async executeRule(
    rule: RoutingRule,
    teamMembers: any[],
    ticket: any
  ): Promise<string | null> {
    const { action } = rule

    if (action.assignTo) {
      return action.assignTo
    }

    if (action.assignToRole) {
      const members = teamMembers.filter((m) => m.role === action.assignToRole)
      if (members.length > 0) {
        // Round-robin within role
        return this.roundRobinFromList(members, ticket)
      }
    }

    if (action.assignToSkill && ticket.tags) {
      const members = teamMembers.filter((m) => {
        const skills = m.skills || []
        return ticket.tags.some((tag: string) => skills.includes(tag))
      })
      if (members.length > 0) {
        return this.roundRobinFromList(members, ticket)
      }
    }

    if (action.roundRobin) {
      return this.roundRobinFromList(teamMembers, ticket)
    }

    return null
  }

  /**
   * Round-robin assignment
   */
  private static async roundRobinAssignment(
    teamMembers: any[],
    ticket: any
  ): Promise<RoutingResult> {
    // Filter to support agents only for default round-robin
    const agents = teamMembers.filter((m) => m.role === 'support_agent')

    if (agents.length === 0) {
      return { assignedTo: null, reason: 'No available agents' }
    }

    // Get current workload (tickets assigned to each agent)
    const workloads = await Promise.all(
      agents.map(async (agent) => {
        const tickets = await TicketRepository.findAll({
          assignedTo: agent.member_id,
          status: 'open',
        })
        return {
          agent,
          workload: tickets.length,
          maxTickets: agent.max_tickets || 10,
        }
      })
    )

    // Sort by workload (ascending) and capacity
    workloads.sort((a, b) => {
      const aAvailable = a.maxTickets - a.workload
      const bAvailable = b.maxTickets - b.workload
      if (aAvailable !== bAvailable) {
        return bAvailable - aAvailable // More available first
      }
      return a.workload - b.workload // Lower workload first
    })

    // Assign to agent with lowest workload and available capacity
    const availableAgent = workloads.find((w) => w.workload < w.maxTickets)
    if (availableAgent) {
      return {
        assignedTo: availableAgent.agent.member_id,
        reason: 'Round-robin assignment (lowest workload)',
      }
    }

    // If all agents at capacity, assign to first agent anyway
    return {
      assignedTo: workloads[0].agent.member_id,
      reason: 'Round-robin assignment (all agents at capacity)',
    }
  }

  /**
   * Round-robin from a list of members
   */
  private static roundRobinFromList(members: any[], ticket: any): string | null {
    if (members.length === 0) return null

    // Simple round-robin based on ticket ID hash
    // In production, would use a more sophisticated algorithm
    const hash = ticket.ticket_id.split('').reduce((acc: number, char: string) => {
      return acc + char.charCodeAt(0)
    }, 0)

    return members[hash % members.length].member_id
  }

  /**
   * Add a custom routing rule
   */
  static addRule(rule: RoutingRule): void {
    this.routingRules.push(rule)
    this.routingRules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get all routing rules
   */
  static getRules(): RoutingRule[] {
    return [...this.routingRules]
  }
}
