/**
 * Health Scoring Service (PROXY LAYER)
 *
 * @deprecated DEPRECATED: Local health score computation has been moved to SaaS Admin.
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - CS Core must NOT compute health scores locally
 * - CS Core must NOT cache health scores locally
 * - All health score retrieval must proxy to SaaS Admin
 * - SaaS Admin is the ONLY system that computes behavioral intelligence
 *
 * This service now acts as a pure proxy layer to SaaS Admin.
 *
 * Three-Layer Intelligence Stack:
 * - Layer 1 (Tenant App): Produces signals, emits events
 * - Layer 2 (SaaS Admin): Computes health scores, recommendations
 * - Layer 3 (CS Core): Displays intelligence, NO computation, NO caching
 *
 * Migration Date: 2026-03-08
 * See: docs/ARCHITECTURAL_BOUNDARIES.md
 */

import { getHealthScore as fetchHealthScoreFromAdmin } from '@/lib/intelligence/client'

export interface HealthScore {
  health_id: string
  tenant_id: string
  customer_email: string
  health_score: number
  health_level: 'healthy' | 'at_risk' | 'critical' | 'churned'
  engagement_score: number
  usage_score: number
  support_score: number
  billing_score: number
  product_fit_score: number
  churn_risk: number
  expansion_probability: number
  renewal_probability: number
  score_trend: 'improving' | 'stable' | 'declining' | null
  recommended_actions: Array<{
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }>
  calculated_at: string
  updated_at: string
}

export interface HealthSignal {
  signal_type: 'engagement' | 'usage' | 'support' | 'billing' | 'product_fit'
  signal_name: string
  signal_value: number
  impact: 'positive' | 'negative' | 'neutral'
  detected_at: string
}

export class HealthScoringService {
  /**
   * @deprecated Use SaaS Admin health score API directly.
   * Health score calculation now happens exclusively in SaaS Admin.
   *
   * This method proxies to SaaS Admin's health score calculation endpoint.
   * CS Core does NOT compute health scores locally.
   */
  static async calculateHealthScore(
    tenantId: string,
    customerEmail: string
  ): Promise<HealthScore> {
    console.warn(
      '[DEPRECATED] HealthScoringService.calculateHealthScore is deprecated. ' +
      'Health score computation is now handled by SaaS Admin. ' +
      'Use the intelligence API endpoints instead.'
    )

    // Proxy to SaaS Admin - NO local computation
    const response = await fetchHealthScoreFromAdmin(tenantId, customerEmail)

    if (!response.ok) {
      throw new Error(`Failed to fetch health score from SaaS Admin: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get health score for a customer - proxies to SaaS Admin.
   * NO local caching - always fetch fresh data from SaaS Admin.
   */
  static async getHealthScore(
    tenantId: string,
    customerEmail: string
  ): Promise<HealthScore | null> {
    try {
      const response = await fetchHealthScoreFromAdmin(tenantId, customerEmail)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        console.error(`Failed to fetch health score from SaaS Admin: ${response.status}`)
        return null
      }

      return response.json()
    } catch (error) {
      console.error('Error fetching health score from SaaS Admin:', error)
      return null
    }
  }

  /**
   * @deprecated Health score history is now maintained in SaaS Admin.
   * Use SaaS Admin API endpoints for historical data.
   */
  static async getHealthScoreHistory(
    tenantId: string,
    customerEmail: string,
    limit: number = 30
  ): Promise<any[]> {
    console.warn(
      '[DEPRECATED] HealthScoringService.getHealthScoreHistory is deprecated. ' +
      'Historical health scores are now maintained by SaaS Admin.'
    )

    // Proxy to SaaS Admin via intelligence client is available at lib/intelligence/client.ts
    // Callers should use SaaS Admin API endpoints directly: GET /api/v1/health/history
    return []
  }

  /**
   * @deprecated Health signals are now maintained in SaaS Admin.
   * Use SaaS Admin API endpoints for signal data.
   */
  static async getRecentSignals(
    tenantId: string,
    customerEmail: string,
    limit: number = 20
  ): Promise<HealthSignal[]> {
    console.warn(
      '[DEPRECATED] HealthScoringService.getRecentSignals is deprecated. ' +
      'Health signals are now maintained by SaaS Admin.'
    )

    // Proxy to SaaS Admin via intelligence client: GET /api/v1/health/signals
    return []
  }
}
