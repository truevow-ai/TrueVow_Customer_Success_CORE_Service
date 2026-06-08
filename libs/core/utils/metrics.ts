/**
 * API Metrics Collection
 * Tracks API call metrics for monitoring and analysis
 */

import { apiLogger } from '@/lib/utils/api-logger'

export interface APIMetric {
  timestamp: number
  service: string
  operation: string
  durationMs: number
  success: boolean
  statusCode?: number
  errorType?: string
  metadata?: Record<string, any>
}

export interface ServiceMetrics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDurationMs: number
  p50DurationMs: number
  p95DurationMs: number
  p99DurationMs: number
  errorRate: number
  lastError?: {
    timestamp: number
    errorType: string
    message: string
  }
}

export interface MetricsSummary {
  services: Record<string, ServiceMetrics>
  totalCalls: number
  totalSuccess: number
  totalFailures: number
  overallErrorRate: number
  periodStart: number
  periodEnd: number
}

/**
 * In-memory metrics store
 * For production, consider using Redis or a time-series database
 */
class MetricsStore {
  private metrics: APIMetric[] = []
  private maxMetrics: number
  private retentionMs: number

  constructor(maxMetrics: number = 10000, retentionMs: number = 3600000) {
    this.maxMetrics = maxMetrics
    this.retentionMs = retentionMs
  }

  /**
   * Record a metric
   */
  record(metric: APIMetric): void {
    this.metrics.push(metric)
    this.cleanup()
  }

  /**
   * Get all metrics for a service
   */
  getMetrics(service?: string, operation?: string, since?: number): APIMetric[] {
    let filtered = this.metrics

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since)
    }

    if (service) {
      filtered = filtered.filter(m => m.service === service)
    }

    if (operation) {
      filtered = filtered.filter(m => m.operation === operation)
    }

    return filtered
  }

  /**
   * Get aggregated metrics for a service
   */
  getServiceMetrics(service: string, since?: number): ServiceMetrics {
    const metrics = this.getMetrics(service, undefined, since)
    
    if (metrics.length === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageDurationMs: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        errorRate: 0,
      }
    }

    const durations = metrics.map(m => m.durationMs).sort((a, b) => a - b)
    const successfulCalls = metrics.filter(m => m.success).length
    const failedCalls = metrics.filter(m => !m.success).length
    const lastError = metrics.filter(m => !m.success).pop()

    return {
      totalCalls: metrics.length,
      successfulCalls,
      failedCalls,
      averageDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50DurationMs: this.percentile(durations, 50),
      p95DurationMs: this.percentile(durations, 95),
      p99DurationMs: this.percentile(durations, 99),
      errorRate: failedCalls / metrics.length,
      lastError: lastError ? {
        timestamp: lastError.timestamp,
        errorType: lastError.errorType || 'unknown',
        message: `HTTP ${lastError.statusCode || 'N/A'}`,
      } : undefined,
    }
  }

  /**
   * Get summary of all services
   */
  getSummary(since?: number): MetricsSummary {
    const metrics = since ? this.metrics.filter(m => m.timestamp >= since) : this.metrics
    const services: Record<string, ServiceMetrics> = {}

    // Get unique services
    const uniqueServices = [...new Set(metrics.map(m => m.service))]
    
    for (const service of uniqueServices) {
      services[service] = this.getServiceMetrics(service, since)
    }

    const totalSuccess = metrics.filter(m => m.success).length
    const totalFailures = metrics.filter(m => !m.success).length

    return {
      services,
      totalCalls: metrics.length,
      totalSuccess,
      totalFailures,
      overallErrorRate: metrics.length > 0 ? totalFailures / metrics.length : 0,
      periodStart: since || (this.metrics[0]?.timestamp || Date.now()),
      periodEnd: Date.now(),
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Cleanup old metrics
   */
  private cleanup(): void {
    // Remove old metrics
    const cutoff = Date.now() - this.retentionMs
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)

    // Trim if still too large
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0
    const index = Math.ceil((p / 100) * sortedValues.length) - 1
    return sortedValues[Math.max(0, index)]
  }
}

// Singleton instance
export const metricsStore = new MetricsStore()

/**
 * Metrics collector class
 */
export class MetricsCollector {
  private service: string

  constructor(service: string) {
    this.service = service
  }

  /**
   * Track an API call
   */
  track(
    operation: string,
    durationMs: number,
    success: boolean,
    options?: {
      statusCode?: number
      errorType?: string
      metadata?: Record<string, any>
    }
  ): void {
    const metric: APIMetric = {
      timestamp: Date.now(),
      service: this.service,
      operation,
      durationMs,
      success,
      ...options,
    }

    metricsStore.record(metric)

    // Log for debugging
    if (!success) {
      apiLogger.warn(`API call failed: ${this.service}.${operation}`, {
        metadata: {
          durationMs,
          statusCode: options?.statusCode,
          errorType: options?.errorType,
        },
      })
    }
  }

  /**
   * Track with timing helper
   */
  trackWithTiming<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now()

    return fn()
      .then(result => {
        this.track(operation, Date.now() - start, true)
        return result
      })
      .catch(error => {
        this.track(operation, Date.now() - start, false, {
          errorType: error.name || 'Error',
        })
        throw error
      })
  }

  /**
   * Get metrics for this service
   */
  getMetrics(since?: number): ServiceMetrics {
    return metricsStore.getServiceMetrics(this.service, since)
  }
}

/**
 * Create a metrics collector for a service
 */
export function createMetricsCollector(service: string): MetricsCollector {
  return new MetricsCollector(service)
}

/**
 * API endpoint to get metrics summary
 * Use this in your API route handler
 */
export function getMetricsResponse(since?: number): MetricsSummary {
  return metricsStore.getSummary(since)
}

/**
 * Health check based on metrics
 */
export function getMetricsHealth(): {
  healthy: boolean
  issues: string[]
  summary: MetricsSummary
} {
  const summary = metricsStore.getSummary(Date.now() - 300000) // Last 5 minutes
  const issues: string[] = []

  // Check for high error rates
  for (const [service, metrics] of Object.entries(summary.services)) {
    if (metrics.errorRate > 0.1) {
      issues.push(`High error rate (${(metrics.errorRate * 100).toFixed(1)}%) for ${service}`)
    }
    if (metrics.p95DurationMs > 5000) {
      issues.push(`High latency (P95: ${metrics.p95DurationMs}ms) for ${service}`)
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
    summary,
  }
}
