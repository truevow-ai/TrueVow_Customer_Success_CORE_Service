/**
 * LLM Provider Service
 * 
 * Manages multiple LLM providers with fallback logic
 * Supports: Anthropic Claude, OpenAI GPT, Grok (xAI)
 */

import { anthropicClient, ClaudeResponse } from '@/lib/integrations/anthropic'
import { openaiClient, OpenAIResponse } from '@/lib/integrations/openai'
import { grokClient, GrokResponse } from '@/lib/integrations/grok'
import { getLLMProviderPriorityOrder, getDefaultModel, getDefaultTemperature, getDefaultMaxTokens, type LLMProvider } from '@/lib/config/llm-config'

export type { LLMProvider }

export interface LLMResponse {
  content: string
  provider: LLMProvider
  model: string
  usage: {
    input_tokens?: number
    output_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface LLMOptions {
  systemPrompt: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  preferredProvider?: LLMProvider
  fallbackProviders?: LLMProvider[]
}

export class LLMProviderService {
  /**
   * Generate response with automatic fallback
   * Automatically uses configured priority order if no preferred provider specified
   */
  static async generateResponse(options: LLMOptions): Promise<LLMResponse> {
    // Get provider order: use preferred if specified, otherwise use configured priority order
    let providers: LLMProvider[]
    
    if (options.preferredProvider) {
      // If preferred provider is specified, use it first, then fallbacks or configured order
      const configuredOrder = getLLMProviderPriorityOrder()
      const available = this.getAvailableProviders()
      const fallbacks = options.fallbackProviders || configuredOrder.filter(p => available.includes(p) && p !== options.preferredProvider)
      providers = [options.preferredProvider, ...fallbacks].filter(p => this.getAvailableProviders().includes(p))
    } else {
      // Use configured priority order automatically
      providers = this.getProviderOrder(undefined, options.fallbackProviders)
    }
    
    if (providers.length === 0) {
      throw new Error('No LLM providers available. Please configure at least one API key.')
    }
    
    let lastError: Error | null = null

    for (const provider of providers) {
      try {
        const response = await this.generateWithProvider(provider, options)
        console.log(`✅ Used LLM provider: ${provider} (from priority order: ${providers.join(' → ')})`)
        return response
      } catch (error) {
        console.warn(`⚠️ Provider ${provider} failed, trying next in priority order:`, error)
        lastError = error instanceof Error ? error : new Error('Unknown error')
        continue
      }
    }

    throw new Error(`All LLM providers failed. Tried: ${providers.join(', ')}. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  /**
   * Generate response with specific provider
   */
  private static async generateWithProvider(
    provider: LLMProvider,
    options: LLMOptions
  ): Promise<LLMResponse> {
    switch (provider) {
      case 'anthropic':
        const claudeResponse = await anthropicClient.generateResponse({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          model: options.model || getDefaultModel('anthropic'),
          maxTokens: options.maxTokens || getDefaultMaxTokens('anthropic'),
          temperature: options.temperature ?? getDefaultTemperature('anthropic'),
        })
        return {
          content: claudeResponse.content,
          provider: 'anthropic',
          model: claudeResponse.model,
          usage: {
            input_tokens: claudeResponse.usage.input_tokens,
            output_tokens: claudeResponse.usage.output_tokens,
          },
        }

      case 'openai':
        const openaiResponse = await openaiClient.generateResponse({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          model: options.model || getDefaultModel('openai'),
          maxTokens: options.maxTokens || getDefaultMaxTokens('openai'),
          temperature: options.temperature ?? getDefaultTemperature('openai'),
        })
        return {
          content: openaiResponse.content,
          provider: 'openai',
          model: openaiResponse.model,
          usage: {
            prompt_tokens: openaiResponse.usage.prompt_tokens,
            completion_tokens: openaiResponse.usage.completion_tokens,
            total_tokens: openaiResponse.usage.total_tokens,
          },
        }

      case 'grok':
        const grokResponse = await grokClient.generateResponse({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          model: options.model || getDefaultModel('grok'),
          maxTokens: options.maxTokens || getDefaultMaxTokens('grok'),
          temperature: options.temperature ?? getDefaultTemperature('grok'),
        })
        return {
          content: grokResponse.content,
          provider: 'grok',
          model: grokResponse.model,
          usage: {
            prompt_tokens: grokResponse.usage.prompt_tokens,
            completion_tokens: grokResponse.usage.completion_tokens,
            total_tokens: grokResponse.usage.total_tokens,
          },
        }

      default:
        throw new Error(`Unknown LLM provider: ${provider}`)
    }
  }

  /**
   * Get provider order with fallbacks
   * Uses configured priority order from environment or config
   */
  private static getProviderOrder(
    preferred?: LLMProvider,
    fallbacks?: LLMProvider[]
  ): LLMProvider[] {
    // Get configured priority order
    const configuredOrder = getLLMProviderPriorityOrder()
    
    // Get available providers
    const available = this.getAvailableProviders()
    
    if (preferred) {
      // If preferred provider is specified, use it first
      const order = [preferred]
      // Filter configured order to only available providers, excluding preferred
      const remaining = (fallbacks || configuredOrder)
        .filter(p => p !== preferred && available.includes(p))
      return [...order, ...remaining]
    }

    // Use configured priority order, filtered to only available providers
    return fallbacks || configuredOrder.filter(p => available.includes(p))
  }

  /**
   * Check which providers are available
   */
  static getAvailableProviders(): LLMProvider[] {
    const available: LLMProvider[] = []

    if (process.env.ANTHROPIC_API_KEY) {
      available.push('anthropic')
    }
    if (process.env.OPENAI_API_KEY) {
      available.push('openai')
    }
    if (process.env.GROK_API_KEY) {
      available.push('grok')
    }

    return available
  }

  /**
   * Get default provider based on configured priority order and availability
   */
  static getDefaultProvider(): LLMProvider | null {
    const configuredOrder = getLLMProviderPriorityOrder()
    const available = this.getAvailableProviders()
    
    // Return first available provider in configured priority order
    return configuredOrder.find(p => available.includes(p)) || null
  }

  /**
   * Get configured priority order (filtered to available providers)
   */
  static getConfiguredProviderOrder(): LLMProvider[] {
    const configuredOrder = getLLMProviderPriorityOrder()
    const available = this.getAvailableProviders()
    return configuredOrder.filter(p => available.includes(p))
  }
}
