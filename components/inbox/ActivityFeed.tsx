'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { User, Clock, Tag, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  activity_id: string
  ticket_id: string
  user_id: string
  user_name: string | null
  activity_type: string
  description: string | null
  metadata: Record<string, any>
  created_at: string
}

interface ActivityFeedProps {
  ticketId: string | null
}

const ACTIVITY_ICONS: Record<string, any> = {
  ticket_created: CheckCircle,
  ticket_assigned: User,
  ticket_resolved: CheckCircle,
  ticket_closed: XCircle,
  message_sent: Clock,
  status_changed: AlertCircle,
  priority_changed: AlertCircle,
  tag_added: Tag,
  tag_removed: Tag,
  note_added: Clock,
}

const ACTIVITY_COLORS: Record<string, string> = {
  ticket_created: 'bg-blue-100 text-blue-800',
  ticket_assigned: 'bg-purple-100 text-purple-800',
  ticket_resolved: 'bg-green-100 text-green-800',
  ticket_closed: 'bg-gray-100 text-gray-800',
  message_sent: 'bg-gray-100 text-gray-800',
  status_changed: 'bg-yellow-100 text-yellow-800',
  priority_changed: 'bg-orange-100 text-orange-800',
  tag_added: 'bg-indigo-100 text-indigo-800',
  tag_removed: 'bg-red-100 text-red-800',
  note_added: 'bg-gray-100 text-gray-800',
}

export function ActivityFeed({ ticketId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ticketId) {
      fetchActivities()
    }
  }, [ticketId])

  const fetchActivities = async () => {
    if (!ticketId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/v1/tickets/${ticketId}/activity`)
      if (!response.ok) throw new Error('Failed to fetch activities')

      const result = await response.json()
      setActivities(result.data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!ticketId) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Create a ticket to see activity</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center py-4 text-gray-500">Loading activity...</div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] || Clock
              const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-100 text-gray-800'

              return (
                <div key={activity.activity_id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.user_name || 'System'}
                      </span>
                      <Badge className={colorClass} size="sm">
                        {activity.activity_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
