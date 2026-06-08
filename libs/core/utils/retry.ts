/**
 * Retry Utility
 * Exponential backoff retry logic for API calls
 */

import { apiLogger } from '@/lib/utils/api-logger'
import { RETRY_CONFIG } from '@/lib/config/app-config'

export interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  retryableErrors?: string[]
  retryableStatusCodes?: number[]
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
}

const DEFAULT_RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
  
  // Add jitter (random factor between 0.5 and 1.5)
  const jitter = 0.5 + Math.random()
  
  // Apply jitter and cap at max
  return Math.min(exponentialDelay * jitter, maxDelayMs)
}

/**
 * Check if an error is retryable
 */
function isRetryable(
  error: Error,
  statusCode?: number,
  options: RetryOptions = {}
): boolean {
  const retryableStatusCodes = options.retryableStatusCodes || DEFAULT_RETRYABLE_STATUS_CODES
  
  // Check status code
  if (statusCode && retryableStatusCodes.includes(statusCode)) {
    return true
  }
  
  // Check error type
  const retryableErrors = options.retryableErrors || [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPROTO',
    'EHOSTUNREACH',
  ]
  
  const errorCode = (error as any).code || (error as any).errno
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true
  }
  
  // Check for timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true
  }
  
  // Check for network errors
  if (error.message.includes('network') || error.message.includes('ECONN')) {
    return true
  }
  
  return false
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wrap a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.MAX_RETRIES
  const baseDelayMs = options.baseDelayMs ?? RETRY_CONFIG.BASE_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? RETRY_CONFIG.MAX_DELAY_MS
  
  let lastError: Error = new Error('Unknown error')
  let lastStatusCode: number | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Try to extract status code from response-like objects
      if ((error as any).status) {
        lastStatusCode = (error as any).status
      }
      
      // Check if we should retry
      if (attempt < maxRetries && isRetryable(lastError, lastStatusCode, options)) {
        const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs)
        
        // Log retry attempt
        apiLogger.warn(`Retrying request (attempt ${attempt + 1}/${maxRetries})`, {
          metadata: {
            error: lastError.message,
            delayMs,
            attempt: attempt + 1,
          },
        })
        
        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError, delayMs)
        }
        
        // Wait before retrying
        await sleep(delayMs)
      } else {
        // Not retryable or max retries reached
        throw lastError
      }
    }
  }
  
  throw lastError
}

/**
 * Create a retry wrapper for fetch
 */
export function createRetryFetch(
  defaultOptions: RetryOptions = {}
): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url: string, init?: RequestInit): Promise<Response> => {
    let lastStatusCode: number | undefined
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url, init)
        lastStatusCode = res.status
        
        // Throw on retryable status codes to trigger retry
        if (DEFAULT_RETRYABLE_STATUS_CODES.includes(res.status)) {
          const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as any
          error.status = res.status
          throw error
        }
        
        return res
      },
      {
        ...defaultOptions,
        onRetry: (attempt, error, delayMs) => {
          apiLogger.externalCall(
            'fetch',
            url,
            delayMs,
            false,
            { statusCode: lastStatusCode, metadata: { attempt } }
          )
          if (defaultOptions.onRetry) {
            defaultOptions.onRetry(attempt, error, delayMs)
          }
        },
      }
    )
    
    return response
  }
}

/**
 * Retry wrapper specifically for API client methods
 */
export class RetryableAPIClient {
  private options: RetryOptions
  
  constructor(options: RetryOptions = {}) {
    this.options = options
  }
  
  async request<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let attempt = 0
    
    return withRetry(fn, {
      ...this.options,
      onRetry: (attemptNum, error, delayMs) => {
        attempt = attemptNum
        apiLogger.externalCall(
          'api-client',
          operation,
          Date.now() - startTime,
          false,
          { metadata: { attempt: attemptNum, error: error.message } }
        )
        if (this.options.onRetry) {
          this.options.onRetry(attemptNum, error, delayMs)
        }
      },
    })
  }
}
