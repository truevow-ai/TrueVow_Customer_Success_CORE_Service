/**
 * Anthropic Claude Integration
 * 
 * Client for interacting with Anthropic's Claude API
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  content: string
  model: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class AnthropicClient {
  private apiKey: string
  private baseUrl: string = 'https://api.anthropic.com/v1'

  constructor(apiKey: string = ANTHROPIC_API_KEY) {
    this.apiKey = apiKey
  }

  /**
   * Generate a response using Claude
   */
  async generateResponse(options: {
    systemPrompt: string
    userPrompt: string
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not configured')
    }

    const model = options.model || 'claude-3-5-sonnet-20241022'
    const maxTokens = options.maxTokens || 4096
    const temperature = options.temperature ?? 0.7

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: options.userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Anthropic API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
      },
    }
  }

  /**
   * Generate a response with conversation history
   */
  async generateResponseWithHistory(options: {
    systemPrompt: string
    messages: ClaudeMessage[]
    model?: string
    maxTokens?: number
    temperature?: number
  }): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not configured')
    }

    const model = options.model || 'claude-3-5-sonnet-20241022'
    const maxTokens = options.maxTokens || 4096
    const temperature = options.temperature ?? 0.7

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: options.systemPrompt,
        messages: options.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Anthropic API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
      },
    }
  }
}

export const anthropicClient = new AnthropicClient()
