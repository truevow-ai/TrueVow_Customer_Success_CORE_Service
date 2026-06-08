/**
 * Billing & Accounting Proxy Service
 * SECURITY: Acts as a secure proxy between CS Support and billing/accounting systems
 * 
 * CRITICAL SECURITY REQUIREMENTS:
 * - AI agents and LLMs NEVER have direct access to billing/accounting systems
 * - All billing operations go through this service (server-side only)
 * - Proper authorization required (not all roles can modify billing)
 * - All operations are audit logged
 * - Input validation and sanitization
 * - Rate limiting
 * - Tenant isolation
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { validateInput, sanitizeString, sanitizeObject } from '@/lib/utils/input-sanitization'
import { SERVICE_URLS, API_TIMEOUTS, BUSINESS_THRESHOLDS } from '@/lib/config/app-config'

export interface BillingOperation {
  operation: 'add_discount' | 'remove_discount' | 'change_tier' | 'add_credit' | 'refund' | 'update_payment_method'
  tenantId: string
  amount?: number
  discountPercent?: number
  discountReason?: string
  newTier?: string
  creditAmount?: number
  creditReason?: string
  refundAmount?: number
  refundReason?: string
  metadata?: Record<string, any>
}

export interface BillingResult {
  success: boolean
  operationId: string
  message: string
  newBalance?: number
  newTier?: string
  metadata?: Record<string, any>
}

export class BillingProxyService {
  // SECURITY: These URLs are server-side only, never exposed to AI agents
  private static platformServiceUrl = SERVICE_URLS.PLATFORM_SERVICE_URL
  private static platformServiceApiKey = process.env.PLATFORM_SERVICE_API_KEY || ''

  /**
   * SECURITY: This method is server-side only.
   * AI agents cannot call this directly - they must go through authenticated API endpoints.
   */
  static async executeBillingOperation(
    operation: BillingOperation,
    requestedBy: string, // Team member ID
    tenantId: string
  ): Promise<BillingResult> {
    // SECURITY: Validate all inputs
    const sanitizedTenantId = validateInput(operation.tenantId, 'uuid')
    const sanitizedRequestedBy = validateInput(requestedBy, 'uuid')

    // SECURITY: Verify requester has permission
    const teamMember = await TeamMemberRepository.findById(sanitizedRequestedBy)
    if (!teamMember) {
      throw new Error('Team member not found')
    }

    // SECURITY: Verify tenant matches (prevent cross-tenant operations)
    if (teamMember.tenant_id !== sanitizedTenantId) {
      throw new Error('Unauthorized: Cannot perform billing operations for other tenants')
    }

    // SECURITY: Verify role has billing permissions
    const allowedRoles = ['csm', 'head_of_cs', 'support_manager']
    if (!teamMember.role || !allowedRoles.includes(teamMember.role)) {
      throw new Error(`Role ${teamMember.role} does not have permission to modify billing`)
    }

    // SECURITY: Sanitize operation data
    const sanitizedOperation = this.sanitizeBillingOperation(operation)

    // SECURITY: Validate operation type
    const validOperations = ['add_discount', 'remove_discount', 'change_tier', 'add_credit', 'refund', 'update_payment_method']
    if (!validOperations.includes(sanitizedOperation.operation)) {
      throw new Error(`Invalid billing operation: ${sanitizedOperation.operation}`)
    }

    // SECURITY: Validate amounts (prevent negative or excessive values)
    if (sanitizedOperation.amount !== undefined) {
      if (sanitizedOperation.amount < 0 || sanitizedOperation.amount > BUSINESS_THRESHOLDS.MAX_BILLING_AMOUNT) {
        throw new Error(`Invalid amount: must be between 0 and ${BUSINESS_THRESHOLDS.MAX_BILLING_AMOUNT}`)
      }
    }

    if (sanitizedOperation.discountPercent !== undefined) {
      if (sanitizedOperation.discountPercent < 0 || sanitizedOperation.discountPercent > BUSINESS_THRESHOLDS.MAX_DISCOUNT_PERCENT) {
        throw new Error(`Invalid discount: must be between 0 and ${BUSINESS_THRESHOLDS.MAX_DISCOUNT_PERCENT} percent`)
      }
    }

    // SECURITY: Validate API URL (prevent SSRF)
    if (!this.platformServiceUrl.startsWith('https://') && !this.platformServiceUrl.startsWith('http://localhost')) {
      throw new Error('Invalid platform service URL')
    }

    // Execute operation via Platform Service (server-side only)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.BILLING_TIMEOUT_MS)

    try {
      const response = await fetch(`${this.platformServiceUrl}/api/v1/billing/operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.platformServiceApiKey}`,
          'Content-Type': 'application/json',
          'X-Service-Name': 'cs-support-service',
          'X-Requested-By': sanitizedRequestedBy,
        },
        body: JSON.stringify({
          ...sanitizedOperation,
          tenant_id: sanitizedTenantId,
          requested_by: sanitizedRequestedBy,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Billing API error:', response.status, errorText.substring(0, 200))
        throw new Error(`Billing operation failed: ${response.status}`)
      }

      const result = await response.json()

      // SECURITY: Sanitize response
      return {
        success: result.success === true,
        operationId: sanitizeString(result.operationId || '', 100),
        message: sanitizeString(result.message || 'Operation completed', 500),
        newBalance: typeof result.newBalance === 'number' ? result.newBalance : undefined,
        newTier: result.newTier ? sanitizeString(result.newTier, 100) : undefined,
        metadata: result.metadata && typeof result.metadata === 'object' ? result.metadata : {},
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Billing operation timeout')
      }
      throw error
    }
  }

  /**
   * SECURITY: Sanitize billing operation data
   */
  private static sanitizeBillingOperation(operation: BillingOperation): BillingOperation {
    return {
      operation: operation.operation,
      tenantId: validateInput(operation.tenantId, 'uuid'),
      amount: operation.amount !== undefined ? Math.round(operation.amount * 100) / 100 : undefined, // Round to 2 decimals
      discountPercent: operation.discountPercent !== undefined 
        ? Math.max(0, Math.min(100, Math.round(operation.discountPercent * 100) / 100)) 
        : undefined,
      discountReason: operation.discountReason ? sanitizeString(operation.discountReason, 500) : undefined,
      newTier: operation.newTier ? sanitizeString(operation.newTier, 100) : undefined,
      creditAmount: operation.creditAmount !== undefined ? Math.round(operation.creditAmount * 100) / 100 : undefined,
      creditReason: operation.creditReason ? sanitizeString(operation.creditReason, 500) : undefined,
      refundAmount: operation.refundAmount !== undefined ? Math.round(operation.refundAmount * 100) / 100 : undefined,
      refundReason: operation.refundReason ? sanitizeString(operation.refundReason, 500) : undefined,
      metadata: operation.metadata ? sanitizeObject(operation.metadata) : undefined,
    }
  }

  /**
   * Get billing information (read-only)
   * SECURITY: Requires proper authorization
   */
  static async getBillingInfo(tenantId: string, requestedBy: string): Promise<any> {
    // SECURITY: Validate inputs
    const sanitizedTenantId = validateInput(tenantId, 'uuid')
    const sanitizedRequestedBy = validateInput(requestedBy, 'uuid')

    // SECURITY: Verify requester has permission
    const teamMember = await TeamMemberRepository.findById(sanitizedRequestedBy)
    if (!teamMember) {
      throw new Error('Team member not found')
    }

    // SECURITY: Verify tenant matches
    if (teamMember.tenant_id !== sanitizedTenantId) {
      throw new Error('Unauthorized: Cannot access billing for other tenants')
    }

    // SECURITY: All CS roles can view billing (read-only)
    // Only specific roles can modify (checked in executeBillingOperation)

    // Get billing info from Platform Service
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.DEFAULT_TIMEOUT_MS)

    try {
      const response = await fetch(`${this.platformServiceUrl}/api/v1/billing/tenant/${sanitizedTenantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.platformServiceApiKey}`,
          'X-Service-Name': 'cs-support-service',
          'X-Requested-By': sanitizedRequestedBy,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to get billing info: ${response.status}`)
      }

      const data = await response.json()
      
      // SECURITY: Sanitize response (remove sensitive data if needed)
      return {
        tenantId: sanitizedTenantId,
        currentTier: data.current_tier || data.currentTier,
        balance: data.balance,
        billingEmail: data.billing_email || data.billingEmail,
        paymentMethod: data.payment_method ? '***' + data.payment_method.slice(-4) : null, // Mask payment method
        discounts: data.discounts || [],
        credits: data.credits || [],
        // Don't expose full payment method details
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Billing info request timeout')
      }
      throw error
    }
  }
}
