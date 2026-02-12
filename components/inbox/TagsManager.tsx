'use client'

import { useState } from 'react'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { X, Plus, Tag as TagIcon } from 'lucide-react'

interface TagsManagerProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagsManager({ tags, onTagsChange, disabled }: TagsManagerProps) {
  const [newTag, setNewTag] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()])
      setNewTag('')
      setIsAdding(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Tags</span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-6 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} className="bg-gray-100 text-gray-800 flex items-center gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {isAdding && !disabled && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              } else if (e.key === 'Escape') {
                setIsAdding(false)
                setNewTag('')
              }
            }}
            placeholder="Enter tag name..."
            className="flex-1"
            autoFocus
          />
          <Button type="button" variant="primary" size="sm" onClick={handleAddTag}>
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false)
              setNewTag('')
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {tags.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500">No tags yet. Click &quot;Add&quot; to create one.</p>
      )}
    </div>
  )
}
