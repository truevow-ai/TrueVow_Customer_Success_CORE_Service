/**
 * GET /api/intelligence/metrics?tenant_id=X&days=7
 * Proxies behavioral metrics to SaaS Admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getBehaviorMetrics } from '@/lib/intelligence/client'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams
  try {
    const up = await getBehaviorMetrics(sp.get('tenant_id') || undefined, parseInt(sp.get('days') || '7'))
    return NextResponse.json(await up.json(), { status: up.ok ? 200 : up.status })
  } catch {
    return NextResponse.json({ error: 'Intelligence service unavailable' }, { status: 503 })
  }
}
