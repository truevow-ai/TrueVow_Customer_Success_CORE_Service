/**
 * GET  /api/intelligence/recommendations?tenant_id=X
 * POST /api/intelligence/recommendations  body: { tenant_id }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations, generateRecommendations } from '@/lib/intelligence/client'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams
  const tenantId = sp.get('tenant_id')
  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  try {
    const up = await getRecommendations(tenantId, sp.get('status') || 'issued', parseInt(sp.get('limit') || '50'))
    return NextResponse.json(await up.json(), { status: up.ok ? 200 : up.status })
  } catch {
    return NextResponse.json({ error: 'Intelligence service unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const tenantId = (body as any)?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  try {
    const up = await generateRecommendations(tenantId)
    return NextResponse.json(await up.json(), { status: up.ok ? 201 : up.status })
  } catch {
    return NextResponse.json({ error: 'Intelligence service unavailable' }, { status: 503 })
  }
}
