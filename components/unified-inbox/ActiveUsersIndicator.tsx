/**
 * Active Users Indicator Component
 * 
 * Shows active users (viewing, typing, editing) in conversation header
 */

'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ActiveUser {
  user_id: string
  team_member_id: string | null
  status: 'viewing' | 'typing' | 'editing'
  last_activity: string
  display_name?: string
  avatar_url?: string
}

interface ActiveUsersIndicatorProps {
  conversationId: string
  className?: string
}

export function ActiveUsersIndicator({ conversationId, className }: ActiveUsersIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])

  useEffect(() => {
    if (!conversationId) return

    const fetchActiveUsers = async () => {
      try {
        const response = await fetch(`/api/v1/collision/${conversationId}/active`)
        if (!response.ok) return

        const data = await response.json()
        setActiveUsers(data.data || [])
      } catch (error) {
        console.error('Error fetching active users:', error)
      }
    }

    fetchActiveUsers()
    const interval = setInterval(fetchActiveUsers, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [conversationId])

  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-gray-500">Active:</span>
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user) => (
          <div
            key={user.user_id}
            className={cn(
              'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs',
              user.status === 'typing' || user.status === 'editing'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            )}
            title={`${user.display_name || 'User'} is ${user.status}`}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full" />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
        ))}
        {activeUsers.length > 3 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs">
            +{activeUsers.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}
