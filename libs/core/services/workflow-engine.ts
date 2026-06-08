/**
 * Workflow Engine
 * 
 * Executes workflows (automatic/manual) with condition evaluation and action execution
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'

export interface WorkflowCondition {
  field: string // e.g., 'subject', 'status', 'tag', 'assigned_to'
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than'
  value: any
  logic?: 'AND' | 'OR' // For combining with next condition
}

export interface WorkflowAction {
  type: 'assign' | 'tag' | 'status' | 'reply' | 'note' | 'close' | 'escalate' | 'notify'
  params: Record<string, any> // Action-specific parameters
}

export interface WorkflowExecution {
  execution_id: string
  workflow_id: string
  conversation_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggered_by: string | null
  triggered_at: string
  completed_at: string | null
  error_message: string | null
  execution_log: Array<{ step: string; result: any; timestamp: string }>
}

export class WorkflowEngine {
  /**
   * Execute automatic workflow (triggered by system events)
   */
  static async executeAutomatic(
    conversationId: string,
    trigger: 'conversation_created' | 'message_received' | 'status_changed' | 'tag_added'
  ): Promise<WorkflowExecution | null> {
    const supabase = await createServerSupabase()

    // Get active automatic workflows for this context
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return null
    }

    // Get workflows that match this trigger and context
    const { data: workflows, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('trigger_type', 'automatic')
      .eq('is_active', true)
      .or(`context_type.eq.all,context_type.eq.${this.getContextType(conversation)}`)

    if (error || !workflows || workflows.length === 0) {
      return null
    }

    // Try each workflow until one matches
    for (const workflow of workflows) {
      const conditions = workflow.conditions as WorkflowCondition[]
      const actions = workflow.actions as WorkflowAction[]

      // Evaluate conditions
      const matches = await this.evaluateConditions(conditions, conversationId)
      if (matches) {
        // Execute workflow
        return await this.executeWorkflow(workflow.workflow_id, conversationId, 'system', actions)
      }
    }

    return null
  }

  /**
   * Execute manual workflow (triggered by user)
   */
  static async executeManual(
    workflowId: string,
    conversationId: string,
    userId: string
  ): Promise<WorkflowExecution> {
    const supabase = await createServerSupabase()

    // Get workflow
    const { data: workflow, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('workflow_id', workflowId)
      .single()

    if (error || !workflow) {
      throw new Error('Workflow not found')
    }

    if (!workflow.is_active) {
      throw new Error('Workflow is not active')
    }

    const actions = workflow.actions as WorkflowAction[]
    return await this.executeWorkflow(workflowId, conversationId, userId, actions)
  }

  /**
   * Execute workflow actions
   */
  private static async executeWorkflow(
    workflowId: string,
    conversationId: string,
    triggeredBy: string,
    actions: WorkflowAction[]
  ): Promise<WorkflowExecution> {
    const supabase = await createServerSupabase()

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        conversation_id: conversationId,
        status: 'running',
        triggered_by: triggeredBy,
        execution_log: [],
      })
      .select()
      .single()

    if (execError || !execution) {
      throw new Error('Failed to create workflow execution')
    }

    const executionLog: Array<{ step: string; result: any; timestamp: string }> = []

    try {
      // Execute each action sequentially
      for (const action of actions) {
        const stepName = `Execute ${action.type}`
        const timestamp = new Date().toISOString()

        try {
          const result = await this.executeAction(action, conversationId)
          executionLog.push({
            step: stepName,
            result: { success: true, ...result },
            timestamp,
          })
        } catch (error: any) {
          executionLog.push({
            step: stepName,
            result: { success: false, error: error.message },
            timestamp,
          })
          // Continue with next action even if one fails
        }
      }

      // Update execution as completed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_log: executionLog,
        })
        .eq('execution_id', execution.execution_id)

      return {
        ...execution,
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_log: executionLog,
      }
    } catch (error: any) {
      // Mark as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          execution_log: executionLog,
        })
        .eq('execution_id', execution.execution_id)

      return {
        ...execution,
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        execution_log: executionLog,
      }
    }
  }

  /**
   * Evaluate workflow conditions
   */
  static async evaluateConditions(
    conditions: WorkflowCondition[],
    conversationId: string
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true // No conditions = always match
    }

    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return false
    }

    // Check if there's a ticket linked via metadata
    const ticketId = conversation.metadata?.ticket_id
    const ticket = ticketId
      ? await TicketRepository.findById(ticketId)
      : null

    let result = true
    let lastLogic: 'AND' | 'OR' = 'AND'

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const conditionResult = await this.evaluateCondition(condition, conversation, ticket)

      if (i === 0) {
        result = conditionResult
      } else {
        if (lastLogic === 'AND') {
          result = result && conditionResult
        } else {
          result = result || conditionResult
        }
      }

      lastLogic = condition.logic || 'AND'
    }

    return result
  }

  /**
   * Evaluate single condition
   */
  private static async evaluateCondition(
    condition: WorkflowCondition,
    conversation: any,
    ticket: any
  ): Promise<boolean> {
    let fieldValue: any

    // Get field value based on condition.field
    switch (condition.field) {
      case 'subject':
        fieldValue = ticket?.subject || ''
        break
      case 'status':
        fieldValue = conversation.status || ticket?.status || ''
        break
      case 'assigned_to':
        fieldValue = conversation.assigned_to || ticket?.assigned_to || ''
        break
      case 'channel':
        fieldValue = conversation.channel || ''
        break
      case 'tag':
        fieldValue = conversation.tags || []
        break
      case 'priority':
        fieldValue = ticket?.priority || ''
        break
      default:
        // Try metadata
        fieldValue = conversation.metadata?.[condition.field] || ticket?.metadata?.[condition.field] || ''
    }

    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase()
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase())
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase())
      case 'is_empty':
        return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'is_not_empty':
        return !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      default:
        return false
    }
  }

  /**
   * Execute workflow action
   */
  private static async executeAction(
    action: WorkflowAction,
    conversationId: string
  ): Promise<Record<string, any>> {
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    switch (action.type) {
      case 'assign':
        await ConversationRepository.update(conversationId, {
          assigned_to: action.params.team_member_id,
        })
        return { assigned_to: action.params.team_member_id }

      case 'tag':
        // Tags are stored in metadata
        const currentTags: string[] = conversation.metadata?.tags || []
        const newTags = action.params.add || []
        const removeTags = action.params.remove || []
        const updatedTags = [
          ...currentTags.filter((t: string) => !removeTags.includes(t)),
          ...newTags.filter((t: string) => !currentTags.includes(t)),
        ]
        await ConversationRepository.update(conversationId, {
          metadata: {
            ...conversation.metadata,
            tags: updatedTags,
          },
        })
        return { tags: updatedTags }

      case 'status':
        await ConversationRepository.update(conversationId, {
          status: action.params.status,
        })
        return { status: action.params.status }

      case 'reply':
        // Create message
        await MessageRepository.create({
          ticket_id: conversation.metadata?.ticket_id,
          from_type: 'agent',
          from_user_id: action.params.agent_id,
          sender_id: action.params.agent_id,
          sender_type: 'agent',
          body: action.params.body,
          is_internal: false,
          attachments: [],
        })
        return { message_sent: true }

      case 'note':
        // Create internal note
        await MessageRepository.create({
          ticket_id: conversation.metadata?.ticket_id,
          from_type: 'agent',
          from_user_id: action.params.agent_id,
          sender_id: action.params.agent_id,
          sender_type: 'agent',
          body: action.params.body,
          is_internal: true,
          attachments: [],
        })
        return { note_created: true }

      case 'close':
        await ConversationRepository.update(conversationId, {
          status: 'closed',
        })
        if (conversation.metadata?.ticket_id) {
          await TicketRepository.update(conversation.metadata?.ticket_id, {
            status: 'closed',
            resolved_at: new Date().toISOString(),
          })
        }
        return { closed: true }

      case 'escalate':
        // Update priority or assign to manager
        if (conversation.metadata?.ticket_id) {
          await TicketRepository.update(conversation.metadata?.ticket_id, {
            priority: 'urgent',
            assigned_to: action.params.manager_id,
          })
        }
        return { escalated: true }

      case 'notify':
        // Send notification (integrate with notification service)
        // For now, just log
        console.log('Notification:', action.params)
        return { notification_sent: true }

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Get context type from conversation
   */
  private static getContextType(conversation: any): string {
    // Default to 'cs' for now
    // Can be enhanced to detect based on conversation metadata
    return 'cs'
  }
}
