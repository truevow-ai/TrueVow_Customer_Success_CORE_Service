import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AgentPerformanceService } from '@/lib/services/agent-performance'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/analytics/agent/:id/comparison
 * Get agent performance comparison against team average
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication (Clerk or API key)
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = params.id
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const periodStart = searchParams.get('period_start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const periodEnd = searchParams.get('period_end') || new Date().toISOString()

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    const comparison = await AgentPerformanceService.getAgentComparison(
      agentId,
      tenantId,
      periodStart,
      periodEnd
    )

    if (!comparison) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ data: comparison })
  } catch (error: any) {
    console.error('Error fetching agent comparison:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent comparison', details: error.message },
      { status: 500 }
    )
  }
}
