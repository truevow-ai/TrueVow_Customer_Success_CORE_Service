/**
 * POST /api/intelligence/recommendations/[id]/acted
 * Records that a CS rep acted on a recommendation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { recordOutcome } from '@/lib/intelligence/client'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { action_taken = true, outcome_event, success_flag = false, notes } = (body as any) ?? {}
  try {
    const up = await recordOutcome(id, { action_taken: Boolean(action_taken), outcome_event, success_flag: Boolean(success_flag), notes })
    return NextResponse.json(await up.json(), { status: up.ok ? 200 : up.status })
  } catch {
    return NextResponse.json({ error: 'Intelligence service unavailable' }, { status: 503 })
  }
}
