/**
 * Mentions Service
 * Parse @mentions from message text and resolve to team member IDs
 */

export interface ParsedMention {
  handle: string
  displayName?: string
}

export interface ResolvedMention {
  handle: string
  team_member_id: string
  user_id?: string
}

export const MentionsService = {
  parseMentions(text: string): ParsedMention[] {
    const matches = text.match(/@(\w+)/g) ?? []
    return [...new Set(matches)].map((m) => ({ handle: m.slice(1) }))
  },

  async resolveMentions(
    parsed: ParsedMention[],
    _tenantId: string
  ): Promise<ResolvedMention[]> {
    if (parsed.length === 0) return []
    const { TeamMemberRepository } = await import('@/lib/repositories/team-members')
    const members = await TeamMemberRepository.findAll({})
    const resolved: ResolvedMention[] = []
    for (const p of parsed) {
      const m = members.find(
        (x) => String(x.user_id ?? '').toLowerCase() === p.handle.toLowerCase()
      )
      if (m) resolved.push({ handle: p.handle, team_member_id: m.member_id, user_id: m.user_id })
    }
    return resolved
  },

  async createMentions(
    _messageId: string,
    _conversationId: string,
    _ticketId: string,
    _resolved: ResolvedMention[],
    _createdBy: string
  ): Promise<void> {
    // Persist via repo/table when available
  },

  async getMentionsForConversation(_conversationId: string): Promise<ResolvedMention[]> {
    return []
  },
}
