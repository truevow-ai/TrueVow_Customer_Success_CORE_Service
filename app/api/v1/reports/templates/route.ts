import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/db/supabase'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * POST /api/v1/reports/templates
 * Create a new report template
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      template_name,
      template_type,
      description,
      report_config,
      schedule_type,
      schedule_config,
      tenant_id,
      is_active = true,
      is_default = false,
    } = body

    if (!template_name || !template_type || !report_config) {
      return NextResponse.json(
        { error: 'template_name, template_type, and report_config are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    const { data: template, error } = await supabase
      .from('cs_report_templates')
      .insert({
        template_name,
        template_type,
        description,
        report_config,
        schedule_type: schedule_type || 'none',
        schedule_config: schedule_config || {},
        tenant_id,
        is_active,
        is_default,
        created_by: userId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/reports/templates
 * Get all report templates for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const templateType = searchParams.get('template_type')
    const isActive = searchParams.get('is_active')

    const supabase = await createServerSupabase()
    let query = supabase.from('cs_report_templates').select('*')

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    }

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    query = query.order('created_at', { ascending: false })

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: templates || [] })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}



