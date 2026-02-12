'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export function WorkspaceSwitcher() {
  const [current] = useState('Default workspace')
  return (
    <div className={cn('flex items-center gap-2 text-sm text-foreground-secondary')}>
      <span className="hidden sm:inline">{current}</span>
    </div>
  )
}
