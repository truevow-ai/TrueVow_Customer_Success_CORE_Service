/**
 * CSAT/NPS Auto-Survey Service
 * 
 * Automated post-resolution feedback loops:
 * - Automatically sends CSAT/NPS surveys after ticket resolution
 * - Configurable delay (default: 24 hours)
 * - Reminder system (default: 1 reminder after 72 hours)
 * - Multi-channel support (email, SMS, in-app)
 * - Response tracking and follow-up
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'

export interface SurveyTemplate {
  template_id: string
  survey_type: 'csat' | 'nps'
  name: string
  subject: string
  message_text: string
  message_html?: string
  questions: Array<{
    question_id: string
    question_text: string
    question_type: 'rating' | 'text' | 'multiple_choice'
    required: boolean
  }>
  delay_hours: number
  reminder_hours: number
  max_reminders: number
  default_channel: 'email' | 'sms' | 'in_app'
}

export interface SurveyAutomationRule {
  rule_id: string
  name: string
  trigger_on: 'ticket_resolved' | 'ticket_closed' | 'conversation_resolved'
  survey_type: 'csat' | 'nps' | 'both'
  template_id: string
  delay_hours: number
  preferred_channel: 'email' | 'sms' | 'in_app' | 'auto'
  is_active: boolean
}

export class CSATNPSSurveyService {
  /**
   * Process ticket resolution and queue survey
   */
  static async processTicketResolution(ticketId: string): Promise<void> {
    const supabase = createServerSupabase()

    // Get ticket
    const ticket = await TicketRepository.findById(ticketId)
    if (!ticket || !ticket.tenant_id || !ticket.customer_email) {
      return // Cannot send survey without required data
    }

    // Check if survey already sent for this ticket
    const { data: existingCSAT } = await supabase
      .from('cs_survey_csat')
      .select('survey_id')
      .eq('ticket_id', ticketId)
      .single()

    const { data: existingNPS } = await supabase
      .from('cs_survey_nps')
      .select('survey_id')
      .eq('ticket_id', ticketId)
      .single()

    if (existingCSAT || existingNPS) {
      return // Survey already sent
    }

    // Get applicable automation rules
    const rules = await this.getApplicableRules(ticket.tenant_id, ticket)

    if (rules.length === 0) {
      return // No rules configured
    }

    // Process each rule
    for (const rule of rules) {
      await this.queueSurvey(ticket, rule)
    }
  }

  /**
   * Get applicable automation rules for a ticket
   */
  private static async getApplicableRules(
    tenantId: string,
    ticket: any
  ): Promise<SurveyAutomationRule[]> {
    const supabase = createServerSupabase()

    // Get rules (tenant-specific first, then default)
    const { data: tenantRules } = await supabase
      .from('cs_survey_automation_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    const { data: defaultRules } = await supabase
      .from('cs_survey_automation_rules')
      .select('*')
      .eq('tenant_id', null)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    const allRules = [...(tenantRules || []), ...(defaultRules || [])]

    // Filter rules based on conditions
    const applicableRules: SurveyAutomationRule[] = []

    for (const rule of allRules) {
      // Check trigger condition
      if (rule.trigger_on === 'ticket_resolved' && ticket.status !== 'resolved') {
        continue
      }
      if (rule.trigger_on === 'ticket_closed' && ticket.status !== 'closed') {
        continue
      }

      // Check status filter
      if (rule.ticket_status && ticket.status !== rule.ticket_status) {
        continue
      }

      // Check priority filter
      if (rule.ticket_priority && ticket.priority !== rule.ticket_priority) {
        continue
      }

      // Check channel filter
      if (rule.ticket_channel && ticket.channel !== rule.ticket_channel) {
        continue
      }

      // Check resolution time filter
      if (rule.min_resolution_time_minutes && ticket.resolved_at && ticket.created_at) {
        const resolutionTimeMinutes = Math.floor(
          (new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60)
        )
        if (resolutionTimeMinutes < rule.min_resolution_time_minutes) {
          continue
        }
      }

      // Check exclusion rules
      if (rule.exclude_if_resolved_by && ticket.resolved_by === rule.exclude_if_resolved_by) {
        continue
      }

      if (rule.exclude_if_reopened) {
        // Check if ticket was reopened (would need to check history)
        // For now, skip if ticket has been updated multiple times
        // TODO: Check ticket history for reopen events
      }

      applicableRules.push(rule as SurveyAutomationRule)
    }

    return applicableRules
  }

  /**
   * Queue survey for sending
   */
  private static async queueSurvey(
    ticket: any,
    rule: SurveyAutomationRule
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Get template
    const { data: template } = await supabase
      .from('cs_survey_templates')
      .select('*')
      .eq('template_id', rule.template_id)
      .single()

    if (!template) {
      console.error(`Template ${rule.template_id} not found`)
      return
    }

    // Calculate send time
    const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date()
    const sendAt = new Date(resolvedAt.getTime() + rule.delay_hours * 60 * 60 * 1000)

    // Determine channel
    const channel = rule.preferred_channel === 'auto'
      ? this.determineBestChannel(ticket.customer_email)
      : rule.preferred_channel

    // Create survey record
    if (rule.survey_type === 'csat' || rule.survey_type === 'both') {
      await supabase.from('cs_survey_csat').insert({
        tenant_id: ticket.tenant_id,
        ticket_id: ticket.ticket_id,
        customer_email: ticket.customer_email,
        score: null, // Not yet responded
        feedback: null,
        auto_sent: true,
        sent_at: null, // Will be set when actually sent
        survey_channel: channel,
        metadata: {
          rule_id: rule.rule_id,
          template_id: rule.template_id,
          scheduled_at: sendAt.toISOString(),
        },
      })
    }

    if (rule.survey_type === 'nps' || rule.survey_type === 'both') {
      await supabase.from('cs_survey_nps').insert({
        tenant_id: ticket.tenant_id,
        ticket_id: ticket.ticket_id,
        customer_email: ticket.customer_email,
        score: null, // Not yet responded
        feedback: null,
        auto_sent: true,
        sent_at: null, // Will be set when actually sent
        survey_channel: channel,
        metadata: {
          rule_id: rule.rule_id,
          template_id: rule.template_id,
          scheduled_at: sendAt.toISOString(),
        },
      })
    }

    // Schedule survey sending (would be processed by background job/cron)
    // For now, we'll create a reminder record
    // TODO: Implement background job to process scheduled surveys
  }

  /**
   * Determine best channel for survey
   */
  private static determineBestChannel(customerEmail: string): 'email' | 'sms' | 'in_app' {
    // Default to email
    // Could be enhanced with customer preference or channel history
    return 'email'
  }

  /**
   * Send scheduled surveys (called by background job/cron)
   */
  static async sendScheduledSurveys(): Promise<void> {
    const supabase = createServerSupabase()
    const now = new Date()

    // Get CSAT surveys ready to send
    const { data: csatSurveys } = await supabase
      .from('cs_survey_csat')
      .select('*')
      .eq('auto_sent', true)
      .is('sent_at', null)
      .not('metadata->scheduled_at', 'is', null)

    if (csatSurveys) {
      for (const survey of csatSurveys) {
        const scheduledAt = survey.metadata?.scheduled_at
        if (scheduledAt && new Date(scheduledAt) <= now) {
          await this.sendSurvey(survey, 'csat')
        }
      }
    }

    // Get NPS surveys ready to send
    const { data: npsSurveys } = await supabase
      .from('cs_survey_nps')
      .select('*')
      .eq('auto_sent', true)
      .is('sent_at', null)
      .not('metadata->scheduled_at', 'is', null)

    if (npsSurveys) {
      for (const survey of npsSurveys) {
        const scheduledAt = survey.metadata?.scheduled_at
        if (scheduledAt && new Date(scheduledAt) <= now) {
          await this.sendSurvey(survey, 'nps')
        }
      }
    }
  }

  /**
   * Send a survey
   */
  private static async sendSurvey(survey: any, surveyType: 'csat' | 'nps'): Promise<void> {
    const supabase = createServerSupabase()

    // Get template
    const templateId = survey.metadata?.template_id
    if (!templateId) {
      console.error(`Template ID not found for survey ${survey.survey_id}`)
      return
    }

    const { data: template } = await supabase
      .from('cs_survey_templates')
      .select('*')
      .eq('template_id', templateId)
      .single()

    if (!template) {
      console.error(`Template ${templateId} not found`)
      return
    }

    // Generate survey link
    const surveyLink = `${process.env.NEXT_PUBLIC_APP_URL}/survey/${surveyType}/${survey.survey_id}`

    // Send via appropriate channel
    const channel = survey.survey_channel || template.default_channel

    if (channel === 'email') {
      await this.sendEmailSurvey(survey, template, surveyLink)
    } else if (channel === 'sms') {
      await this.sendSMSSurvey(survey, template, surveyLink)
    } else if (channel === 'in_app') {
      // In-app notification (would be handled by frontend)
      // Just mark as sent
    }

    // Update survey record
    await supabase
      .from(`cs_survey_${surveyType}`)
      .update({
        sent_at: new Date().toISOString(),
        survey_link: surveyLink,
      })
      .eq('survey_id', survey.survey_id)

    // Schedule reminder if configured
    if (template.reminder_hours && template.max_reminders > 0) {
      const reminderAt = new Date(Date.now() + template.reminder_hours * 60 * 60 * 1000)
      
      await supabase.from('cs_survey_reminders').insert({
        survey_id: survey.survey_id,
        survey_type: surveyType,
        tenant_id: survey.tenant_id,
        customer_email: survey.customer_email,
        reminder_number: 1,
        scheduled_at: reminderAt.toISOString(),
        channel: channel,
        status: 'pending',
      })
    }
  }

  /**
   * Send survey via email
   */
  private static async sendEmailSurvey(
    survey: any,
    template: any,
    surveyLink: string
  ): Promise<void> {
    const { EnhancedEmailService } = await import('./enhanced-email-service')
    const supabase = createServerSupabase()

    try {
      // Prepare email content with survey link
      let htmlBody = template.message_html || template.message_text || ''
      let textBody = template.message_text || ''

      // Add survey link to email
      const linkHtml = `<p style="margin: 20px 0;"><a href="${surveyLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Take Survey</a></p>`
      const linkText = `\n\nTake Survey: ${surveyLink}\n\n`

      htmlBody = htmlBody.replace('{{survey_link}}', linkHtml) + (htmlBody.includes('{{survey_link}}') ? '' : linkHtml)
      textBody = textBody.replace('{{survey_link}}', surveyLink) + (textBody.includes('{{survey_link}}') ? '' : linkText)

      // Send email via Resend
      const emailResult = await EnhancedEmailService.sendEmail({
        to: survey.customer_email,
        subject: template.subject || `How was your experience?`,
        html: htmlBody,
        text: textBody,
        utmSource: 'cs-support',
        utmMedium: 'email',
        utmCampaign: `survey-${template.survey_type}`,
        leadId: survey.customer_email,
        jurisdiction: 'US',
        metadata: {
          survey_id: survey.survey_id,
          survey_type: template.survey_type,
        },
      })

      // Email record is already created in cs_email_sends by EnhancedEmailService
      // Update it with survey metadata if needed
      if (emailResult.emailId) {
        await supabase
          .from('cs_email_sends')
          .update({
            metadata: {
              survey_id: survey.survey_id,
              survey_type: template.survey_type,
              survey_link: surveyLink,
              template_id: template.template_id,
            },
          })
          .eq('email_id', emailResult.emailId)
      }
    } catch (error: any) {
      console.error('Error sending survey email:', error)
      // EnhancedEmailService handles error logging in cs_email_sends
      throw error
    }
  }

  /**
   * Send survey via SMS
   */
  private static async sendSMSSurvey(
    survey: any,
    template: any,
    surveyLink: string
  ): Promise<void> {
    // TODO: Integrate with Twilio
    // SMS record will be created by UnifiedMessagingService in cs_sms_logs
    // For now, just log (TODO: Integrate with UnifiedMessagingService for SMS surveys)
    const supabase = createServerSupabase()
    console.log('SMS survey would be sent:', {
      tenant_id: survey.tenant_id,
      customer_email: survey.customer_email,
      body: `${template.message_text} ${surveyLink}`,
      template_id: template.template_id,
      scheduled_at: new Date().toISOString(),
      metadata: {
        survey_id: survey.survey_id,
        survey_type: template.survey_type,
        survey_link: surveyLink,
      },
    })
  }

  /**
   * Record survey response
   */
  static async recordResponse(
    surveyId: string,
    surveyType: 'csat' | 'nps',
    score: number,
    feedbackText?: string,
    responses?: Record<string, any>
  ): Promise<void> {
    const supabase = createServerSupabase()

    // Update survey record
    await supabase
      .from(`cs_survey_${surveyType}`)
      .update({
        score,
        feedback: feedbackText,
        responded_at: new Date().toISOString(),
      })
      .eq('survey_id', surveyId)

    // Get survey for response record
    const { data: survey } = await supabase
      .from(`cs_survey_${surveyType}`)
      .select('*')
      .eq('survey_id', surveyId)
      .single()

    if (!survey) {
      throw new Error('Survey not found')
    }

    // Create response record
    await supabase.from('cs_survey_responses').insert({
      survey_id: surveyId,
      survey_type: surveyType,
      tenant_id: survey.tenant_id,
      ticket_id: survey.ticket_id,
      customer_email: survey.customer_email,
      score,
      rating: score,
      feedback_text: feedbackText,
      responses: responses || {},
      responded_at: new Date().toISOString(),
      response_channel: survey.survey_channel || 'web',
    })

    // Determine if follow-up is required
    const followUpRequired = this.shouldFollowUp(score, surveyType, feedbackText)

    if (followUpRequired) {
      await supabase
        .from('cs_survey_responses')
        .update({
          follow_up_required: true,
        })
        .eq('survey_id', surveyId)
    }
  }

  /**
   * Determine if follow-up is required
   */
  private static shouldFollowUp(
    score: number,
    surveyType: 'csat' | 'nps',
    feedbackText?: string
  ): boolean {
    if (surveyType === 'csat') {
      // Follow up on low scores (1-2) or if negative feedback
      return score <= 2 || (feedbackText && this.hasNegativeSentiment(feedbackText))
    } else if (surveyType === 'nps') {
      // Follow up on detractors (0-6) or if negative feedback
      return score <= 6 || (feedbackText && this.hasNegativeSentiment(feedbackText))
    }
    return false
  }

  /**
   * Simple negative sentiment detection
   */
  private static hasNegativeSentiment(text: string): boolean {
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointed', 'frustrated', 'angry', 'unhappy', 'poor', 'worst']
    const lowerText = text.toLowerCase()
    return negativeWords.some(word => lowerText.includes(word))
  }

  /**
   * Get survey statistics
   */
  static async getSurveyStats(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<any> {
    const supabase = createServerSupabase()

    const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = periodEnd || new Date()

    // Get CSAT stats
    const { data: csatResponses } = await supabase
      .from('cs_survey_responses')
      .select('score, feedback_text')
      .eq('tenant_id', tenantId)
      .eq('survey_type', 'csat')
      .gte('responded_at', start.toISOString())
      .lte('responded_at', end.toISOString())
      .not('score', 'is', null)

    // Get NPS stats
    const { data: npsResponses } = await supabase
      .from('cs_survey_responses')
      .select('score, feedback_text')
      .eq('tenant_id', tenantId)
      .eq('survey_type', 'nps')
      .gte('responded_at', start.toISOString())
      .lte('responded_at', end.toISOString())
      .not('score', 'is', null)

    // Calculate CSAT metrics
    const csatScores = (csatResponses || []).map(r => r.score)
    const csatAverage = csatScores.length > 0
      ? csatScores.reduce((sum, score) => sum + score, 0) / csatScores.length
      : 0

    // Calculate NPS metrics
    const npsScores = (npsResponses || []).map(r => r.score)
    const promoters = npsScores.filter(s => s >= 9).length
    const passives = npsScores.filter(s => s >= 7 && s <= 8).length
    const detractors = npsScores.filter(s => s <= 6).length
    const totalNPS = npsScores.length
    const npsScore = totalNPS > 0
      ? Math.round(((promoters - detractors) / totalNPS) * 100)
      : 0

    return {
      csat: {
        average: Math.round(csatAverage * 10) / 10,
        total_responses: csatScores.length,
        distribution: {
          5: csatScores.filter(s => s === 5).length,
          4: csatScores.filter(s => s === 4).length,
          3: csatScores.filter(s => s === 3).length,
          2: csatScores.filter(s => s === 2).length,
          1: csatScores.filter(s => s === 1).length,
        },
      },
      nps: {
        score: npsScore,
        total_responses: totalNPS,
        promoters,
        passives,
        detractors,
        distribution: {
          '9-10': promoters,
          '7-8': passives,
          '0-6': detractors,
        },
      },
      response_rate: {
        surveys_sent: 0, // TODO: Calculate from survey records
        surveys_responded: csatScores.length + totalNPS,
        response_rate: 0, // TODO: Calculate
      },
    }
  }
}
