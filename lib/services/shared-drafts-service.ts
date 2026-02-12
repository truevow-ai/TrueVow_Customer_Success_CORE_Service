/**
 * Shared Drafts Service
 * Get/save/discard shared reply drafts per conversation
 */

export interface SharedDraft {
  draft_id: string
  conversation_id: string
  ticket_id: string | null
  subject: string | null
  body: string
  body_html: string | null
  attachments: unknown[]
  shared_with_team: string
  shared_with_role: string | null
  editable_by_all: boolean
  created_by: string
  updated_at: string
}

const inMemory = new Map<string, SharedDraft>()

export const SharedDraftsService = {
  async getDraftForConversation(conversationId: string): Promise<SharedDraft | null> {
    const draft = inMemory.get(conversationId) ?? null
    return draft
  },

  async saveDraft(
    data: {
      conversation_id: string
      ticket_id: string | null
      subject: string | null
      body: string
      body_html?: string | null
      attachments?: unknown[]
      shared_with_team: string
      shared_with_role?: string | null
      editable_by_all: boolean
      created_by: string
    },
    existingDraftId?: string | null
  ): Promise<SharedDraft> {
    const id = existingDraftId ?? `draft-${data.conversation_id}-${Date.now()}`
    const draft: SharedDraft = {
      draft_id: id,
      conversation_id: data.conversation_id,
      ticket_id: data.ticket_id ?? null,
      subject: data.subject ?? null,
      body: data.body,
      body_html: data.body_html ?? null,
      attachments: data.attachments ?? [],
      shared_with_team: data.shared_with_team ?? 'all',
      shared_with_role: data.shared_with_role ?? null,
      editable_by_all: data.editable_by_all ?? true,
      created_by: data.created_by,
      updated_at: new Date().toISOString(),
    }
    inMemory.set(data.conversation_id, draft)
    return draft
  },

  async discardDraft(draftId: string): Promise<void> {
    for (const [k, v] of inMemory) {
      if (v.draft_id === draftId) {
        inMemory.delete(k)
        return
      }
    }
  },
}
