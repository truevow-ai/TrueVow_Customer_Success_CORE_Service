/**
 * API Route: Unsubscribe Email
 * POST /api/v1/email/unsubscribe/[token]
 * 
 * Handles email unsubscription via token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Find unsubscribe token
    const { data: unsubscribeRecord, error: findError } = await supabase
      .from('cs_email_unsubscribes')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !unsubscribeRecord) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    // Check if already unsubscribed
    if (unsubscribeRecord.status === 'unsubscribed') {
      return NextResponse.json({
        success: true,
        message: 'You are already unsubscribed',
        already_unsubscribed: true,
      })
    }

    // Mark as unsubscribed
    const { error: updateError } = await supabase
      .from('cs_email_unsubscribes')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (updateError) {
      throw updateError
    }

    // Add to suppression list
    await supabase.from('cs_email_suppressions').insert({
      email: unsubscribeRecord.email,
      reason: 'unsubscribed',
      email_id: unsubscribeRecord.email_id,
      suppressed_at: new Date().toISOString(),
    }).catch(() => {
      // Ignore duplicate key errors
    })

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed',
      email: unsubscribeRecord.email,
    })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/email/unsubscribe/[token]
 * Get unsubscribe status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: unsubscribeRecord } = await supabase
      .from('cs_email_unsubscribes')
      .select('*')
      .eq('token', token)
      .single()

    if (!unsubscribeRecord) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      email: unsubscribeRecord.email,
      status: unsubscribeRecord.status,
      unsubscribed: unsubscribeRecord.status === 'unsubscribed',
    })
  } catch (error: any) {
    console.error('Get unsubscribe status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get unsubscribe status' },
      { status: 500 }
    )
  }
}
