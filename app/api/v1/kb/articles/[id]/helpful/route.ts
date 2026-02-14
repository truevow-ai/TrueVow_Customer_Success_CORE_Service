/**
 * Mark KB Article as Helpful
 * 
 * POST /api/v1/kb/articles/[id]/helpful
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { KBRepository } from '@/lib/repositories/kb'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await KBRepository.markHelpful(id)

    return NextResponse.json({
      success: true,
      message: 'Article marked as helpful',
    })
  } catch (error: any) {
    console.error('Error marking article as helpful:', error)
    return NextResponse.json(
      { error: 'Failed to mark article as helpful', details: error.message },
      { status: 500 }
    )
  }
}
