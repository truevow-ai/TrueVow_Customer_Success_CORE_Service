/**
 * Unified Dialer Service
 * 
 * Unified service for getting phone numbers based on user permissions and department
 * Integrates with Sales CRM service and local phone pool management
 */

import { DialerPermissionsService, DialerPermission } from './dialer-permissions-service'
import { PhonePoolService } from './phone-pool-service'
import { salesServiceClient } from '@/lib/integrations/sales-client'
import { createServerSupabase } from '@/lib/db/supabase'

export interface PhoneNumberResult {
  phone_number: string
  twilio_number_sid: string | null
  assignment_type: 'individual' | 'pool'
  source: 'sales_crm' | 'local_pool' | 'default'
}

export interface GetPhoneNumberParams {
  user_id: string
  department: string
  call_type: 'inbound' | 'outbound'
  campaign_id?: string
}

export class UnifiedDialerService {
  /**
   * Get phone number for call
   */
  static async getPhoneNumber(params: GetPhoneNumberParams): Promise<PhoneNumberResult> {
    // Check if user has dialer access
    const canMakeCall = await this.canMakeCall(params.user_id)
    if (!canMakeCall) {
      throw new Error('User does not have dialer access')
    }

    // Get user's dialer permission
    const permission = await DialerPermissionsService.getPermission(params.user_id)
    if (!permission) {
      throw new Error('User does not have dialer permissions configured')
    }

    // Check if user has outbound permission (for outbound calls)
    if (params.call_type === 'outbound' && !permission.permissions.outbound) {
      throw new Error('User does not have outbound call permission')
    }

    // Check if user has inbound permission (for inbound calls)
    if (params.call_type === 'inbound' && !permission.permissions.inbound) {
      throw new Error('User does not have inbound call permission')
    }

    // Determine number assignment strategy
    if (permission.number_assignment === 'individual') {
      // Try to get individual number from Sales CRM service
      try {
        const result = await salesServiceClient.getPhoneNumber({
          user_id: params.user_id,
          call_type: params.call_type === 'outbound' ? 'direct_call' : 'direct_call',
          service: 'cs_support',
        })

        if (result?.phone_number) {
          return {
            phone_number: result.phone_number,
            twilio_number_sid: null, // Will be in Sales CRM service
            assignment_type: 'individual',
            source: 'sales_crm',
          }
        }
      } catch (error) {
        console.warn('Failed to get individual number from Sales CRM, falling back to pool:', error)
      }
    }

    // Use pool number (default for customer support)
    try {
      const poolNumber = await PhonePoolService.getAvailableNumber(
        params.department,
        params.user_id,
        30 // Reserve for 30 minutes
      )

      if (poolNumber) {
        return {
          phone_number: poolNumber.phone_number,
          twilio_number_sid: poolNumber.twilio_number_sid,
          assignment_type: 'pool',
          source: 'local_pool',
        }
      }
    } catch (error) {
      console.warn('Failed to get pool number, falling back to default:', error)
    }

    // Fallback to default Twilio number
    const defaultNumber = process.env.TWILIO_PHONE_NUMBER
    if (!defaultNumber) {
      throw new Error('No phone number available and no default Twilio number configured')
    }

    return {
      phone_number: defaultNumber,
      twilio_number_sid: null,
      assignment_type: 'pool',
      source: 'default',
    }
  }

  /**
   * Check if user can make call
   */
  static async canMakeCall(userId: string): Promise<boolean> {
    return DialerPermissionsService.hasDialerAccess(userId)
  }

  /**
   * Get user's dialer permission
   */
  static async getUserPermission(userId: string): Promise<DialerPermission | null> {
    return DialerPermissionsService.getPermission(userId)
  }

  /**
   * Initialize dialer permission for user
   * Call this when a user is first created or when enabling dialer
   */
  static async initializeUserPermission(
    userId: string,
    role: string,
    department: string
  ): Promise<DialerPermission> {
    return DialerPermissionsService.getOrCreatePermission(userId, role, department)
  }

  /**
   * Release phone number after call
   */
  static async releasePhoneNumber(phoneNumber: string): Promise<void> {
    // Check if it's a pool number
    const supabase = createServerSupabase()
    const { data } = await supabase
      .from('phone_number_pools')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (data) {
      // It's a pool number, release it
      await PhonePoolService.releaseNumber(phoneNumber)
    }
    // Individual numbers don't need to be released
  }

  /**
   * Mark phone number as in use
   */
  static async markPhoneNumberInUse(phoneNumber: string): Promise<void> {
    // Check if it's a pool number
    const supabase = createServerSupabase()
    const { data } = await supabase
      .from('phone_number_pools')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (data) {
      // It's a pool number, mark as in use
      await PhonePoolService.markInUse(phoneNumber)
    }
    // Individual numbers don't need to be marked
  }
}
