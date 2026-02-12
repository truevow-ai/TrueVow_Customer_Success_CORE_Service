import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'
import { AdvancedSearchService, SearchFilters } from '@/lib/services/advanced-search'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().optional(),
  channel: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  assignedTo: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
  customerEmail: z.string().email().optional(),
})

/**
 * POST /api/v1/inbox/search
 * Advanced search with filters
 */
export const POST = withTeamMember(async (req: NextRequest, context) => {
  try {
    const body = await req.json()
    const validation = searchSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('Invalid search parameters', 400)
    }

    const { page, limit, offset } = getPagination(req)

    // Get team member for tenant filtering
    const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
    if (!teamMember) {
      return errorResponse('Team member not found', 404)
    }

    const filters: SearchFilters = {
      ...validation.data,
      tenantId: teamMember.tenant_id,
    }

    // Handle "me" and "unassigned" in assignedTo
    if (filters.assignedTo) {
      const processed: string[] = []
      for (const assign of filters.assignedTo) {
        if (assign === 'me') {
          processed.push(teamMember.member_id)
        } else if (assign === 'unassigned') {
          // Will be handled in search service
          processed.push('unassigned')
        } else {
          processed.push(assign)
        }
      }
      filters.assignedTo = processed
    }

    const result = await AdvancedSearchService.search(filters, limit, offset)

    return successResponse({
      results: result.results,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Search failed',
      500
    )
  }
})

/**
 * GET /api/v1/inbox/search/suggestions
 * Get search suggestions
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return successResponse({ suggestions: [] })
    }

    const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
    if (!teamMember) {
      return errorResponse('Team member not found', 404)
    }

    const suggestions = await AdvancedSearchService.getSuggestions(
      query,
      teamMember.tenant_id
    )

    return successResponse({ suggestions })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get suggestions',
      500
    )
  }
})
