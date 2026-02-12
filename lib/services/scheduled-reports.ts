import { createServerSupabase } from '@/lib/db/supabase'
import { ReportGeneratorService, ReportTemplate, ScheduleConfig } from './report-generator'

export interface ScheduledReportExecution {
  execution_id: string
  template_id: string
  tenant_id: string
  scheduled_at: string
  executed_at?: string
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  report_id?: string
  error_message?: string
  retry_count: number
  next_retry_at?: string
}

export class ScheduledReportsService {
  /**
   * Get all scheduled report templates for a tenant
   */
  static async getScheduledTemplates(tenantId: string): Promise<ReportTemplate[]> {
    const supabase = createServerSupabase()
    const { data: templates, error } = await supabase
      .from('cs_report_templates')
      .select('*')
      .eq('is_active', true)
      .in('schedule_type', ['daily', 'weekly', 'monthly'])
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)

    if (error) {
      throw error
    }

    return (templates || []).map((t) => ({
      template_id: t.template_id,
      template_name: t.template_name,
      template_type: t.template_type,
      description: t.description,
      report_config: t.report_config,
      schedule_type: t.schedule_type,
      schedule_config: t.schedule_config,
      is_active: t.is_active,
      is_default: t.is_default,
    }))
  }

  /**
   * Get pending scheduled executions
   */
  static async getPendingExecutions(limit: number = 100): Promise<ScheduledReportExecution[]> {
    const supabase = createServerSupabase()
    const now = new Date().toISOString()

    const { data: executions, error } = await supabase
      .from('cs_scheduled_report_executions')
      .select('*')
      .eq('execution_status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw error
    }

    return (executions || []).map((e) => ({
      execution_id: e.execution_id,
      template_id: e.template_id,
      tenant_id: e.tenant_id,
      scheduled_at: e.scheduled_at,
      executed_at: e.executed_at,
      execution_status: e.execution_status,
      report_id: e.report_id,
      error_message: e.error_message,
      retry_count: e.retry_count || 0,
      next_retry_at: e.next_retry_at,
    }))
  }

  /**
   * Execute a scheduled report
   */
  static async executeScheduledReport(executionId: string): Promise<void> {
    const supabase = createServerSupabase()

    // Get execution
    const { data: execution, error: execError } = await supabase
      .from('cs_scheduled_report_executions')
      .select('*, cs_report_templates(*)')
      .eq('execution_id', executionId)
      .single()

    if (execError || !execution) {
      throw new Error(`Execution not found: ${executionId}`)
    }

    if (execution.execution_status !== 'pending') {
      return // Already executed or skipped
    }

    // Update status to running
    await supabase
      .from('cs_scheduled_report_executions')
      .update({
        execution_status: 'running',
        executed_at: new Date().toISOString(),
      })
      .eq('execution_id', executionId)

    try {
      const template = execution.cs_report_templates as any

      // Calculate period based on schedule type
      const period = this.calculatePeriod(template.schedule_type)

      // Generate report
      const report = await ReportGeneratorService.generateReport(
        template.template_id,
        execution.tenant_id,
        period.start,
        period.end
      )

      // Update execution with success
      await supabase
        .from('cs_scheduled_report_executions')
        .update({
          execution_status: 'completed',
          report_id: report.report_id,
        })
        .eq('execution_id', executionId)

      // Schedule next execution
      await this.scheduleNextExecution(template, execution.tenant_id)
    } catch (error: any) {
      // Update execution with failure
      const retryCount = (execution.retry_count || 0) + 1
      const maxRetries = 3

      if (retryCount < maxRetries) {
        // Schedule retry (exponential backoff: 1h, 2h, 4h)
        const retryDelay = Math.pow(2, retryCount - 1) * 60 * 60 * 1000 // hours to ms
        const nextRetry = new Date(Date.now() + retryDelay)

        await supabase
          .from('cs_scheduled_report_executions')
          .update({
            execution_status: 'pending',
            error_message: error.message,
            retry_count: retryCount,
            next_retry_at: nextRetry.toISOString(),
          })
          .eq('execution_id', executionId)
      } else {
        // Max retries reached, mark as failed
        await supabase
          .from('cs_scheduled_report_executions')
          .update({
            execution_status: 'failed',
            error_message: error.message,
            retry_count: retryCount,
          })
          .eq('execution_id', executionId)
      }

      throw error
    }
  }

  /**
   * Schedule next execution for a template
   */
  private static async scheduleNextExecution(
    template: any,
    tenantId: string
  ): Promise<void> {
    const scheduleConfig: ScheduleConfig = template.schedule_config || {}
    const nextScheduled = this.calculateNextScheduledTime(
      template.schedule_type,
      scheduleConfig
    )

    const supabase = createServerSupabase()
    await supabase.from('cs_scheduled_report_executions').insert({
      template_id: template.template_id,
      tenant_id: tenantId,
      scheduled_at: nextScheduled.toISOString(),
      execution_status: 'pending',
    })
  }

  /**
   * Calculate period based on schedule type
   */
  private static calculatePeriod(
    scheduleType: string
  ): { start: string; end: string } {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (scheduleType) {
      case 'daily':
        start = new Date(now)
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break

      case 'weekly':
        start = new Date(now)
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break

      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break

      default:
        // Default to last 30 days
        start = new Date(now)
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  /**
   * Calculate next scheduled time
   */
  private static calculateNextScheduledTime(
    scheduleType: string,
    config: ScheduleConfig
  ): Date {
    const now = new Date()
    const next = new Date(now)

    // Parse time from config (HH:MM format)
    const [hours, minutes] = (config.time || '09:00').split(':').map(Number)

    switch (scheduleType) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        next.setHours(hours, minutes, 0, 0)
        break

      case 'weekly':
        const dayOfWeek = config.day_of_week ?? 1 // Monday
        const currentDay = next.getDay()
        const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7
        next.setDate(next.getDate() + daysUntilNext)
        next.setHours(hours, minutes, 0, 0)
        break

      case 'monthly':
        const dayOfMonth = config.day_of_month ?? 1
        next.setMonth(next.getMonth() + 1)
        next.setDate(dayOfMonth)
        next.setHours(hours, minutes, 0, 0)
        break

      default:
        // Default to tomorrow at 9 AM
        next.setDate(next.getDate() + 1)
        next.setHours(9, 0, 0, 0)
    }

    return next
  }

  /**
   * Initialize scheduled reports for a tenant
   * Creates initial scheduled executions for all active templates
   */
  static async initializeScheduledReports(tenantId: string): Promise<void> {
    const templates = await this.getScheduledTemplates(tenantId)

    for (const template of templates) {
      const scheduleConfig: ScheduleConfig = template.schedule_config || {}
      const nextScheduled = this.calculateNextScheduledTime(
        template.schedule_type!,
        scheduleConfig
      )

      const supabase = createServerSupabase()

      // Check if execution already exists
      const { data: existing } = await supabase
        .from('cs_scheduled_report_executions')
        .select('execution_id')
        .eq('template_id', template.template_id)
        .eq('tenant_id', tenantId)
        .eq('execution_status', 'pending')
        .single()

      if (!existing) {
        await supabase.from('cs_scheduled_report_executions').insert({
          template_id: template.template_id,
          tenant_id: tenantId,
          scheduled_at: nextScheduled.toISOString(),
          execution_status: 'pending',
        })
      }
    }
  }

  /**
   * Get execution history for a template
   */
  static async getExecutionHistory(
    templateId: string,
    tenantId: string,
    limit: number = 50
  ): Promise<ScheduledReportExecution[]> {
    const supabase = createServerSupabase()
    const { data: executions, error } = await supabase
      .from('cs_scheduled_report_executions')
      .select('*')
      .eq('template_id', templateId)
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (executions || []).map((e) => ({
      execution_id: e.execution_id,
      template_id: e.template_id,
      tenant_id: e.tenant_id,
      scheduled_at: e.scheduled_at,
      executed_at: e.executed_at,
      execution_status: e.execution_status,
      report_id: e.report_id,
      error_message: e.error_message,
      retry_count: e.retry_count || 0,
      next_retry_at: e.next_retry_at,
    }))
  }
}
