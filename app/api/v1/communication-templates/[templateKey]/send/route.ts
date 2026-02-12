/**
 * Send Communication via Template API
 * 
 * POST /api/v1/communication-templates/[templateKey]/send
 * Send email or SMS using a communication template
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { CommunicationSenderService } from '@/lib/services/communication-sender'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db/supabase'

const sendCommunicationSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]),
  variables: z.record(z.any()).optional().default({}),
  tenant_id: z.string().uuid().optional(),
  customer_email: z.string().email(),
  scheduled_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * POST /api/v1/communication-templates/[templateKey]/send
 * Send communication (email or SMS) using a template
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateKey: string }> }
) {
  const { templateKey } = await params
  
  const handler = withTeamMember(async (req: NextRequest, context: { userId: string; teamMemberId: string }) => {
    try {
      const validation = await validateBody(req, sendCommunicationSchema)
      if (!validation.success) {
        return validation.response
      }

      const supabase = createServerSupabase()
      
      // Get team member to determine tenant_id if not provided
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('tenant_id, user_id')
        .eq('clerk_user_id', context.userId)
        .single()

      const tenantId = validation.data.tenant_id || teamMember?.tenant_id
      
      if (!tenantId) {
        return errorResponse('Tenant ID is required', 400)
      }

      // Send communication
      const result = await CommunicationSenderService.sendCommunication({
        templateKey,
        to: validation.data.to,
        variables: validation.data.variables || {},
        tenantId,
        customerEmail: validation.data.customer_email,
        scheduledAt: validation.data.scheduled_at,
        metadata: {
          ...validation.data.metadata,
          sent_by: context.userId,
          sent_by_team_member: context.teamMemberId,
        },
      })

      if (result.status === 'failed') {
        return errorResponse(result.error || 'Failed to send communication', 500)
      }

      return successResponse({
        communication_id: result.communicationId,
        status: result.status,
        message_id: result.messageId,
      }, 'Communication sent successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to send communication',
        500
      )
    }
  })
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 10, // Limit to 10 sends per minute
    },
    handler
  )(req)
}
