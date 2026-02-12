/**
 * Generate CS-Support Service API Key
 * 
 * This script generates a secure random API key for CS-Support Service.
 * Other services will use this key to authenticate when calling CS-Support Service.
 * 
 * Usage:
 *   node scripts/generate-cs-support-api-key.js
 */

const crypto = require('crypto')

/**
 * Generate a secure random API key (64 characters, hex)
 */
function generateApiKey() {
  // Generate 32 random bytes (256 bits) and convert to hex (64 characters)
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Main function
 */
function main() {
  console.log('🔑 Generating CS-Support Service API Key...\n')
  
  const apiKey = generateApiKey()
  
  console.log('✅ Generated API Key:')
  console.log('─'.repeat(80))
  console.log(apiKey)
  console.log('─'.repeat(80))
  console.log('\n📋 Add this to your .env.local file:')
  console.log(`CS_SUPPORT_SERVICE_API_KEY=${apiKey}`)
  console.log('\n📋 Also add this to other services\' .env.local files:')
  console.log('   - Sales CRM Service')
  console.log('   - Platform Service')
  console.log('   - Internal Ops Service')
  console.log('   - Tenant Service')
  console.log(`\n   CS_SUPPORT_SERVICE_URL=http://localhost:3007`)
  console.log(`   CS_SUPPORT_SERVICE_API_KEY=${apiKey}`)
  console.log('\n✅ Done!')
}

main()
