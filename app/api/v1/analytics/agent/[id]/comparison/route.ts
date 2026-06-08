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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication (Clerk or API key)
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const compareWith = searchParams.get('compare_with')?.split(',') || []

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    // Get comparison data - pass agent IDs as array
    const agentIds = [agentId, ...compareWith]
    const comparison = await AgentPerformanceService.getAgentComparison(agentIds)

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
