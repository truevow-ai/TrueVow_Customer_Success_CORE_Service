/**
 * Progress Chart Component
 * 
 * Simple CSS-based bar chart for progress visualization
 */

'use client'

interface ProgressChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  title?: string
}

export function ProgressChart({ data, title }: ProgressChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-semibold text-gray-900">{title}</h4>}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#3b82f6',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
