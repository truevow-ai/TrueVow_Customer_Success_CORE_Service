/**
 * Attribution Reporter Service
 * 
 * Reports attribution events to Internal Ops (Port 3006).
 * Used by all CS CORE agents (CSM, CAS-*) to track performance.
 * 
 * API Contract:
 * POST http://localhost:3006/api/v1/agents/attribution
 * Authorization: Bearer INTERNAL_OPS_SERVICE_API_KEY
 */

import type { AttributionEvent, CSCoreAgentDefinition, JtbdLayerType } from '@/libs/types/cas-agents'

// ============================================================
// Configuration
// ============================================================

const INTERNAL_OPS_URL = process.env.INTERNAL_OPS_SERVICE_URL || 'http://localhost:3006'
const INTERNAL_OPS_API_KEY = process.env.INTERNAL_OPS_SERVICE_API_KEY

// ============================================================
// Agent-Definition-Aware Attribution (New API)
// ============================================================

interface AgentAttributionEvent {
  agent: CSCoreAgentDefinition
  action: string
  outcome: 'success' | 'failure' | 'partial' | 'escalated'
  tenant_id?: string
  jtbd_layer?: JtbdLayerType
  metadata?: Record<string, unknown>
}

/**
 * Report attribution using agent definition (preferred method)
 * Automatically extracts autonomy and attribution scores from the agent
 */
export async function reportAttribution(event: AgentAttributionEvent): Promise<void> {
  if (!INTERNAL_OPS_URL || !INTERNAL_OPS_API_KEY) {
    console.warn('[Attribution] Attribution reporting disabled: missing config')
    return
  }

  try {
    await fetch(`${INTERNAL_OPS_URL}/api/v1/agents/attribution`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_OPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_type: event.agent.agent_type,
        agent_name: event.agent.agent_name,
        service_owner: 'cs_core',
        tenant_id: event.tenant_id || null,
        action: event.action,
        outcome: event.outcome,
        autonomy_score: event.agent.quadrant_position.autonomy_score,
        attribution_score: event.agent.quadrant_position.attribution_score,
        jtbd_layer: event.jtbd_layer || 'standard',
        metadata: event.metadata || {},
      }),
    })
  } catch (error) {
    console.error('[Attribution] Attribution reporting error:', error)
  }
}

// ============================================================
// Legacy Attribution Reporter (Class-based API)
// ============================================================

export class AttributionReporter {
  
  /**
   * Report an attribution event to Internal Ops
   */
  static async report(event: AttributionEvent): Promise<boolean> {
    // Don't fail silently in development if no API key
    if (!INTERNAL_OPS_API_KEY) {
      console.warn('[Attribution] INTERNAL_OPS_SERVICE_API_KEY not configured - skipping report')
      return false
    }
    
    try {
      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/agents/attribution`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INTERNAL_OPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Attribution] Failed to report: ${response.status} ${errorText}`)
        return false
      }
      
      const result = await response.json()
      console.log(`[Attribution] Reported ${event.agent_type}:${event.action} -> ${result.log_id || 'ok'}`)
      return true
    } catch (error) {
      // Network errors - Internal Ops may not be running
      console.warn(`[Attribution] Failed to connect to Internal Ops: ${error}`)
      return false
    }
  }
  
  /**
   * Report CSM action attribution
   */
  static async reportCSM(
    tenantId: string,
    action: string,
    outcome: 'success' | 'failure' | 'pending',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    return this.report({
      agent_type: 'CSM',
      agent_name: 'Client Success Manager',
      service_owner: 'cs_core',
      tenant_id: tenantId,
      action,
      outcome,
      autonomy_score: 8,
      attribution_score: 9,
      jtbd_layer: 'customer_value',
      metadata,
    })
  }
  
  /**
   * Report CAS action attribution
   */
  static async reportCAS(
    casType: string,
    tenantId: string,
    action: string,
    outcome: 'success' | 'failure' | 'pending',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    // CAS agent name mapping
    const casNames: Record<string, string> = {
      'CAS-GCalendar': 'Google Calendar Specialist',
      'CAS-Gmail': 'Gmail Integration Specialist',
      'CAS-Phone': 'Phone Integration Specialist',
      'CAS-Microsoft': 'Microsoft 365 Specialist',
      'CAS-Stripe': 'Stripe Payment Specialist',
      'CAS-Draft': 'Draft Service Specialist',
    }
    
    // CAS attribution scores (from agent definitions)
    const casScores: Record<string, { autonomy: number; attribution: number }> = {
      'CAS-GCalendar': { autonomy: 6, attribution: 7 },
      'CAS-Gmail': { autonomy: 7, attribution: 6 },
      'CAS-Phone': { autonomy: 5, attribution: 7 },
      'CAS-Microsoft': { autonomy: 5, attribution: 6 },
      'CAS-Stripe': { autonomy: 4, attribution: 8 },
      'CAS-Draft': { autonomy: 7, attribution: 6 },
    }
    
    const scores = casScores[casType] || { autonomy: 5, attribution: 6 }
    
    return this.report({
      agent_type: casType,
      agent_name: casNames[casType] || casType,
      service_owner: 'cs_core',
      tenant_id: tenantId,
      action,
      outcome,
      autonomy_score: scores.autonomy,
      attribution_score: scores.attribution,
      jtbd_layer: 'standard',
      metadata,
    })
  }
  
  /**
   * Report customer transfer event
   */
  static async reportCustomerTransfer(
    tenantId: string,
    outcome: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    return this.reportCSM(tenantId, 'customer_transferred', outcome, {
      ...metadata,
      event_type: 'transfer_from_saas_admin',
    })
  }
  
  /**
   * Report 90-day sequence milestone
   */
  static async reportSequenceMilestone(
    tenantId: string,
    dayNumber: number,
    outcome: 'success' | 'failure' | 'pending',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    return this.reportCSM(tenantId, `sequence_day_${dayNumber}`, outcome, {
      ...metadata,
      day_number: dayNumber,
    })
  }
  
  /**
   * Report health score change
   */
  static async reportHealthScoreChange(
    tenantId: string,
    oldScore: number,
    newScore: number,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const outcome = newScore >= 70 ? 'success' : (newScore >= 50 ? 'pending' : 'failure')
    
    return this.reportCSM(tenantId, 'health_score_change', outcome, {
      ...metadata,
      old_score: oldScore,
      new_score: newScore,
      delta: newScore - oldScore,
    })
  }
  
  /**
   * Report churn risk detected
   */
  static async reportChurnRiskDetected(
    tenantId: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const outcome = riskLevel === 'low' ? 'success' : (riskLevel === 'medium' ? 'pending' : 'failure')
    
    return this.reportCSM(tenantId, 'churn_risk_detected', outcome, {
      ...metadata,
      risk_level: riskLevel,
    })
  }
  
  /**
   * Report integration health check
   */
  static async reportIntegrationHealthCheck(
    casType: string,
    tenantId: string,
    healthStatus: 'healthy' | 'degraded' | 'error' | 'unknown',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const outcome = healthStatus === 'healthy' ? 'success' : 
                    healthStatus === 'degraded' ? 'pending' : 'failure'
    
    return this.reportCAS(casType, tenantId, 'health_check', outcome, {
      ...metadata,
      health_status: healthStatus,
    })
  }
}
