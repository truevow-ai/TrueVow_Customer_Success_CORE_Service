/**
 * AI Triage Service
 * Handles AI-powered classification, sentiment analysis, and response suggestions
 * Uses LLM (Claude/OpenAI) for intelligent classification and response generation
 */

import { Message } from '@/types/database'
import { LLMProviderService } from '@/lib/services/llm-provider'

export interface TriageResult {
  category: 'technical' | 'billing' | 'feature_request' | 'bug' | 'question' | 'complaint' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  intent: string
  confidence: number // 0-100
  suggestedResponse?: string
  suggestedTags?: string[]
  requiresHumanReview: boolean
}

export interface AISuggestion {
  confidence: 'high' | 'medium' | 'low'
  response: string
  reasoning: string
  kbArticles?: Array<{ id: string; title: string; relevance: number }>
}

export class AITriageService {
  /**
   * Analyze message and provide triage result
   * Uses LLM for intelligent classification when available, falls back to rule-based
   */
  static async analyzeMessage(message: Message): Promise<TriageResult> {
    const body = message.body
    const messagePreview = body.substring(0, 500) // Limit to first 500 chars for LLM

    // Try LLM-based classification first
    try {
      const llmResult = await this.analyzeWithLLM(messagePreview, body)
      if (llmResult) {
        return llmResult
      }
    } catch (error) {
      console.warn('LLM triage failed, falling back to rule-based:', error)
      // Fall through to rule-based classification
    }

    // Fallback to rule-based classification
    return this.analyzeWithRules(body)
  }

  /**
   * Analyze message using LLM
   */
  private static async analyzeWithLLM(
    messagePreview: string,
    fullBody: string
  ): Promise<TriageResult | null> {
    try {
      const systemPrompt = `You are an AI assistant that analyzes customer support messages to classify them for triage.

Analyze the customer message and return a JSON object with:
- category: one of "technical", "billing", "feature_request", "bug", "question", "complaint", "other"
- priority: one of "low", "medium", "high", "urgent"
- sentiment: one of "positive", "neutral", "negative", "urgent"
- intent: a brief description of the customer's intent (e.g., "cancellation_request", "upgrade_inquiry", "access_issue", "general_inquiry")
- confidence: a number 0-100 indicating confidence in the classification
- suggestedTags: array of relevant tags (e.g., ["bug", "technical"], ["billing", "refund"])
- requiresHumanReview: boolean indicating if this needs human review

Return ONLY valid JSON, no markdown formatting.`

      const userPrompt = `Analyze this customer support message:

"${messagePreview}"

Return the classification as JSON.`

      const response = await LLMProviderService.generateResponse({
        systemPrompt,
        userPrompt,
        temperature: 0.3, // Lower temperature for more consistent classification
        maxTokens: 500,
      })

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return null
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate and return
      return {
        category: parsed.category || 'other',
        priority: parsed.priority || 'medium',
        sentiment: parsed.sentiment || 'neutral',
        intent: parsed.intent || 'general_inquiry',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 60)),
        suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
        requiresHumanReview: parsed.requiresHumanReview ?? (
          parsed.category === 'billing' ||
          parsed.sentiment === 'urgent' ||
          parsed.priority === 'urgent' ||
          (parsed.confidence || 60) < 50
        ),
      }
    } catch (error) {
      console.error('Error in LLM triage:', error)
      return null
    }
  }

  /**
   * Rule-based classification (fallback)
   */
  private static analyzeWithRules(body: string): TriageResult {
    const bodyLower = body.toLowerCase()
    let category: TriageResult['category'] = 'other'
    let priority: TriageResult['priority'] = 'medium'
    let sentiment: TriageResult['sentiment'] = 'neutral'
    let intent = 'general_inquiry'
    let confidence = 60
    const suggestedTags: string[] = []

    // Category detection
    if (
      bodyLower.includes('bug') ||
      bodyLower.includes('error') ||
      bodyLower.includes('broken') ||
      bodyLower.includes('not working') ||
      bodyLower.includes('crash')
    ) {
      category = 'bug'
      priority = 'high'
      suggestedTags.push('bug')
    } else if (
      bodyLower.includes('bill') ||
      bodyLower.includes('payment') ||
      bodyLower.includes('invoice') ||
      bodyLower.includes('charge') ||
      bodyLower.includes('refund')
    ) {
      category = 'billing'
      priority = 'high'
      suggestedTags.push('billing')
    } else if (
      bodyLower.includes('how to') ||
      bodyLower.includes('how do') ||
      bodyLower.includes('tutorial') ||
      bodyLower.includes('guide')
    ) {
      category = 'question'
      priority = 'medium'
      suggestedTags.push('how-to')
    } else if (
      bodyLower.includes('feature') ||
      bodyLower.includes('suggestion') ||
      bodyLower.includes('enhancement') ||
      bodyLower.includes('improvement')
    ) {
      category = 'feature_request'
      priority = 'low'
      suggestedTags.push('feature-request')
    } else if (
      bodyLower.includes('api') ||
      bodyLower.includes('integration') ||
      bodyLower.includes('technical') ||
      bodyLower.includes('code')
    ) {
      category = 'technical'
      priority = 'high'
      suggestedTags.push('technical')
    }

    // Sentiment detection
    const negativeWords = ['angry', 'frustrated', 'disappointed', 'terrible', 'awful', 'hate']
    const positiveWords = ['thank', 'great', 'excellent', 'love', 'amazing', 'perfect']
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'broken']

    if (urgentWords.some((word) => bodyLower.includes(word))) {
      sentiment = 'urgent'
      priority = 'urgent'
      confidence = 85
    } else if (negativeWords.some((word) => bodyLower.includes(word))) {
      sentiment = 'negative'
      priority = priority === 'low' ? 'medium' : priority
      confidence = 75
    } else if (positiveWords.some((word) => bodyLower.includes(word))) {
      sentiment = 'positive'
      confidence = 70
    }

    // Intent detection
    if (bodyLower.includes('cancel') || bodyLower.includes('unsubscribe')) {
      intent = 'cancellation_request'
      priority = 'high'
    } else if (bodyLower.includes('upgrade') || bodyLower.includes('plan')) {
      intent = 'upgrade_inquiry'
    } else if (bodyLower.includes('login') || bodyLower.includes('password') || bodyLower.includes('access')) {
      intent = 'access_issue'
      priority = 'high'
    }

    // Determine if human review is needed
    const requiresHumanReview =
      category === 'billing' ||
      sentiment === 'urgent' ||
      priority === 'urgent' ||
      confidence < 50

    return {
      category,
      priority,
      sentiment,
      intent,
      confidence,
      suggestedTags,
      requiresHumanReview,
    }
  }

  /**
   * Generate AI response suggestion
   * Uses LLM to generate contextual, helpful responses
   */
  static async generateSuggestion(
    message: Message,
    triageResult: TriageResult,
    context?: {
      customerHistory?: any[]
      similarTickets?: any[]
      kbArticles?: any[]
    }
  ): Promise<AISuggestion> {
    // Try LLM-based response generation first
    try {
      const llmSuggestion = await this.generateSuggestionWithLLM(message, triageResult, context)
      if (llmSuggestion) {
        return llmSuggestion
      }
    } catch (error) {
      console.warn('LLM suggestion generation failed, falling back to templates:', error)
      // Fall through to template-based suggestions
    }

    // Fallback to template-based suggestions
    return this.generateSuggestionWithTemplates(triageResult, context)
  }

  /**
   * Generate response suggestion using LLM
   */
  private static async generateSuggestionWithLLM(
    message: Message,
    triageResult: TriageResult,
    context?: {
      customerHistory?: any[]
      similarTickets?: any[]
      kbArticles?: any[]
    }
  ): Promise<AISuggestion | null> {
    try {
      const kbContext = context?.kbArticles?.[0]
        ? `\n\nRelevant knowledge base article: "${context.kbArticles[0].title}"`
        : ''

      const systemPrompt = `You are a customer support agent assistant. Generate a helpful, professional, and empathetic response to customer messages.

Guidelines:
- Be professional, friendly, and empathetic
- Address the customer's specific concern
- If a KB article is provided, reference it naturally
- Keep responses concise but complete
- For urgent issues, acknowledge urgency
- For billing issues, be careful and suggest contacting billing team
- Never make promises you can't keep
- Always offer to help further

Return a JSON object with:
- response: The suggested response text
- reasoning: Brief explanation of why this response is appropriate
- confidence: "high", "medium", or "low" based on how confident you are in this response`

      const userPrompt = `Customer message:
"${message.body.substring(0, 1000)}"

Classification:
- Category: ${triageResult.category}
- Priority: ${triageResult.priority}
- Sentiment: ${triageResult.sentiment}
- Intent: ${triageResult.intent}
${kbContext}

Generate an appropriate response. Return ONLY valid JSON, no markdown formatting.`

      const llmResponse = await LLMProviderService.generateResponse({
        systemPrompt,
        userPrompt,
        temperature: 0.7, // Higher temperature for more natural responses
        maxTokens: 800,
      })

      // Parse JSON response
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return null
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        confidence: parsed.confidence || 'medium',
        response: parsed.response || '',
        reasoning: parsed.reasoning || 'LLM-generated response',
        kbArticles: context?.kbArticles || [],
      }
    } catch (error) {
      console.error('Error in LLM suggestion generation:', error)
      return null
    }
  }

  /**
   * Template-based response generation (fallback)
   */
  private static generateSuggestionWithTemplates(
    triageResult: TriageResult,
    context?: {
      customerHistory?: any[]
      similarTickets?: any[]
      kbArticles?: any[]
    }
  ): AISuggestion {
    let response = ''
    let reasoning = ''
    let confidence: 'high' | 'medium' | 'low' = 'medium'

    // High confidence responses for common issues
    if (triageResult.category === 'question' && triageResult.confidence >= 70) {
      response = `Thank you for reaching out! I'd be happy to help you with that. ${context?.kbArticles?.[0] ? `You might find this helpful: ${context.kbArticles[0].title}` : 'Let me provide you with some guidance.'}`
      confidence = 'high'
      reasoning = 'Common question type with high confidence classification'
    } else if (triageResult.category === 'bug' && triageResult.confidence >= 70) {
      response = `I'm sorry to hear you're experiencing this issue. Let me help you troubleshoot this. Can you provide more details about when this started happening?`
      confidence = 'high'
      reasoning = 'Bug report with clear indicators'
    } else if (triageResult.sentiment === 'urgent') {
      response = `I understand this is urgent. Let me escalate this to our team right away.`
      confidence = 'high'
      reasoning = 'Urgent sentiment detected'
    } else {
      response = `Thank you for contacting us. I'm reviewing your message and will get back to you shortly.`
      confidence = 'low'
      reasoning = 'Complex issue requiring human review'
    }

    return {
      confidence,
      response,
      reasoning,
      kbArticles: context?.kbArticles || [],
    }
  }

  /**
   * Auto-assign based on triage result
   */
  static async suggestAssignment(
    triageResult: TriageResult,
    availableAgents: Array<{ member_id: string; role: string; skills: string[] }>
  ): Promise<string | null> {
    // Billing issues → CSM
    if (triageResult.category === 'billing') {
      const csm = availableAgents.find((a) => a.role === 'csm')
      return csm?.member_id || null
    }

    // Technical issues → Solutions Engineer
    if (triageResult.category === 'technical') {
      const se = availableAgents.find((a) => a.role === 'solutions_engineer')
      return se?.member_id || null
    }

    // Urgent issues → Support Manager
    if (triageResult.priority === 'urgent' || triageResult.sentiment === 'urgent') {
      const manager = availableAgents.find((a) => a.role === 'support_manager')
      return manager?.member_id || null
    }

    // Default → Round-robin from support agents
    const agents = availableAgents.filter((a) => a.role === 'support_agent')
    if (agents.length > 0) {
      // Simple round-robin (would need state management for real implementation)
      return agents[0].member_id
    }

    return null
  }
}
