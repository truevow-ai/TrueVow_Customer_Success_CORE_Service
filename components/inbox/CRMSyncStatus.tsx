'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncStatus {
  ticketId: string
  crmCaseId: string | null
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict'
  lastSyncedAt: string | null
  errorMessage: string | null
  metadata?: Record<string, any>
}

interface CRMSyncStatusProps {
  ticketId: string
  onSyncComplete?: () => void
}

export function CRMSyncStatus({ ticketId, onSyncComplete }: CRMSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncStatus()
  }, [ticketId])

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/crm/sync/status?ticket_id=${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch sync status')

      const data = await response.json()
      setSyncStatus(data.data.status)
    } catch (err) {
      console.error('Error fetching sync status:', err)
      setError('Failed to load sync status')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (action: 'create' | 'update') => {
    try {
      setSyncing(true)
      setError(null)

      const response = await fetch('/api/v1/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to sync')
      }

      // Refresh status
      await fetchSyncStatus()
      onSyncComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading sync status...</span>
        </div>
      </Card>
    )
  }

  const statusColors = {
    synced: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    conflict: 'bg-orange-100 text-orange-800',
  }

  const statusIcons = {
    synced: CheckCircle,
    pending: Clock,
    failed: XCircle,
    conflict: XCircle,
  }

  const StatusIcon = syncStatus ? statusIcons[syncStatus.syncStatus] : Clock

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">CRM Sync</h3>
            {syncStatus && (
              <Badge className={statusColors[syncStatus.syncStatus]}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {syncStatus.syncStatus.toUpperCase()}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSyncStatus}
            disabled={loading}
            className="touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {syncStatus ? (
          <div className="space-y-2 text-sm">
            {syncStatus.crmCaseId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Case ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{syncStatus.crmCaseId}</span>
                  {syncStatus.metadata?.caseNumber && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_INTAKELY_CRM_URL || 'https://crm.intakely.com'}/cases/${syncStatus.crmCaseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {syncStatus.metadata?.caseNumber && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Case #:</span>
                <span className="font-medium">{syncStatus.metadata.caseNumber}</span>
              </div>
            )}

            {syncStatus.lastSyncedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last synced:</span>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(syncStatus.lastSyncedAt), { addSuffix: true })}
                </span>
              </div>
            )}

            {syncStatus.errorMessage && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {syncStatus.errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {syncStatus.syncStatus === 'synced' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('update')}
                  disabled={syncing}
                  className="flex-1 touch-manipulation"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Update in CRM'
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSync('create')}
                  disabled={syncing}
                  className="flex-1 touch-manipulation"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync to CRM'
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Not synced to CRM</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSync('create')}
              disabled={syncing}
              className="w-full touch-manipulation"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Creating case...
                </>
              ) : (
                'Create Case in CRM'
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
