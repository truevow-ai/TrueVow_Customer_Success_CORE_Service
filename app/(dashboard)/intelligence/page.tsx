'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, TrendingDown,
  Phone, RefreshCw, ChevronDown, ChevronUp, Loader2,
  Activity, Users, Zap, Target
} from 'lucide-react'

interface Recommendation {
  recommendation_id: string
  tenant_id:         string
  insight_type:      'slow_response' | 'ignored_lead' | 'disengaged_firm' | 'high_value_lead'
  action_type:       'call_lead' | 'cs_call_firm' | 'review_case'
  target_object_id:  string | null
  message:           string
  issued_at:         string
  expires_at:        string | null
  status:            string
}

interface Metrics {
  engagement_score:    number
  lead_handling_rate:  number | null
  pattern_alerts:      { abandonment_sessions: number; ignored_lead_sessions: number }
  total_events:        number
}

interface FirmRow {
  tenant_id:       string
  firm_name:       string
  score:           number
  health_level:    'healthy' | 'needs_attention' | 'at_risk'
  open_recs:       number
  recommendations: Recommendation[]
  metrics:         Metrics | null
}

const INSIGHT_LABELS: Record<string, string> = {
  slow_response:   'Slow Response',
  ignored_lead:    'Ignored Lead',
  disengaged_firm: 'Disengaged',
  high_value_lead: 'High Value Case',
}

function healthColor(level: string) {
  if (level === 'healthy')          return 'text-green-600 bg-green-50 border-green-200'
  if (level === 'needs_attention')  return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function healthLabel(level: string) {
  if (level === 'healthy')          return 'Healthy'
  if (level === 'needs_attention')  return 'Needs Attention'
  return 'At Risk'
}

function scoreToHealth(score: number): FirmRow['health_level'] {
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'needs_attention'
  return 'at_risk'
}

function minutesAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

function RecCard({
  rec, onMarkDone, onMarkIgnored,
}: {
  rec: Recommendation
  onMarkDone: (id: string) => void
  onMarkIgnored: (id: string) => void
}) {
  const [submitting, setSubmitting] = useState(false)

  async function handleAct(acted: boolean) {
    setSubmitting(true)
    try {
      await fetch(`/api/intelligence/recommendations/${rec.recommendation_id}/acted`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_taken: acted, success_flag: acted }),
      })
      acted ? onMarkDone(rec.recommendation_id) : onMarkIgnored(rec.recommendation_id)
    } finally { setSubmitting(false) }
  }

  const iconMap: Record<string, string> = {
    slow_response: '⏱', ignored_lead: '⚠', disengaged_firm: '📉', high_value_lead: '⚡',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-lg">{iconMap[rec.insight_type] || '•'}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {INSIGHT_LABELS[rec.insight_type]}
            </span>
            <span className="text-xs text-gray-400">{minutesAgo(rec.issued_at)}</span>
          </div>
          <p className="mt-1 text-sm text-gray-800 leading-snug">{rec.message}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void handleAct(true)} disabled={submitting}
          className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
          {submitting ? '...' : '✓ Mark as Done'}
        </button>
        <button onClick={() => void handleAct(false)} disabled={submitting}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  const [firms, setFirms]       = useState<FirmRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadFirms = useCallback(async () => {
    setLoading(true)
    try {
      const tenantsRes = await fetch('/api/tenants')
      if (!tenantsRes.ok) throw new Error('tenants fetch failed')
      const td = await tenantsRes.json()
      const tenants: Array<{ id: string; name: string }> = td.tenants || td || []

      const rows = await Promise.all(
        tenants.slice(0, 50).map(async (t) => {
          try {
            await fetch('/api/intelligence/recommendations', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenant_id: t.id }),
            })
            const recRes  = await fetch(`/api/intelligence/recommendations?tenant_id=${t.id}&status=issued&limit=10`)
            const recData = recRes.ok ? await recRes.json() : { recommendations: [] }
            const metRes  = await fetch(`/api/intelligence/metrics?tenant_id=${t.id}&days=7`)
            const metData: Metrics | null = metRes.ok ? await metRes.json() : null
            const score       = metData ? Math.min(100, Math.round(metData.engagement_score)) : 0
            const openRecs: Recommendation[] = recData.recommendations || []
            return { tenant_id: t.id, firm_name: t.name, score,
              health_level: scoreToHealth(score), open_recs: openRecs.length,
              recommendations: openRecs, metrics: metData } satisfies FirmRow
          } catch {
            return { tenant_id: t.id, firm_name: t.name, score: 0,
              health_level: 'at_risk' as const, open_recs: 0, recommendations: [], metrics: null } satisfies FirmRow
          }
        })
      )

      rows.sort((a, b) => {
        const o = { at_risk: 0, needs_attention: 1, healthy: 2 }
        return o[a.health_level] - o[b.health_level]
      })
      setFirms(rows)
    } catch (err) { console.error('intelligence load', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadFirms() }, [loadFirms])

  function dismissRec(firmId: string, recId: string) {
    setFirms(prev => prev.map(f => {
      if (f.tenant_id !== firmId) return f
      const filtered = f.recommendations.filter(r => r.recommendation_id !== recId)
      return { ...f, recommendations: filtered, open_recs: filtered.length }
    }))
  }

  const totalFirms    = firms.length
  const healthyFirms  = firms.filter(f => f.health_level === 'healthy').length
  const attentionFirms = firms.filter(f => f.health_level === 'needs_attention').length
  const atRiskFirms   = firms.filter(f => f.health_level === 'at_risk').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your daily firm health briefing — act on red flags</p>
        </div>
        <button onClick={() => { setRefreshing(true); void loadFirms().finally(() => setRefreshing(false)) }}
          disabled={loading || refreshing}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Firms',     value: totalFirms,     color: 'text-gray-900' },
          { label: 'Healthy',         value: healthyFirms,   color: 'text-green-700' },
          { label: 'Needs Attention', value: attentionFirms, color: 'text-amber-700' },
          { label: 'At Risk',         value: atRiskFirms,    color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{loading ? '–' : s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : firms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-400">No firms in portfolio.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Firm', 'Score', 'Status', 'Open Recommendations', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firms.map(firm => (
                <>
                  <tr key={firm.tenant_id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === firm.tenant_id ? null : firm.tenant_id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{firm.firm_name}</td>
                    <td className="px-4 py-3"><span className="font-bold">{firm.score}</span><span className="text-gray-400 text-xs"> /100</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${healthColor(firm.health_level)}`}>
                        {healthLabel(firm.health_level)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {firm.open_recs === 0
                        ? <span className="text-gray-400 text-xs">None</span>
                        : <span className={`font-semibold ${firm.open_recs >= 3 ? 'text-red-600' : 'text-amber-600'}`}>{firm.open_recs} action{firm.open_recs > 1 ? 's' : ''}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {expanded === firm.tenant_id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                  </tr>
                  {expanded === firm.tenant_id && (
                    <tr key={`${firm.tenant_id}-ex`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-3">
                          {firm.metrics && (
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-3 border-b border-gray-200">
                              <span>Engagement: <strong className="text-gray-800">{firm.metrics.engagement_score}</strong></span>
                              {firm.metrics.lead_handling_rate !== null && (
                                <span>Lead handling: <strong className="text-gray-800">{firm.metrics.lead_handling_rate}%</strong></span>
                              )}
                              <span>Events (7d): <strong className="text-gray-800">{firm.metrics.total_events}</strong></span>
                            </div>
                          )}
                          {firm.recommendations.length === 0 ? (
                            <p className="text-sm text-gray-400 py-2">No open recommendations.</p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {firm.recommendations.map(rec => (
                                <RecCard key={rec.recommendation_id} rec={rec}
                                  onMarkDone={(id) => dismissRec(firm.tenant_id, id)}
                                  onMarkIgnored={(id) => dismissRec(firm.tenant_id, id)} />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
