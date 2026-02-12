'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell, Search, Command } from 'lucide-react'
import { Input } from '@/components/shared/Input'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { cn } from '@/lib/utils/cn'

export function Header() {
  const { open, setOpen } = useCommandPalette()

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background-secondary px-6">
        <div className="flex flex-1 items-center gap-4">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'border border-border bg-background text-foreground-secondary',
              'hover:bg-background hover:text-foreground transition-colors',
              'text-sm font-medium'
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <div className="hidden sm:flex items-center gap-1 ml-2 text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-background-secondary border border-border">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Workspace Switcher */}
          <WorkspaceSwitcher />
          
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-foreground-secondary hover:bg-background-secondary transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* User Menu */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      
      {/* Command Palette */}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  )
}

