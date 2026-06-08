/**
 * API Logging Utility
 * Centralized logging for API routes with structured output
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  requestId?: string
  method?: string
  path?: string
  statusCode?: number
  durationMs?: number
  userId?: string
  tenantId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class APILogger {
  private service: string
  private isDevelopment: boolean

  constructor(service: string = 'cs-support-api') {
    this.service = service
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        `[${entry.service}]`,
      ]
      
      if (entry.requestId) parts.push(`[req:${entry.requestId.slice(0, 8)}]`)
      if (entry.method && entry.path) parts.push(`[${entry.method} ${entry.path}]`)
      if (entry.statusCode) parts.push(`[${entry.statusCode}]`)
      if (entry.durationMs !== undefined) parts.push(`[${entry.durationMs}ms]`)
      
      parts.push(entry.message)
      
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        parts.push(JSON.stringify(entry.metadata))
      }
      
      if (entry.error) {
        parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`)
        if (entry.error.stack && this.isDevelopment) {
          parts.push(`\n  Stack: ${entry.error.stack}`)
        }
      }
      
      return parts.join(' ')
    }
    
    // JSON format for production (structured logging)
    return JSON.stringify(entry)
  }

  private log(level: LogLevel, message: string, data?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...data,
    }

    const formatted = this.formatLog(entry)
    
    switch (level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.log(formatted)
        }
        break
      default:
        console.log(formatted)
    }
  }

  debug(message: string, data?: Partial<LogEntry>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Partial<LogEntry>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Partial<LogEntry>): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error, data?: Partial<LogEntry>): void {
    this.log('error', message, {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    })
  }

  /**
   * Log API request start
   */
  requestStart(
    requestId: string,
    method: string,
    path: string,
    data?: { userId?: string; tenantId?: string; metadata?: Record<string, any> }
  ): void {
    this.info(`Request started`, {
      requestId,
      method,
      path,
      ...data,
    })
  }

  /**
   * Log API request completion
   */
  requestEnd(
    requestId: string,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    data?: { userId?: string; tenantId?: string; metadata?: Record<string, any> }
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info'
    this.log(level, `Request completed`, {
      requestId,
      method,
      path,
      statusCode,
      durationMs,
      ...data,
    })
  }

  /**
   * Log API error
   */
  requestError(
    requestId: string,
    method: string,
    path: string,
    error: Error,
    durationMs: number,
    data?: { userId?: string; tenantId?: string; metadata?: Record<string, any> }
  ): void {
    this.error(`Request failed`, error, {
      requestId,
      method,
      path,
      statusCode: 500,
      durationMs,
      ...data,
    })
  }

  /**
   * Log external API call
   */
  externalCall(
    service: string,
    operation: string,
    durationMs: number,
    success: boolean,
    data?: { statusCode?: number; metadata?: Record<string, any> }
  ): void {
    const level = success ? 'info' : 'warn'
    this.log(level, `External API call: ${service}.${operation}`, {
      durationMs,
      statusCode: data?.statusCode,
      metadata: {
        externalService: service,
        operation,
        success,
        ...data?.metadata,
      },
    })
  }

  /**
   * Log database operation
   */
  dbOperation(
    operation: string,
    table: string,
    durationMs: number,
    data?: { rowCount?: number; metadata?: Record<string, any> }
  ): void {
    this.debug(`DB operation: ${operation} on ${table}`, {
      durationMs,
      metadata: {
        dbTable: table,
        dbOperation: operation,
        rowCount: data?.rowCount,
        ...data?.metadata,
      },
    })
  }
}

// Singleton instance
export const apiLogger = new APILogger()

// Factory for creating service-specific loggers
export function createLogger(service: string): APILogger {
  return new APILogger(service)
}

// Request ID generator
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Timing helper
export function createTimer(): () => number {
  const start = Date.now()
  return () => Date.now() - start
}
