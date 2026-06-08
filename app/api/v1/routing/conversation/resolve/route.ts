/**
 * POST /api/v1/routing/conversation/resolve
 *
 * Applies routing rules to determine the best agent for an incoming conversation.
 * Used by the inbox to auto-assign new tickets.
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { ConversationRoutingService } from '@/lib/services/conversation-routing'
import { z } from 'zod'

const resolveSchema = z.object({
  tenant_id: z.string().uuid(),
  channel: z.enum(['email', 'sms', 'call', 'web', 'internal']).optional().default('web'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  category: z.string().optional(),
  subject: z.string().optional(),
  customer_email: z.string().email().optional(),
})

export const POST = withTeamMember(async (req: NextRequest) => {
  try {
    const validation = await validateBody(req, resolveSchema)
    if (!validation.success) {
      return validation.response
    }

    const result = await ConversationRoutingService.routeConversation(
      validation.data.tenant_id,
      {
        channel: validation.data.channel,
        priority: validation.data.priority,
        category: validation.data.category,
        subject: validation.data.subject,
        customer_email: validation.data.customer_email,
      }
    )

    return successResponse(result)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to resolve routing', 500)
  }
})

/**
 * GET /api/v1/routing/conversation/resolve?tenant_id=<uuid>
 * Get routing rules configuration for a tenant
 */
export const GET = withTeamMember(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return errorResponse('tenant_id query parameter is required', 400)
    }

    const supabase = (await import('@/lib/db/supabase')).createServerSupabase()
    const db = await supabase

    const { data: rules } = await db
      .from('cs_conversation_routing_rules')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order('rule_priority', { ascending: false })

    return successResponse({ rules: rules || [] })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch routing rules', 500)
  }
})
