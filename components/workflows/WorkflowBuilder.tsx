/**
 * Workflow Builder Component
 * 
 * Visual "If... Then..." workflow builder
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Form, FormField, FormLabel } from '@/components/shared/Form'
import { Plus, Trash2, Save, Play } from 'lucide-react'

interface WorkflowCondition {
  field: string
  operator: string
  value: string
  logic?: 'AND' | 'OR'
}

interface WorkflowAction {
  type: string
  params: Record<string, any>
}

interface WorkflowBuilderProps {
  workflowId?: string
  onSave?: (workflow: any) => void
}

export function WorkflowBuilder({ workflowId, onSave }: WorkflowBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contextType, setContextType] = useState('cs')
  const [triggerType, setTriggerType] = useState('automatic')
  const [conditions, setConditions] = useState<WorkflowCondition[]>([
    { field: 'status', operator: 'equals', value: '', logic: 'AND' },
  ])
  const [actions, setActions] = useState<WorkflowAction[]>([
    { type: 'assign', params: {} },
  ])

  const addCondition = () => {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: '', logic: 'AND' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], ...updates }
    setConditions(updated)
  }

  const addAction = () => {
    setActions([...actions, { type: 'assign', params: {} }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], ...updates }
    setActions(updated)
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/v1/workflows', {
        method: workflowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          name,
          description,
          context_type: contextType,
          trigger_type: triggerType,
          conditions,
          actions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSave?.(data.data)
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <Form>
          <FormField>
            <FormLabel>Workflow Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Auto-assign VIP customers"
            />
          </FormField>
          <FormField>
            <FormLabel>Description</FormLabel>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Context</FormLabel>
              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="cs">Customer Support</option>
                <option value="sales">Sales</option>
                <option value="ops">Operations</option>
                <option value="management">Management</option>
                <option value="all">All Contexts</option>
              </select>
            </FormField>
            <FormField>
              <FormLabel>Trigger Type</FormLabel>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </FormField>
          </div>
        </Form>
      </Card>

      {/* Conditions (If...) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">If...</h3>
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, { field: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="subject">Subject</option>
                <option value="status">Status</option>
                <option value="assigned_to">Assigned To</option>
                <option value="channel">Channel</option>
                <option value="tag">Tag</option>
                <option value="priority">Priority</option>
              </select>
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, { operator: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="equals">is</option>
                <option value="contains">contains</option>
                <option value="starts_with">starts with</option>
                <option value="ends_with">ends with</option>
                <option value="is_empty">is empty</option>
                <option value="is_not_empty">is not empty</option>
              </select>
              <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                placeholder="Value"
                className="flex-1"
              />
              {index < conditions.length - 1 && (
                <select
                  value={condition.logic || 'AND'}
                  onChange={(e) => updateCondition(index, { logic: e.target.value as 'AND' | 'OR' })}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCondition(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions (Then...) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Then...</h3>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        </div>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <select
                value={action.type}
                onChange={(e) => updateAction(index, { type: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="assign">Assign to</option>
                <option value="tag">Add tag</option>
                <option value="status">Change status</option>
                <option value="reply">Send reply</option>
                <option value="note">Add note</option>
                <option value="close">Close conversation</option>
                <option value="escalate">Escalate</option>
                <option value="notify">Send notification</option>
              </select>
              <Input
                value={action.params.value || ''}
                onChange={(e) => updateAction(index, { params: { ...action.params, value: e.target.value } })}
                placeholder="Action parameter"
                className="flex-1"
              />
              {index < actions.length - 1 && (
                <span className="text-sm text-gray-500 px-2">AND</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAction(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save Workflow
        </Button>
        <Button onClick={handleSave}>
          <Play className="h-4 w-4 mr-1" />
          Save & Test
        </Button>
      </div>
    </div>
  )
}
