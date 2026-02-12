/**
 * Secondary Navigation Component
 * 
 * Contextual navigation that appears when a module is selected
 * Shows sub-navigation items for the selected module
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface SecondaryNavItem {
  name: string
  href: string
  badge?: number
}

interface SecondaryNavConfig {
  title: string
  items: SecondaryNavItem[]
}

interface SecondaryNavProps {
  config: SecondaryNavConfig | null
  isPrimaryCollapsed: boolean
}

// Module-specific navigation configs
const moduleNavConfigs: Record<string, SecondaryNavConfig> = {
  inbox: {
    title: 'Inbox',
    items: [
      { name: 'All Conversations', href: '/dashboard/inbox' },
      { name: 'Unassigned', href: '/dashboard/inbox?filter=unassigned' },
      { name: 'Assigned to Me', href: '/dashboard/inbox?filter=assigned' },
      { name: 'Closed', href: '/dashboard/inbox?filter=closed' },
    ],
  },
  tickets: {
    title: 'Tickets',
    items: [
      { name: 'All Tickets', href: '/dashboard/tickets' },
      { name: 'Open', href: '/dashboard/tickets?status=open' },
      { name: 'In Progress', href: '/dashboard/tickets?status=in_progress' },
      { name: 'Resolved', href: '/dashboard/tickets?status=resolved' },
    ],
  },
  'knowledge-base': {
    title: 'Knowledge Base',
    items: [
      { name: 'All Articles', href: '/dashboard/knowledge-base' },
      { name: 'Drafts', href: '/dashboard/knowledge-base?status=draft' },
      { name: 'Published', href: '/dashboard/knowledge-base?status=published' },
      { name: 'Categories', href: '/dashboard/knowledge-base/categories' },
    ],
  },
  analytics: {
    title: 'Analytics',
    items: [
      { name: 'Dashboard', href: '/dashboard/analytics' },
      { name: 'Reports', href: '/dashboard/analytics/reports' },
      { name: 'Usage', href: '/dashboard/analytics/usage' },
    ],
  },
  settings: {
    title: 'Settings',
    items: [
      { name: 'General', href: '/dashboard/settings' },
      { name: 'AI Agents', href: '/dashboard/settings/ai-agents' },
      { name: 'FAQs', href: '/dashboard/settings/faqs' },
    ],
  },
}

export function SecondaryNav({ config, isPrimaryCollapsed }: SecondaryNavProps) {
  const pathname = usePathname()

  // Auto-detect module from pathname if config not provided
  const detectedConfig = useMemo(() => {
    if (config) return config

    for (const [module, moduleConfig] of Object.entries(moduleNavConfigs)) {
      if (pathname?.includes(`/dashboard/${module}`)) {
        return moduleConfig
      }
    }

    return null
  }, [pathname, config])

  if (!detectedConfig) return null

  const leftOffset = isPrimaryCollapsed ? '64px' : '256px'

  return (
    <div
      className="fixed left-0 top-0 h-screen bg-background border-r border-border z-30 overflow-y-auto"
      style={{
        left: leftOffset,
        width: '256px',
        transition: 'left 200ms ease-in-out',
      }}
    >
      <div className="p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">{detectedConfig.title}</h2>
        <nav className="space-y-1">
          {detectedConfig.items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-active/10 text-active border-r-2 border-active font-medium'
                    : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
                )}
              >
                <span>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-active text-active-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
