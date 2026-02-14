import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
import { verifyApiKey } from '@/lib/middleware/api-key'
import { createServerSupabase } from '@/lib/db/supabase'

/**
 * POST /api/v1/integrations/internal-ops/time-tracking
 * Log time tracking for support activities
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
      activity_type,
      ticket_id,
      customer_id,
      user_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      metadata,
    } = body

    if (!activity_type || !user_id || !start_time) {
      return NextResponse.json(
        { error: 'activity_type, user_id, and start_time are required' },
        { status: 400 }
      )
    }

    // Note: Onboarding data is now in SaaS Admin service
    // If JTBD context is needed, it should be fetched from SaaS Admin API
    let enrichedMetadata = metadata || {}
    if (activity_type === 'onboarding' && customer_id) {
      // TODO: Fetch JTBD context from SaaS Admin service if needed
      // For now, onboarding activities will not have JTBD enrichment
      console.log('Onboarding activity logged - JTBD context available from SaaS Admin service')
    }

    // Log time tracking in Internal Ops Service
    const tracking = await internalOpsServiceClient.logTimeTracking({
      activity_type,
      ticket_id,
      customer_id,
      user_id: user_id || userId,
      start_time,
      end_time,
      duration_minutes,
      description,
      metadata: {
        ...enrichedMetadata,
        logged_from: 'cs-support-service',
      },
    })

    return NextResponse.json({ data: tracking }, { status: 201 })
  } catch (error: any) {
    console.error('Error logging time tracking:', error)
    return NextResponse.json(
      { error: 'Failed to log time tracking', details: error.message },
      { status: 500 }
    )
  }
}



