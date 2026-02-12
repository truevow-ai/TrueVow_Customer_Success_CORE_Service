'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TeamMember {
  member_id: string
  clerk_user_id: string
  role: string
  metadata?: Record<string, any>
}

interface MentionsAutocompleteProps {
  text: string
  onTextChange: (text: string) => void
  teamMembers: TeamMember[]
  onMentionSelect?: (member: TeamMember) => void
  placeholder?: string
  className?: string
}

export function MentionsAutocomplete({
  text,
  onTextChange,
  teamMembers,
  onMentionSelect,
  placeholder = 'Type @ to mention someone...',
  className,
}: MentionsAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<TeamMember[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter team members for suggestions
  const filterMembers = (query: string): TeamMember[] => {
    if (!query) return teamMembers.slice(0, 10)

    const lowerQuery = query.toLowerCase()
    return teamMembers
      .filter((member) => {
        const name = member.metadata?.name || member.clerk_user_id || ''
        const email = member.metadata?.email || ''
        return (
          name.toLowerCase().includes(lowerQuery) ||
          email.toLowerCase().includes(lowerQuery) ||
          member.clerk_user_id.toLowerCase().includes(lowerQuery)
        )
      })
      .slice(0, 10)
  }

  // Handle text change and detect @mentions
  const handleTextChange = (value: string) => {
    onTextChange(value)

    const cursorPosition = textareaRef.current?.selectionStart || value.length
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      // Check if @ is part of a mention (not in the middle of a word)
      const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
        const mentionQuery = textBeforeCursor.substring(lastAtIndex + 1).split(/\s/)[0]
        
        // Only show suggestions if we're still typing the mention (no space after @)
        if (!mentionQuery.includes(' ') && !mentionQuery.includes('\n')) {
          setMentionStart(lastAtIndex)
          const filtered = filterMembers(mentionQuery)
          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
          setSelectedIndex(0)
          return
        }
      }
    }

    setShowSuggestions(false)
    setMentionStart(null)
  }

  // Insert mention into text
  const insertMention = (member: TeamMember) => {
    if (mentionStart === null || !textareaRef.current) return

    const name = member.metadata?.name || member.clerk_user_id || 'User'
    const beforeMention = text.substring(0, mentionStart)
    const afterMention = text.substring(textareaRef.current.selectionStart)
    const newText = `${beforeMention}@${name} ${afterMention}`

    onTextChange(newText)
    setShowSuggestions(false)
    setMentionStart(null)

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = mentionStart + name.length + 2 // +2 for @ and space
        textareaRef.current.setSelectionRange(newPosition, newPosition)
        textareaRef.current.focus()
      }
    }, 0)

    if (onMentionSelect) {
      onMentionSelect(member)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions.length > 0) {
        e.preventDefault()
        insertMention(suggestions[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setMentionStart(null)
    }
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, showSuggestions])

  // Calculate position for suggestions dropdown
  const getSuggestionsPosition = () => {
    if (!textareaRef.current || mentionStart === null) return {}

    const textarea = textareaRef.current
    const textBeforeMention = text.substring(0, mentionStart)
    
    // Create a temporary element to measure text width
    const measureDiv = document.createElement('div')
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    measureDiv.style.whiteSpace = 'pre-wrap'
    measureDiv.style.width = textarea.offsetWidth + 'px'
    measureDiv.style.font = window.getComputedStyle(textarea).font
    measureDiv.style.padding = window.getComputedStyle(textarea).padding
    measureDiv.textContent = textBeforeMention
    document.body.appendChild(measureDiv)

    const rect = textarea.getBoundingClientRect()
    const scrollTop = textarea.scrollTop
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20
    const lines = (textBeforeMention.match(/\n/g) || []).length
    const top = rect.top + (lines * lineHeight) + lineHeight + scrollTop

    document.body.removeChild(measureDiv)

    return {
      position: 'absolute' as const,
      top: `${Math.min(top, window.innerHeight - 200)}px`,
      left: `${rect.left}px`,
      width: `${Math.min(rect.width, 300)}px`,
      zIndex: 1000,
    }
  }

  return (
    <div className={cn('relative', className)}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay hiding to allow clicking on suggestions
          setTimeout(() => setShowSuggestions(false), 200)
        }}
        onFocus={() => {
          // Re-check for mentions on focus
          if (mentionStart !== null) {
            const textBeforeCursor = text.substring(0, textareaRef.current?.selectionStart || text.length)
            const lastAtIndex = textBeforeCursor.lastIndexOf('@')
            if (lastAtIndex !== -1) {
              const mentionQuery = textBeforeCursor.substring(lastAtIndex + 1).split(/\s/)[0]
              if (!mentionQuery.includes(' ')) {
                const filtered = filterMembers(mentionQuery)
                setSuggestions(filtered)
                setShowSuggestions(filtered.length > 0)
              }
            }
          }
        }}
        placeholder={placeholder}
        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
        rows={4}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={getSuggestionsPosition()}
          className="bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto"
        >
          {suggestions.map((member, index) => {
            const name = member.metadata?.name || member.clerk_user_id || 'User'
            const email = member.metadata?.email || ''
            return (
              <button
                key={member.member_id}
                type="button"
                onClick={() => insertMention(member)}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors',
                  index === selectedIndex && 'bg-blue-50'
                )}
              >
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                  {email && (
                    <div className="text-xs text-gray-500 truncate">{email}</div>
                  )}
                </div>
                <div className="text-xs text-gray-400 capitalize">{member.role}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
