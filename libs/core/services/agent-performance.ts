/**
 * Agent Performance Service
 * 
 * Provides analytics and performance metrics for support agents
 */

export interface AgentPerformanceMetrics {
  agent_id: string
  agent_name: string
  total_tickets: number
  resolved_tickets: number
  avg_resolution_time: number
  satisfaction_score: number
  first_response_time: number
  tickets_per_day: number
}

export interface TeamPerformanceSummary {
  total_agents: number
  avg_satisfaction: number
  total_tickets: number
  resolution_rate: number
  avg_first_response_time: number
}

export class AgentPerformanceService {
  /**
   * Get performance metrics for a specific agent
   */
  static async getAgentPerformance(agentId: string): Promise<AgentPerformanceMetrics | null> {
    // Mock data for demonstration
    const mockData: Record<string, AgentPerformanceMetrics> = {
      'agent-1': {
        agent_id: 'agent-1',
        agent_name: 'John Smith',
        total_tickets: 45,
        resolved_tickets: 42,
        avg_resolution_time: 120, // minutes
        satisfaction_score: 4.2,
        first_response_time: 15, // minutes
        tickets_per_day: 9
      },
      'agent-2': {
        agent_id: 'agent-2',
        agent_name: 'Jane Doe',
        total_tickets: 38,
        resolved_tickets: 35,
        avg_resolution_time: 95,
        satisfaction_score: 4.6,
        first_response_time: 12,
        tickets_per_day: 7.5
      }
    }

    return mockData[agentId] || null
  }

  /**
   * Get performance comparison between agents
   */
  static async getAgentComparison(agentIds: string[]): Promise<AgentPerformanceMetrics[]> {
    const results: AgentPerformanceMetrics[] = []
    
    for (const agentId of agentIds) {
      const metrics = await this.getAgentPerformance(agentId)
      if (metrics) {
        results.push(metrics)
      }
    }
    
    return results
  }

  /**
   * Get team performance summary
   */
  static async getTeamPerformance(): Promise<TeamPerformanceSummary> {
    // Mock team data
    return {
      total_agents: 8,
      avg_satisfaction: 4.3,
      total_tickets: 320,
      resolution_rate: 92,
      avg_first_response_time: 18
    }
  }

  /**
   * Get agent ranking by performance metric
   */
  static async getAgentRankings(sortBy: 'satisfaction' | 'resolution_time' | 'tickets_handled' = 'satisfaction'): Promise<AgentPerformanceMetrics[]> {
    // Mock rankings data
    const agents = [
      {
        agent_id: 'agent-1',
        agent_name: 'John Smith',
        total_tickets: 45,
        resolved_tickets: 42,
        avg_resolution_time: 120,
        satisfaction_score: 4.2,
        first_response_time: 15,
        tickets_per_day: 9
      },
      {
        agent_id: 'agent-2',
        agent_name: 'Jane Doe',
        total_tickets: 38,
        resolved_tickets: 35,
        avg_resolution_time: 95,
        satisfaction_score: 4.6,
        first_response_time: 12,
        tickets_per_day: 7.5
      },
      {
        agent_id: 'agent-3',
        agent_name: 'Mike Johnson',
        total_tickets: 52,
        resolved_tickets: 48,
        avg_resolution_time: 85,
        satisfaction_score: 4.1,
        first_response_time: 20,
        tickets_per_day: 10.4
      }
    ]

    // Sort based on the requested metric
    switch (sortBy) {
      case 'satisfaction':
        return agents.sort((a, b) => b.satisfaction_score - a.satisfaction_score)
      case 'resolution_time':
        return agents.sort((a, b) => a.avg_resolution_time - b.avg_resolution_time)
      case 'tickets_handled':
        return agents.sort((a, b) => b.total_tickets - a.total_tickets)
      default:
        return agents
    }
  }
}