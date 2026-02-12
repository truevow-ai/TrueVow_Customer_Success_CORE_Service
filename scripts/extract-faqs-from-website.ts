/**
 * FAQ Extraction Script
 * 
 * Extracts FAQs from marketing website HTML files
 * Categorizes them and creates structured FAQ entries
 * 
 * Run: npx tsx scripts/extract-faqs-from-website.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface ExtractedFAQ {
  question: string
  answer: string
  category: string
  source_page: string
  tags: string[]
  match_keywords: string[]
  match_intents: string[]
}

const WEBSITE_PATH = 'C:\\Users\\yasha\\OneDrive\\Documents\\TrueVow\\Cursor\\2025-TrueVow-Website'
const OUTPUT_PATH = 'database/seed_faqs_from_website.sql'

// Category mapping based on page and content
const CATEGORY_MAP: Record<string, string> = {
  'pricing': 'billing',
  'connect': 'connect',
  'draft': 'draft',
  'settle': 'settle',
  'intake': 'onboarding',
  'how-it-works': 'onboarding',
  'index': 'general',
}

// Intent patterns
const INTENT_PATTERNS = {
  how_to: /^(how|how do|how can|how to)/i,
  what_is: /^(what|what is|what are|what does)/i,
  can_i: /^(can i|can you|can we|can they)/i,
  why: /^(why|why do|why does|why is)/i,
  do_you: /^(do you|does it|do they)/i,
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  ])
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10)
}

function detectIntent(question: string): string[] {
  const intents: string[] = []
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(question)) {
      intents.push(intent)
    }
  }
  return intents
}

function detectCategory(question: string, answer: string, sourcePage: string): string {
  // Check for category keywords in question/answer
  const lowerText = (question + ' ' + answer).toLowerCase()
  
  if (lowerText.includes('billing') || lowerText.includes('pricing') || lowerText.includes('cost') || lowerText.includes('price')) {
    return 'billing'
  }
  if (lowerText.includes('compliance') || lowerText.includes('bar') || lowerText.includes('phi') || lowerText.includes('privacy')) {
    return 'compliance'
  }
  if (lowerText.includes('technical') || lowerText.includes('error') || lowerText.includes('issue') || lowerText.includes('bug')) {
    return 'technical'
  }
  if (lowerText.includes('onboarding') || lowerText.includes('setup') || lowerText.includes('getting started')) {
    return 'onboarding'
  }
  if (lowerText.includes('account') || lowerText.includes('user') || lowerText.includes('team')) {
    return 'account'
  }
  
  // Use page-based category
  const pageName = sourcePage.replace('.html', '').toLowerCase()
  return CATEGORY_MAP[pageName] || 'general'
}

function extractFAQsFromHTML(htmlContent: string, sourcePage: string): ExtractedFAQ[] {
  const faqs: ExtractedFAQ[] = []
  
  // Common FAQ patterns in HTML
  // Pattern 1: <h3>Question</h3><p>Answer</p>
  const pattern1 = /<h[2-4][^>]*>(.*?)<\/h[2-4]>\s*<p[^>]*>(.*?)<\/p>/gis
  let match1
  while ((match1 = pattern1.exec(htmlContent)) !== null) {
    const question = match1[1].replace(/<[^>]+>/g, '').trim()
    const answer = match1[2].replace(/<[^>]+>/g, '').trim()
    
    if (question && answer && question.length < 200 && answer.length > 20) {
      const category = detectCategory(question, answer, sourcePage)
      faqs.push({
        question,
        answer,
        category,
        source_page: sourcePage,
        tags: [sourcePage.replace('.html', ''), category],
        match_keywords: extractKeywords(question + ' ' + answer),
        match_intents: detectIntent(question),
      })
    }
  }
  
  // Pattern 2: <div class="faq"> or similar structures
  const pattern2 = /<div[^>]*class="[^"]*faq[^"]*"[^>]*>.*?<h[2-4][^>]*>(.*?)<\/h[2-4]>(.*?)<\/div>/gis
  let match2
  while ((match2 = pattern2.exec(htmlContent)) !== null) {
    const question = match2[1].replace(/<[^>]+>/g, '').trim()
    const answer = match2[2].replace(/<[^>]+>/g, '').trim()
    
    if (question && answer && question.length < 200 && answer.length > 20) {
      const category = detectCategory(question, answer, sourcePage)
      faqs.push({
        question,
        answer,
        category,
        source_page: sourcePage,
        tags: [sourcePage.replace('.html', ''), category],
        match_keywords: extractKeywords(question + ' ' + answer),
        match_intents: detectIntent(question),
      })
    }
  }
  
  // Pattern 3: <dt>Question</dt><dd>Answer</dd>
  const pattern3 = /<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/gis
  let match3
  while ((match3 = pattern3.exec(htmlContent)) !== null) {
    const question = match3[1].replace(/<[^>]+>/g, '').trim()
    const answer = match3[2].replace(/<[^>]+>/g, '').trim()
    
    if (question && answer && question.length < 200 && answer.length > 20) {
      const category = detectCategory(question, answer, sourcePage)
      faqs.push({
        question,
        answer,
        category,
        source_page: sourcePage,
        tags: [sourcePage.replace('.html', ''), category],
        match_keywords: extractKeywords(question + ' ' + answer),
        match_intents: detectIntent(question),
      })
    }
  }
  
  // Remove duplicates
  const uniqueFAQs = faqs.filter((faq, index, self) =>
    index === self.findIndex(f => f.question.toLowerCase() === faq.question.toLowerCase())
  )
  
  return uniqueFAQs
}

function generateSQLInsert(faqs: ExtractedFAQ[]): string {
  const sql = `-- ============================================================================
-- FAQ ENTRIES FROM MARKETING WEBSITE
-- ============================================================================
-- Extracted from marketing website HTML files
-- Generated: ${new Date().toISOString()}
-- Total FAQs: ${faqs.length}

-- Delete existing FAQs from website (optional - comment out if you want to keep them)
-- DELETE FROM cs_faq_entries WHERE metadata->>'source' = 'marketing_website';

INSERT INTO cs_faq_entries (
  question,
  answer,
  category,
  match_keywords,
  match_intents,
  tags,
  is_default,
  is_active,
  priority,
  metadata
) VALUES
${faqs
  .map(
    (faq, index) => `(
  ${JSON.stringify(faq.question)},
  ${JSON.stringify(faq.answer)},
  ${JSON.stringify(faq.category)},
  ARRAY[${faq.match_keywords.map(k => JSON.stringify(k)).join(', ')}],
  ARRAY[${faq.match_intents.map(i => JSON.stringify(i)).join(', ')}],
  ARRAY[${faq.tags.map(t => JSON.stringify(t)).join(', ')}],
  TRUE,
  TRUE,
  ${10 - Math.floor(index / 10)}, -- Priority decreases slightly for each FAQ
  ${JSON.stringify({ source: 'marketing_website', source_page: faq.source_page })}
)`
  )
  .join(',\n')}
ON CONFLICT DO NOTHING;

-- Update usage tracking
COMMENT ON TABLE cs_faq_entries IS 'Pre-approved FAQ entries - includes FAQs extracted from marketing website';
`

  return sql
}

async function main() {
  console.log('Extracting FAQs from marketing website...')
  
  const allFAQs: ExtractedFAQ[] = []
  const htmlFiles = [
    'pricing.html',
    'connect.html',
    'draft.html',
    'settle.html',
    'index.html',
    'how-it-works.html',
  ]
  
  // Try multiple possible paths
  const possiblePaths = [
    path.join(WEBSITE_PATH, 'marketing'),
    path.join(WEBSITE_PATH, 'src'),
    path.join(WEBSITE_PATH, 'public'),
    WEBSITE_PATH,
  ]
  
  for (const file of htmlFiles) {
    let found = false
    for (const basePath of possiblePaths) {
      const filePath = path.join(basePath, file)
      if (fs.existsSync(filePath)) {
        console.log(`Reading ${file} from ${basePath}...`)
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const faqs = extractFAQsFromHTML(content, file)
          console.log(`  Found ${faqs.length} FAQs`)
          allFAQs.push(...faqs)
          found = true
          break
        } catch (error) {
          console.error(`  Error reading ${filePath}:`, error)
        }
      }
    }
    if (!found) {
      console.log(`  File not found: ${file} (searched in ${possiblePaths.join(', ')})`)
    }
  }
  
  console.log(`\nTotal FAQs extracted: ${allFAQs.length}`)
  
  if (allFAQs.length === 0) {
    console.log('\n⚠️  No FAQs found. Please check:')
    console.log('1. Marketing website path is correct')
    console.log('2. HTML files contain FAQ structures')
    console.log('3. File names match expected patterns')
    return
  }
  
  // Group by category
  const byCategory: Record<string, ExtractedFAQ[]> = {}
  for (const faq of allFAQs) {
    if (!byCategory[faq.category]) {
      byCategory[faq.category] = []
    }
    byCategory[faq.category].push(faq)
  }
  
  console.log('\nBy Category:')
  for (const [category, faqs] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${faqs.length}`)
  }
  
  // Generate SQL
  const sql = generateSQLInsert(allFAQs)
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  fs.writeFileSync(OUTPUT_PATH, sql, 'utf-8')
  console.log(`\n✅ SQL file generated: ${OUTPUT_PATH}`)
  console.log(`\nNext steps:`)
  console.log(`1. Review ${OUTPUT_PATH}`)
  console.log(`2. Run the SQL file against your database:`)
  console.log(`   psql -d your_database -f ${OUTPUT_PATH}`)
  console.log(`3. FAQs will be available to AI agents via Tier1FAQAgent`)
}

main().catch(console.error)
