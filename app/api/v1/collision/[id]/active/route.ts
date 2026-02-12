/**
 * Collision Detection API - Get Active Users
 * 
 * GET /api/v1/collision/[id]/active - Get active users for conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { CollisionDetectionService } from '@/lib/services/collision-detection-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: conversationId } = await params

    const activeUsers = await CollisionDetectionService.getActiveUsers(conversationId)

    return successResponse(activeUsers)
  } catch (error: any) {
    console.error('Error fetching active users:', error)
    return errorResponse('Failed to fetch active users', 500, error.message)
  }
}
