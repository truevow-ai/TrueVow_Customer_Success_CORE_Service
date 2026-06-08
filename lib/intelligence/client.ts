/**
 * intelligence/client.ts
 * Server-side fetch wrappers for CS Core proxy routes.
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
