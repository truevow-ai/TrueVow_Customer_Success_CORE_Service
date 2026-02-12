/**
 * Customer Success Dashboard Component
 * 
 * Displays POST-ONBOARDING customer management dashboard for CSMs.
 * 
 * NOTE: This dashboard shows customers who have completed onboarding and gone live.
 * Client Success Managers manage these customers post-onboarding (health scores, success metrics, at-risk identification).
 * 
 * Onboarding workflows are handled by client_onboarding_manager role in SaaS Admin service.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Loader2,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { CustomerDetailModal } from './CustomerDetailModal'
import { ProgressChart } from './ProgressChart'
import { HealthScoreDistribution } from './HealthScoreDistribution'
import { ContextualSidebar } from '@/components/layout/ContextualSidebar'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { VirtualizedList } from '@/components/ui/virtualized-list'

interface PostOnboardingCustomer {
  customer_id: string
  customer_email: string
  tenant_id: string
  go_live_date: string
  onboarding_completed_at: string
  transferred_from_onboarding_at: string
  assigned_csm_id: string | null
  health_score: number | null
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  days_since_go_live: number
  communications_count: number
  last_communication_at: string | null
  status: 'active' | 'at_risk' | 'healthy'
  notes?: string | null
  metadata?: Record<string, any> | null
}

interface CustomerSuccessDashboardData {
  summary: {
    total_customers: number
    total_at_risk: number
    total_healthy: number
    average_health_score: number
    average_days_since_go_live: number
  }
  active_customers: PostOnboardingCustomer[]
  at_risk_customers: PostOnboardingCustomer[]
  recent_transfers: PostOnboardingCustomer[]
  communication_stats: {
    total_communications: number
    emails_sent: number
    sms_sent: number
    calls_made: number
    last_7_days: number
  }
}

export function CustomerSuccessDashboard() {
  const [data, setData] = useState<CustomerSuccessDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<PostOnboardingCustomer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [healthScoreFilter, setHealthScoreFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/v1/dashboard/onboarding')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setLastRefresh(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!data) return []

    let customers = [...data.active_customers, ...data.at_risk_customers]

    // Search filter
    if (searchQuery) {
      customers = customers.filter((c) =>
        c.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      customers = customers.filter((c) => c.status === statusFilter)
    }

    // Health score filter
    if (healthScoreFilter !== 'all') {
      customers = customers.filter((c) => {
        if (c.health_score === null) return healthScoreFilter === 'no_score'
        if (healthScoreFilter === 'high') return c.health_score >= 80
        if (healthScoreFilter === 'medium') return c.health_score >= 60 && c.health_score < 80
        if (healthScoreFilter === 'low') return c.health_score < 60
        return true
      })
    }

    return customers
  }, [data, searchQuery, statusFilter, healthScoreFilter])

  // Health score distribution
  const healthScoreDistribution = useMemo(() => {
    if (!data) return []

    const active = [...data.active_customers, ...data.at_risk_customers]
    const high = active.filter((c) => c.health_score !== null && c.health_score >= 80).length
    const medium = active.filter(
      (c) => c.health_score !== null && c.health_score >= 60 && c.health_score < 80
    ).length
    const low = active.filter((c) => c.health_score !== null && c.health_score < 60).length
    const noScore = active.filter((c) => c.health_score === null).length

    return [
      { range: 'High (80+)', count: high, color: '#10b981' },
      { range: 'Medium (60-79)', count: medium, color: '#f59e0b' },
      { range: 'Low (<60)', count: low, color: '#ef4444' },
      { range: 'No Score', count: noScore, color: '#9ca3af' },
    ]
  }, [data])

  // Recent transfers chart data (replacing milestone stats)
  const recentTransfersChartData = useMemo(() => {
    if (!data) return []

    // Group by days since go-live ranges
    const ranges = [
      { label: '0-30 days', min: 0, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
      { label: '90+ days', min: 91, max: Infinity },
    ]

    return ranges.map((range, index) => {
      const count = data.recent_transfers.filter(
        (c) => c.days_since_go_live >= range.min && c.days_since_go_live <= range.max
      ).length
      return {
        label: range.label,
        value: count,
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5],
      }
    })
  }, [data])

  const { showToast } = useToast()

  const handleSendEmail = async (email: string) => {
    try {
      // Optimistically show success
      showToast({
        type: 'success',
        title: 'Email opened',
        description: `Opening email client for ${email}`,
      })

      // Open email client
      window.location.href = `mailto:${email}`
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to open email',
        description: 'Please try again.',
      })
    }
  }

  const handleScheduleCall = async (email: string) => {
    try {
      // Optimistically show success
      await optimisticUpdate({
        currentData: data,
        updateFn: (current) => current, // No UI change needed
        apiCall: async () => {
          // In a real implementation, this would create a calendar event
          // For now, we'll just show a success message
          return { success: true }
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Call scheduled',
            description: `Scheduling call with ${email}`,
          })
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to schedule call',
            description: error.message || 'Please try again.',
          })
        },
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to schedule call',
        description: 'Please try again.',
      })
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

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

  const renderCustomerCard = (customer: PostOnboardingCustomer) => (
    <>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-gray-900">{customer.customer_email}</p>
          <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
          {customer.churn_risk_level && customer.churn_risk_level !== 'low' && (
            <Badge className="bg-orange-100 text-orange-800">
              Risk: {customer.churn_risk_level}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span>{customer.days_since_go_live} days since go-live</span>
          {customer.health_score !== null && (
            <span className={getHealthScoreColor(customer.health_score)}>
              Health: {customer.health_score}
            </span>
          )}
          <span>{customer.communications_count} communications</span>
          {customer.last_communication_at && (
            <span>Last: {new Date(customer.last_communication_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <div className="ml-4 flex space-x-2">
        <Button
          onClick={() => setSelectedCustomer(customer)}
          variant="outline"
          size="sm"
        >
          <Eye className="mr-2 h-4 w-4" />
          Details
        </Button>
        <Button
          onClick={() => handleSendEmail(customer.customer_email)}
          variant="ghost"
          size="sm"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleScheduleCall(customer.customer_email)}
          variant="ghost"
          size="sm"
        >
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header with Refresh Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Success Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage post-onboarding customers and track customer health
            {lastRefresh && (
              <span className="ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="at_risk">At Risk</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Health Score Filter */}
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <select
              value={healthScoreFilter}
              onChange={(e) => setHealthScoreFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Health Scores</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low (&lt;60)</option>
              <option value="no_score">No Score</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_customers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Healthy</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_healthy}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">At Risk</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_at_risk}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Days Since Go-Live</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.average_days_since_go_live}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Health</p>
              <p className={`text-2xl font-bold ${getHealthScoreColor(data.summary.average_health_score)}`}>
                {data.summary.average_health_score || 'N/A'}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Health Score Distribution */}
        <HealthScoreDistribution scores={healthScoreDistribution} />

        {/* Milestone Progress Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Milestone Completion</h3>
          <ProgressChart data={recentTransfersChartData} />
        </Card>
      </div>

      {/* Communication Stats */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Communication Activity</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{data.communication_stats.emails_sent}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Emails</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{data.communication_stats.sms_sent}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">SMS</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Phone className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{data.communication_stats.calls_made}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Calls</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{data.communication_stats.total_communications}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span className="text-2xl font-bold">{data.communication_stats.last_7_days}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Last 7 Days</p>
          </div>
        </div>
      </Card>

      {/* At Risk Customers */}
      {data.at_risk_customers.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">At Risk Customers</h2>
            <Badge className="bg-red-100 text-red-800">{data.at_risk_customers.length}</Badge>
          </div>
          <div className="space-y-3">
            {data.at_risk_customers.map((customer) => (
              <div
                key={customer.customer_id}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{customer.customer_email}</p>
                    <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                    {customer.churn_risk_level && customer.churn_risk_level !== 'low' && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Risk: {customer.churn_risk_level}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{customer.days_since_go_live} days since go-live</span>
                    {customer.health_score !== null && (
                      <span className={getHealthScoreColor(customer.health_score)}>
                        Health: {customer.health_score}
                      </span>
                    )}
                    <span>{customer.communications_count} communications</span>
                    {customer.last_communication_at && (
                      <span>Last: {new Date(customer.last_communication_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedCustomer(customer)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtered Active Customers */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Post-Onboarding Customers {filteredCustomers.length !== data.active_customers.length && `(${filteredCustomers.length} filtered)`}
          </h2>
          <Badge className="bg-blue-100 text-blue-800">{filteredCustomers.length}</Badge>
        </div>
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.length > 50 ? (
              <VirtualizedList
                items={filteredCustomers}
                estimateSize={120}
                containerClassName="h-[600px]"
                renderItem={(customer) => (
                  <div
                    key={customer.customer_id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 mb-3"
                  >
                    {renderCustomerCard(customer)}
                  </div>
                )}
              />
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.progress_id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
                >
                  {renderCustomerCard(customer)}
                </div>
              ))
            )
          ) : (
            <p className="py-8 text-center text-gray-500">No customers match the current filters</p>
          )}
        </div>
      </Card>

      {/* Recent Transfers */}
      {data.recent_transfers.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Transfers</h2>
          <div className="space-y-3">
            {data.recent_transfers.slice(0, 5).map((customer) => (
              <div key={customer.customer_id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="font-medium text-gray-900">{customer.customer_email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {milestone.completed_count} completed
                    {milestone.average_completion_days > 0 && (
                      <span> • Avg {milestone.average_completion_days} days</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Customer Detail Sidebar */}
      <ContextualSidebar
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Customer: ${selectedCustomer.customer_email}` : undefined}
      >
        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onSendEmail={handleSendEmail}
            onScheduleCall={handleScheduleCall}
          />
        )}
      </ContextualSidebar>
    </div>
  )
}
