/**
 * Test Communication Templates System
 * 
 * Tests:
 * 1. Template retrieval by key
 * 2. Template rendering with variables
 * 3. Template lookup by sequence/milestone
 * 4. API endpoint testing (if server is running)
 */

import { createServerSupabase } from '../lib/db/supabase'
import { CommunicationTemplatesService } from '../lib/services/communication-templates'

// Test data
const testVariables = {
  customer_name: 'John Smith',
  csm_name: 'Sarah Johnson',
  csm_email: 'sarah.johnson@truevow.com',
  csm_phone: '+1-555-0123',
  checklist_link: 'https://app.truevow.com/onboarding/checklist',
  calendly_link: 'https://calendly.com/truevow/onboarding',
  support_portal_link: 'https://support.truevow.com',
  support_phone: '+1-555-HELP',
  documentation_link: 'https://docs.truevow.com',
  call_date: 'January 20, 2026',
  call_time: '2:00 PM',
  timezone: 'EST',
  meeting_link: 'https://zoom.us/j/123456789',
  login_link: 'https://app.truevow.com/login',
  phone_number: '+1-555-0100',
  tutorials_link: 'https://docs.truevow.com/tutorials',
  best_practices_link: 'https://docs.truevow.com/best-practices',
  ticket_id: 'TKT-12345',
  ticket_link: 'https://support.truevow.com/tickets/12345',
}

async function testTemplateRetrieval() {
  console.log('\n📋 Test 1: Template Retrieval by Key')
  console.log('=' .repeat(50))
  
  try {
    const template = await CommunicationTemplatesService.getTemplateByKey(
      'pre_onboarding_email_1'
    )
    
    if (!template) {
      throw new Error('Template not found')
    }
    
    console.log('✅ Template retrieved successfully')
    console.log(`   Template Key: ${template.template_key}`)
    console.log(`   Name: ${template.template_name}`)
    console.log(`   Type: ${template.template_type}`)
    console.log(`   Category: ${template.category}`)
    console.log(`   Variables: ${template.variables.length} defined`)
    
    return true
  } catch (error) {
    console.error('❌ Template retrieval failed:', error)
    return false
  }
}

async function testTemplateRendering() {
  console.log('\n🎨 Test 2: Template Rendering with Variables')
  console.log('=' .repeat(50))
  
  try {
    const template = await CommunicationTemplatesService.getTemplateByKey(
      'pre_onboarding_email_1'
    )
    
    if (!template) {
      throw new Error('Template not found')
    }
    
    const rendered = CommunicationTemplatesService.renderTemplate(
      template,
      testVariables
    )
    
    console.log('✅ Template rendered successfully')
    console.log(`   Subject: ${rendered.subject?.substring(0, 50)}...`)
    console.log(`   Body length: ${rendered.body.length} characters`)
    
    // Check if variables were replaced
    const hasVariables = rendered.body.includes('[') && rendered.body.includes(']')
    if (hasVariables) {
      console.log('⚠️  Warning: Some variables may not have been replaced')
      // Find unreplaced variables
      const unreplaced = rendered.body.match(/\[([^\]]+)\]/g)
      if (unreplaced) {
        console.log(`   Unreplaced variables: ${unreplaced.slice(0, 3).join(', ')}`)
      }
    } else {
      console.log('✅ All variables appear to be replaced')
    }
    
    return true
  } catch (error) {
    console.error('❌ Template rendering failed:', error)
    return false
  }
}

async function testTemplateLookupBySequence() {
  console.log('\n🔍 Test 3: Template Lookup by Sequence')
  console.log('=' .repeat(50))
  
  try {
    const templates = await CommunicationTemplatesService.getTemplatesBySequence(
      'law_firm_pre_onboarding',
      'email'
    )
    
    console.log(`✅ Found ${templates.length} templates for sequence`)
    
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.template_name} (${template.template_key})`)
    })
    
    return templates.length > 0
  } catch (error) {
    console.error('❌ Template lookup failed:', error)
    return false
  }
}

async function testAllTemplatesExist() {
  console.log('\n📦 Test 4: Verify All Templates Exist')
  console.log('=' .repeat(50))
  
  const expectedTemplates = [
    'pre_onboarding_email_1',
    'pre_onboarding_sms_1',
    'pre_onboarding_email_2',
    'onboarding_call_email_2',
    'onboarding_call_email_3',
    'onboarding_call_email_4',
    'post_onboarding_email_2',
    'post_onboarding_email_3',
    'post_onboarding_email_4',
    'post_onboarding_email_5',
    'post_onboarding_email_6',
    'post_onboarding_sms_critical',
    'post_onboarding_in_app_welcome',
  ]
  
  const results: { [key: string]: boolean } = {}
  
  for (const templateKey of expectedTemplates) {
    try {
      const template = await CommunicationTemplatesService.getTemplateByKey(templateKey)
      results[templateKey] = !!template
      if (template) {
        console.log(`✅ ${templateKey}`)
      } else {
        console.log(`❌ ${templateKey} - Not found`)
      }
    } catch (error) {
      results[templateKey] = false
      console.log(`❌ ${templateKey} - Error: ${error}`)
    }
  }
  
  const successCount = Object.values(results).filter(Boolean).length
  console.log(`\n   Summary: ${successCount}/${expectedTemplates.length} templates found`)
  
  return successCount === expectedTemplates.length
}

async function testVariableValidation() {
  console.log('\n✅ Test 5: Variable Validation')
  console.log('=' .repeat(50))
  
  try {
    const template = await CommunicationTemplatesService.getTemplateByKey(
      'pre_onboarding_email_1'
    )
    
    if (!template) {
      throw new Error('Template not found')
    }
    
    // Test with missing required variables
    const incompleteVars = {
      customer_name: 'John Smith',
      // Missing csm_name, csm_email, etc.
    }
    
    try {
      CommunicationTemplatesService.renderTemplate(template, incompleteVars)
      console.log('⚠️  Warning: Template rendered without all required variables')
      return false
    } catch (error) {
      console.log('✅ Required variable validation works (correctly rejected incomplete vars)')
      return true
    }
  } catch (error) {
    console.error('❌ Variable validation test failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('\n🧪 Communication Templates Test Suite')
  console.log('=' .repeat(50))
  console.log(`Started at: ${new Date().toISOString()}\n`)
  
  const results = {
    retrieval: await testTemplateRetrieval(),
    rendering: await testTemplateRendering(),
    lookup: await testTemplateLookupBySequence(),
    allExist: await testAllTemplatesExist(),
    validation: await testVariableValidation(),
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Test Results Summary')
  console.log('=' .repeat(50))
  
  const testNames = {
    retrieval: 'Template Retrieval',
    rendering: 'Template Rendering',
    lookup: 'Template Lookup',
    allExist: 'All Templates Exist',
    validation: 'Variable Validation',
  }
  
  let passed = 0
  let total = 0
  
  for (const [key, passed_test] of Object.entries(results)) {
    total++
    if (passed_test) {
      passed++
      console.log(`✅ ${testNames[key as keyof typeof testNames]}`)
    } else {
      console.log(`❌ ${testNames[key as keyof typeof testNames]}`)
    }
  }
  
  console.log(`\n   Passed: ${passed}/${total}`)
  console.log(`   Completed at: ${new Date().toISOString()}\n`)
  
  if (passed === total) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.')
    process.exit(1)
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
