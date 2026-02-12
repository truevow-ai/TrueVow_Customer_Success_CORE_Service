/**
 * Collision Indicator Component
 * 
 * Shows real-time collaboration indicators (viewing, typing, editing)
 */

'use client'

import { useState, useEffect } from 'react'
import { User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ActiveUser {
  user_id: string
  team_member_id: string | null
  status: 'viewing' | 'typing' | 'editing'
  last_activity: string
  display_name?: string
  avatar_url?: string
}

interface CollisionIndicatorProps {
  conversationId: string
  className?: string
  showTooltip?: boolean
}

export function CollisionIndicator({
  conversationId,
  className,
  showTooltip = true,
}: CollisionIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!conversationId) return

    // Fetch active users
    const fetchActiveUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/collision/${conversationId}/active`)
        if (!response.ok) return

        const data = await response.json()
        setActiveUsers(data.data || [])
      } catch (error) {
        console.error('Error fetching active users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveUsers()

    // Poll every 5 seconds
    const interval = setInterval(fetchActiveUsers, 5000)

    return () => clearInterval(interval)
  }, [conversationId])

  if (loading || activeUsers.length === 0) {
    return null
  }

  // Filter out current user (if needed)
  const otherUsers = activeUsers.filter((user, index, self) => 
    index === self.findIndex(u => u.user_id === user.user_id)
  )

  if (otherUsers.length === 0) {
    return null
  }

  // Get highest priority status (typing > editing > viewing)
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'typing':
      case 'editing':
        return 2
      case 'viewing':
        return 1
      default:
        return 0
    }
  }

  const primaryUser = otherUsers.reduce((prev, current) => 
    getStatusPriority(current.status) > getStatusPriority(prev.status) ? current : prev
  )

  const getIndicatorColor = (status: string) => {
    switch (status) {
      case 'typing':
      case 'editing':
        return 'bg-red-500'
      case 'viewing':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string, name: string) => {
    switch (status) {
      case 'typing':
        return `${name} is typing`
      case 'editing':
        return `${name} is editing`
      case 'viewing':
        return `${name} is viewing`
      default:
        return `${name} is active`
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="relative">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            getIndicatorColor(primaryUser.status)
          )}
        />
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50">
            {getStatusText(primaryUser.status, primaryUser.display_name || 'Someone')}
            {otherUsers.length > 1 && ` (+${otherUsers.length - 1} more)`}
          </div>
        )}
      </div>
      {otherUsers.length > 1 && (
        <span className="text-xs text-gray-500">
          +{otherUsers.length - 1}
        </span>
      )}
    </div>
  )
}
