import { createServerSupabase } from '@/lib/db/supabase'
import { salesCrmClient } from '@/lib/integrations/sales-client'
import { platformClient } from '@/lib/integrations/platform-client'
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
import { tenantServiceClient } from '@/lib/integrations/tenant-client'

export interface IntegrationStatus {
  integration_type: string
  integration_name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  last_check: string
  response_time_ms?: number
  error_message?: string
  metadata?: Record<string, any>
}

export interface IntegrationHealth {
  overall_status: 'healthy' | 'degraded' | 'down'
  integrations: IntegrationStatus[]
  last_updated: string
}

export class IntegrationManagementService {
  /**
   * Check health of all integrations
   */
  static async checkAllIntegrations(): Promise<IntegrationHealth> {
    const integrations: IntegrationStatus[] = []

    // Check Sales-CRM Service
    try {
      const salesStatus = await this.checkSalesCrmIntegration()
      integrations.push(salesStatus)
    } catch (error: any) {
      integrations.push({
        integration_type: 'sales_crm',
        integration_name: 'Sales-CRM Service',
        status: 'down',
        last_check: new Date().toISOString(),
        error_message: error.message,
      })
    }

    // Check Platform Service
    try {
      const platformStatus = await this.checkPlatformIntegration()
      integrations.push(platformStatus)
    } catch (error: any) {
      integrations.push({
        integration_type: 'platform',
        integration_name: 'Platform Service',
        status: 'down',
        last_check: new Date().toISOString(),
        error_message: error.message,
      })
    }

    // Check Internal Ops Service
    try {
      const internalOpsStatus = await this.checkInternalOpsIntegration()
      integrations.push(internalOpsStatus)
    } catch (error: any) {
      integrations.push({
        integration_type: 'internal_ops',
        integration_name: 'Internal Ops Service',
        status: 'down',
        last_check: new Date().toISOString(),
        error_message: error.message,
      })
    }

    // Check Tenant Service
    try {
      const tenantStatus = await this.checkTenantServiceIntegration()
      integrations.push(tenantStatus)
    } catch (error: any) {
      integrations.push({
        integration_type: 'tenant_service',
        integration_name: 'Tenant Service',
        status: 'down',
        last_check: new Date().toISOString(),
        error_message: error.message,
      })
    }

    // Determine overall status
    const hasDown = integrations.some((i) => i.status === 'down')
    const hasDegraded = integrations.some((i) => i.status === 'degraded')
    const overallStatus: 'healthy' | 'degraded' | 'down' = hasDown
      ? 'down'
      : hasDegraded
        ? 'degraded'
        : 'healthy'

    return {
      overall_status: overallStatus,
      integrations,
      last_updated: new Date().toISOString(),
    }
  }

  /**
   * Check Sales-CRM Service health
   */
  private static async checkSalesCrmIntegration(): Promise<IntegrationStatus> {
    const startTime = Date.now()
    try {
      // Simple health check - try to get a customer (will fail gracefully if service is down)
      await salesCrmClient.getCustomer('health-check-test-id')
      // If we get here, service is responding (even if customer doesn't exist)
      return {
        integration_type: 'sales_crm',
        integration_name: 'Sales-CRM Service',
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
      }
    } catch (error: any) {
      // Check if it's a 404 (service is up but customer doesn't exist) vs other error
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          integration_type: 'sales_crm',
          integration_name: 'Sales-CRM Service',
          status: 'healthy',
          last_check: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
        }
      }
      // Service is down or error
      return {
        integration_type: 'sales_crm',
        integration_name: 'Sales-CRM Service',
        status: 'down',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
      }
    }
  }

  /**
   * Check Platform Service health
   */
  private static async checkPlatformIntegration(): Promise<IntegrationStatus> {
    const startTime = Date.now()
    try {
      // Simple health check
      await platformClient.getTenant('health-check-test-id')
      return {
        integration_type: 'platform',
        integration_name: 'Platform Service',
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
      }
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          integration_type: 'platform',
          integration_name: 'Platform Service',
          status: 'healthy',
          last_check: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
        }
      }
      return {
        integration_type: 'platform',
        integration_name: 'Platform Service',
        status: 'down',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
      }
    }
  }

  /**
   * Check Internal Ops Service health
   */
  private static async checkInternalOpsIntegration(): Promise<IntegrationStatus> {
    const startTime = Date.now()
    try {
      // Try to get user performance (will fail gracefully if service is down)
      await internalOpsServiceClient.getUserPerformance('health-check-test-id')
      return {
        integration_type: 'internal_ops',
        integration_name: 'Internal Ops Service',
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
      }
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          integration_type: 'internal_ops',
          integration_name: 'Internal Ops Service',
          status: 'healthy',
          last_check: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
        }
      }
      return {
        integration_type: 'internal_ops',
        integration_name: 'Internal Ops Service',
        status: 'down',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
      }
    }
  }

  /**
   * Check Tenant Service health
   */
  private static async checkTenantServiceIntegration(): Promise<IntegrationStatus> {
    const startTime = Date.now()
    try {
      // Try to get portal config (will fail gracefully if service is down)
      await tenantServiceClient.getPortalConfig('health-check-test-id')
      return {
        integration_type: 'tenant_service',
        integration_name: 'Tenant Service',
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
      }
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          integration_type: 'tenant_service',
          integration_name: 'Tenant Service',
          status: 'healthy',
          last_check: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
        }
      }
      return {
        integration_type: 'tenant_service',
        integration_name: 'Tenant Service',
        status: 'down',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
      }
    }
  }

  /**
   * Get integration errors from database
   */
  static async getIntegrationErrors(
    integrationType?: string,
    limit: number = 50
  ): Promise<any[]> {
    const supabase = await createServerSupabase()
    let query = supabase
      .from('cs_integrations')
      .select('*')
      .not('last_error', 'is', null)
      .order('last_error_at', { ascending: false })
      .limit(limit)

    if (integrationType) {
      query = query.eq('integration_type', integrationType)
    }

    const { data: integrations, error } = await query

    if (error) {
      throw error
    }

    return (integrations || []).map((integration) => ({
      integration_type: integration.integration_type,
      integration_name: integration.integration_name,
      error: integration.last_error,
      error_at: integration.last_error_at,
      status: integration.health_status,
    }))
  }

  /**
   * Update integration status in database
   */
  static async updateIntegrationStatus(
    integrationType: string,
    status: 'healthy' | 'degraded' | 'down',
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createServerSupabase()

    const update: any = {
      health_status: status,
      last_sync_at: new Date().toISOString(),
    }

    if (errorMessage) {
      update.last_error = errorMessage
      update.last_error_at = new Date().toISOString()
    } else {
      update.last_error = null
      update.last_error_at = null
    }

    await supabase
      .from('cs_integrations')
      .update(update)
      .eq('integration_type', integrationType)
  }
}
