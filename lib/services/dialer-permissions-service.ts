/**
 * Dialer Permissions Service
 * 
 * Manages dialer permissions for users in the unified dialer system
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface DialerPermission {
  user_id: string
  role: string
  department: string
  dialer_enabled: boolean
  permissions: {
    inbound: boolean
    outbound: boolean
    parallel_dialing: boolean
    conference_rooms: boolean
    call_coaching: boolean
    recording: boolean
    transcription: boolean
  }
  number_assignment: 'individual' | 'pool' | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface DefaultPermissions {
  role: string
  department: string
  dialer_enabled: boolean
  permissions: DialerPermission['permissions']
  number_assignment: 'individual' | 'pool'
}

// Default permissions for customer support
const CUSTOMER_SUPPORT_DEFAULTS: DefaultPermissions = {
  role: 'customer_support',
  department: 'customer_support',
  dialer_enabled: true, // Default on for support
  permissions: {
    inbound: false,
    outbound: true,
    parallel_dialing: false,
    conference_rooms: false,
    call_coaching: false,
    recording: true,
    transcription: true,
  },
  number_assignment: 'pool', // Uses pool of numbers
}

export class DialerPermissionsService {
  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: string, department: string): DefaultPermissions {
    if (role === 'customer_support' || department === 'customer_support') {
      return CUSTOMER_SUPPORT_DEFAULTS
    }

    // Default for other roles
    return {
      role,
      department,
      dialer_enabled: false,
      permissions: {
        inbound: false,
        outbound: false,
        parallel_dialing: false,
        conference_rooms: false,
        call_coaching: false,
        recording: true,
        transcription: true,
      },
      number_assignment: 'pool',
    }
  }

  /**
   * Check if user has dialer access
   */
  static async hasDialerAccess(userId: string): Promise<boolean> {
    const permission = await this.getPermission(userId)
    return permission?.dialer_enabled ?? false
  }

  /**
   * Get user's dialer permission
   */
  static async getPermission(userId: string): Promise<DialerPermission | null> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('dialer_permissions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    // Parse permissions JSONB
    const permissions = typeof data.permissions === 'string' 
      ? JSON.parse(data.permissions) 
      : data.permissions

    return {
      ...data,
      permissions: {
        inbound: permissions.inbound ?? false,
        outbound: permissions.outbound ?? false,
        parallel_dialing: permissions.parallel_dialing ?? false,
        conference_rooms: permissions.conference_rooms ?? false,
        call_coaching: permissions.call_coaching ?? false,
        recording: permissions.recording ?? true,
        transcription: permissions.transcription ?? true,
      },
    }
  }

  /**
   * Get or create permission for user
   */
  static async getOrCreatePermission(
    userId: string,
    role: string,
    department: string
  ): Promise<DialerPermission> {
    let permission = await this.getPermission(userId)

    if (!permission) {
      // Get default permissions for role
      const defaults = this.getDefaultPermissions(role, department)

      // Create new permission
      permission = await this.createPermission(userId, {
        role,
        department,
        dialer_enabled: defaults.dialer_enabled,
        permissions: defaults.permissions,
        number_assignment: defaults.number_assignment,
      })
    }

    return permission
  }

  /**
   * Create permission for user
   */
  static async createPermission(
    userId: string,
    options: {
      role: string
      department: string
      dialer_enabled?: boolean
      permissions?: DialerPermission['permissions']
      number_assignment?: 'individual' | 'pool'
    }
  ): Promise<DialerPermission> {
    const supabase = createServerSupabase()

    const defaults = this.getDefaultPermissions(options.role, options.department)

    const { data, error } = await supabase
      .from('dialer_permissions')
      .insert({
        user_id: userId,
        role: options.role,
        department: options.department,
        dialer_enabled: options.dialer_enabled ?? defaults.dialer_enabled,
        permissions: options.permissions ?? defaults.permissions,
        number_assignment: options.number_assignment ?? defaults.number_assignment,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to create dialer permission: ${error?.message}`)
    }

    const permissions = typeof data.permissions === 'string' 
      ? JSON.parse(data.permissions) 
      : data.permissions

    return {
      ...data,
      permissions: {
        inbound: permissions.inbound ?? false,
        outbound: permissions.outbound ?? false,
        parallel_dialing: permissions.parallel_dialing ?? false,
        conference_rooms: permissions.conference_rooms ?? false,
        call_coaching: permissions.call_coaching ?? false,
        recording: permissions.recording ?? true,
        transcription: permissions.transcription ?? true,
      },
    }
  }

  /**
   * Toggle dialer on/off for user
   */
  static async toggleDialer(userId: string, enabled: boolean): Promise<DialerPermission> {
    const supabase = createServerSupabase()

    // Get or create permission first
    const existing = await this.getPermission(userId)
    if (!existing) {
      // Need role and department to create
      // Try to get from team members table
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('role')
        .eq('clerk_user_id', userId)
        .single()

      const role = teamMember?.role || 'customer_support'
      const department = 'customer_support'

      return this.createPermission(userId, {
        role,
        department,
        dialer_enabled: enabled,
      })
    }

    // Update existing permission
    const { data, error } = await supabase
      .from('dialer_permissions')
      .update({
        dialer_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to toggle dialer: ${error?.message}`)
    }

    const permissions = typeof data.permissions === 'string' 
      ? JSON.parse(data.permissions) 
      : data.permissions

    return {
      ...data,
      permissions: {
        inbound: permissions.inbound ?? false,
        outbound: permissions.outbound ?? false,
        parallel_dialing: permissions.parallel_dialing ?? false,
        conference_rooms: permissions.conference_rooms ?? false,
        call_coaching: permissions.call_coaching ?? false,
        recording: permissions.recording ?? true,
        transcription: permissions.transcription ?? true,
      },
    }
  }

  /**
   * Check specific permission
   */
  static async hasPermission(
    userId: string,
    permission: keyof DialerPermission['permissions']
  ): Promise<boolean> {
    const dialerPermission = await this.getPermission(userId)
    if (!dialerPermission || !dialerPermission.dialer_enabled) {
      return false
    }

    return dialerPermission.permissions[permission] ?? false
  }

  /**
   * Update permission
   */
  static async updatePermission(
    userId: string,
    updates: Partial<{
      dialer_enabled: boolean
      permissions: Partial<DialerPermission['permissions']>
      number_assignment: 'individual' | 'pool'
      phone_number: string
    }>
  ): Promise<DialerPermission> {
    const supabase = createServerSupabase()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.dialer_enabled !== undefined) {
      updateData.dialer_enabled = updates.dialer_enabled
    }

    if (updates.permissions) {
      // Get existing permissions and merge
      const existing = await this.getPermission(userId)
      const mergedPermissions = {
        ...existing?.permissions,
        ...updates.permissions,
      }
      updateData.permissions = mergedPermissions
    }

    if (updates.number_assignment !== undefined) {
      updateData.number_assignment = updates.number_assignment
    }

    if (updates.phone_number !== undefined) {
      updateData.phone_number = updates.phone_number
    }

    const { data, error } = await supabase
      .from('dialer_permissions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to update dialer permission: ${error?.message}`)
    }

    const permissions = typeof data.permissions === 'string' 
      ? JSON.parse(data.permissions) 
      : data.permissions

    return {
      ...data,
      permissions: {
        inbound: permissions.inbound ?? false,
        outbound: permissions.outbound ?? false,
        parallel_dialing: permissions.parallel_dialing ?? false,
        conference_rooms: permissions.conference_rooms ?? false,
        call_coaching: permissions.call_coaching ?? false,
        recording: permissions.recording ?? true,
        transcription: permissions.transcription ?? true,
      },
    }
  }
}
