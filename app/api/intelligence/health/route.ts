/**
 * Intelligence Health Score API (PROXY LAYER)
 *
 * GET  /api/intelligence/health?tenant_id=X&customer_email=Y
 * POST /api/intelligence/health/calculate (body: { tenant_id, customer_email })
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - This endpoint proxies to SaaS Admin
 * - CS Core does NOT compute health scores locally
 * - CS Core does NOT cache health scores locally
 * - All intelligence data comes from SaaS Admin
 *
 * Three-Layer Intelligence Stack:
 * - Layer 1 (Tenant App): Produces signals, emits events
 * - Layer 2 (SaaS Admin): Computes health scores, recommendations
 * - Layer 3 (CS Core): Displays intelligence, NO computation, NO caching
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getHealthScore,
  getHealthScoreHistory,
  getHealthSignals
} from '@/lib/intelligence/client'

/**
 * GET /api/intelligence/health
 * Get health score for a customer from SaaS Admin.
 *
 * Query params:
 * - tenant_id: UUID of the tenant
 * - customer_email: Email of the customer
 * - include_history: If true, include historical scores (optional)
 * - include_signals: If true, include health signals (optional)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams
  const tenantId = sp.get('tenant_id')
  const customerEmail = sp.get('customer_email')
  const includeHistory = sp.get('include_history') === 'true'
  const includeSignals = sp.get('include_signals') === 'true'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }
  if (!customerEmail) {
    return NextResponse.json({ error: 'customer_email required' }, { status: 400 })
  }

  try {
    // Fetch health score from SaaS Admin - NO local caching
    const healthResponse = await getHealthScore(tenantId, customerEmail)

    if (!healthResponse.ok) {
      if (healthResponse.status === 404) {
        return NextResponse.json(
          { error: 'Health score not found', data: null },
          { status: 404 }
        )
      }
      const errorData = await healthResponse.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch health score from SaaS Admin' },
        { status: healthResponse.status }
      )
    }

    const healthScore = await healthResponse.json()

    // Optionally include history and signals
    const response: any = {
      success: true,
      data: healthScore
    }

    if (includeHistory) {
      const historyResponse = await getHealthScoreHistory(tenantId, customerEmail)
      if (historyResponse.ok) {
        response.history = await historyResponse.json()
      }
    }

    if (includeSignals) {
      const signalsResponse = await getHealthSignals(tenantId, customerEmail)
      if (signalsResponse.ok) {
        response.signals = await signalsResponse.json()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching health score from SaaS Admin:', error)
    return NextResponse.json(
      { error: 'Intelligence service unavailable' },
      { status: 503 }
    )
  }
}
