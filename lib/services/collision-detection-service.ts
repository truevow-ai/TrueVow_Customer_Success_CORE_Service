/**
 * Collision Detection Service
 * 
 * Real-time collaboration tracking for unified inbox
 * Tracks who is viewing, typing, or editing conversations
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

export type CollisionStatus = 'viewing' | 'typing' | 'editing'

export interface ActiveUser {
  user_id: string
  team_member_id: string | null
  status: CollisionStatus
  last_activity: string
  display_name?: string
  avatar_url?: string
}

export class CollisionDetectionService {
  /**
   * Mark user as viewing a conversation
   */
  static async markViewing(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get team member ID
    const teamMember = await TeamMemberRepository.findByClerkUserId(userId)

    const { error } = await supabase
      .from('collision_detection')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        team_member_id: teamMember?.member_id || null,
        status: 'viewing',
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id',
      })

    if (error) {
      console.error('Error marking viewing:', error)
      // Don't throw - collision detection is non-critical
    }
  }

  /**
   * Mark user as typing in a conversation
   */
  static async markTyping(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get team member ID
    const teamMember = await TeamMemberRepository.findByClerkUserId(userId)

    const { error } = await supabase
      .from('collision_detection')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        team_member_id: teamMember?.member_id || null,
        status: 'typing',
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id',
      })

    if (error) {
      console.error('Error marking typing:', error)
      // Don't throw - collision detection is non-critical
    }
  }

  /**
   * Mark user as editing (draft, note, etc.)
   */
  static async markEditing(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get team member ID
    const teamMember = await TeamMemberRepository.findByClerkUserId(userId)

    const { error } = await supabase
      .from('collision_detection')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        team_member_id: teamMember?.member_id || null,
        status: 'editing',
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id',
      })

    if (error) {
      console.error('Error marking editing:', error)
      // Don't throw - collision detection is non-critical
    }
  }

  /**
   * Clear user's activity (user left conversation)
   */
  static async clearActivity(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('collision_detection')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing activity:', error)
      // Don't throw - collision detection is non-critical
    }
  }

  /**
   * Get active users for a conversation
   */
  static async getActiveUsers(conversationId: string): Promise<ActiveUser[]> {
    const supabase = createServerSupabase()

    // Get active users (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('collision_detection')
      .select(`
        user_id,
        team_member_id,
        status,
        last_activity,
        cs_team_members (
          metadata
        )
      `)
      .eq('conversation_id', conversationId)
      .gte('last_activity', fiveMinutesAgo)
      .order('last_activity', { ascending: false })

    if (error) {
      console.error('Error fetching active users:', error)
      return []
    }

    // Map to ActiveUser format
    return (data || []).map((item: any) => {
      const teamMember = item.cs_team_members
      const metadata = teamMember?.metadata || {}

      return {
        user_id: item.user_id,
        team_member_id: item.team_member_id,
        status: item.status as CollisionStatus,
        last_activity: item.last_activity,
        display_name: metadata.name || 'Unknown User',
        avatar_url: metadata.avatar_url || null,
      }
    })
  }

  /**
   * Get active users for multiple conversations (for inbox list view)
   */
  static async getActiveUsersForConversations(
    conversationIds: string[]
  ): Promise<Record<string, ActiveUser[]>> {
    const supabase = createServerSupabase()

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('collision_detection')
      .select(`
        conversation_id,
        user_id,
        team_member_id,
        status,
        last_activity,
        cs_team_members (
          metadata
        )
      `)
      .in('conversation_id', conversationIds)
      .gte('last_activity', fiveMinutesAgo)
      .order('last_activity', { ascending: false })

    if (error) {
      console.error('Error fetching active users:', error)
      return {}
    }

    // Group by conversation_id
    const result: Record<string, ActiveUser[]> = {}

    for (const item of data || []) {
      const conversationId = item.conversation_id
      if (!result[conversationId]) {
        result[conversationId] = []
      }

      const teamMember = item.cs_team_members
      const metadata = teamMember?.metadata || {}

      result[conversationId].push({
        user_id: item.user_id,
        team_member_id: item.team_member_id,
        status: item.status as CollisionStatus,
        last_activity: item.last_activity,
        display_name: metadata.name || 'Unknown User',
        avatar_url: metadata.avatar_url || null,
      })
    }

    return result
  }

  /**
   * Cleanup stale activities (older than 5 minutes)
   * Should be called periodically (via cron or scheduled task)
   */
  static async cleanupStaleActivities(): Promise<number> {
    const supabase = createServerSupabase()

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('collision_detection')
      .delete()
      .lt('last_activity', fiveMinutesAgo)
      .select()

    if (error) {
      console.error('Error cleaning up stale activities:', error)
      return 0
    }

    return data?.length || 0
  }

  /**
   * Get collision indicator color for status
   */
  static getIndicatorColor(status: CollisionStatus): 'yellow' | 'red' {
    return status === 'typing' || status === 'editing' ? 'red' : 'yellow'
  }

  /**
   * Get collision indicator text
   */
  static getIndicatorText(status: CollisionStatus, displayName: string): string {
    switch (status) {
      case 'viewing':
        return `${displayName} is viewing`
      case 'typing':
        return `${displayName} is typing`
      case 'editing':
        return `${displayName} is editing`
      default:
        return `${displayName} is active`
    }
  }
}
