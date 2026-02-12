'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { BillingOperations } from '@/components/billing/BillingOperations'
import { HealthScore } from '@/components/health/HealthScore'
import { Badge } from '@/components/shared/Badge'
import { User, Mail, Calendar, Tag, TrendingUp, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CustomerProfileProps {
  customerEmail: string
  customerName: string | null
  tenantId: string | null
}

interface CustomerData {
  email: string
  name: string | null
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  averageResponseTime: number
  lastContact: string | null
  healthScore: number | null
  healthLevel: 'healthy' | 'at_risk' | 'critical' | null
  tags: string[]
}

export function CustomerProfile({
  customerEmail,
  customerName,
  tenantId,
}: CustomerProfileProps) {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerData()
  }, [customerEmail, tenantId])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('email', customerEmail)
      if (tenantId) params.append('tenant_id', tenantId)

      const response = await fetch(`/api/v1/customers/profile?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch customer data')

      const result = await response.json()
      setCustomerData(result.data)
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">Loading customer profile...</div>
      </Card>
    )
  }

  if (!customerData) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">No customer data available</div>
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {customerData.name || customerData.email}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {customerData.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-900">{customerData.totalTickets}</div>
          <div className="text-xs text-gray-600">Total Tickets</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{customerData.openTickets}</div>
          <div className="text-xs text-gray-600">Open</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-green-600">{customerData.resolvedTickets}</div>
          <div className="text-xs text-gray-600">Resolved</div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-900">
            {customerData.averageResponseTime > 0
              ? `${Math.round(customerData.averageResponseTime / 60)}m`
              : '-'}
          </div>
          <div className="text-xs text-gray-600">Avg Response</div>
        </div>
      </div>

      {customerData.lastContact && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Last contact: {formatDistanceToNow(new Date(customerData.lastContact), { addSuffix: true })}</span>
        </div>
      )}

      {customerData.tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Tag className="h-4 w-4" />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {customerData.tags.map((tag) => (
              <Badge key={tag} className="bg-gray-100 text-gray-800">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Health Score */}
      {tenantId && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <HealthScore
            tenantId={tenantId}
            customerEmail={customerEmail}
            onRefresh={fetchCustomerData}
          />
        </div>
      )}

      {/* Billing Operations (if authorized and tenant ID available) */}
      {tenantId && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <BillingOperations
            tenantId={tenantId}
            onOperationComplete={() => {
              // Refresh customer profile if needed
              fetchCustomerData()
            }}
          />
        </div>
      )}
    </Card>
  )
}
