/**
 * Health Score Distribution Chart
 * 
 * Shows distribution of health scores across customers
 */

'use client'

import { Card } from '@/components/shared/Card'

interface HealthScoreDistributionProps {
  scores: Array<{ range: string; count: number; color: string }>
}

export function HealthScoreDistribution({ scores }: HealthScoreDistributionProps) {
  const maxCount = Math.max(...scores.map((s) => s.count), 1)

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Health Score Distribution</h3>
      <div className="space-y-3">
        {scores.map((score, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{score.range}</span>
              <span className="font-medium text-gray-900">{score.count} customers</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(score.count / maxCount) * 100}%`,
                  backgroundColor: score.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
