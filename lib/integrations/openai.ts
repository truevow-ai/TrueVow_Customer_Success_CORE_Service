/**
 * OpenAI Integration
 * 
 * Client for interacting with OpenAI's API (GPT-4, GPT-3.5, etc.)
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIResponse {
  content: string
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIClient {
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(apiKey: string = OPENAI_API_KEY) {
    this.apiKey = apiKey
  }

  /**
   * Generate a response using OpenAI
   */
  async generateResponse(options: {
    systemPrompt: string
    userPrompt: string
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<OpenAIResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured')
    }

    const model = options.model || 'gpt-4-turbo-preview'
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
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
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
    messages: OpenAIMessage[]
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<OpenAIResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured')
    }

    const model = options.model || 'gpt-4-turbo-preview'
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
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
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

export const openaiClient = new OpenAIClient()
