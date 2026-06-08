import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AgentPerformanceService } from '@/lib/services/agent-performance'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/analytics/team
 * Get team performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (Clerk or API key)
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const periodStart = searchParams.get('period_start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const periodEnd = searchParams.get('period_end') || new Date().toISOString()

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    const teamMetrics = await AgentPerformanceService.getTeamPerformance()

    return NextResponse.json({ data: teamMetrics })
  } catch (error: any) {
    console.error('Error fetching team performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team performance', details: error.message },
      { status: 500 }
    )
  }
}



