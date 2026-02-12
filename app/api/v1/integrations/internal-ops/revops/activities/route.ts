import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * POST /api/v1/integrations/internal-ops/revops/activities
 * Report activity for RevOps tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      activity_type,
      description,
      points,
      revenue_impact,
      customer_id,
      ticket_id,
      metadata,
    } = body

    if (!user_id || !activity_type || !description) {
      return NextResponse.json(
        { error: 'user_id, activity_type, and description are required' },
        { status: 400 }
      )
    }

    // Log RevOps activity in Internal Ops Service
    const activity = await internalOpsServiceClient.logRevOpsActivity({
      user_id,
      activity_type,
      description,
      points,
      revenue_impact,
      customer_id,
      ticket_id,
      metadata: {
        ...metadata,
        logged_from: 'cs-support-service',
        logged_by: userId,
      },
    })

    return NextResponse.json({ data: activity }, { status: 201 })
  } catch (error: any) {
    console.error('Error logging RevOps activity:', error)
    return NextResponse.json(
      { error: 'Failed to log RevOps activity', details: error.message },
      { status: 500 }
    )
  }
}
