'use client'

import { Badge } from '@/components/shared/Badge'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface SLAIndicatorProps {
  firstResponseTarget: string | null
  resolutionTarget: string | null
  firstResponseAt: string | null
  resolvedAt: string | null
  createdAt: string
}

export function SLAIndicator({
  firstResponseTarget,
  resolutionTarget,
  firstResponseAt,
  resolvedAt,
  createdAt,
}: SLAIndicatorProps) {
  const now = new Date()
  const created = new Date(createdAt)

  // Calculate first response SLA status
  let firstResponseStatus: 'ok' | 'warning' | 'breach' | null = null
  let firstResponseTime: string | null = null

  if (firstResponseTarget) {
    const target = new Date(firstResponseTarget)
    const timeRemaining = target.getTime() - now.getTime()

    if (firstResponseAt) {
      // Already responded
      const responseTime = new Date(firstResponseAt).getTime() - created.getTime()
      firstResponseTime = formatDistanceToNow(new Date(firstResponseAt), { addSuffix: false })
      firstResponseStatus = responseTime <= target.getTime() - created.getTime() ? 'ok' : 'breach'
    } else {
      // Not yet responded
      const hoursRemaining = timeRemaining / (1000 * 60 * 60)
      if (hoursRemaining < 0) {
        firstResponseStatus = 'breach'
      } else if (hoursRemaining < 1) {
        firstResponseStatus = 'warning'
      }
    }
  }

  // Calculate resolution SLA status
  let resolutionStatus: 'ok' | 'warning' | 'breach' | null = null
  let resolutionTime: string | null = null

  if (resolutionTarget) {
    const target = new Date(resolutionTarget)
    const timeRemaining = target.getTime() - now.getTime()

    if (resolvedAt) {
      // Already resolved
      const resolveTime = new Date(resolvedAt).getTime() - created.getTime()
      resolutionTime = formatDistanceToNow(new Date(resolvedAt), { addSuffix: false })
      resolutionStatus = resolveTime <= target.getTime() - created.getTime() ? 'ok' : 'breach'
    } else {
      // Not yet resolved
      const hoursRemaining = timeRemaining / (1000 * 60 * 60)
      if (hoursRemaining < 0) {
        resolutionStatus = 'breach'
      } else if (hoursRemaining < 24) {
        resolutionStatus = 'warning'
      }
    }
  }

  if (!firstResponseTarget && !resolutionTarget) {
    return null
  }

  return (
    <div className="space-y-2">
      {firstResponseTarget && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">First Response:</span>
          {firstResponseStatus === 'ok' && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              On Time
            </Badge>
          )}
          {firstResponseStatus === 'warning' && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warning
            </Badge>
          )}
          {firstResponseStatus === 'breach' && (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Breached
            </Badge>
          )}
          {!firstResponseStatus && (
            <span className="text-sm text-gray-500">
              Target: {format(new Date(firstResponseTarget), 'MMM d, h:mm a')}
            </span>
          )}
          {firstResponseTime && (
            <span className="text-sm text-gray-500">({firstResponseTime})</span>
          )}
        </div>
      )}

      {resolutionTarget && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">Resolution:</span>
          {resolutionStatus === 'ok' && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              On Time
            </Badge>
          )}
          {resolutionStatus === 'warning' && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warning
            </Badge>
          )}
          {resolutionStatus === 'breach' && (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Breached
            </Badge>
          )}
          {!resolutionStatus && (
            <span className="text-sm text-gray-500">
              Target: {format(new Date(resolutionTarget), 'MMM d, h:mm a')}
            </span>
          )}
          {resolutionTime && (
            <span className="text-sm text-gray-500">({resolutionTime})</span>
          )}
        </div>
      )}
    </div>
  )
}
