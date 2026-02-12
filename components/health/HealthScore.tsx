'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  RefreshCw,
  Activity,
  Loader2,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'

interface HealthScore {
  health_id: string
  tenant_id: string
  customer_email: string
  health_score: number
  health_level: 'healthy' | 'at_risk' | 'critical' | 'churned'
  engagement_score: number
  usage_score: number
  support_score: number
  billing_score: number
  product_fit_score: number
  churn_risk: number
  expansion_probability: number
  renewal_probability: number
  score_trend: 'improving' | 'stable' | 'declining' | null
  recommended_actions: Array<{
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }>
  calculated_at: string
  updated_at: string
}

interface HealthScoreProps {
  tenantId: string
  customerEmail: string
  onRefresh?: () => void
}

export function HealthScore({ tenantId, customerEmail, onRefresh }: HealthScoreProps) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchHealthScore()
  }, [tenantId, customerEmail])

  const fetchHealthScore = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        tenant_id: tenantId,
        customer_email: customerEmail,
      })
      const response = await fetch(`/api/v1/health/score?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch health score')
      
      const result = await response.json()
      setHealthScore(result.data)
    } catch (error) {
      console.error('Error fetching health score:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    try {
      setCalculating(true)
      const response = await fetch('/api/v1/health/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, customerEmail }),
      })
      
      if (!response.ok) throw new Error('Failed to calculate health score')
      
      await fetchHealthScore()
      onRefresh?.()
    } catch (error) {
      console.error('Error calculating health score:', error)
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <div>Loading health score...</div>
        </div>
      </Card>
    )
  }

  if (!healthScore) {
    return (
      <Card className="p-4">
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No Health Score</h3>
          <p className="text-sm text-gray-600 mb-4">
            Calculate health score to get insights into customer health
          </p>
          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="touch-manipulation min-h-[44px]"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Calculate Health Score
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  const healthColor =
    healthScore.health_level === 'healthy'
      ? 'bg-green-100 text-green-800 border-green-200'
      : healthScore.health_level === 'at_risk'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : healthScore.health_level === 'critical'
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-gray-100 text-gray-800 border-gray-200'

  const trendIcon =
    healthScore.score_trend === 'improving' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : healthScore.score_trend === 'declining' ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <Minus className="h-4 w-4 text-gray-600" />
    )

  const trendColor =
    healthScore.score_trend === 'improving'
      ? 'text-green-600'
      : healthScore.score_trend === 'declining'
      ? 'text-red-600'
      : 'text-gray-600'

  return (
    <Card className="p-4 lg:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customer Health Score</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCalculate}
              disabled={calculating}
              className="touch-manipulation"
            >
              {calculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600 mb-1">Overall Health Score</div>
            <div className="text-3xl font-bold text-gray-900">{healthScore.health_score}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={healthColor}>{healthScore.health_level.replace('_', ' ')}</Badge>
              {healthScore.score_trend && (
                <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                  {trendIcon}
                  <span className="capitalize">{healthScore.score_trend}</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(healthScore.health_score / 100) * 251.2} 251.2`}
                className={
                  healthScore.health_level === 'healthy'
                    ? 'text-green-600'
                    : healthScore.health_level === 'at_risk'
                    ? 'text-yellow-600'
                    : healthScore.health_level === 'critical'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }
              />
            </svg>
          </div>
        </div>

        {/* ML Predictions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs text-red-700 mb-1">Churn Risk</div>
            <div className="text-xl font-bold text-red-900">{Math.round(healthScore.churn_risk)}%</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Expansion</div>
            <div className="text-xl font-bold text-blue-900">
              {Math.round(healthScore.expansion_probability)}%
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs text-green-700 mb-1">Renewal</div>
            <div className="text-xl font-bold text-green-900">
              {Math.round(healthScore.renewal_probability)}%
            </div>
          </div>
        </div>

        {/* Component Scores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Engagement</span>
            <span className="font-semibold">{healthScore.engagement_score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.engagement_score}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usage</span>
            <span className="font-semibold">{healthScore.usage_score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.usage_score}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Support</span>
            <span className="font-semibold">{healthScore.support_score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.support_score}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Billing</span>
            <span className="font-semibold">{healthScore.billing_score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.billing_score}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Product Fit</span>
            <span className="font-semibold">{healthScore.product_fit_score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.product_fit_score}%` }}
            />
          </div>
        </div>

        {/* Recommended Actions */}
        {healthScore.recommended_actions && healthScore.recommended_actions.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-gray-500" />
              <h4 className="font-semibold text-gray-900">Recommended Actions</h4>
            </div>
            <div className="space-y-2">
              {healthScore.recommended_actions.map((action, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    action.priority === 'urgent'
                      ? 'bg-red-50 border-red-200'
                      : action.priority === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : action.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {action.title}
                      </div>
                      <div className="text-xs text-gray-600">{action.message}</div>
                    </div>
                    <Badge
                      className={
                        action.priority === 'urgent'
                          ? 'bg-red-600'
                          : action.priority === 'high'
                          ? 'bg-orange-600'
                          : action.priority === 'medium'
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                      }
                    >
                      {action.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Calculated */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          Last calculated: {new Date(healthScore.calculated_at).toLocaleString()}
        </div>
      </div>
    </Card>
  )
}
