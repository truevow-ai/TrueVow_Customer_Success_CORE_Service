/**
 * Knowledge Base Articles API
 * 
 * GET /api/v1/kb/articles - List articles
 * POST /api/v1/kb/articles - Create article
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { KBRepository } from '@/lib/repositories/kb'
import { z } from 'zod'

const createArticleSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const articles = await KBRepository.findAllArticles({
      status: status || undefined,
      categoryId: categoryId || undefined,
      search: search || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length,
    })
  } catch (error: any) {
    console.error('Error fetching KB articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createArticleSchema.parse(body)

    const article = await KBRepository.createArticle({
      ...validated,
      author_id: context.userId,
    })

    return NextResponse.json({
      success: true,
      data: article,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating KB article:', error)
    return NextResponse.json(
      { error: 'Failed to create article', details: error.message },
      { status: 500 }
    )
  }
}



