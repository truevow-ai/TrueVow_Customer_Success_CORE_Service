/**
 * Dialer Toggle Component
 * 
 * Toggle dialer on/off and display permissions for CS-Support users
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'

interface DialerPermission {
  user_id: string
  role: string
  department: string
  dialer_enabled: boolean
  permissions: {
    inbound: boolean
    outbound: boolean
    parallel_dialing: boolean
    conference_rooms: boolean
    call_coaching: boolean
    recording: boolean
    transcription: boolean
  }
  number_assignment: 'individual' | 'pool' | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

export function DialerToggle() {
  const [permission, setPermission] = useState<DialerPermission | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { showToast } = useToast()

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/v1/dialer/permissions')
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      const data = await response.json()
      if (data.success) {
        setPermission(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch permissions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!permission) return

    try {
      setToggling(true)
      setError(null)
      setSuccess(null)

      // Optimistically update UI
      const updatedPermission = await optimisticUpdate({
        currentData: permission,
        updateFn: (current) => ({
          ...current,
          dialer_enabled: enabled,
        }),
        apiCall: async () => {
          const response = await fetch('/api/v1/dialer/permissions/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ enabled }),
          })

          if (!response.ok) {
            throw new Error('Failed to toggle dialer')
          }

          const data = await response.json()
          if (!data.success) {
            throw new Error(data.error || 'Failed to toggle dialer')
          }
          return data
        },
        onSuccess: (result) => {
          setPermission(result.data.permission)
          setSuccess(result.data.message || `Dialer ${enabled ? 'enabled' : 'disabled'} successfully`)
          showToast({
            type: 'success',
            title: `Dialer ${enabled ? 'enabled' : 'disabled'}`,
            description: result.data.message || 'Your dialer settings have been updated.',
          })
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000)
        },
        onError: (err) => {
          setError(err.message || 'Failed to toggle dialer')
          showToast({
            type: 'error',
            title: 'Failed to update',
            description: err.message || 'Please try again.',
          })
        },
      })

      setPermission(updatedPermission)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle dialer')
      showToast({
        type: 'error',
        title: 'Failed to update',
        description: 'Please try again.',
      })
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading dialer permissions...</span>
        </div>
      </Card>
    )
  }

  if (error && !permission) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={fetchPermissions}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </Card>
    )
  }

  if (!permission) {
    return null
  }

  const availableFeatures = Object.entries(permission.permissions)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dialer Access</h3>
            <p className="text-sm text-gray-500">
              {permission.role} • {permission.department}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {permission.dialer_enabled ? (
              <span className="flex items-center space-x-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Enabled</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-sm text-gray-400">
                <XCircle className="h-4 w-4" />
                <span>Disabled</span>
              </span>
            )}
            <button
              onClick={() => handleToggle(!permission.dialer_enabled)}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                permission.dialer_enabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permission.dialer_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-50 p-3">
            <div className="flex items-center space-x-2 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <div className="flex items-center space-x-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Permissions Details */}
        {permission.dialer_enabled && (
          <div className="space-y-3 rounded-md bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-900">Available Features</h4>
            <div className="space-y-2">
              {availableFeatures.length > 0 ? (
                <ul className="space-y-1">
                  {availableFeatures.map((feature) => (
                    <li key={feature} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No features enabled</p>
              )}
            </div>

            {/* Number Assignment */}
            {permission.number_assignment && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Number Assignment:</span>{' '}
                  <span className="capitalize">{permission.number_assignment}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {toggling && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>
    </Card>
  )
}
