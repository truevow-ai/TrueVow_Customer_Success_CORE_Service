/**
 * AI Agent Guardrails Configuration UI
 * 
 * Admin UI for configuring guardrails for each AI agent
 * Similar to Vercel's approach - clear rules of engagement
 */

'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, HelpCircle } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { cn } from '@/lib/utils/cn'

interface GuardrailsConfig {
  agent_id: string
  agent_name: string
  can_do: string[]
  cannot_do: string[]
  escalation_criteria: string[]
  tone_guidelines: {
    empathetic: boolean
    professional: boolean
    specific: boolean
    concise: boolean
    avoid_blabber: boolean
  }
  authorized_actions: string[]
  restricted_topics: string[]
  max_response_length?: number
}

export default function AIAgentGuardrailsPage() {
  const { showToast } = useToast()
  const [agents, setAgents] = useState<GuardrailsConfig[]>([])
  const [selectedAgent, setSelectedAgent] = useState<GuardrailsConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/v1/ai-agents/guardrails')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedAgent) return

    setIsLoading(true)
    try {
      const updatedAgents = await optimisticUpdate({
        currentData: agents,
        updateFn: (data) => {
          const index = data.findIndex((a) => a.agent_id === selectedAgent.agent_id)
          if (index >= 0) {
            const updated = [...data]
            updated[index] = selectedAgent
            return updated
          }
          return [...data, selectedAgent]
        },
        apiCall: async () => {
          const response = await fetch('/api/v1/ai-agents/guardrails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedAgent),
          })
          if (!response.ok) throw new Error('Failed to save guardrails')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Guardrails saved',
            description: 'AI agent guardrails have been updated successfully.',
          })
          fetchAgents() // Refresh to get actual data
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to save',
            description: error.message || 'Please try again.',
          })
        },
      })

      setAgents(updatedAgents)
    } catch (error) {
      console.error('Error saving guardrails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">AI Agent Guardrails</h1>
        <p className="text-sm text-foreground-secondary mb-2">
          Configure rules of engagement for AI support agents. Define what agents can and cannot do, escalation criteria, and response guidelines.
        </p>
        <Breadcrumbs
          items={[
            { label: 'Settings', href: '/dashboard/settings' },
            { label: 'AI Agents', href: '/dashboard/settings/ai-agents' },
          ]}
          className="mt-2"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Agents</h2>
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.agent_id}
                  onClick={() => setSelectedAgent(agent)}
                  className={cn(
                    'w-full text-left px-4 py-2 rounded-lg transition-colors',
                    selectedAgent?.agent_id === agent.agent_id
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  {agent.agent_name}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Agent Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <Input
                    value={selectedAgent.agent_name}
                    onChange={(e) => setSelectedAgent({ ...selectedAgent, agent_name: e.target.value })}
                  />
                </div>

                {/* What Agent Can Do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What I Can Do
                  </label>
                  <div className="space-y-2">
                    {selectedAgent.can_do.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newCanDo = [...selectedAgent.can_do]
                            newCanDo[index] = e.target.value
                            setSelectedAgent({ ...selectedAgent, can_do: newCanDo })
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCanDo = selectedAgent.can_do.filter((_, i) => i !== index)
                            setSelectedAgent({ ...selectedAgent, can_do: newCanDo })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent({
                          ...selectedAgent,
                          can_do: [...selectedAgent.can_do, ''],
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* What Agent Cannot Do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What I Cannot Do
                  </label>
                  <div className="space-y-2">
                    {selectedAgent.cannot_do.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newCannotDo = [...selectedAgent.cannot_do]
                            newCannotDo[index] = e.target.value
                            setSelectedAgent({ ...selectedAgent, cannot_do: newCannotDo })
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCannotDo = selectedAgent.cannot_do.filter((_, i) => i !== index)
                            setSelectedAgent({ ...selectedAgent, cannot_do: newCannotDo })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent({
                          ...selectedAgent,
                          cannot_do: [...selectedAgent.cannot_do, ''],
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Escalation Criteria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When Cases Get Escalated
                  </label>
                  <div className="space-y-2">
                    {selectedAgent.escalation_criteria.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newCriteria = [...selectedAgent.escalation_criteria]
                            newCriteria[index] = e.target.value
                            setSelectedAgent({ ...selectedAgent, escalation_criteria: newCriteria })
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCriteria = selectedAgent.escalation_criteria.filter((_, i) => i !== index)
                            setSelectedAgent({ ...selectedAgent, escalation_criteria: newCriteria })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent({
                          ...selectedAgent,
                          escalation_criteria: [...selectedAgent.escalation_criteria, ''],
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Tone Guidelines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone Guidelines
                  </label>
                  <div className="space-y-2">
                    {Object.entries(selectedAgent.tone_guidelines).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setSelectedAgent({
                              ...selectedAgent,
                              tone_guidelines: {
                                ...selectedAgent.tone_guidelines,
                                [key]: e.target.checked,
                              },
                            })
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Guardrails
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select an agent to configure guardrails</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
