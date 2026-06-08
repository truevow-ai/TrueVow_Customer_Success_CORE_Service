/**
 * intelligence/client.ts
 *
 * Server-side fetch wrappers for SaaS Admin intelligence routes.
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - CS Core must NOT compute health scores locally
 * - CS Core must NOT cache health scores locally
 * - All intelligence data must come from SaaS Admin
 * - This client is the ONLY way CS Core accesses intelligence data
 *
 * SAAS_ADMIN_SERVICE_API_KEY stays server-side only.
 */

const SAAS_ADMIN_URL = process.env.SAAS_ADMINISTRATION_SERVICE_URL
  || process.env.PLATFORM_SERVICE_API_URL
  || 'http://localhost:3001'

const SAAS_API_KEY = process.env.SAAS_ADMINISTRATION_SERVICE_API_KEY
  || process.env.PLATFORM_SERVICE_API_KEY
  || ''

function adminHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-API-Key': SAAS_API_KEY }
}

export async function getRecommendations(
  tenantId: string, status = 'issued', limit = 50
): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/analytics/recommendations`)
  url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('status', status)
  url.searchParams.set('limit', String(limit))
  return fetch(url.toString(), { method: 'GET', headers: adminHeaders(), signal: AbortSignal.timeout(8000) })
}

export async function generateRecommendations(tenantId: string): Promise<Response> {
  return fetch(`${SAAS_ADMIN_URL}/api/v1/analytics/recommendations`, {
    method: 'POST', headers: adminHeaders(),
    body: JSON.stringify({ tenant_id: tenantId }), signal: AbortSignal.timeout(8000),
  })
}

export async function recordOutcome(
  recommendationId: string,
  payload: { action_taken: boolean; outcome_event?: string; success_flag?: boolean; notes?: string }
): Promise<Response> {
  return fetch(`${SAAS_ADMIN_URL}/api/v1/analytics/recommendations/${recommendationId}/outcome`, {
    method: 'POST', headers: adminHeaders(),
    body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
  })
}

export async function getBehaviorMetrics(tenantId?: string, days = 7): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/analytics/portal-events/metrics`)
  if (tenantId) url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('days', String(days))
  return fetch(url.toString(), { method: 'GET', headers: adminHeaders(), signal: AbortSignal.timeout(8000) })
}

// ============================================================================
// HEALTH SCORE PROXY METHODS
// These methods proxy to SaaS Admin - NO local computation, NO caching
// ============================================================================

/**
 * Get health score for a customer from SaaS Admin.
 * NO local caching - always fetch fresh data.
 */
export async function getHealthScore(
  tenantId: string,
  customerEmail: string
): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/health/score`)
  url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('customer_email', customerEmail)
  return fetch(url.toString(), {
    method: 'GET',
    headers: adminHeaders(),
    signal: AbortSignal.timeout(8000)
  })
}

/**
 * Request health score calculation from SaaS Admin.
 * The actual computation happens in SaaS Admin, not CS Core.
 */
export async function calculateHealthScore(
  tenantId: string,
  customerEmail: string
): Promise<Response> {
  return fetch(`${SAAS_ADMIN_URL}/api/v1/health/calculate`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      tenant_id: tenantId,
      customer_email: customerEmail
    }),
    signal: AbortSignal.timeout(15000) // Longer timeout for calculation
  })
}

/**
 * Get health score history from SaaS Admin.
 */
export async function getHealthScoreHistory(
  tenantId: string,
  customerEmail: string,
  limit: number = 30
): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/health/history`)
  url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('customer_email', customerEmail)
  url.searchParams.set('limit', String(limit))
  return fetch(url.toString(), {
    method: 'GET',
    headers: adminHeaders(),
    signal: AbortSignal.timeout(8000)
  })
}

/**
 * Get health signals for a customer from SaaS Admin.
 */
export async function getHealthSignals(
  tenantId: string,
  customerEmail: string,
  limit: number = 20
): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/health/signals`)
  url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('customer_email', customerEmail)
  url.searchParams.set('limit', String(limit))
  return fetch(url.toString(), {
    method: 'GET',
    headers: adminHeaders(),
    signal: AbortSignal.timeout(8000)
  })
}

// ============================================================================
// RECOMMENDATION OUTCOME TRACKING
// Critical for intelligence engine learning
// ============================================================================

/**
 * Record the outcome of a recommendation.
 * This is essential for the intelligence engine to learn and improve.
 *
 * @param recommendationId - The ID of the recommendation
 * @param payload - Outcome data including action taken and result
 */
export async function recordRecommendationOutcome(
  recommendationId: string,
  payload: {
    action_taken: boolean
    action_timestamp?: string
    action_type?: string // e.g., 'call', 'email', 'sms', 'meeting'
    outcome_type?: string // e.g., 'lead_contacted', 'consult_booked', 'client_retained'
    outcome_value?: number
    success_flag?: boolean
    notes?: string
  }
): Promise<Response> {
  return fetch(`${SAAS_ADMIN_URL}/api/v1/analytics/recommendations/${recommendationId}/outcome`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  })
}

/**
 * Get all tenants' health scores (for CS Core dashboard).
 * Only available to CS Core service role.
 */
export async function getAllTenantHealthScores(
  riskLevel?: 'healthy' | 'at_risk' | 'critical' | 'churned',
  limit: number = 100
): Promise<Response> {
  const url = new URL(`${SAAS_ADMIN_URL}/api/v1/health/scores`)
  if (riskLevel) url.searchParams.set('risk_level', riskLevel)
  url.searchParams.set('limit', String(limit))
  return fetch(url.toString(), {
    method: 'GET',
    headers: adminHeaders(),
    signal: AbortSignal.timeout(10000)
  })
}
