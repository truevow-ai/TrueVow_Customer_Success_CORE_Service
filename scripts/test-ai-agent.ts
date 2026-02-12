/**
 * Test AI Agent Integration
 * 
 * Tests the Support Agent with various scenarios
 */

import { SupportAgent } from '../lib/ai/support-agent'
import { AgentContext } from '../lib/services/ai-agent-prompts'

async function testAIAgent() {
  console.log('🤖 Testing AI Support Agent\n')
  console.log('=' .repeat(80))

  // Check environment variables
  const { LLMProviderService } = await import('../lib/services/llm-provider')
  const availableProviders = LLMProviderService.getAvailableProviders()
  
  if (availableProviders.length === 0) {
    console.error('❌ No LLM provider API keys configured')
    console.error('   Set at least one of:')
    console.error('   - ANTHROPIC_API_KEY')
    console.error('   - OPENAI_API_KEY')
    console.error('   - GROK_API_KEY')
    process.exit(1)
  }

  console.log('✅ LLM Providers configured:')
  availableProviders.forEach(provider => {
    console.log(`   - ${provider}`)
  })
  console.log()

  // Test 1: Ticket Analysis
  console.log('📋 Test 1: Ticket Analysis')
  console.log('-'.repeat(80))

  try {
    const agent = new SupportAgent()
    const context: AgentContext = {
      subject: 'Password reset needed',
      description: 'I cannot log in to my account. I forgot my password.',
      channel: 'email',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      tenantName: 'Smith Law Firm',
      accountStatus: 'active',
      activeServices: ['INTAKE'],
      healthScore: 75,
      recentTicketsCount: 2,
    }

    const analysis = await agent.analyzeTicket(context)
    console.log('✅ Ticket analyzed successfully')
    console.log(`   Category: ${analysis.category}`)
    console.log(`   Priority: ${analysis.priority}`)
    console.log(`   Complexity: ${analysis.complexity}`)
    console.log(`   Confidence: ${analysis.confidence}`)
    console.log(`   Reasoning: ${analysis.reasoning}`)
  } catch (error) {
    console.error('❌ Error analyzing ticket:', error)
  }

  console.log()

  // Test 2: Generate First Response
  console.log('💬 Test 2: Generate First Response')
  console.log('-'.repeat(80))

  try {
    const agent = new SupportAgent()
    const context: AgentContext = {
      subject: 'Service not working',
      description: 'INTAKE service is down. I cannot make calls.',
      channel: 'email',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      priority: 'high',
      relevantArticles: [
        {
          id: 'kb-1',
          title: 'Troubleshooting INTAKE',
          summary: 'Common INTAKE issues and solutions',
          link: 'https://docs.truevow.com/kb/troubleshooting-intake',
        },
      ],
      serviceStatus: {
        INTAKE: 'operational',
      },
    }

    const response = await agent.generateFirstResponse(context)
    console.log('✅ Response generated successfully')
    console.log(`   Confidence: ${response.confidence}`)
    console.log(`   Should Escalate: ${response.shouldEscalate}`)
    console.log(`   Response Preview: ${response.response.substring(0, 100)}...`)
    if (response.suggestedActions) {
      console.log(`   Suggested Actions: ${response.suggestedActions.length}`)
    }
  } catch (error) {
    console.error('❌ Error generating response:', error)
  }

  console.log()

  // Test 3: Password Reset Response
  console.log('🔐 Test 3: Password Reset Response')
  console.log('-'.repeat(80))

  try {
    const agent = new SupportAgent()
    const context: AgentContext = {
      subject: 'Password reset',
      description: 'I need to reset my password',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
    }

    const response = await agent.generateIssueResponse('password_reset', context)
    console.log('✅ Password reset response generated')
    console.log(`   Response Preview: ${response.response.substring(0, 150)}...`)
  } catch (error) {
    console.error('❌ Error generating password reset response:', error)
  }

  console.log()

  // Test 4: Billing Question (should escalate)
  console.log('💰 Test 4: Billing Question (Should Escalate)')
  console.log('-'.repeat(80))

  try {
    const agent = new SupportAgent()
    const context: AgentContext = {
      subject: 'Billing question',
      description: 'I have a question about my bill',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
    }

    const response = await agent.generateIssueResponse('billing', context)
    console.log('✅ Billing response generated')
    console.log(`   Should Escalate: ${response.shouldEscalate}`)
    console.log(`   Escalation Reason: ${response.escalationReason}`)
    console.log(`   Response Preview: ${response.response.substring(0, 150)}...`)
  } catch (error) {
    console.error('❌ Error generating billing response:', error)
  }

  console.log()
  console.log('=' .repeat(80))
  console.log('✅ AI Agent Tests Complete')
  console.log()
  console.log('📝 Notes:')
  console.log('   - Verify responses are appropriate for each scenario')
  console.log('   - Check escalation logic works correctly')
  console.log('   - Review response quality and tone')
}

// Run tests
testAIAgent().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
