'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Star,
  Users,
  Mail,
  MessageSquare,
  Phone,
  BarChart3,
  Activity,
} from 'lucide-react'
import { format, subDays } from 'date-fns'

interface DashboardMetrics {
  ticketVolume: {
    total: number
    open: number
    in_progress: number
    resolved: number
    closed: number
    byChannel: Record<string, number>
    byPriority: Record<string, number>
    trend: Array<{ date: string; count: number }>
  }
  responseTime: {
    average: number
    median: number
    p95: number
    byChannel: Record<string, number>
    trend: Array<{ date: string; avgMinutes: number }>
  }
  resolutionTime: {
    average: number
    median: number
    p95: number
    byChannel: Record<string, number>
    trend: Array<{ date: string; avgHours: number }>
  }
  csat: {
    average: number
    count: number
    distribution: Record<string, number>
    trend: Array<{ date: string; average: number; count: number }>
  }
  nps: {
    score: number
    count: number
    promoters: number
    passives: number
    detractors: number
    trend: Array<{ date: string; score: number; count: number }>
  }
  sla: {
    complianceRate: number
    totalTickets: number
    compliantTickets: number
    breachedTickets: number
    warningTickets: number
    firstResponseCompliance: number
    resolutionCompliance: number
    trend: Array<{ date: string; complianceRate: number; breaches: number }>
  }
  agentPerformance: Array<{
    agentId: string
    agentName: string
    ticketsAssigned: number
    ticketsResolved: number
    averageResponseTime: number
    averageResolutionTime: number
    csatScore: number
    firstContactResolution: number
  }>
  summary: {
    totalTickets: number
    openTickets: number
    averageResponseTime: number
    averageResolutionTime: number
    averageCSAT: number
    npsScore: number
    slaComplianceRate: number
    activeAgents: number
  }
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  chat: MessageSquare,
  facebook: MessageSquare,
  form: MessageSquare,
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange, customFrom, customTo])

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      let from: string
      let to: string

      if (timeRange === 'custom') {
        from = customFrom || subDays(new Date(), 30).toISOString()
        to = customTo || new Date().toISOString()
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        from = subDays(new Date(), days).toISOString()
        to = new Date().toISOString()
      }

      const params = new URLSearchParams({
        from,
        to,
      })

      const response = await fetch(`/api/v1/analytics/dashboard?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()
      setMetrics(data.data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`
    const days = Math.floor(hours / 24)
    const hrs = Math.round(hours % 24)
    return `${days}d ${hrs}h`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Activity className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (!metrics) {
    return <div className="text-center py-12 text-gray-500">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
          {timeRange === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.summary.totalTickets}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.summary.openTickets}</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMinutes(metrics.summary.averageResponseTime)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg CSAT</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.summary.averageCSAT.toFixed(1)}/5
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Additional Summary Cards - NPS and SLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">NPS Score</h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.nps.score}</p>
              <p className="text-sm text-gray-500">/ 100</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
              <div>
                <span className="font-medium text-green-600">{metrics.nps.promoters}</span> Promoters
              </div>
              <div>
                <span className="font-medium text-yellow-600">{metrics.nps.passives}</span> Passives
              </div>
              <div>
                <span className="font-medium text-red-600">{metrics.nps.detractors}</span> Detractors
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{metrics.nps.count} total responses</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">SLA Compliance</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.sla.complianceRate.toFixed(1)}%</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
              <div>
                <span className="font-medium text-green-600">{metrics.sla.compliantTickets}</span> Compliant
              </div>
              <div>
                <span className="font-medium text-orange-600">{metrics.sla.warningTickets}</span> Warnings
              </div>
              <div>
                <span className="font-medium text-red-600">{metrics.sla.breachedTickets}</span> Breached
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="text-gray-500">First Response:</span>
                <span className="ml-1 font-medium">{metrics.sla.firstResponseCompliance.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-500">Resolution:</span>
                <span className="ml-1 font-medium">{metrics.sla.resolutionCompliance.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Ticket Volume by Channel */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Channel</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(metrics.ticketVolume.byChannel).map(([channel, count]) => {
            const Icon = CHANNEL_ICONS[channel as keyof typeof CHANNEL_ICONS] || BarChart3
            return (
              <div key={channel} className="text-center">
                <Icon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{channel}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Response Time & Resolution Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average</span>
              <span className="text-lg font-semibold">
                {formatMinutes(metrics.responseTime.average)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Median</span>
              <span className="text-lg font-semibold">
                {formatMinutes(metrics.responseTime.median)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">95th Percentile</span>
              <span className="text-lg font-semibold">
                {formatMinutes(metrics.responseTime.p95)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution Time</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average</span>
              <span className="text-lg font-semibold">
                {formatHours(metrics.resolutionTime.average)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Median</span>
              <span className="text-lg font-semibold">
                {formatHours(metrics.resolutionTime.median)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">95th Percentile</span>
              <span className="text-lg font-semibold">
                {formatHours(metrics.resolutionTime.p95)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* CSAT & NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Satisfaction ({metrics.csat.count} responses)
          </h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = metrics.csat.distribution[rating.toString()] || 0
              const percentage = metrics.csat.count > 0 ? (count / metrics.csat.count) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-20">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{rating}</span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Net Promoter Score ({metrics.nps.count} responses)
          </h2>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{metrics.nps.score}</div>
              <p className="text-sm text-gray-500">NPS Score (-100 to 100)</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Promoters (9-10)</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-[200px]">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${metrics.nps.count > 0 ? (metrics.nps.promoters / metrics.nps.count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-600 w-12 text-right">{metrics.nps.promoters}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Passives (7-8)</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-[200px]">
                    <div
                      className="bg-yellow-500 h-full rounded-full"
                      style={{ width: `${metrics.nps.count > 0 ? (metrics.nps.passives / metrics.nps.count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-yellow-600 w-12 text-right">{metrics.nps.passives}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Detractors (0-6)</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-[200px]">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${metrics.nps.count > 0 ? (metrics.nps.detractors / metrics.nps.count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-red-600 w-12 text-right">{metrics.nps.detractors}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SLA Compliance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Overall Compliance</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.sla.complianceRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">
              {metrics.sla.compliantTickets} of {metrics.sla.totalTickets} tickets
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">First Response SLA</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.sla.firstResponseCompliance.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Response time compliance</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Resolution SLA</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.sla.resolutionCompliance.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Resolution time compliance</div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Compliant: <span className="font-medium text-gray-900">{metrics.sla.compliantTickets}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Warnings: <span className="font-medium text-gray-900">{metrics.sla.warningTickets}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Breached: <span className="font-medium text-gray-900">{metrics.sla.breachedTickets}</span></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Agent Performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Agent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Assigned</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Resolved</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Avg Response</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Avg Resolution</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CSAT</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">FCR</th>
              </tr>
            </thead>
            <tbody>
              {metrics.agentPerformance.map((agent) => (
                <tr key={agent.agentId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {agent.agentName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {agent.ticketsAssigned}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {agent.ticketsResolved}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {formatMinutes(agent.averageResponseTime)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {formatHours(agent.averageResolutionTime)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <Badge className={agent.csatScore >= 4 ? 'bg-green-100 text-green-800' : ''}>
                      {agent.csatScore.toFixed(1)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {agent.firstContactResolution.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
