/**
 * Contextual Sidebar Component
 * 
 * Right-side sidebar for detail views and contextual information
 */

'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ContextualSidebarProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

export function ContextualSidebar({
  open,
  onClose,
  title,
  children,
  width = '384px',
}: ContextualSidebarProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-background border-l border-border shadow-xl z-50',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ width }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-background-secondary transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-foreground-secondary" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  )
}
