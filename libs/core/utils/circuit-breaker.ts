/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping calls to failing services
 */

import { apiLogger } from '@/lib/utils/api-logger'

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  successThreshold?: number
  timeout?: number
  resetTimeoutMs?: number
  onStateChange?: (state: CircuitState, serviceName: string) => void
}

interface CircuitStats {
  failures: number
  successes: number
  lastFailureTime: number | null
  lastSuccessTime: number | null
  totalCalls: number
  totalFailures: number
  totalSuccesses: number
}

/**
 * Circuit Breaker for protecting external service calls
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    totalCalls: 0,
    totalFailures: 0,
    totalSuccesses: 0,
  }
  private nextAttemptTime: number = 0
  private readonly options: Required<CircuitBreakerOptions>
  private readonly serviceName: string

  constructor(
    serviceName: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.serviceName = serviceName
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 3,
      timeout: options.timeout ?? 30000,
      resetTimeoutMs: options.resetTimeoutMs ?? 60000,
      onStateChange: options.onStateChange ?? (() => {}),
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats & { state: CircuitState } {
    return { ...this.stats, state: this.state }
  }

  /**
   * Check if calls are allowed
   */
  canExecute(): boolean {
    if (this.state === 'closed') {
      return true
    }

    if (this.state === 'open') {
      // Check if reset timeout has passed
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionTo('half-open')
        return true
      }
      return false
    }

    // half-open state - allow one call
    return true
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    this.stats.successes++
    this.stats.lastSuccessTime = Date.now()
    this.stats.totalCalls++
    this.stats.totalSuccesses++

    if (this.state === 'half-open') {
      // In half-open, check if we've reached success threshold
      if (this.stats.successes >= this.options.successThreshold) {
        this.transitionTo('closed')
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.stats.failures = 0
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(): void {
    this.stats.failures++
    this.stats.lastFailureTime = Date.now()
    this.stats.totalCalls++
    this.stats.totalFailures++

    if (this.state === 'half-open') {
      // Any failure in half-open immediately opens circuit
      this.transitionTo('open')
    } else if (this.state === 'closed') {
      // Check if we've reached failure threshold
      if (this.stats.failures >= this.options.failureThreshold) {
        this.transitionTo('open')
      }
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerError(
        `Circuit breaker is open for service: ${this.serviceName}`,
        this.serviceName,
        this.state
      )
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * Force reset the circuit breaker
   */
  reset(): void {
    this.transitionTo('closed')
  }

  /**
   * Force open the circuit breaker
   */
  trip(): void {
    this.transitionTo('open')
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState

    if (newState === 'open') {
      this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs
      apiLogger.warn(`Circuit breaker opened for ${this.serviceName}`, {
        metadata: {
          serviceName: this.serviceName,
          failures: this.stats.failures,
          lastFailureTime: this.stats.lastFailureTime,
        },
      })
    } else if (newState === 'closed') {
      this.stats.failures = 0
      this.stats.successes = 0
      apiLogger.info(`Circuit breaker closed for ${this.serviceName}`, {
        metadata: { serviceName: this.serviceName },
      })
    } else if (newState === 'half-open') {
      this.stats.successes = 0
      apiLogger.info(`Circuit breaker half-open for ${this.serviceName}`, {
        metadata: { serviceName: this.serviceName },
      })
    }

    this.options.onStateChange(newState, this.serviceName)
  }
}

/**
 * Custom error for circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly state: CircuitState
  ) {
    super(message)
    this.name = 'CircuitBreakerError'
  }
}

/**
 * Circuit Breaker Manager - manages circuit breakers for multiple services
 */
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private defaultOptions: CircuitBreakerOptions

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const breaker = new CircuitBreaker(serviceName, {
        ...this.defaultOptions,
        ...options,
      })
      this.circuitBreakers.set(serviceName, breaker)
    }
    return this.circuitBreakers.get(serviceName)!
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, ReturnType<CircuitBreaker['getStats']>> {
    const states: Record<string, ReturnType<CircuitBreaker['getStats']>> = {}
    for (const [name, breaker] of this.circuitBreakers) {
      states[name] = breaker.getStats()
    }
    return states
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset()
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, options)
    return breaker.execute(fn)
  }
}

// Singleton manager instance
export const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
  successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '3', 10),
  resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || '60000', 10),
})
