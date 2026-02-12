import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { MentionsService } from '@/lib/services/mentions-service'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { z } from 'zod'

const createMentionsSchema = z.object({
  message_id: z.string().uuid('Invalid message ID'),
  text: z.string().min(1, 'Text is required'),
})

/**
 * POST /api/v1/inbox/[id]/mentions
 * Parse and create mentions from message text
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, createMentionsSchema)
      if (!validation.success) {
        return validation.response
      }

      const { message_id, text } = validation.data

      // Get conversation
      const conversation = await ConversationRepository.findById(conversationId)
      if (!conversation) {
        return errorResponse('Conversation not found', 404)
      }

      // Parse mentions from text
      const parsedMentions = MentionsService.parseMentions(text)
      
      if (parsedMentions.length === 0) {
        return successResponse({ mentions: [], message: 'No mentions found' })
      }

      // Resolve mentions to team member IDs
      const resolvedMentions = await MentionsService.resolveMentions(
        parsedMentions,
        conversation.tenant_id
      )

      if (resolvedMentions.length === 0) {
        return successResponse({ mentions: [], message: 'No valid mentions found' })
      }

      // Create mention records and notifications
      await MentionsService.createMentions(
        message_id,
        conversationId,
        conversation.ticket_id || '',
        resolvedMentions,
        context.teamMemberId || context.userId
      )

      return successResponse({
        mentions: resolvedMentions,
        message: `Created ${resolvedMentions.length} mention(s)`,
      })
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to create mentions',
        500
      )
    }
  })(req)
}

/**
 * GET /api/v1/inbox/[id]/mentions
 * Get all mentions for a conversation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const mentions = await MentionsService.getMentionsForConversation(conversationId)
      return successResponse({ mentions })
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch mentions',
        500
      )
    }
  })(req)
}
