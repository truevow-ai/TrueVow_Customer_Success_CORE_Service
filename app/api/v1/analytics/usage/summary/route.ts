/**
 * Analytics Usage Summary API
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  return successResponse({
    summary: {
      totalUsers: 0,
      activeUsers: 0,
      avgSessionDuration: 0,
      peakUsageHours: [],
    }
  })
}
