/**
 * Command Palette Component
 * 
 * Global search and navigation (Cmd+K / Ctrl+K)
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  BookOpen,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

export interface Command {
  id: string
  label: string
  description?: string
  keywords?: string[]
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
  group?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands?: Command[]
}

const defaultCommands: Command[] = [
  {
    id: 'dashboard',
    label: 'Go to Dashboard',
    description: 'View onboarding dashboard',
    keywords: ['dashboard', 'home', 'main'],
    icon: LayoutDashboard,
    href: '/dashboard/dashboard',
    group: 'Navigation',
  },
  {
    id: 'inbox',
    label: 'Open Inbox',
    description: 'View all conversations',
    keywords: ['inbox', 'messages', 'conversations'],
    icon: Inbox,
    href: '/dashboard/inbox',
    group: 'Navigation',
  },
  {
    id: 'tickets',
    label: 'View Tickets',
    description: 'Manage support tickets',
    keywords: ['tickets', 'support'],
    icon: Ticket,
    href: '/dashboard/tickets',
    group: 'Navigation',
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    description: 'Browse articles',
    keywords: ['kb', 'knowledge', 'articles', 'help'],
    icon: BookOpen,
    href: '/dashboard/knowledge-base',
    group: 'Navigation',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'View analytics dashboard',
    keywords: ['analytics', 'reports', 'metrics'],
    icon: BarChart3,
    href: '/dashboard/analytics',
    group: 'Navigation',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure settings',
    keywords: ['settings', 'config', 'preferences'],
    icon: Settings,
    href: '/dashboard/settings',
    group: 'Navigation',
  },
]

export function CommandPalette({ open, onClose, commands = defaultCommands }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands
    const query = searchQuery.toLowerCase()
    return commands.filter((cmd) => {
      const matchesLabel = cmd.label.toLowerCase().includes(query)
      const matchesDescription = cmd.description?.toLowerCase().includes(query)
      const matchesKeywords = cmd.keywords?.some((kw) => kw.toLowerCase().includes(query))
      return matchesLabel || matchesDescription || matchesKeywords
    })
  }, [commands, searchQuery])

  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>()
    filteredCommands.forEach((cmd) => {
      const group = cmd.group || 'Other'
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push(cmd)
    })
    return Array.from(groups.entries())
  }, [filteredCommands])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filteredCommands[selectedIndex]
        if (selected) handleCommandSelect(selected)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const handleCommandSelect = (command: Command) => {
    if (command.href) router.push(command.href)
    else if (command.action) command.action()
    onClose()
    setSearchQuery('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4">
        <div className="rounded-lg border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-foreground placeholder:text-foreground-secondary focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-foreground-secondary">
              <kbd className="px-2 py-1 rounded bg-background-secondary border border-border">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {groupedCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-foreground-secondary">
                <p>No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              groupedCommands.map(([group, groupCommands]) => (
                <div key={group} className="py-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-foreground-secondary uppercase">{group}</div>
                  {groupCommands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command)
                    const isSelected = globalIndex === selectedIndex
                    const Icon = command.icon
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleCommandSelect(command)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                          isSelected ? 'bg-active text-active-foreground' : 'hover:bg-background-secondary'
                        )}
                      >
                        {Icon && <Icon className={cn('h-5 w-5 flex-shrink-0', isSelected ? 'text-active-foreground' : 'text-foreground-secondary')} />}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', isSelected ? 'text-active-foreground' : 'text-foreground')}>{command.label}</p>
                          {command.description && <p className={cn('text-xs mt-0.5', isSelected ? 'text-active-foreground/80' : 'text-foreground-secondary')}>{command.description}</p>}
                        </div>
                        {command.href && <ArrowRight className={cn('h-4 w-4 flex-shrink-0', isSelected ? 'text-active-foreground' : 'text-foreground-secondary')} />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-foreground-secondary">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background-secondary border border-border">â†‘â†“</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background-secondary border border-border">Enter</kbd>
                <span>Select</span>
              </div>
            </div>
            <button onClick={onClose} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
