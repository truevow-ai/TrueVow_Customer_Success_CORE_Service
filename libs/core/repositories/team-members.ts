import { createServerSupabase } from '@/lib/db/supabase'

export interface TeamMember {
  member_id: string
  user_id: string
  clerk_user_id: string
  tenant_id?: string
  role: 'support_agent' | 'support_manager' | 'csm' | 'head_of_cs' | 'solutions_engineer'
  is_active: boolean
  timezone: string
  work_schedule: Record<string, any>
  skills: string[]
  max_tickets: number
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface TeamMemberInsert {
  user_id: string
  clerk_user_id: string
  role: TeamMember['role']
  is_active?: boolean
  timezone?: string
  work_schedule?: Record<string, any>
  skills?: string[]
  max_tickets?: number
  metadata?: Record<string, any>
}

export class TeamMemberRepository {
  /**
   * Get team member by ID
   */
  static async findById(memberId: string): Promise<TeamMember | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_members')
      .select('*')
      .eq('member_id', memberId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as TeamMember
  }

  /**
   * Get all team members with optional filters
   */
  static async findAll(filters?: {
    role?: string
    isActive?: boolean
  }): Promise<TeamMember[]> {
    const supabase = await createServerSupabase()
    let query = supabase.from('cs_team_members').select('*')

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query

    if (error) throw error
    return data as TeamMember[]
  }

  /**
   * Get team member by user ID
   */
  static async findByUserId(userId: string): Promise<TeamMember | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_members')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as TeamMember
  }

  /**
   * Get team member by Clerk user ID
   */
  static async findByClerkUserId(clerkUserId: string): Promise<TeamMember | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_members')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as TeamMember
  }

  /**
   * Create a new team member
   */
  static async create(member: TeamMemberInsert): Promise<TeamMember> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_members')
      .insert({
        ...member,
        is_active: member.is_active ?? true,
        timezone: member.timezone || 'Asia/Karachi',
        work_schedule: member.work_schedule || {},
        skills: member.skills || [],
        max_tickets: member.max_tickets || 10,
        metadata: member.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as TeamMember
  }

  /**
   * Update a team member
   */
  static async update(memberId: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_members')
      .update(updates)
      .eq('member_id', memberId)
      .select()
      .single()

    if (error) throw error
    return data as TeamMember
  }

  /**
   * Get active support agents
   */
  static async getActiveAgents(): Promise<TeamMember[]> {
    return this.findAll({ role: 'support_agent', isActive: true })
  }

  /**
   * Get active CSMs
   */
  static async getActiveCSMs(): Promise<TeamMember[]> {
    return this.findAll({ role: 'csm', isActive: true })
  }

  /**
   * Get team members by role
   */
  static async getByRole(role: TeamMember['role']): Promise<TeamMember[]> {
    return this.findAll({ role, isActive: true })
  }

  /**
   * Deactivate a team member
   */
  static async deactivate(memberId: string): Promise<TeamMember> {
    return this.update(memberId, { is_active: false })
  }

  /**
   * Activate a team member
   */
  static async activate(memberId: string): Promise<TeamMember> {
    return this.update(memberId, { is_active: true })
  }
}

