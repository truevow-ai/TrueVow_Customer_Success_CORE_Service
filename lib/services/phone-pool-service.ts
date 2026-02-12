/**
 * Phone Pool Service
 * 
 * Manages phone number pools for the unified dialer system
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface PhonePoolNumber {
  id: string
  department: string
  phone_number: string
  twilio_number_sid: string | null
  status: 'available' | 'reserved' | 'in_use' | 'maintenance'
  reserved_by: string | null
  reserved_until: string | null
  created_at: string
  updated_at: string
}

export class PhonePoolService {
  /**
   * Get available number from pool
   */
  static async getAvailableNumber(
    department: string,
    reservedBy: string,
    durationMinutes: number = 30
  ): Promise<PhonePoolNumber | null> {
    const supabase = createServerSupabase()

    // First, release any expired reservations
    await this.releaseExpiredReservations()

    // Try to find an available number
    const { data, error } = await supabase
      .from('phone_number_pools')
      .select('*')
      .eq('department', department)
      .eq('status', 'available')
      .limit(1)
      .single()

    if (error || !data) {
      // No available number
      return null
    }

    // Reserve the number
    const reservedUntil = new Date()
    reservedUntil.setMinutes(reservedUntil.getMinutes() + durationMinutes)

    const { data: reserved, error: reserveError } = await supabase
      .from('phone_number_pools')
      .update({
        status: 'reserved',
        reserved_by: reservedBy,
        reserved_until: reservedUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single()

    if (reserveError || !reserved) {
      throw new Error(`Failed to reserve phone number: ${reserveError?.message}`)
    }

    return reserved
  }

  /**
   * Reserve number for call
   */
  static async reserveNumber(
    phoneNumber: string,
    reservedBy: string,
    durationMinutes: number = 30
  ): Promise<PhonePoolNumber> {
    const supabase = createServerSupabase()

    const reservedUntil = new Date()
    reservedUntil.setMinutes(reservedUntil.getMinutes() + durationMinutes)

    const { data, error } = await supabase
      .from('phone_number_pools')
      .update({
        status: 'reserved',
        reserved_by: reservedBy,
        reserved_until: reservedUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to reserve phone number: ${error?.message}`)
    }

    return data
  }

  /**
   * Mark number as in use
   */
  static async markInUse(phoneNumber: string): Promise<void> {
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('phone_number_pools')
      .update({
        status: 'in_use',
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber)

    if (error) {
      throw new Error(`Failed to mark number as in use: ${error.message}`)
    }
  }

  /**
   * Release number back to pool
   */
  static async releaseNumber(phoneNumber: string): Promise<void> {
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('phone_number_pools')
      .update({
        status: 'available',
        reserved_by: null,
        reserved_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber)

    if (error) {
      throw new Error(`Failed to release phone number: ${error.message}`)
    }
  }

  /**
   * Release expired reservations
   */
  static async releaseExpiredReservations(): Promise<number> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .rpc('release_expired_phone_reservations')

    if (error) {
      // If RPC doesn't exist, do it manually
      const { error: updateError } = await supabase
        .from('phone_number_pools')
        .update({
          status: 'available',
          reserved_by: null,
          reserved_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'reserved')
        .lt('reserved_until', new Date().toISOString())

      if (updateError) {
        console.warn('Failed to release expired reservations:', updateError)
        return 0
      }

      return 1
    }

    return data || 0
  }

  /**
   * Get pool numbers for department
   */
  static async getPoolNumbers(department: string): Promise<PhonePoolNumber[]> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('phone_number_pools')
      .select('*')
      .eq('department', department)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get pool numbers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Add number to pool
   */
  static async addToPool(
    department: string,
    phoneNumber: string,
    twilioNumberSid?: string
  ): Promise<PhonePoolNumber> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('phone_number_pools')
      .insert({
        department,
        phone_number: phoneNumber,
        twilio_number_sid: twilioNumberSid || null,
        status: 'available',
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to add number to pool: ${error?.message}`)
    }

    return data
  }

  /**
   * Remove number from pool
   */
  static async removeFromPool(phoneNumber: string): Promise<void> {
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('phone_number_pools')
      .delete()
      .eq('phone_number', phoneNumber)

    if (error) {
      throw new Error(`Failed to remove number from pool: ${error.message}`)
    }
  }
}
