import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { z } from 'zod'

const draftSchema = z.object({
  body: z.string().max(5000, 'Draft too long'),
  attachments: z.array(z.any()).optional().default([]),
})

/**
 * GET /api/v1/inbox/:id/draft
 * Get saved draft for a conversation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const conversation = await ConversationRepository.findById(id)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Get draft from conversation metadata
      const draft = conversation.metadata?.draft || null

      return successResponse({ draft })
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to fetch draft', 500)
    }
  })(req)
}

/**
 * POST /api/v1/inbox/:id/draft
 * Save a draft for a conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, draftSchema)
      if (!validation.success) {
        return validation.response
      }

      const { body, attachments } = validation.data

      const conversation = await ConversationRepository.findById(id)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Save draft in conversation metadata
      const updatedMetadata = {
        ...conversation.metadata,
        draft: {
          body,
          attachments: attachments || [],
          saved_at: new Date().toISOString(),
          saved_by: context.teamMemberId || context.userId,
        },
      }

      await ConversationRepository.update(id, {
        metadata: updatedMetadata,
      })

      return successResponse({ draft: updatedMetadata.draft }, 'Draft saved successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to save draft', 500)
    }
  })(req)
}

/**
 * DELETE /api/v1/inbox/:id/draft
 * Delete saved draft
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const conversation = await ConversationRepository.findById(id)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Remove draft from metadata
      const updatedMetadata = { ...conversation.metadata }
      delete updatedMetadata.draft

      await ConversationRepository.update(id, {
        metadata: updatedMetadata,
      })

      return successResponse(null, 'Draft deleted successfully')
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to delete draft', 500)
    }
  })(req)
}
