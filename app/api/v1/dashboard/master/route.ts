/**
 * API Route: Master Dashboard
 * GET /api/v1/dashboard/master
 * 
 * Returns comprehensive master dashboard data aggregating all CS Support modules
 */

import { NextRequest, NextResponse } from 'next/server'
import { MasterDashboardService } from '@/lib/services/master-dashboard'
import { getAuth } from '@clerk/nextjs/server'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get team member for tenant ID
    const teamMember = await TeamMemberRepository.findByClerkUserId(userId)
    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const timeRange = from && to
      ? { from, to }
      : undefined

    // Get master dashboard data
    const dashboardData = await MasterDashboardService.getMasterDashboard(
      teamMember.tenant_id || '',
      timeRange
    )

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
  } catch (error: any) {
    console.error('Error getting master dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get master dashboard' },
      { status: 500 }
    )
  }
}



