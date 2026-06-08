/**
 * Analytics Trends Feedback API
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  return successResponse({
    trends: [],
    summary: {
      positive: 0,
      neutral: 0,
      negative: 0,
    }
  })
}
