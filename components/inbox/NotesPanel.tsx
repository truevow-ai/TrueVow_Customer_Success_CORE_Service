'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Badge } from '@/components/shared/Badge'
import { User, Clock, Plus, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Note {
  note_id: string
  ticket_id: string
  user_id: string
  user_name: string | null
  body: string
  is_internal: boolean
  created_at: string
}

interface NotesPanelProps {
  ticketId: string | null
  onNoteAdded?: () => void
}

export function NotesPanel({ ticketId, onNoteAdded }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchNotes()
    }
  }, [ticketId])

  const fetchNotes = async () => {
    if (!ticketId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/v1/tickets/${ticketId}/notes`)
      if (!response.ok) throw new Error('Failed to fetch notes')

      const result = await response.json()
      setNotes(result.data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!ticketId || !newNote.trim()) return

    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newNote,
          is_internal: isInternal,
        }),
      })

      if (!response.ok) throw new Error('Failed to add note')

      setNewNote('')
      setIsInternal(false)
      setIsAdding(false)
      await fetchNotes()
      onNoteAdded?.()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    }
  }

  if (!ticketId) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Create a ticket to add notes</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
          {!isAdding && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Internal note (only visible to team)</span>
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false)
                    setNewNote('')
                    setIsInternal(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No notes yet. Click &quot;Add Note&quot; to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.note_id}
                className={`p-3 rounded-lg ${
                  note.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {note.user_name || 'Unknown User'}
                    </span>
                    {note.is_internal && (
                      <Badge className="bg-yellow-100 text-yellow-800">Internal</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
