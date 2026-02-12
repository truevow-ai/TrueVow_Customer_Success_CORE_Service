import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { createServerSupabase } from '@/lib/db/supabase'
import { z } from 'zod'

const cannedResponseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})

// In-memory storage for now (should be moved to database table)
// TODO: Create cs_canned_responses table
const cannedResponsesStore: Map<string, any> = new Map()

/**
 * GET /api/v1/canned-responses
 * Get all canned responses
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined

    let responses = Array.from(cannedResponsesStore.values())

    if (category) {
      responses = responses.filter((r) => r.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      responses = responses.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.content.toLowerCase().includes(searchLower)
      )
    }

    return successResponse({ responses })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch canned responses', 500)
  }
})

/**
 * POST /api/v1/canned-responses
 * Create a new canned response
 */
export const POST = withTeamMember(async (req: NextRequest, context) => {
  try {
    const validation = await validateBody(req, cannedResponseSchema)
    if (!validation.success) {
      return validation.response
    }

    const { title, content, category, tags } = validation.data

    const response = {
      id: `canned-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      created_by: context.teamMemberId || context.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    cannedResponsesStore.set(response.id, response)

    return successResponse(response, 'Canned response created successfully')
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to create canned response', 500)
  }
})
