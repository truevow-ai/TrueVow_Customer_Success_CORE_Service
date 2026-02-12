/**
 * Email Rate Limiter Service
 * 
 * Implements rate limiting for email sending to prevent abuse
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface RateLimitConfig {
  perMinute?: number
  perHour?: number
  perDay?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number
}

export class EmailRateLimiterService {
  private static readonly DEFAULT_LIMITS = {
    perMinute: 300, // 300 emails per minute per domain
    perHour: 10000, // 10,000 emails per hour
    perDay: 100000, // 100,000 emails per day
  }

  /**
   * Check if email sending is allowed for a domain
   */
  static async checkRateLimit(
    domain: string,
    config: RateLimitConfig = {}
  ): Promise<RateLimitResult> {
    const limits = {
      perMinute: config.perMinute || this.DEFAULT_LIMITS.perMinute,
      perHour: config.perHour || this.DEFAULT_LIMITS.perHour,
      perDay: config.perDay || this.DEFAULT_LIMITS.perDay,
    }

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const supabase = createServerSupabase()

    // Check per-minute limit
    const { count: minuteCount } = await supabase
      .from('cs_email_sends')
      .select('*', { count: 'exact', head: true })
      .eq('from_domain', domain)
      .gte('sent_at', oneMinuteAgo.toISOString())

    if (minuteCount && minuteCount >= limits.perMinute) {
      const resetAt = new Date(now.getTime() + 60 * 1000)
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      }
    }

    // Check per-hour limit
    const { count: hourCount } = await supabase
      .from('cs_email_sends')
      .select('*', { count: 'exact', head: true })
      .eq('from_domain', domain)
      .gte('sent_at', oneHourAgo.toISOString())

    if (hourCount && hourCount >= limits.perHour) {
      const resetAt = new Date(now.getTime() + 60 * 60 * 1000)
      return {
        allowed: false,
        remaining: limits.perHour - (hourCount || 0),
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      }
    }

    // Check per-day limit
    const { count: dayCount } = await supabase
      .from('cs_email_sends')
      .select('*', { count: 'exact', head: true })
      .eq('from_domain', domain)
      .gte('sent_at', oneDayAgo.toISOString())

    if (dayCount && dayCount >= limits.perDay) {
      const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      return {
        allowed: false,
        remaining: limits.perDay - (dayCount || 0),
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      }
    }

    // Calculate remaining based on most restrictive limit
    const remaining = Math.min(
      limits.perMinute - (minuteCount || 0),
      limits.perHour - (hourCount || 0),
      limits.perDay - (dayCount || 0)
    )

    return {
      allowed: true,
      remaining,
      resetAt: new Date(now.getTime() + 60 * 1000), // Reset in 1 minute
    }
  }

  /**
   * Record email send for rate limiting
   */
  static async recordEmailSend(
    domain: string,
    emailId: string,
    to: string,
    subject: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    await supabase.from('cs_email_sends').insert({
      email_id: emailId,
      from_domain: domain,
      to_email: to,
      subject,
      sent_at: new Date().toISOString(),
    })
  }
}
