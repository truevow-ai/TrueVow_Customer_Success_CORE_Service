'use client'

import { useState } from 'react'
import { Button } from '@/components/shared/Button'
import { User, Tag, Archive, Trash2, CheckCircle } from 'lucide-react'

interface BulkActionsProps {
  selectedIds: string[]
  onActionComplete: () => void
}

export function BulkActions({ selectedIds, onActionComplete }: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<string | null>(null)

  const handleBulkAction = async (actionType: string, value?: string) => {
    if (selectedIds.length === 0) return

    try {
      setLoading(true)
      setAction(actionType)

      const response = await fetch('/api/v1/inbox/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_ids: selectedIds,
          action: actionType,
          value,
        }),
      })

      if (!response.ok) throw new Error('Failed to perform bulk action')

      onActionComplete()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to perform bulk action. Please try again.')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-gray-700">
        {selectedIds.length} selected
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('assign')}
          disabled={loading}
        >
          <User className="h-4 w-4 mr-1" />
          Assign
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('tag')}
          disabled={loading}
        >
          <Tag className="h-4 w-4 mr-1" />
          Tag
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('status', 'closed')}
          disabled={loading}
        >
          <Archive className="h-4 w-4 mr-1" />
          Archive
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('status', 'resolved')}
          disabled={loading}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Resolve
        </Button>
      </div>
    </div>
  )
}
