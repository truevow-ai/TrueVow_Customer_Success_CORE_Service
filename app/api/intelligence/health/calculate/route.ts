/**
 * Intelligence Health Score Calculation API (PROXY LAYER)
 *
 * POST /api/intelligence/health/calculate
 * Body: { tenant_id: string, customer_email: string }
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - This endpoint proxies to SaaS Admin
 * - CS Core does NOT compute health scores locally
 * - The actual calculation happens in SaaS Admin
 *
 * Three-Layer Intelligence Stack:
 * - Layer 1 (Tenant App): Produces signals, emits events
 * - Layer 2 (SaaS Admin): Computes health scores, recommendations
 * - Layer 3 (CS Core): Displays intelligence, NO computation, NO caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateHealthScore } from '@/lib/intelligence/client'

/**
 * POST /api/intelligence/health/calculate
 * Request health score calculation from SaaS Admin.
 *
 * Body:
 * - tenant_id: UUID of the tenant
 * - customer_email: Email of the customer
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tenantId = (body as any)?.tenant_id
  const customerEmail = (body as any)?.customer_email

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }
  if (!customerEmail) {
    return NextResponse.json({ error: 'customer_email required' }, { status: 400 })
  }

  try {
    // Proxy to SaaS Admin - NO local computation
    const response = await calculateHealthScore(tenantId, customerEmail)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to calculate health score in SaaS Admin' },
        { status: response.status }
      )
    }

    const healthScore = await response.json()

    return NextResponse.json(
      {
        success: true,
        data: healthScore,
        message: 'Health score calculated successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error calculating health score via SaaS Admin:', error)
    return NextResponse.json(
      { error: 'Intelligence service unavailable' },
      { status: 503 }
    )
  }
}
