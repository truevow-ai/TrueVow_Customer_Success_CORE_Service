/**
 * Service Registry Client
 * 
 * Participates in the centralized Service Registry hosted by Internal Ops (Port 3006).
 * - Registers service on startup
 * - Sends heartbeat every 5 minutes
 * - Queries registry for service discovery (source of truth)
 * - Fails fast if services are unreachable (no silent skipping)
 * 
 * Registry API Contract:
 * POST /api/v1/registry - Register service
 * POST /api/v1/registry/modules - Register module
 * POST /api/v1/registry/heartbeat - Send heartbeat
 * POST /api/v1/integrations - Register integration
 * GET  /api/v1/registry/services - List all services
 * GET  /api/v1/registry/services/:name - Get specific service
 */

// ============================================================
// Configuration
// ============================================================

const REGISTRY_URL = process.env.SERVICE_REGISTRY_URL || process.env.INTERNAL_OPS_SERVICE_URL || 'http://localhost:3006'
const REGISTRY_API_KEY = process.env.SERVICE_REGISTRY_API_KEY || process.env.INTERNAL_OPS_SERVICE_API_KEY
const HEARTBEAT_INTERVAL_MS = (parseInt(process.env.SERVICE_HEARTBEAT_INTERVAL_S || '300')) * 1000

// ============================================================
// Types
// ============================================================

export interface ServiceConfig {
  service_name: string
  service_type: string
  service_url: string
  port: number
  version?: string
  health_endpoint?: string
  endpoints?: Array<{ path: string; method: string; description?: string }>
  agents?: string[]
  capabilities?: string[]
}

export interface ModuleConfig {
  service_name: string
  module_name: string
  module_version?: string
  description?: string
  endpoints?: Array<{ path: string; method: string; description?: string }>
  events_published?: Array<{ event_name: string; description?: string }>
  events_consumed?: Array<{ event_name: string; source_service?: string }>
}

export interface IntegrationConfig {
  source_service: string
  target_service: string
  integration_type: string
  purpose?: string
  event_triggers?: string[]
}

export interface ServiceRegistration {
  name: string
  display_name?: string
  service_name?: string
  url?: string
  service_url?: string
  port: number
  version: string
  health_endpoint?: string
  capabilities?: string[]
  status: 'healthy' | 'degraded' | 'unhealthy'
  last_heartbeat?: string
  is_active?: boolean
}

export interface ServiceEndpoint {
  name: string
  url: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  available: boolean
}

export class ServiceUnavailableError extends Error {
  constructor(serviceName: string, reason?: string) {
    super(`Service '${serviceName}' is unavailable${reason ? `: ${reason}` : ''}`)
    this.name = 'ServiceUnavailableError'
  }
}

// ============================================================
// Service Registry Client
// ============================================================

let heartbeatInterval: NodeJS.Timeout | null = null
let isRegistered = false
let currentServiceName: string | null = null

export class ServiceRegistryClient {
  
  // ========== SERVICE REGISTRATION ==========
  
  /**
   * Register service with the registry
   * Called from instrumentation.ts with service config
   */
  static async registerService(config: ServiceConfig): Promise<boolean> {
    if (!REGISTRY_API_KEY) {
      console.warn('[ServiceRegistry] SERVICE_REGISTRY_API_KEY not configured - registration disabled')
      return false
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ServiceRegistry] Registration failed: ${response.status} ${errorText}`)
        return false
      }

      isRegistered = true
      currentServiceName = config.service_name
      console.log(`[ServiceRegistry] Registered '${config.service_name}' at ${config.service_url}`)
      
      // Start heartbeat after successful registration
      this.startHeartbeat(config.service_name)
      
      return true
    } catch (error) {
      console.warn(`[ServiceRegistry] Failed to connect to registry: ${error}`)
      return false
    }
  }

  /**
   * Register a module for this service
   */
  static async registerModule(config: ModuleConfig): Promise<boolean> {
    if (!REGISTRY_API_KEY) {
      return false
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry/modules`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        console.warn(`[ServiceRegistry] Module registration failed: ${response.status}`)
        return false
      }

      console.log(`[ServiceRegistry] Module '${config.module_name}' registered`)
      return true
    } catch (error) {
      console.warn(`[ServiceRegistry] Module registration error: ${error}`)
      return false
    }
  }

  /**
   * Register an integration contract
   */
  static async registerIntegration(config: IntegrationConfig): Promise<boolean> {
    if (!REGISTRY_API_KEY) {
      return false
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/integrations`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        console.warn(`[ServiceRegistry] Integration registration failed: ${response.status}`)
        return false
      }

      console.log(`[ServiceRegistry] Integration ${config.source_service} → ${config.target_service} registered`)
      return true
    } catch (error) {
      console.warn(`[ServiceRegistry] Integration registration error: ${error}`)
      return false
    }
  }

  /**
   * Legacy: Register service (simplified)
   * @deprecated Use registerService() with config instead
   */
  static async register(): Promise<boolean> {
    if (!REGISTRY_API_KEY) {
      console.warn('[ServiceRegistry] SERVICE_REGISTRY_API_KEY not configured - registration disabled')
      return false
    }

    const serviceName = process.env.SERVICE_NAME || 'cs-core'
    const servicePort = parseInt(process.env.SERVICE_PORT || '3061')
    const serviceUrl = process.env.CUSTOMER_SUCCESS_CORE_SERVICE_URL || `http://localhost:${servicePort}`
    
    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: serviceName,
          service_type: process.env.SERVICE_TYPE || 'customer_success',
          service_url: serviceUrl,
          port: servicePort,
          version: '1.0.0',
          health_endpoint: '/api/v1/service/health',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ServiceRegistry] Registration failed: ${response.status} ${errorText}`)
        return false
      }

      isRegistered = true
      currentServiceName = serviceName
      console.log(`[ServiceRegistry] Registered '${serviceName}' at ${serviceUrl}`)
      
      // Start heartbeat after successful registration
      this.startHeartbeat(serviceName)
      
      return true
    } catch (error) {
      console.warn(`[ServiceRegistry] Failed to connect to registry: ${error}`)
      return false
    }
  }

  // ========== HEARTBEAT ==========

  /**
   * Send heartbeat to registry
   */
  static async sendHeartbeat(serviceName?: string): Promise<boolean> {
    if (!REGISTRY_API_KEY || !isRegistered) {
      return false
    }

    const name = serviceName || currentServiceName
    if (!name) {
      return false
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry/heartbeat`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: name,
          status: 'alive',
        }),
      })

      if (!response.ok) {
        console.warn(`[ServiceRegistry] Heartbeat failed: ${response.status}`)
        return false
      }

      return true
    } catch (error) {
      console.warn(`[ServiceRegistry] Heartbeat error: ${error}`)
      return false
    }
  }

  /**
   * Start heartbeat interval
   */
  static startHeartbeat(serviceName?: string): void {
    if (heartbeatInterval) {
      return // Already running
    }

    const name = serviceName || currentServiceName
    
    heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(name || undefined).catch(console.error)
    }, HEARTBEAT_INTERVAL_MS)

    console.log(`[ServiceRegistry] Heartbeat started (interval: ${HEARTBEAT_INTERVAL_MS / 1000}s)`)
  }

  /**
   * Stop heartbeat interval
   */
  static stopHeartbeat(): void {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
      console.log('[ServiceRegistry] Heartbeat stopped')
    }
  }

  /**
   * Deregister service from registry (on shutdown)
   */
  static async deregister(): Promise<void> {
    this.stopHeartbeat()
    
    if (!REGISTRY_API_KEY || !isRegistered || !currentServiceName) {
      return
    }

    try {
      await fetch(`${REGISTRY_URL}/api/v1/registry/deregister`, {
        method: 'POST',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: currentServiceName,
        }),
      })
      
      isRegistered = false
      console.log(`[ServiceRegistry] Deregistered '${currentServiceName}'`)
      currentServiceName = null
    } catch (error) {
      console.warn(`[ServiceRegistry] Deregister error: ${error}`)
    }
  }

  // ========== SERVICE DISCOVERY ==========

  /**
   * Get service URL from registry
   * Throws ServiceUnavailableError if service not found or unhealthy (fail-fast)
   */
  static async getServiceUrl(serviceName: string, failFast: boolean = true): Promise<string | null> {
    if (!REGISTRY_API_KEY) {
      return this.getFallbackUrl(serviceName)
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry/${serviceName}`, {
        method: 'GET',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 404) {
        if (failFast) {
          throw new ServiceUnavailableError(serviceName, 'not registered')
        }
        console.warn(`[ServiceRegistry] Service '${serviceName}' not found in registry`)
        return this.getFallbackUrl(serviceName)
      }

      if (!response.ok) {
        if (failFast) {
          throw new ServiceUnavailableError(serviceName, `registry error: ${response.status}`)
        }
        return this.getFallbackUrl(serviceName)
      }

      const service: ServiceRegistration = await response.json()
      
      // Check if service is active/healthy
      if (service.status === 'unhealthy' || service.is_active === false) {
        if (failFast) {
          throw new ServiceUnavailableError(serviceName, 'marked unhealthy')
        }
        console.warn(`[ServiceRegistry] Service '${serviceName}' is unhealthy`)
        return null
      }

      return service.service_url || service.url || null
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error
      }
      
      console.warn(`[ServiceRegistry] Cannot reach registry: ${error}`)
      
      if (failFast) {
        throw new ServiceUnavailableError('registry', 'cannot connect')
      }
      
      return this.getFallbackUrl(serviceName)
    }
  }

  /**
   * Get all registered services
   */
  static async getAllServices(): Promise<ServiceRegistration[]> {
    if (!REGISTRY_API_KEY) {
      console.warn('[ServiceRegistry] Cannot list services: API key not configured')
      return []
    }

    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/registry/services`, {
        method: 'GET',
        headers: {
          'X-Registry-API-Key': REGISTRY_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`[ServiceRegistry] Failed to list services: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error(`[ServiceRegistry] Error listing services: ${error}`)
      return []
    }
  }

  /**
   * Check if a specific service is healthy
   */
  static async isServiceHealthy(serviceName: string): Promise<boolean> {
    try {
      const url = await this.getServiceUrl(serviceName, false)
      return url !== null
    } catch {
      return false
    }
  }

  // ========== FALLBACK URLS ==========

  private static getFallbackUrl(serviceName: string): string | null {
    const fallbacks: Record<string, string | undefined> = {
      'internal-ops': process.env.INTERNAL_OPS_SERVICE_URL || 'http://localhost:3006',
      'internal_ops': process.env.INTERNAL_OPS_SERVICE_URL || 'http://localhost:3006',
      'saas-admin': process.env.SAAS_ADMINISTRATION_SERVICE_URL || 'http://localhost:3001',
      'saas_admin': process.env.SAAS_ADMINISTRATION_SERVICE_URL || 'http://localhost:3001',
      'fls': process.env.CUSTOMER_FIRST_LINE_SUPPORT_SERVICE_URL || 'http://localhost:3066',
      'billing': process.env.TENANT_BILLING_SERVICE_URL || 'http://localhost:3016',
      'settle': process.env.SETTLE_SERVICE_URL || 'http://localhost:3041',
      'draft': process.env.DRAFT_SERVICE_API_URL || 'http://localhost:3036',
    }

    const url = fallbacks[serviceName]
    if (url) {
      console.log(`[ServiceRegistry] Using fallback URL for '${serviceName}': ${url}`)
    }
    return url || null
  }
}

// ============================================================
// Convenience exports (for instrumentation.ts)
// ============================================================

export async function registerService(config: ServiceConfig): Promise<boolean> {
  return ServiceRegistryClient.registerService(config)
}

export async function registerModule(config: ModuleConfig): Promise<boolean> {
  return ServiceRegistryClient.registerModule(config)
}

export async function registerIntegration(config: IntegrationConfig): Promise<boolean> {
  return ServiceRegistryClient.registerIntegration(config)
}

export async function requireService(serviceName: string): Promise<string> {
  const url = await ServiceRegistryClient.getServiceUrl(serviceName, true)
  if (!url) {
    throw new ServiceUnavailableError(serviceName, 'no URL available')
  }
  return url
}

export async function discoverService(serviceName: string): Promise<string> {
  return requireService(serviceName)
}

export async function discoverServiceSafe(serviceName: string): Promise<string | null> {
  return ServiceRegistryClient.getServiceUrl(serviceName, false)
}
