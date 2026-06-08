/**
 * Resilient API Client
 * Combines retry logic with circuit breaker pattern
 */

import { withRetry, RetryOptions } from '@/lib/utils/retry'
import { circuitBreakerManager, CircuitBreakerError } from '@/lib/utils/circuit-breaker'
import { apiLogger, createTimer } from '@/lib/utils/api-logger'
import { API_TIMEOUTS } from '@/lib/config/app-config'

export interface ResilientClientOptions {
  serviceName: string
  retryOptions?: RetryOptions
  circuitBreakerOptions?: {
    failureThreshold?: number
    successThreshold?: number
    resetTimeoutMs?: number
  }
  timeoutMs?: number
}

/**
 * Make a resilient API call with retry and circuit breaker protection
 */
export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  clientOptions: ResilientClientOptions
): Promise<Response> {
  const { serviceName, retryOptions, circuitBreakerOptions, timeoutMs } = clientOptions
  const timer = createTimer()
  const actualTimeout = timeoutMs ?? API_TIMEOUTS.DEFAULT_TIMEOUT_MS

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), actualTimeout)

  try {
    const response = await circuitBreakerManager.execute(
      serviceName,
      async () => {
        return withRetry(
          async () => {
            const res = await fetch(url, {
              ...options,
              signal: controller.signal,
            })

            // Throw on retryable status codes
            if ([408, 429, 500, 502, 503, 504].includes(res.status)) {
              const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as any
              error.status = res.status
              throw error
            }

            return res
          },
          retryOptions
        )
      },
      circuitBreakerOptions
    )

    clearTimeout(timeoutId)
    const durationMs = timer()

    apiLogger.externalCall(serviceName, url, durationMs, response.ok, {
      statusCode: response.status,
    })

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    const durationMs = timer()

    if (error instanceof CircuitBreakerError) {
      apiLogger.warn(`Circuit breaker blocked call to ${serviceName}`, {
        metadata: { url, durationMs },
      })
    } else {
      apiLogger.externalCall(serviceName, url, durationMs, false)
    }

    throw error
  }
}

/**
 * Create a resilient API client factory
 */
export function createResilientClient(
  serviceName: string,
  defaultOptions: {
    baseUrl?: string
    headers?: Record<string, string>
    retryOptions?: RetryOptions
    circuitBreakerOptions?: ResilientClientOptions['circuitBreakerOptions']
    timeoutMs?: number
  } = {}
) {
  return {
    async request<T>(
      endpoint: string,
      options: RequestInit = {},
      overrides: Partial<ResilientClientOptions> = {}
    ): Promise<T> {
      const url = defaultOptions.baseUrl
        ? `${defaultOptions.baseUrl}${endpoint}`
        : endpoint

      const response = await resilientFetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...defaultOptions.headers,
          ...options.headers,
        },
      }, {
        serviceName,
        retryOptions: defaultOptions.retryOptions,
        circuitBreakerOptions: defaultOptions.circuitBreakerOptions,
        timeoutMs: defaultOptions.timeoutMs,
        ...overrides,
      })

      if (!response.ok) {
        throw new Error(`${serviceName} API error: ${response.statusText}`)
      }

      return response.json()
    },

    async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      return this.request<T>(endpoint, { ...options, method: 'GET' })
    },

    async post<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      })
    },

    async put<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      })
    },

    async patch<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    },

    async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      return this.request<T>(endpoint, { ...options, method: 'DELETE' })
    },
  }
}

/**
 * Health check helper for circuit breakers
 */
export function getCircuitBreakerHealth(): {
  healthy: boolean
  services: Record<string, { state: string; failures: number; successes: number }>
} {
  const states = circuitBreakerManager.getAllStates()
  const services: Record<string, { state: string; failures: number; successes: number }> = {}
  let healthy = true

  for (const [name, stats] of Object.entries(states)) {
    services[name] = {
      state: stats.state,
      failures: stats.totalFailures,
      successes: stats.totalSuccesses,
    }
    if (stats.state === 'open') {
      healthy = false
    }
  }

  return { healthy, services }
}
