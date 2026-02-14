/**
 * GET /api/v1/customers/subscriptions
 * 
 * Get customer subscription status for services
 * Returns which services (INTAKE, VERIFY, DRAFT, SETTLE, CONNECT) are active
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/db/supabase'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const supabase = createServerSupabase()
    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return errorResponse('Tenant ID is required', 400)
    }

    // TODO: Integrate with Platform Service to get actual subscription status
    // For now, return mock data structure
    // In production, this would call Platform Service API

    const subscriptions = {
      INTAKE: true, // Always available (primary service)
      VERIFY: false, // Check from Platform Service
      DRAFT: false, // Check from Platform Service
      SETTLE: false, // Check from Platform Service
      CONNECT: false, // Check from Platform Service
    }

    // TODO: Replace with actual Platform Service call
    // const platformResponse = await fetch(`${process.env.PLATFORM_SERVICE_URL}/api/v1/tenants/${tenantId}/subscriptions`, {
    //   headers: { 'Authorization': `Bearer ${process.env.PLATFORM_SERVICE_API_KEY}` }
    // })
    // const subscriptions = await platformResponse.json()

    return successResponse({
      tenant_id: tenantId,
      subscriptions,
      updated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error)
    return errorResponse('Failed to fetch subscription status', 500)
  }
}



