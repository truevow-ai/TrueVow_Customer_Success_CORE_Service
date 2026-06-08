/**
 * Customer Detail Modal
 * 
 * Shows detailed information about a post-onboarding customer
 */

'use client'

import { X, Mail, Phone, Calendar, Activity, TrendingUp, MessageSquare, Map, Eye } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'

interface PostOnboardingCustomer {
  customer_id: string
  customer_email: string
  tenant_id: string
  go_live_date: string | null
  onboarding_completed_at: string | null
  transferred_from_onboarding_at: string | null
  assigned_csm_id: string | null
  health_score: number | null
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  days_since_go_live: number
  communications_count: number
  last_communication_at: string | null
  status: string
  notes?: string | null
  metadata?: Record<string, any> | null
}

interface CustomerDetailModalProps {
  customer: PostOnboardingCustomer | null
  onClose: () => void
  onSendEmail?: (email: string) => void
  onScheduleCall?: (email: string) => void
  onViewJourney?: (customerId: string, customerEmail: string) => void
}

export function CustomerDetailModal({
  customer,
  onClose,
  onSendEmail,
  onScheduleCall,
  onViewJourney,
}: CustomerDetailModalProps) {
  if (!customer) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'at_risk':
        return 'bg-red-100 text-red-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
        <p className="mt-1 text-sm text-gray-500">{customer.customer_email}</p>
      </div>

      {/* Content */}
      <div className="space-y-6">
          {/* Status and Health Score */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Health Score</p>
                  <p className={`text-xl font-bold ${getHealthScoreColor(customer.health_score)}`}>
                    {customer.health_score !== null ? customer.health_score : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Days Since Go-Live</p>
                  <p className="text-xl font-bold text-gray-900">{customer.days_since_go_live}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Churn Risk */}
          {customer.churn_risk_level && customer.churn_risk_level !== 'low' && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Churn Risk</h3>
              <div className="space-y-2">
                <Badge
                  className={
                    customer.churn_risk_level === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : customer.churn_risk_level === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {customer.churn_risk_level.toUpperCase()}
                </Badge>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">Onboarding Completed</p>
                  <p className="text-sm text-gray-500">
                    {customer.onboarding_completed_at ? new Date(customer.onboarding_completed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Go-Live Date</p>
                  <p className="text-sm text-gray-500">
                    {customer.go_live_date ? new Date(customer.go_live_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">Transferred to CS-Support</p>
                  <p className="text-sm text-gray-500">
                    {customer.transferred_from_onboarding_at ? new Date(customer.transferred_from_onboarding_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {customer.last_communication_at && (
                <div className="flex items-start space-x-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900">Last Communication</p>
                    <p className="text-sm text-gray-500">
                      {new Date(customer.last_communication_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Communication Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Communications</h3>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold text-gray-900">
                  {customer.communications_count}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Total communications sent</p>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            {onViewJourney && (
              <Button 
                onClick={() => onViewJourney(customer.customer_id, customer.customer_email)}
                variant="outline"
                className="flex-1"
              >
                <Map className="mr-2 h-4 w-4" />
                View Journey
              </Button>
            )}
            <div className="flex space-x-3">
              {onSendEmail && (
                <Button onClick={() => onSendEmail(customer.customer_email)} className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              )}
              {onScheduleCall && (
                <Button
                  onClick={() => onScheduleCall(customer.customer_email)}
                  variant="outline"
                  className="flex-1"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Schedule Call
                </Button>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
