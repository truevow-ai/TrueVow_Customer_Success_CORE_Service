'use client'

import { useState, useEffect } from 'react'
import { FileText, Users, Clock, User, CheckCircle, X } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface SharedDraft {
  draft_id: string
  body: string
  subject?: string | null
  created_by: string
  last_edited_by?: string | null
  updated_at: string
  version: number
  shared_with_team: 'all' | 'assigned_team' | 'specific_role'
  editable_by_all: boolean
}

interface SharedDraftIndicatorProps {
  conversationId?: string
  draft?: SharedDraft | null
  onLoadDraft?: (draft: SharedDraft) => void
  onDraftUpdate?: (draft: SharedDraft | null) => void
  onDiscard?: () => void
  className?: string
}

export function SharedDraftIndicator({
  conversationId,
  onLoadDraft,
  onDraftUpdate,
  className,
}: SharedDraftIndicatorProps) {
  const [draft, setDraft] = useState<SharedDraft | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Fetch draft on mount and set up polling for real-time sync
  useEffect(() => {
    fetchDraft()

    // Poll for draft updates every 3 seconds (real-time sync)
    const pollInterval = setInterval(() => {
      if (!syncing) {
        fetchDraft(true) // Silent fetch
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [conversationId])

  const fetchDraft = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await fetch(`/api/v1/inbox/${conversationId}/shared-draft`)
      if (response.ok) {
        const result = await response.json()
        const newDraft = result.data
        if (newDraft) {
          // Only update if version changed (someone else edited)
          if (!draft || newDraft.version !== draft.version) {
            setDraft(newDraft)
            if (onDraftUpdate) {
              onDraftUpdate(newDraft)
            }
          }
        } else {
          if (draft) {
            setDraft(null)
            if (onDraftUpdate) {
              onDraftUpdate(null)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shared draft:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleLoadDraft = () => {
    if (draft && onLoadDraft) {
      onLoadDraft(draft)
    }
  }

  const handleDiscardDraft = async () => {
    if (!draft) return

    try {
      setSyncing(true)
      if (conversationId) {
        const response = await fetch(`/api/v1/inbox/${conversationId}/shared-draft`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setDraft(null)
          if (onDraftUpdate) {
            onDraftUpdate(null)
          }
        }
      }
      if (onDiscard) {
        onDiscard()
      }
    } catch (error) {
      console.error('Error discarding draft:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !draft) {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-4 w-4 animate-pulse" />
          <span>Loading draft...</span>
        </div>
      </Card>
    )
  }

  if (!draft) return null

  return (
    <Card className={cn('p-3 sm:p-4', className)}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                Shared Draft {draft.version > 1 && `(v${draft.version})`}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Users className="h-3 w-3" />
                <span className="capitalize">{draft.shared_with_team.replace('_', ' ')}</span>
                {draft.editable_by_all && (
                  <>
                    <span>•</span>
                    <span>Editable by all</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {syncing && (
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        <div className="text-sm text-gray-700 line-clamp-2">
          {draft.body.substring(0, 150)}
          {draft.body.length > 150 && '...'}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {draft.last_edited_by && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[100px]">Edited by {draft.last_edited_by}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadDraft}
            className="flex-1 text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Load Draft
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDiscardDraft}
            disabled={syncing}
            className="text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
