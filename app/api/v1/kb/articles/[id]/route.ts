/**
 * Knowledge Base Article API
 * 
 * GET /api/v1/kb/articles/[id] - Get article
 * PUT /api/v1/kb/articles/[id] - Update article
 * DELETE /api/v1/kb/articles/[id] - Delete article
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { KBRepository } from '@/lib/repositories/kb'
import { z } from 'zod'

const updateArticleSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const article = await KBRepository.findArticleById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Increment views for published articles
    if (article.status === 'published') {
      await KBRepository.incrementViews(id).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error: any) {
    console.error('Error fetching KB article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validated = updateArticleSchema.parse(body)

    const article = await KBRepository.updateArticle(id, validated)

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating KB article:', error)
    return NextResponse.json(
      { error: 'Failed to update article', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await KBRepository.deleteArticle(id)

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting KB article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article', details: error.message },
      { status: 500 }
    )
  }
}
