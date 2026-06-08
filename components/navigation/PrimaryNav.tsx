/**
 * Primary Navigation Component
 * 
 * Collapsible left sidebar with Supabase-style behavior
 * - Default: Collapsed to icons (64px)
 * - Expanded: Full width (256px) with labels
 * - Hover: Expands over secondary nav
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Ticket,
  Phone,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Brain,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/dashboard', icon: LayoutDashboard },
  { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpen },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Intelligence', href: '/dashboard/intelligence', icon: Brain },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface PrimaryNavProps {
  onModuleSelect?: (module: string) => void
}

export function PrimaryNav({ onModuleSelect }: PrimaryNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = !isCollapsed || isHovered

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-40',
        'transition-all duration-200 ease-in-out',
        'flex flex-col',
        isExpanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {isExpanded ? (
          <h1 className="text-xl font-bold text-sidebar-foreground">CS-Support</h1>
        ) : (
          <div className="h-8 w-8 rounded bg-active flex items-center justify-center">
            <span className="text-sm font-bold text-active-foreground">CS</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onModuleSelect?.(item.name.toLowerCase())}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'relative',
                isActive
                  ? 'bg-active text-active-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-active/20 hover:text-sidebar-foreground'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-active-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-foreground'
                )}
              />
              {isExpanded && (
                <>
                  <span className="ml-3">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-active-foreground" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center rounded-md p-2 hover:bg-active/20 transition-colors"
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5 text-sidebar-foreground/80" />
          ) : (
            <ChevronRight className="h-5 w-5 text-sidebar-foreground/80" />
          )}
        </button>
      </div>
    </div>
  )
}
