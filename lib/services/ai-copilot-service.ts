/**
 * AI Copilot Service
 * 
 * Enhanced AI draft generation with full context and knowledge base integration
 */

import { LLMProviderService } from '@/lib/services/llm-provider'
import { MessageRepository } from '@/lib/repositories/messages'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { KBRepository } from '@/lib/repositories/kb'

export interface CopilotDraft {
  draft: string
  subject: string | null
  confidence: number // 0-1
  reasoning: string
  kb_articles: Array<{ id: string; title: string; relevance: number }>
  suggested_tags: string[]
  requires_review: boolean
}

export interface CopilotContext {
  conversationId: string
  customerEmail: string
  customerName: string | null
  channel: string
  previousMessages: Array<{ from: string; body: string; timestamp: string }>
  ticketSubject: string | null
  ticketStatus: string | null
  similarTickets: Array<{ id: string; subject: string; resolution: string }>
  kbArticles: Array<{ id: string; title: string; content: string }>
}

export class AICopilotService {
  /**
   * Generate full draft from conversation context
   */
  static async generateDraft(context: CopilotContext): Promise<CopilotDraft> {
    // Build comprehensive prompt with all context
    const systemPrompt = `You are an AI assistant helping customer support agents draft professional, empathetic responses.

**Your Role:**
- Generate complete, ready-to-send email/SMS responses
- Use conversation history for context
- Reference knowledge base articles when relevant
- Maintain professional, empathetic tone
- Be concise but thorough
- Include clear next steps

**Guidelines:**
- Acknowledge the customer's issue
- Provide helpful information or solution
- Reference KB articles if applicable
- End with clear next steps or escalation offer
- Keep tone professional but friendly

**Output Format (JSON):**
{
  "draft": "Full draft message",
  "subject": "Email subject (if email)",
  "confidence": 0.85,
  "reasoning": "Why this draft was generated",
  "kb_articles": [{"id": "uuid", "title": "Title", "relevance": 0.9}],
  "suggested_tags": ["tag1", "tag2"],
  "requires_review": false
}`

    const userPrompt = this.buildContextPrompt(context)

    try {
      const response = await LLMProviderService.generateResponse({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 800,
      })

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          draft: parsed.draft || '',
          subject: parsed.subject || null,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || 'AI-generated draft',
          kb_articles: parsed.kb_articles || [],
          suggested_tags: parsed.suggested_tags || [],
          requires_review: parsed.requires_review !== false, // Default to true for safety
        }
      }

      // Fallback
      return {
        draft: response.content,
        subject: null,
        confidence: 0.5,
        reasoning: 'Generated from conversation context',
        kb_articles: [],
        suggested_tags: [],
        requires_review: true,
      }
    } catch (error) {
      console.error('Error generating copilot draft:', error)
      throw new Error('Failed to generate AI draft')
    }
  }

  /**
   * Build context prompt from conversation data
   */
  private static buildContextPrompt(context: CopilotContext): string {
    let prompt = `Generate a response for this customer conversation:

**Customer:** ${context.customerName || context.customerEmail}
**Channel:** ${context.channel}
${context.ticketSubject ? `**Subject:** ${context.ticketSubject}` : ''}
${context.ticketStatus ? `**Ticket Status:** ${context.ticketStatus}` : ''}

**Conversation History:**
${context.previousMessages
  .slice(-5) // Last 5 messages for context
  .map((m) => `${m.from}: ${m.body}`)
  .join('\n\n')}`

    if (context.kbArticles.length > 0) {
      prompt += `\n\n**Relevant Knowledge Base Articles:**
${context.kbArticles
  .slice(0, 3) // Top 3 articles
  .map((kb) => `- ${kb.title}: ${kb.content.substring(0, 200)}...`)
  .join('\n')}`
    }

    if (context.similarTickets.length > 0) {
      prompt += `\n\n**Similar Resolved Tickets:**
${context.similarTickets
  .slice(0, 2) // Top 2 similar tickets
  .map((t) => `- ${t.subject}: ${t.resolution}`)
  .join('\n')}`
    }

    prompt += `\n\nGenerate a professional, helpful response. Return JSON format.`

    return prompt
  }

  /**
   * Get copilot context for a conversation
   */
  static async getContext(conversationId: string): Promise<CopilotContext> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Get messages via ticket (messages are linked to tickets, not conversations)
    const messages = conversation.ticket_id
      ? await MessageRepository.findByTicket(conversation.ticket_id)
      : []
    const previousMessages = messages.map((m) => ({
      from: m.from_type === 'customer' ? 'Customer' : 'Agent',
      body: m.body,
      timestamp: m.created_at,
    }))

    // Get ticket
    const ticket = conversation.ticket_id
      ? await TicketRepository.findById(conversation.ticket_id)
      : null

    // Search knowledge base for relevant articles
    const lastCustomerMessage = messages
      .filter((m) => m.from_type === 'customer')
      .slice(-1)[0]
    
    const kbArticles = lastCustomerMessage
      ? await KBRepository.searchArticles({
          query: lastCustomerMessage.body.substring(0, 100),
          limit: 3,
          publishedOnly: true,
        })
      : []

    // Find similar tickets (by subject/keywords)
    const similarTickets = ticket
      ? await this.findSimilarTickets(ticket.ticket_id, ticket.subject || '')
      : []

    return {
      conversationId,
      customerEmail: conversation.customer_email,
      customerName: conversation.customer_name,
      channel: conversation.channel,
      previousMessages,
      ticketSubject: ticket?.subject || null,
      ticketStatus: ticket?.status || null,
      similarTickets: similarTickets.map((t) => ({
        id: t.ticket_id,
        subject: t.subject,
        resolution: t.status,
      })),
      kbArticles: kbArticles.map((kb) => ({
        id: kb.article_id,
        title: kb.title,
        content: kb.excerpt || kb.content.substring(0, 500),
      })),
    }
  }

  /**
   * Generate draft with full context
   */
  static async generateDraftForConversation(conversationId: string): Promise<CopilotDraft> {
    const context = await this.getContext(conversationId)
    return this.generateDraft(context)
  }
}
