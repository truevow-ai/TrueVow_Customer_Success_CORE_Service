/**
 * Analytics Usage Feature Adoption API
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  return successResponse({
    features: [],
    summary: {
      totalFeatures: 0,
      avgAdoptionRate: 0,
    }
  })
}
