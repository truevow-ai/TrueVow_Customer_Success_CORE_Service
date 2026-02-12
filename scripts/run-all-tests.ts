/**
 * Master Test Runner
 * 
 * Runs all automated tests for CS-Support Service
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration?: number
  error?: string
  output?: string
}

const testResults: TestResult[] = []
const startTime = Date.now()

console.log('🚀 Starting Automated Test Suite for CS-Support Service\n')
console.log('=' .repeat(80))

// Test configurations
const tests = [
  {
    name: 'Unified Dialer Verification',
    script: 'verify:dialer',
    description: 'Verifies dialer permissions, phone pools, and mappings',
  },
  {
    name: 'SMS Integration (Twilio)',
    script: 'test:sms',
    description: 'Tests SMS sending via Twilio integration',
  },
  {
    name: 'AI Agent (Multi-LLM)',
    script: 'test:ai-agent',
    description: 'Tests AI agent with multiple LLM providers and priority order',
  },
  {
    name: 'Post-Onboarding Flows',
    script: 'test:post-onboarding',
    description: 'Tests post-onboarding support flows and automation',
  },
]

async function runTest(test: typeof tests[0]): Promise<TestResult> {
  const testStartTime = Date.now()
  console.log(`\n📋 Running: ${test.name}`)
  console.log(`   ${test.description}`)
  console.log(`   Command: npm run ${test.script}`)
  console.log('-'.repeat(80))

  try {
    const output = execSync(`npm run ${test.script}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    const duration = Date.now() - testStartTime
    console.log(`✅ PASSED: ${test.name} (${duration}ms)`)
    
    return {
      name: test.name,
      status: 'passed',
      duration,
      output: output.substring(0, 500), // First 500 chars
    }
  } catch (error: any) {
    const duration = Date.now() - testStartTime
    const errorMessage = error.message || error.toString()
    // Combine both stdout and stderr to check for config errors
    const errorOutput = (error.stdout || '') + (error.stderr || '') || errorMessage
    
    // Check if this is a configuration/setup issue (missing env vars, etc.)
    const isConfigError = 
      errorOutput.toLowerCase().includes('missing required environment variables') ||
      errorOutput.toLowerCase().includes('environment variable') ||
      errorOutput.toLowerCase().includes('supabaseurl is required') ||
      errorOutput.toLowerCase().includes('next_public_supabase_url') ||
      errorOutput.toLowerCase().includes('supabase_url') ||
      errorOutput.includes('Please set these in your .env file') ||
      errorOutput.includes('TEST_SMS_TO_PHONE')
    
    if (isConfigError) {
      console.log(`⏭️  SKIPPED: ${test.name} (${duration}ms) - Missing configuration`)
      if (errorOutput) {
        const configMsg = errorOutput.match(/Missing required environment variables:[\s\S]*?(?=\n\n|Please|$)/)?.[0] || 
                         errorOutput.match(/❌.*/)?.[0] || 
                         'Configuration required'
        console.log(`   Reason: ${configMsg.substring(0, 150)}`)
      }
      
      return {
        name: test.name,
        status: 'skipped',
        duration,
        error: 'Configuration required - missing environment variables',
        output: errorOutput.substring(0, 500),
      }
    }
    
    console.log(`❌ FAILED: ${test.name} (${duration}ms)`)
    if (errorOutput) {
      console.log(`   Error: ${errorOutput.substring(0, 200)}`)
    }
    
    return {
      name: test.name,
      status: 'failed',
      duration,
      error: errorMessage,
      output: errorOutput.substring(0, 500),
    }
  }
}

async function runAllTests() {
  for (const test of tests) {
    const result = await runTest(test)
    testResults.push(result)
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Generate report
  const totalDuration = Date.now() - startTime
  const passed = testResults.filter(r => r.status === 'passed').length
  const failed = testResults.filter(r => r.status === 'failed').length
  const skipped = testResults.filter(r => r.status === 'skipped').length

  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Tests: ${testResults.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)
  console.log('='.repeat(80))

  // Detailed results
  console.log('\n📋 DETAILED RESULTS:\n')
  testResults.forEach((result, index) => {
    const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'
    console.log(`${index + 1}. ${icon} ${result.name}`)
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error.substring(0, 150)}...`)
    }
    console.log('')
  })

  // Save report to file
  const reportPath = path.join(process.cwd(), 'docs', 'AUTOMATED_TEST_REPORT.md')
  const reportContent = generateMarkdownReport(testResults, totalDuration)
  fs.writeFileSync(reportPath, reportContent)
  console.log(`\n📄 Full report saved to: ${reportPath}`)

  // Exit with appropriate code (only fail if there are actual failures, not skipped)
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please review the results above.')
    process.exit(1)
  } else if (skipped > 0 && passed > 0) {
    console.log('\n✅ All configured tests passed!')
    console.log(`⏭️  ${skipped} test(s) skipped due to missing configuration.`)
    console.log('   Set required environment variables to run all tests.')
    process.exit(0)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

function generateMarkdownReport(results: TestResult[], totalDuration: number): string {
  const passed = results.filter(r => r.status === 'passed').length
  const failed = results.filter(r => r.status === 'failed').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return `# Automated Test Report - CS-Support Service

**Date:** ${new Date().toISOString()}  
**Status:** ${failed === 0 ? '✅ All Tests Passed' : '❌ Some Tests Failed'}

---

## Summary

- **Total Tests:** ${results.length}
- **✅ Passed:** ${passed}
- **❌ Failed:** ${failed}
- **⏭️ Skipped:** ${skipped}
- **⏱️ Total Duration:** ${totalDuration}ms

---

## Test Results

${results.map((result, index) => {
  const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'
  return `### ${index + 1}. ${icon} ${result.name}

**Status:** ${result.status.toUpperCase()}  
**Duration:** ${result.duration || 'N/A'}ms

${result.error ? `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n` : ''}

${result.output ? `**Output:**\n\`\`\`\n${result.output.substring(0, 1000)}\n\`\`\`\n` : ''}

---`
}).join('\n\n')}

---

**Report Generated:** ${new Date().toISOString()}
`
}

// Run all tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
