/**
 * Knowledge Base Categories API
 * 
 * GET /api/v1/kb/categories - List categories
 * POST /api/v1/kb/categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { KBRepository } from '@/lib/repositories/kb'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  parent_category_id: z.string().uuid().optional().nullable(),
  order_index: z.number().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await KBRepository.findAllCategories()

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error: any) {
    console.error('Error fetching KB categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createCategorySchema.parse(body)

    const category = await KBRepository.createCategory(validated)

    return NextResponse.json({
      success: true,
      data: category,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating KB category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    )
  }
}
