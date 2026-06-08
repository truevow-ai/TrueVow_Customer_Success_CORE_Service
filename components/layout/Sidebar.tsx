'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Phone,
  Heart,
  RefreshCw,
  BookMarked,
  Star,
  UserPlus,
  Brain,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  // Primary Functions
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Onboarding', href: '/dashboard/onboarding', icon: UserPlus },
  { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  
  // Customer Success Tools
  { name: 'Health Scores', href: '/dashboard/health', icon: Heart },
  { name: 'Renewals', href: '/dashboard/renewals', icon: RefreshCw },
  { name: 'Playbooks', href: '/dashboard/playbooks', icon: BookMarked },
  { name: 'Surveys', href: '/dashboard/surveys', icon: Star },
  
  // Communication
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  
  // Resources
  { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpen },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Portfolio Intelligence', href: '/dashboard/intelligence', icon: Brain },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">CS-Support</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/dashboard/help"
          className="flex items-center text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </Link>
      </div>
    </div>
  )
}

