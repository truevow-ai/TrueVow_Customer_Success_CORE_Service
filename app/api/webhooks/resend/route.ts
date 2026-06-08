/**
 * Resend Webhook Handler
 * 
 * Handles webhook events from Resend:
 * - email.sent
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 * - email.unsubscribed
 */

import { NextRequest, NextResponse } from 'next/server'
import { ResendClient } from '@/lib/integrations/resend'
import { createServerSupabase } from '@/lib/db/supabase'

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ''
const RESEND_WEBHOOK_ENDPOINT = process.env.RESEND_WEBHOOK_ENDPOINT || ''

/**
 * POST /api/webhooks/resend
 * Handle Resend webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Verify signature
    const signature = request.headers.get('resend-signature') || 
                     request.headers.get('x-resend-signature') || 
                     ''

    if (!RESEND_WEBHOOK_SECRET) {
      console.error('RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const isValid = ResendClient.verifySignature(
      rawBody,
      signature,
      RESEND_WEBHOOK_SECRET
    )

    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Handle different event types
    const eventType = body.type
    const eventData = body.data || {}

    const supabase = await createServerSupabase()

    switch (eventType) {
      case 'email.sent':
        await handleEmailSent(supabase, eventData)
        break

      case 'email.delivered':
        await handleEmailDelivered(supabase, eventData)
        break

      case 'email.opened':
        await handleEmailOpened(supabase, eventData)
        break

      case 'email.clicked':
        await handleEmailClicked(supabase, eventData)
        break

      case 'email.bounced':
        await handleEmailBounced(supabase, eventData)
        break

      case 'email.complained':
        await handleEmailComplained(supabase, eventData)
        break

      case 'email.unsubscribed':
        await handleEmailUnsubscribed(supabase, eventData)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Resend webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Handle email.sent event
 */
async function handleEmailSent(supabase: any, data: any) {
  const emailId = data.email_id || data.id

  if (!emailId) return

  // Update email_sends table if exists
  await supabase
    .from('cs_email_sends')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })
}

/**
 * Handle email.delivered event
 */
async function handleEmailDelivered(supabase: any, data: any) {
  const emailId = data.email_id || data.id

  if (!emailId) return

  await supabase
    .from('cs_email_sends')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })
}

/**
 * Handle email.opened event
 */
async function handleEmailOpened(supabase: any, data: any) {
  const emailId = data.email_id || data.id
  const recipient = data.recipient || data.to

  if (!emailId) return

  // Record open event
  await supabase.from('cs_email_events').insert({
    email_id: emailId,
    event_type: 'opened',
    recipient_email: recipient,
    event_data: data,
    occurred_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist, ignore
  })

    // Update email_sends
    const { data: existingEmail } = await supabase
      .from('cs_email_sends')
      .select('opened_count')
      .eq('email_id', emailId)
      .single()

    const newOpenedCount = (existingEmail?.opened_count || 0) + 1

    await supabase
      .from('cs_email_sends')
      .update({
        opened_at: new Date().toISOString(),
        opened_count: newOpenedCount,
      })
      .eq('email_id', emailId)
      .catch(() => {
        // Table might not exist, ignore
      })

  // TODO: Trigger conditional logic if part of sequence
}

/**
 * Handle email.clicked event
 */
async function handleEmailClicked(supabase: any, data: any) {
  const emailId = data.email_id || data.id
  const recipient = data.recipient || data.to
  const link = data.link || data.url

  if (!emailId) return

  // Record click event
  await supabase.from('cs_email_events').insert({
    email_id: emailId,
    event_type: 'clicked',
    recipient_email: recipient,
    event_data: { ...data, link },
    occurred_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist, ignore
  })

  // Update email_sends
  const { data: existingEmail } = await supabase
    .from('cs_email_sends')
    .select('clicked_count')
    .eq('email_id', emailId)
    .single()

  const newClickedCount = (existingEmail?.clicked_count || 0) + 1

  await supabase
    .from('cs_email_sends')
    .update({
      clicked_at: new Date().toISOString(),
      clicked_count: newClickedCount,
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })

  // TODO: Trigger conditional logic if part of sequence
}

/**
 * Handle email.bounced event
 */
async function handleEmailBounced(supabase: any, data: any) {
  const emailId = data.email_id || data.id
  const recipient = data.recipient || data.to
  const bounceType = data.bounce_type || 'hard'

  if (!emailId || !recipient) return

  // Add to suppression list
  await supabase.from('cs_email_suppressions').insert({
    email: recipient,
    reason: 'bounced',
    bounce_type: bounceType,
    email_id: emailId,
    suppressed_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist or duplicate, ignore
  })

  // Update email_sends
  await supabase
    .from('cs_email_sends')
    .update({
      status: 'bounced',
      bounced_at: new Date().toISOString(),
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })
}

/**
 * Handle email.complained event
 */
async function handleEmailComplained(supabase: any, data: any) {
  const emailId = data.email_id || data.id
  const recipient = data.recipient || data.to

  if (!emailId || !recipient) return

  // Add to suppression list
  await supabase.from('cs_email_suppressions').insert({
    email: recipient,
    reason: 'complaint',
    email_id: emailId,
    suppressed_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist or duplicate, ignore
  })

  // Update email_sends
  await supabase
    .from('cs_email_sends')
    .update({
      status: 'complained',
      complained_at: new Date().toISOString(),
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })
}

/**
 * Handle email.unsubscribed event
 */
async function handleEmailUnsubscribed(supabase: any, data: any) {
  const emailId = data.email_id || data.id
  const recipient = data.recipient || data.to

  if (!emailId || !recipient) return

  // Add to suppression list
  await supabase.from('cs_email_suppressions').insert({
    email: recipient,
    reason: 'unsubscribed',
    email_id: emailId,
    suppressed_at: new Date().toISOString(),
  }).catch(() => {
    // Table might not exist or duplicate, ignore
  })

  // Update unsubscribe token if exists
  await supabase
    .from('cs_email_unsubscribes')
    .update({
      unsubscribed_at: new Date().toISOString(),
      status: 'unsubscribed',
    })
    .eq('email', recipient)
    .catch(() => {
      // Table might not exist, ignore
    })

  // Update email_sends
  await supabase
    .from('cs_email_sends')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email_id', emailId)
    .catch(() => {
      // Table might not exist, ignore
    })
}



