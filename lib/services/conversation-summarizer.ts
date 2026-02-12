/**
 * Conversation Summarizer Service
 * Uses LLM to generate intelligent conversation summaries
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { LLMProviderService } from '@/lib/services/llm-provider'

export interface ConversationSummary {
  summary: string
  key_points: string[]
  customer_issue: string
  resolution_status: 'resolved' | 'in_progress' | 'pending' | 'escalated'
  suggested_actions: string[]
  confidence: number
  generated_at: string
}

export class ConversationSummarizer {
  /**
   * Get or generate conversation summary
   * Caches summary in conversation metadata
   */
  static async getSummary(
    conversationId: string,
    forceRegenerate = false
  ): Promise<ConversationSummary | null> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Check cache in metadata
    if (!forceRegenerate && conversation.metadata?.summary) {
      const cached = conversation.metadata.summary as ConversationSummary
      // Regenerate if older than 1 hour
      const cachedTime = new Date(cached.generated_at).getTime()
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      if (cachedTime > oneHourAgo) {
        return cached
      }
    }

    // Generate new summary
    const summary = await this.generateSummary(conversationId, conversation)

    // Cache in conversation metadata
    const updatedMetadata = {
      ...conversation.metadata,
      summary,
    }
    await ConversationRepository.update(conversationId, {
      metadata: updatedMetadata,
    })

    return summary
  }

  /**
   * Generate summary using LLM
   */
  private static async generateSummary(
    conversationId: string,
    conversation: any
  ): Promise<ConversationSummary> {
    // Get all messages
    let messages: any[] = []
    if (conversation.ticket_id) {
      messages = await MessageRepository.findByTicket(conversation.ticket_id)
    }

    // Get ticket for context
    let ticket = null
    if (conversation.ticket_id) {
      ticket = await TicketRepository.findById(conversation.ticket_id)
    }

    // Build conversation context
    const conversationText = messages
      .map((msg) => {
        const sender = msg.from_type === 'customer' ? 'Customer' : 'Agent'
        return `${sender}: ${msg.body}`
      })
      .join('\n\n')

    const context = `
Customer: ${conversation.customer_name || conversation.customer_email}
Channel: ${conversation.channel}
Status: ${ticket?.status || conversation.status}
Priority: ${ticket?.priority || 'medium'}
Created: ${conversation.created_at}

Conversation:
${conversationText.substring(0, 4000)}${conversationText.length > 4000 ? '...' : ''}
`

    // Generate summary using LLM
    const systemPrompt = `You are an AI assistant that summarizes customer support conversations. 
Analyze the conversation and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. The main customer issue
4. Resolution status (resolved, in_progress, pending, escalated)
5. Suggested actions (2-3 actionable items)
6. Confidence level (0-1)

Return ONLY valid JSON in this format:
{
  "summary": "Brief summary...",
  "key_points": ["Point 1", "Point 2"],
  "customer_issue": "Main issue description",
  "resolution_status": "resolved|in_progress|pending|escalated",
  "suggested_actions": ["Action 1", "Action 2"],
  "confidence": 0.85
}`

    try {
      const response = await LLMProviderService.generateResponse({
        systemPrompt,
        userPrompt: `Summarize this customer support conversation:\n\n${context}`,
        temperature: 0.3, // Lower temperature for more consistent summaries
        maxTokens: 800,
      })

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from LLM')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        summary: parsed.summary || 'No summary available',
        key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
        customer_issue: parsed.customer_issue || 'Issue not identified',
        resolution_status: parsed.resolution_status || 'pending',
        suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [],
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
        generated_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error generating summary with LLM:', error)
      
      // Fallback to rule-based summary
      return this.generateFallbackSummary(conversation, messages, ticket)
    }
  }

  /**
   * Fallback rule-based summary if LLM fails
   */
  private static generateFallbackSummary(
    conversation: any,
    messages: any[],
    ticket: any
  ): ConversationSummary {
    const customerMessages = messages.filter((m) => m.from_type === 'customer')
    const agentMessages = messages.filter((m) => m.from_type === 'agent')

    const summary = `Customer ${conversation.customer_name || conversation.customer_email} contacted via ${conversation.channel}. 
${customerMessages.length} customer message(s) and ${agentMessages.length} agent response(s).`

    const keyPoints: string[] = []
    if (ticket) {
      keyPoints.push(`Priority: ${ticket.priority}`)
      keyPoints.push(`Status: ${ticket.status}`)
    }
    if (customerMessages.length > 0) {
      keyPoints.push(`First message: ${customerMessages[0].body.substring(0, 100)}...`)
    }

    const customerIssue = customerMessages.length > 0
      ? customerMessages[0].body.substring(0, 200)
      : 'Issue not specified'

    const resolutionStatus = ticket?.status === 'resolved' ? 'resolved' :
      ticket?.status === 'closed' ? 'resolved' :
      ticket?.priority === 'urgent' ? 'escalated' :
      agentMessages.length > 0 ? 'in_progress' : 'pending'

    const suggestedActions: string[] = []
    if (resolutionStatus === 'pending') {
      suggestedActions.push('Respond to customer')
    }
    if (ticket?.priority === 'urgent') {
      suggestedActions.push('Escalate to manager')
    }
    if (agentMessages.length === 0) {
      suggestedActions.push('Assign to agent')
    }

    return {
      summary,
      key_points: keyPoints,
      customer_issue: customerIssue,
      resolution_status: resolutionStatus as any,
      suggested_actions: suggestedActions,
      confidence: 0.6, // Lower confidence for fallback
      generated_at: new Date().toISOString(),
    }
  }
}
