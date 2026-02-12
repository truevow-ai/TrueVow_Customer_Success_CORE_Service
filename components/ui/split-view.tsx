/**
 * Split View Component
 * 
 * Two-panel layout (list + detail side-by-side)
 * Used by: Gmail, Linear, Notion
 * Pattern: List + detail side-by-side
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SplitViewProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: string | number
  rightWidth?: string | number
  className?: string
  leftClassName?: string
  rightClassName?: string
  onResize?: (leftWidth: number, rightWidth: number) => void
}

export function SplitView({
  left,
  right,
  leftWidth = '40%',
  rightWidth = '60%',
  className,
  leftClassName,
  rightClassName,
  onResize,
}: SplitViewProps) {
  return (
    <div className={cn('flex h-full overflow-hidden', className)}>
      {/* Left Panel */}
      <div
        className={cn('overflow-auto border-r border-border', leftClassName)}
        style={{ width: leftWidth, minWidth: 0 }}
      >
        {left}
      </div>

      {/* Right Panel */}
      <div
        className={cn('overflow-auto', rightClassName)}
        style={{ width: rightWidth, minWidth: 0 }}
      >
        {right}
      </div>
    </div>
  )
}
