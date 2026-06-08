/**
 * Next.js Instrumentation Hook
 * 
 * Runs once when the Next.js server starts up.
 * Used for service registration with Internal Ops Service Registry.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server (Node.js runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  // Check if registry is enabled
  const registryEnabled = process.env.SERVICE_REGISTRY_ENABLED === 'true' || process.env.NODE_ENV === 'production'
  
  if (!registryEnabled) {
    console.log('[Instrumentation] Service registry disabled (set SERVICE_REGISTRY_ENABLED=true to enable)')
    return
  }

  try {
    // Dynamic imports to avoid bundling issues
    const { registerService, registerModule, registerIntegration, ServiceRegistryClient } = 
      await import('@/lib/services/service-registry')
    const { getServiceConfig, SERVICE_MODULES, SERVICE_INTEGRATIONS } = 
      await import('@/lib/services/service-config')
    
    console.log('[Instrumentation] Registering with Service Registry...')
    
    // 1. Register service
    const config = getServiceConfig()
    const serviceRegistered = await registerService(config)
    
    if (serviceRegistered) {
      console.log(`[Instrumentation] Service '${config.service_name}' registered successfully`)
      
      // 2. Register modules
      for (const module of SERVICE_MODULES) {
        await registerModule(module)
      }
      console.log(`[Instrumentation] ${SERVICE_MODULES.length} modules registered`)
      
      // 3. Register integrations
      for (const integration of SERVICE_INTEGRATIONS) {
        await registerIntegration(integration)
      }
      console.log(`[Instrumentation] ${SERVICE_INTEGRATIONS.length} integrations registered`)
      
    } else {
      console.warn('[Instrumentation] Service registration failed - will retry on next heartbeat')
    }

    // Setup graceful shutdown
    const gracefulShutdown = async () => {
      console.log('[Instrumentation] Shutting down - deregistering from service registry...')
      await ServiceRegistryClient.deregister()
      process.exit(0)
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
    
    console.log('[Instrumentation] Service Registry registration complete')

    // 4. Initialize Tag Sync with Internal Ops
    try {
      const { initializeTagSync } = await import('@/lib/services/tag-sync')
      await initializeTagSync()
    } catch (tagError) {
      console.warn('[Instrumentation] Tag sync initialization failed (non-critical):', tagError)
    }
    
  } catch (error) {
    // Don't crash the server if registry is unavailable
    console.error('[Instrumentation] Service registration error:', error)
  }
}
