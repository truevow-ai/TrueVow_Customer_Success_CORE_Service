-- ============================================================================
-- SEED FAQ ENTRIES
-- ============================================================================
-- Pre-approved FAQ questions and answers for Tier 1 Rule-Based FAQ Agent
-- These are deterministic, zero-risk responses that don't use LLM

-- Onboarding FAQs
INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority) VALUES
(
  'How do I connect Google Calendar?',
  'To connect Google Calendar: 1) Go to Settings → Integrations, 2) Click "Connect Google Calendar", 3) Authorize TrueVow access, 4) Select which calendars to sync. We never access your inbox - only create calendar events. Your calendar data remains private and Bar-compliant.',
  'onboarding',
  ARRAY['google calendar', 'calendar', 'connect', 'sync'],
  ARRAY['how_to'],
  ARRAY['onboarding', 'calendar', 'integration'],
  TRUE,
  10
),
(
  'Can I change my intake script?',
  'Intake scripts can only be modified during your scheduled success call with your Customer Success Manager. This ensures compliance and proper configuration. Contact your CSM to schedule a call.',
  'onboarding',
  ARRAY['intake script', 'script', 'change', 'modify'],
  ARRAY['can_i', 'how_to'],
  ARRAY['onboarding', 'intake', 'compliance'],
  TRUE,
  9
),
(
  'Do you store call recordings?',
  'No. TrueVow operates on a zero-knowledge principle. We do not store call recordings or transcripts. Every call generates a blockchain certificate proving "No PHI was accessed" for Bar compliance. Your client communications remain completely private.',
  'compliance',
  ARRAY['recordings', 'store', 'transcripts', 'privacy', 'zero-knowledge'],
  ARRAY['do_you', 'what_is'],
  ARRAY['compliance', 'privacy', 'zero-knowledge'],
  TRUE,
  10
),
(
  'Is this Bar-compliant?',
  'Yes. TrueVow is built for ABA Rule 1.6 compliance: - No recordings - No transcripts - Every call generates a blockchain certificate proving "No PHI accessed" - Zero-knowledge architecture. Your CSM can walk you through a mock audit if needed.',
  'compliance',
  ARRAY['bar', 'compliance', 'aba', 'rule 1.6', 'compliant'],
  ARRAY['is_this', 'what_is'],
  ARRAY['compliance', 'bar', 'legal'],
  TRUE,
  10
),
(
  'How do I use Settle™?',
  'Settle™ shows anonymized settlement ranges using public court records (e.g., "Rear-end, $50K medicals, Miami" → $52K–$89K). It uses no client data. Your Customer Success Manager will demo this in your success call. We don''t store any client information.',
  'features',
  ARRAY['settle', 'settlement', 'how to use'],
  ARRAY['how_to', 'what_is'],
  ARRAY['features', 'settle'],
  TRUE,
  8
),
(
  'I can''t connect Outlook',
  'To connect Outlook: 1) Go to Settings → Integrations, 2) Click "Connect Outlook", 3) Sign in with your Microsoft account, 4) Authorize TrueVow access. If it still fails, I''ll alert your CSM to walk you through it. Remember: We never access your inbox - only create calendar events.',
  'technical',
  ARRAY['outlook', 'connect', 'microsoft', 'can''t', 'error'],
  ARRAY['how_to', 'troubleshooting'],
  ARRAY['technical', 'outlook', 'integration'],
  TRUE,
  7
),
(
  'How do I enable Spanish mode?',
  'To enable Spanish mode: 1) Go to Settings → Language, 2) Select "Spanish" from the language dropdown, 3) Save settings. Your intake forms and communications will now default to Spanish. Contact your CSM if you need help configuring this.',
  'features',
  ARRAY['spanish', 'language', 'enable', 'mode'],
  ARRAY['how_to'],
  ARRAY['features', 'language', 'localization'],
  TRUE,
  6
),
(
  'I want to add a new attorney',
  'To add a new attorney: 1) Go to Settings → Team Members, 2) Click "Add Team Member", 3) Enter attorney details, 4) Assign roles and permissions. Your Customer Success Manager can help with role configuration and permissions setup.',
  'account',
  ARRAY['add attorney', 'new attorney', 'team member', 'user'],
  ARRAY['how_to', 'can_i'],
  ARRAY['account', 'team', 'users'],
  TRUE,
  6
),
(
  'My calls aren''t routing to Maria',
  'To fix call routing: 1) Check Settings → Call Routing, 2) Verify Maria''s status is "Active", 3) Check routing rules match your criteria, 4) Test with a sample call. If issues persist, your CSM can review your routing configuration. We don''t access your call data - only routing settings.',
  'technical',
  ARRAY['calls', 'routing', 'not routing', 'maria', 'phone'],
  ARRAY['troubleshooting', 'why'],
  ARRAY['technical', 'routing', 'calls'],
  TRUE,
  7
),
(
  'What is zero-knowledge?',
  'Zero-knowledge means TrueVow never stores, records, or accesses your client communications. We don''t see call recordings, transcripts, or client data. Every call generates a blockchain certificate proving "No PHI was accessed" for Bar compliance. This ensures your client communications remain completely private.',
  'compliance',
  ARRAY['zero-knowledge', 'zero knowledge', 'privacy', 'what is'],
  ARRAY['what_is'],
  ARRAY['compliance', 'privacy', 'zero-knowledge'],
  TRUE,
  9
);

-- Update usage count trigger (optional - for analytics)
COMMENT ON TABLE cs_faq_entries IS 'Pre-approved FAQ entries for Tier 1 Rule-Based FAQ Agent - deterministic, zero-risk responses';
