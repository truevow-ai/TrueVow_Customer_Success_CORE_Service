/**
 * Agent Execution Repository
 * 
 * Tracks execution logs for CS CORE deterministic agents (CSM, CAS-*).
 * Reports to Internal Ops for attribution tracking.
 * 
 * Table: cs_core_agent_executions
 */

import { createServerSupabase } from '@/lib/db/supabase'
import type { CSCoreAgentDefinition } from '@/libs/types/cas-agents'

interface ExecutionLog {
  agent_type: string
  tenant_id?: string
  action: string
  outcome: 'success' | 'failure' | 'partial' | 'escalated'
  autonomy_score: number
  attribution_score: number
  jtbd_layer?: string
  execution_context?: Record<string, unknown>
  duration_ms?: number
  error_details?: Record<string, unknown>
}

export class AgentExecutionRepository {
  
  /**
   * Log an agent execution to the database
   * Automatically pulls autonomy and attribution scores from agent definition
   */
  static async logExecution(
    agent: CSCoreAgentDefinition,
    log: Omit<ExecutionLog, 'autonomy_score' | 'attribution_score'>
  ): Promise<string> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_core_agent_executions')
      .insert({
        agent_type: log.agent_type,
        tenant_id: log.tenant_id || null,
        action: log.action,
        outcome: log.outcome,
        autonomy_score: agent.quadrant_position.autonomy_score,
        attribution_score: agent.quadrant_position.attribution_score,
        jtbd_layer: log.jtbd_layer || 'standard',
        execution_context: log.execution_context || {},
        duration_ms: log.duration_ms || null,
        error_details: log.error_details || null,
      })
      .select('execution_id')
      .single()
    
    if (error) throw error
    return data.execution_id
  }

  /**
   * Get execution history for a specific agent type
   */
  static async getExecutionsByAgent(
    agentType: string,
    limit: number = 100
  ): Promise<ExecutionLog[]> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_core_agent_executions')
      .select('*')
      .eq('agent_type', agentType)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data as ExecutionLog[]
  }

  /**
   * Get execution history for a specific tenant
   */
  static async getExecutionsByTenant(
    tenantId: string,
    limit: number = 100
  ): Promise<ExecutionLog[]> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_core_agent_executions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data as ExecutionLog[]
  }

  /**
   * Get execution statistics for an agent type
   */
  static async getAgentStats(agentType: string): Promise<{
    total_executions: number
    success_rate: number
    avg_duration_ms: number
    escalation_rate: number
  }> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_core_agent_executions')
      .select('outcome, duration_ms')
      .eq('agent_type', agentType)
    
    if (error) throw error
    
    const executions = data || []
    const total = executions.length
    
    if (total === 0) {
      return {
        total_executions: 0,
        success_rate: 0,
        avg_duration_ms: 0,
        escalation_rate: 0,
      }
    }
    
    const successes = executions.filter((e: { outcome: string }) => e.outcome === 'success').length
    const escalations = executions.filter((e: { outcome: string }) => e.outcome === 'escalated').length
    const durations = executions
      .filter((e: { duration_ms?: number }) => e.duration_ms != null)
      .map((e: { duration_ms?: number }) => e.duration_ms as number)
    
    return {
      total_executions: total,
      success_rate: (successes / total) * 100,
      avg_duration_ms: durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0,
      escalation_rate: (escalations / total) * 100,
    }
  }
}
