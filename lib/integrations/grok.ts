/**
 * Grok (xAI) Integration
 * 
 * Client for interacting with xAI's Grok API
 */

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1'

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GrokResponse {
  content: string
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class GrokClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string = GROK_API_KEY, baseUrl: string = GROK_API_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * Generate a response using Grok
   */
  async generateResponse(options: {
    systemPrompt: string
    userPrompt: string
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<GrokResponse> {
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY environment variable is not configured')
    }

    const model = options.model || 'grok-beta'
    const maxTokens = options.maxTokens || 4096
    const temperature = options.temperature ?? 0.7

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt,
          },
          {
            role: 'user',
            content: options.userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`Grok API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
    }
  }

  /**
   * Generate a response with conversation history
   */
  async generateResponseWithHistory(options: {
    systemPrompt: string
    messages: GrokMessage[]
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<GrokResponse> {
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY environment variable is not configured')
    }

    const model = options.model || 'grok-beta'
    const maxTokens = options.maxTokens || 4096
    const temperature = options.temperature ?? 0.7

    const messages = [
      {
        role: 'system' as const,
        content: options.systemPrompt,
      },
      ...options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`Grok API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
    }
  }
}

export const grokClient = new GrokClient()
