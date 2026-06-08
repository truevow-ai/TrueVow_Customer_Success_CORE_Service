-- ============================================================================
-- SUPPORT-ORIENTED FAQ ENTRIES
-- ============================================================================
-- Comprehensive set of customer support FAQs (not sales-oriented)
-- These address questions from existing TrueVow customers
-- Total: 63 FAQs across 13 categories
-- ============================================================================
-- 
-- CATEGORIES:
--   - Onboarding (5 FAQs)
--   - Technical (6 FAQs)
--   - Billing (6 FAQs)
--   - Account (5 FAQs)
--   - Intake Service (5 FAQs)
--   - Verify Service (5 FAQs)
--   - Draft Service (5 FAQs)
--   - Settle Service (5 FAQs)
--   - Connect Service (5 FAQs)
--   - Compliance (5 FAQs)
--   - Integrations (4 FAQs)
--   - Reporting (3 FAQs)
--   - Escalation (4 FAQs)
-- ============================================================================

-- ============================================================================
-- SAFETY: Remove existing support FAQs to prevent duplicates
-- ============================================================================
-- This makes the script idempotent (safe to run multiple times)
DELETE FROM cs_faq_entries 
WHERE metadata->>'source' = 'support_faqs';

-- ============================================================================
-- ONBOARDING (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I get started with TrueVow?',
  'Welcome to TrueVow! Your Customer Success Manager (CSM) will schedule an onboarding call to configure your intake script, set up call routing, and connect your integrations. Check your email for the onboarding invitation, or contact support to schedule your call.',
  'onboarding',
  ARRAY['getting started', 'onboarding', 'setup', 'begin', 'start', 'first steps'],
  ARRAY['how_to', 'what_is'],
  ARRAY['onboarding', 'getting-started'],
  TRUE,
  10,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How long does onboarding take?',
  'Onboarding typically takes 1-2 weeks from signup to going live. This includes your CSM call, intake script configuration, team member setup, and integration connections. Your CSM will guide you through each step.',
  'onboarding',
  ARRAY['onboarding time', 'how long', 'duration', 'timeline', 'when live'],
  ARRAY['how_to', 'what_is'],
  ARRAY['onboarding', 'timeline'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I change my intake script after onboarding?',
  'Yes, but intake script changes must be done during a scheduled call with your Customer Success Manager to ensure compliance and proper configuration. Contact your CSM or support to schedule a script review call.',
  'onboarding',
  ARRAY['intake script', 'change script', 'modify script', 'update script', 'edit script'],
  ARRAY['can_i', 'how_to'],
  ARRAY['onboarding', 'intake', 'compliance'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'How do I add team members to my account?',
  'To add team members: 1) Go to Settings → Team Members, 2) Click "Add Team Member", 3) Enter their email and details, 4) Assign roles and permissions. Your Customer Success Manager can help configure roles and permissions if needed.',
  'onboarding',
  ARRAY['add team member', 'add user', 'new user', 'team member', 'add attorney'],
  ARRAY['how_to', 'can_i'],
  ARRAY['onboarding', 'account', 'team'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'What roles and permissions are available?',
  'TrueVow supports multiple roles: Admin (full access), Attorney (case access), Paralegal (limited access), and Viewer (read-only). Your CSM can help configure role-based permissions based on your firm''s needs.',
  'onboarding',
  ARRAY['roles', 'permissions', 'access levels', 'user roles', 'what roles'],
  ARRAY['what_is', 'how_to'],
  ARRAY['onboarding', 'account', 'permissions'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- TECHNICAL (6 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'My calls aren''t routing correctly',
  'To troubleshoot call routing: 1) Check Settings → Call Routing, 2) Verify team members are "Active", 3) Review routing rules match your criteria, 4) Test with a sample call. If issues persist, create a support case and we''ll review your routing configuration.',
  'technical',
  ARRAY['calls not routing', 'routing issue', 'call routing', 'wrong person', 'routing problem'],
  ARRAY['troubleshooting', 'why', 'how_to'],
  ARRAY['technical', 'routing', 'calls'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'I''m getting an error when trying to access my account',
  'If you''re seeing an error, try: 1) Clear your browser cache and cookies, 2) Try a different browser, 3) Check if you''re using the correct login URL, 4) Ensure your account is active. If the error persists, create a support case with the exact error message and we''ll investigate.',
  'technical',
  ARRAY['error', 'cannot access', 'login error', 'access denied', 'account error', 'not working'],
  ARRAY['troubleshooting', 'why', 'what_is'],
  ARRAY['technical', 'account', 'errors'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I integrate my phone system?',
  'Phone integration is configured during onboarding with your CSM. If you need to update your phone settings: 1) Go to Settings → Integrations → Phone, 2) Review your current configuration, 3) Contact support if changes are needed. We support most major phone systems and can help with custom integrations.',
  'technical',
  ARRAY['phone integration', 'phone system', 'connect phone', 'phone setup', 'voip'],
  ARRAY['how_to', 'what_is'],
  ARRAY['technical', 'integrations', 'phone'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'My integration stopped working',
  'If an integration stops working: 1) Check Settings → Integrations to see connection status, 2) Try disconnecting and reconnecting the integration, 3) Verify your credentials haven''t expired, 4) Check if the third-party service is experiencing issues. If it still doesn''t work, create a support case with details.',
  'technical',
  ARRAY['integration not working', 'integration broken', 'integration error', 'sync issue', 'connection lost'],
  ARRAY['troubleshooting', 'why'],
  ARRAY['technical', 'integrations'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I export my data?',
  'To export your data: 1) Go to Settings → Data Export, 2) Select the data type (cases, conversations, reports), 3) Choose date range, 4) Click "Export". Large exports may take time and you''ll receive an email when ready. For custom exports, contact support.',
  'technical',
  ARRAY['export data', 'download data', 'backup', 'data export', 'export cases'],
  ARRAY['how_to', 'can_i'],
  ARRAY['technical', 'reporting', 'data'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'The system is running slowly',
  'If TrueVow is running slowly: 1) Check your internet connection, 2) Try refreshing the page, 3) Clear browser cache, 4) Check if other users are experiencing the same issue. If slowness persists, create a support case with details about when it occurs and we''ll investigate.',
  'technical',
  ARRAY['slow', 'slow loading', 'performance', 'lag', 'taking long', 'not responding'],
  ARRAY['troubleshooting', 'why'],
  ARRAY['technical', 'performance'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- BILLING (6 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I view my invoices?',
  'To view invoices: 1) Go to Settings → Billing, 2) Click "Invoices" tab, 3) View or download any invoice. All invoices are also emailed to your billing contact. If you need a specific invoice, contact billing support.',
  'billing',
  ARRAY['invoice', 'billing', 'payment', 'receipt', 'statement', 'view invoice'],
  ARRAY['how_to', 'where'],
  ARRAY['billing', 'invoices'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'I was charged incorrectly',
  'If you believe you were charged incorrectly: 1) Review your invoice in Settings → Billing, 2) Check your subscription plan and usage, 3) Create a billing support case with details. Our billing team will review and respond within 2 business days.',
  'billing',
  ARRAY['incorrect charge', 'wrong charge', 'billing error', 'overcharged', 'charge dispute'],
  ARRAY['troubleshooting', 'why'],
  ARRAY['billing', 'disputes'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I update my payment method?',
  'To update your payment method: 1) Go to Settings → Billing, 2) Click "Payment Methods", 3) Click "Add New" or "Update", 4) Enter your new payment information. Your new payment method will be used for future charges.',
  'billing',
  ARRAY['payment method', 'credit card', 'update payment', 'change card', 'billing info'],
  ARRAY['how_to', 'can_i'],
  ARRAY['billing', 'payment'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'I need a refund',
  'Refund requests are handled on a case-by-case basis. To request a refund: 1) Create a billing support case, 2) Explain the reason for the refund request, 3) Include relevant invoice numbers. Our billing team will review your request and respond within 2 business days. Refunds are processed according to our refund policy.',
  'billing',
  ARRAY['refund', 'refund request', 'money back', 'cancel subscription refund'],
  ARRAY['how_to', 'can_i'],
  ARRAY['billing', 'refunds'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How does billing work for multiple services?',
  'Each TrueVow service (INTAKE, VERIFY, DRAFT, SETTLE, CONNECT) is billed separately based on your subscription plan. You can view all active subscriptions in Settings → Billing → Subscriptions. Each service has its own usage limits and pricing tier.',
  'billing',
  ARRAY['billing multiple services', 'subscription pricing', 'service billing', 'how billing works'],
  ARRAY['what_is', 'how_to'],
  ARRAY['billing', 'subscriptions'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I change my subscription plan?',
  'Yes, you can upgrade or downgrade your subscription plan at any time. Go to Settings → Billing → Subscriptions, select the service, and click "Change Plan". Plan changes take effect immediately for upgrades, and at the end of your billing cycle for downgrades. Contact support if you need assistance.',
  'billing',
  ARRAY['change plan', 'upgrade', 'downgrade', 'subscription change', 'plan change'],
  ARRAY['can_i', 'how_to'],
  ARRAY['billing', 'subscriptions'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- ACCOUNT (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I change my account email?',
  'To change your account email: 1) Go to Settings → Account, 2) Click "Change Email", 3) Enter your new email and verify it. You''ll receive a confirmation email at the new address. Note: This changes your login email for the account.',
  'account',
  ARRAY['change email', 'update email', 'email address', 'account email'],
  ARRAY['how_to', 'can_i'],
  ARRAY['account', 'settings'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'I forgot my password',
  'To reset your password: 1) Go to the login page, 2) Click "Forgot Password", 3) Enter your email, 4) Check your email for reset instructions. If you don''t receive the email, check spam folder or contact support.',
  'account',
  ARRAY['forgot password', 'reset password', 'password reset', 'can''t login'],
  ARRAY['how_to', 'troubleshooting'],
  ARRAY['account', 'login'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I deactivate a team member?',
  'To deactivate a team member: 1) Go to Settings → Team Members, 2) Find the team member, 3) Click "Deactivate" (or "Remove" if they haven''t been active). Deactivated members lose access immediately but their historical data is preserved.',
  'account',
  ARRAY['deactivate user', 'remove team member', 'disable user', 'remove access'],
  ARRAY['how_to', 'can_i'],
  ARRAY['account', 'team'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I have multiple accounts?',
  'Yes, you can have multiple TrueVow accounts if you manage multiple law firms or practices. Each account is separate with its own billing, team members, and data. Contact support if you need help setting up multiple accounts.',
  'account',
  ARRAY['multiple accounts', 'second account', 'another account', 'multiple firms'],
  ARRAY['can_i', 'how_to'],
  ARRAY['account'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I update my firm information?',
  'To update firm information: 1) Go to Settings → Account → Firm Details, 2) Update the fields you need to change, 3) Click "Save". Changes to firm name or address may require verification. Contact support if you need assistance.',
  'account',
  ARRAY['update firm', 'change firm info', 'firm details', 'company information'],
  ARRAY['how_to', 'can_i'],
  ARRAY['account', 'settings'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- INTAKE SERVICE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I customize my intake questions?',
  'Intake questions are part of your intake script, which is configured during onboarding with your CSM. To modify questions, schedule a call with your Customer Success Manager. They''ll ensure questions are Bar-compliant and properly configured.',
  'intake',
  ARRAY['intake questions', 'customize intake', 'intake script', 'intake form'],
  ARRAY['how_to', 'can_i'],
  ARRAY['intake', 'onboarding'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'Where do I see new intake cases?',
  'New intake cases appear in your INTAKE dashboard. Go to INTAKE → Cases to view all cases. You can filter by status (new, in-progress, qualified, not qualified) and sort by date, priority, or case value.',
  'intake',
  ARRAY['new cases', 'intake cases', 'view cases', 'where cases', 'case dashboard'],
  ARRAY['where', 'how_to'],
  ARRAY['intake', 'cases'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'How do I qualify a case in INTAKE?',
  'To qualify a case: 1) Open the case from INTAKE → Cases, 2) Review the intake information, 3) Click "Qualify" if it meets your criteria, or "Not Qualified" if it doesn''t. Qualified cases can be moved to your case management system.',
  'intake',
  ARRAY['qualify case', 'case qualification', 'mark qualified', 'approve case'],
  ARRAY['how_to'],
  ARRAY['intake', 'cases'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'Can I set up automated case routing?',
  'Yes, automated case routing is configured during onboarding. Your CSM can help set up rules based on case type, value, practice area, or other criteria. To modify routing rules, contact your CSM or create a support case.',
  'intake',
  ARRAY['case routing', 'automated routing', 'auto assign', 'routing rules'],
  ARRAY['can_i', 'how_to'],
  ARRAY['intake', 'automation'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
),
(
  'How do I export intake data?',
  'To export intake data: 1) Go to INTAKE → Reports, 2) Select "Export Data", 3) Choose date range and filters, 4) Click "Export". You can export cases, call transcripts (if enabled), and intake metrics. Large exports are emailed when ready.',
  'intake',
  ARRAY['export intake', 'download cases', 'intake data', 'export cases'],
  ARRAY['how_to', 'can_i'],
  ARRAY['intake', 'reporting'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "intake"}'::jsonb
);

-- ============================================================================
-- VERIFY SERVICE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How does VERIFY work?',
  'VERIFY automatically verifies case information by checking medical records, insurance coverage, and other data sources. When a case is submitted for verification, VERIFY runs automated checks and provides a verification report with findings.',
  'verify',
  ARRAY['how verify works', 'what is verify', 'verify service', 'verification process'],
  ARRAY['what_is', 'how_to'],
  ARRAY['verify'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "verify"}'::jsonb
),
(
  'How long does verification take?',
  'Verification typically completes within 24-48 hours, depending on data source availability and complexity. You''ll receive a notification when verification is complete. Urgent verifications can be expedited - contact support to request priority processing.',
  'verify',
  ARRAY['verification time', 'how long verify', 'verify duration', 'when verified'],
  ARRAY['what_is', 'how_to'],
  ARRAY['verify', 'timeline'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "verify"}'::jsonb
),
(
  'Where do I see verification results?',
  'Verification results appear in VERIFY → Reports. Each case shows verification status, findings, and any flags or issues detected. You can filter by status, date, or case type. Detailed reports are available for each verified case.',
  'verify',
  ARRAY['verification results', 'verify report', 'where results', 'verification status'],
  ARRAY['where', 'how_to'],
  ARRAY['verify', 'reporting'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "verify"}'::jsonb
),
(
  'What data sources does VERIFY check?',
  'VERIFY checks multiple data sources including medical records databases, insurance coverage databases, public records, and other authorized sources. The specific sources checked depend on your subscription tier and the type of case being verified.',
  'verify',
  ARRAY['data sources', 'what sources', 'verify checks', 'verification sources'],
  ARRAY['what_is'],
  ARRAY['verify'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "verify"}'::jsonb
),
(
  'Can I request manual verification?',
  'Yes, you can request manual verification for complex cases. Go to VERIFY → Request Verification, select "Manual Review", and provide case details. Manual verifications may take longer but provide more detailed analysis. Additional fees may apply.',
  'verify',
  ARRAY['manual verification', 'request verification', 'manual review'],
  ARRAY['can_i', 'how_to'],
  ARRAY['verify'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "verify"}'::jsonb
);

-- ============================================================================
-- DRAFT SERVICE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I create a document with DRAFT?',
  'To create a document: 1) Go to DRAFT → New Document, 2) Select document type (motion, brief, letter, etc.), 3) Fill in case details and requirements, 4) Click "Generate". DRAFT creates a Bar-compliant draft based on your case information and templates.',
  'draft',
  ARRAY['create document', 'draft document', 'generate document', 'new document'],
  ARRAY['how_to'],
  ARRAY['draft'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "draft"}'::jsonb
),
(
  'What document types does DRAFT support?',
  'DRAFT supports various document types including motions, briefs, demand letters, settlement agreements, contracts, and more. Available document types depend on your subscription tier. Contact your CSM to see all available templates for your plan.',
  'draft',
  ARRAY['document types', 'what documents', 'templates', 'available documents'],
  ARRAY['what_is'],
  ARRAY['draft'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "draft"}'::jsonb
),
(
  'Can I customize DRAFT templates?',
  'Yes, template customization is available for Enterprise plans. Your CSM can help configure custom templates that match your firm''s style and requirements. Custom templates are Bar-compliant and follow your firm''s formatting guidelines.',
  'draft',
  ARRAY['customize template', 'custom template', 'template customization', 'edit template'],
  ARRAY['can_i', 'how_to'],
  ARRAY['draft'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "draft"}'::jsonb
),
(
  'How accurate are DRAFT documents?',
  'DRAFT documents are generated using Bar-compliant templates and your case data. However, all documents should be reviewed and edited by an attorney before filing. DRAFT provides a starting point that saves time but requires attorney review for accuracy and completeness.',
  'draft',
  ARRAY['accuracy', 'document quality', 'how accurate', 'document review'],
  ARRAY['what_is'],
  ARRAY['draft', 'compliance'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "draft"}'::jsonb
),
(
  'Where are my drafted documents stored?',
  'Drafted documents are stored in DRAFT → Documents. You can view, download, edit, and manage all your drafts from this dashboard. Documents are also linked to their associated cases for easy reference.',
  'draft',
  ARRAY['where documents', 'document storage', 'view documents', 'document library'],
  ARRAY['where', 'how_to'],
  ARRAY['draft'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "draft"}'::jsonb
);

-- ============================================================================
-- SETTLE SERVICE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How does SETTLE help with settlement negotiations?',
  'SETTLE analyzes case data, similar cases, and settlement history to provide settlement recommendations and negotiation strategies. It helps identify optimal settlement ranges and provides data-backed insights for negotiations.',
  'settle',
  ARRAY['settlement', 'settle service', 'how settle works', 'negotiation'],
  ARRAY['what_is', 'how_to'],
  ARRAY['settle'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "settle"}'::jsonb
),
(
  'What data does SETTLE use for recommendations?',
  'SETTLE uses your case data, historical settlement data from similar cases, industry benchmarks, and other authorized data sources to generate recommendations. All data is anonymized and Bar-compliant.',
  'settle',
  ARRAY['settlement data', 'what data', 'settle sources', 'recommendation data'],
  ARRAY['what_is'],
  ARRAY['settle'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "settle"}'::jsonb
),
(
  'How do I access SETTLE recommendations?',
  'SETTLE recommendations appear in SETTLE → Recommendations for each case. You can view settlement ranges, negotiation strategies, and data insights. Recommendations are updated as case information changes.',
  'settle',
  ARRAY['settlement recommendations', 'where recommendations', 'settle report', 'settlement analysis'],
  ARRAY['where', 'how_to'],
  ARRAY['settle', 'reporting'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "settle"}'::jsonb
),
(
  'Can SETTLE negotiate settlements automatically?',
  'No, SETTLE provides data and recommendations but does not automatically negotiate. All settlement negotiations must be conducted by licensed attorneys. SETTLE is a tool to inform your negotiation strategy, not replace attorney judgment.',
  'settle',
  ARRAY['automatic negotiation', 'auto settle', 'automated settlement'],
  ARRAY['can_i', 'what_is'],
  ARRAY['settle', 'compliance'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "settle"}'::jsonb
),
(
  'How accurate are SETTLE recommendations?',
  'SETTLE recommendations are based on data analysis and historical patterns, but settlement outcomes depend on many factors. Recommendations should be used as one input in your decision-making process, not as guarantees. Always exercise professional judgment.',
  'settle',
  ARRAY['settlement accuracy', 'recommendation accuracy', 'how accurate'],
  ARRAY['what_is'],
  ARRAY['settle'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "settle"}'::jsonb
);

-- ============================================================================
-- CONNECT SERVICE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How does CONNECT work?',
  'CONNECT helps you find and connect with medical providers, experts, and other service providers for your cases. You can search by specialty, location, availability, and other criteria. CONNECT also facilitates referrals and tracks connections.',
  'connect',
  ARRAY['connect service', 'how connect works', 'what is connect', 'provider network'],
  ARRAY['what_is', 'how_to'],
  ARRAY['connect'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "connect"}'::jsonb
),
(
  'How do I find a medical provider?',
  'To find a medical provider: 1) Go to CONNECT → Find Providers, 2) Select provider type (doctor, specialist, etc.), 3) Enter location or specialty, 4) Review available providers, 5) Click "Connect" to initiate contact. Providers can respond through CONNECT.',
  'connect',
  ARRAY['find provider', 'medical provider', 'find doctor', 'provider search'],
  ARRAY['how_to', 'where'],
  ARRAY['connect'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "connect"}'::jsonb
),
(
  'Are referrals through CONNECT free?',
  'Yes, referrals through CONNECT are free for law firms. Medical providers may charge their standard fees for services, but the referral connection itself is free. CONNECT helps facilitate the connection but doesn''t charge referral fees.',
  'connect',
  ARRAY['referral cost', 'free referral', 'referral fee', 'connect cost'],
  ARRAY['what_is', 'can_i'],
  ARRAY['connect', 'billing'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "connect"}'::jsonb
),
(
  'How do I track my CONNECT referrals?',
  'All CONNECT referrals are tracked in CONNECT → My Referrals. You can see referral status (pending, accepted, completed), provider responses, and case associations. You''ll also receive notifications when providers respond.',
  'connect',
  ARRAY['track referrals', 'referral status', 'my referrals', 'referral tracking'],
  ARRAY['how_to', 'where'],
  ARRAY['connect'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "connect"}'::jsonb
),
(
  'Can I add my own providers to CONNECT?',
  'Yes, you can add providers you already work with to CONNECT. Go to CONNECT → My Providers → Add Provider, enter provider details, and they''ll be added to your network. This helps you manage all provider relationships in one place.',
  'connect',
  ARRAY['add provider', 'custom provider', 'my providers', 'provider network'],
  ARRAY['can_i', 'how_to'],
  ARRAY['connect'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "connect"}'::jsonb
);

-- ============================================================================
-- COMPLIANCE (5 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'Is TrueVow Bar-compliant?',
  'Yes, TrueVow is designed to be Bar-compliant. We operate on a zero-knowledge principle - we don''t store call recordings, transcripts, or access client PHI. Every call generates a blockchain certificate proving "No PHI was accessed" for Bar compliance.',
  'compliance',
  ARRAY['bar compliant', 'compliance', 'bar ethics', 'ethical', 'bar rules'],
  ARRAY['what_is', 'is_it'],
  ARRAY['compliance', 'bar'],
  TRUE,
  10,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Do you store call recordings?',
  'No. TrueVow operates on a zero-knowledge principle. We do not store call recordings or transcripts. Every call generates a blockchain certificate proving "No PHI was accessed" for Bar compliance. Your client communications remain completely private.',
  'compliance',
  ARRAY['recordings', 'store', 'transcripts', 'privacy', 'zero-knowledge', 'call storage'],
  ARRAY['do_you', 'what_is'],
  ARRAY['compliance', 'privacy', 'zero-knowledge'],
  TRUE,
  10,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'What is zero-knowledge?',
  'Zero-knowledge means TrueVow never stores, records, or accesses your client communications. We don''t see call recordings, transcripts, or client data. Every call generates a blockchain certificate proving "No PHI was accessed" for Bar compliance. This ensures your client communications remain completely private.',
  'compliance',
  ARRAY['zero-knowledge', 'zero knowledge', 'privacy', 'what is'],
  ARRAY['what_is'],
  ARRAY['compliance', 'privacy', 'zero-knowledge'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do you ensure data security?',
  'TrueVow uses enterprise-grade security including encryption in transit and at rest, secure authentication, regular security audits, and compliance with industry standards. We never access your client data and operate on a zero-knowledge principle.',
  'compliance',
  ARRAY['security', 'data security', 'encryption', 'secure', 'protection'],
  ARRAY['what_is', 'how_to'],
  ARRAY['compliance', 'security'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I get a compliance report?',
  'Yes, compliance reports are available for your records. Contact support to request a compliance report that documents TrueVow''s Bar-compliant architecture, zero-knowledge principles, and security measures. Reports are useful for Bar audits or compliance reviews.',
  'compliance',
  ARRAY['compliance report', 'audit report', 'bar audit', 'compliance documentation'],
  ARRAY['can_i', 'how_to'],
  ARRAY['compliance'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- INTEGRATIONS (4 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I connect Google Calendar?',
  'To connect Google Calendar: 1) Go to Settings → Integrations, 2) Click "Connect Google Calendar", 3) Authorize TrueVow access, 4) Select which calendars to sync. We never access your inbox - only create calendar events. Your calendar data remains private and Bar-compliant.',
  'integrations',
  ARRAY['google calendar', 'calendar', 'connect', 'sync'],
  ARRAY['how_to'],
  ARRAY['integrations', 'calendar'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I integrate with my case management system?',
  'Yes, TrueVow integrates with many case management systems. Available integrations depend on your subscription tier. Contact your CSM or support to see available integrations for your system and help with setup.',
  'integrations',
  ARRAY['case management', 'cms integration', 'integrate cms', 'case system'],
  ARRAY['can_i', 'how_to'],
  ARRAY['integrations'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I disconnect an integration?',
  'To disconnect an integration: 1) Go to Settings → Integrations, 2) Find the integration you want to disconnect, 3) Click "Disconnect" or "Remove", 4) Confirm. Disconnecting stops data sync but doesn''t delete historical data.',
  'integrations',
  ARRAY['disconnect', 'remove integration', 'unlink', 'disconnect integration'],
  ARRAY['how_to', 'can_i'],
  ARRAY['integrations'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'My integration isn''t syncing',
  'If an integration isn''t syncing: 1) Check Settings → Integrations for connection status, 2) Try disconnecting and reconnecting, 3) Verify credentials haven''t expired, 4) Check if the third-party service is experiencing issues. If it still doesn''t work, create a support case.',
  'integrations',
  ARRAY['not syncing', 'sync issue', 'integration broken', 'not updating'],
  ARRAY['troubleshooting', 'why'],
  ARRAY['integrations'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- REPORTING (3 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'How do I view my case metrics?',
  'Case metrics are available in each service dashboard (INTAKE, VERIFY, DRAFT, SETTLE, CONNECT). Go to the service → Reports to view metrics like case volume, conversion rates, average case value, and other key performance indicators.',
  'reporting',
  ARRAY['metrics', 'case metrics', 'analytics', 'statistics', 'kpi'],
  ARRAY['how_to', 'where'],
  ARRAY['reporting'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I create custom reports?',
  'Custom reports are available for Enterprise plans. Contact your CSM to discuss custom reporting needs. Standard reports are available in each service dashboard and can be exported in various formats.',
  'reporting',
  ARRAY['custom reports', 'custom analytics', 'custom dashboard'],
  ARRAY['can_i', 'how_to'],
  ARRAY['reporting'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How often are reports updated?',
  'Reports are updated in real-time as data changes. Metrics refresh automatically when you view reports. For exported reports, data is current as of the export time.',
  'reporting',
  ARRAY['report update', 'data refresh', 'when updated', 'report frequency'],
  ARRAY['what_is', 'how_to'],
  ARRAY['reporting'],
  TRUE,
  6,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- ESCALATION (4 FAQs)
-- ============================================================================

INSERT INTO cs_faq_entries (question, answer, category, match_keywords, match_intents, tags, is_default, priority, metadata) VALUES
(
  'When should I create a support case?',
  'Create a support case for: technical issues that persist after troubleshooting, billing questions, account access problems, feature requests, or any issue requiring human assistance. Use the "Create Case" button in support chat or go to Settings → Support → Create Case.',
  'escalation',
  ARRAY['create case', 'support case', 'when to escalate', 'help request'],
  ARRAY['how_to', 'when'],
  ARRAY['escalation', 'support'],
  TRUE,
  9,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How long does it take to get a response?',
  'Support response times vary by priority: Urgent (2 hours), High (4 hours), Medium (1 business day), Low (2 business days). Response times are during business hours (Monday-Friday, 9 AM - 5 PM EST). Urgent issues may have faster response.',
  'escalation',
  ARRAY['response time', 'how long', 'support time', 'when response'],
  ARRAY['what_is', 'how_to'],
  ARRAY['escalation', 'support'],
  TRUE,
  8,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'How do I check my support case status?',
  'To check case status: 1) Go to Settings → Support → My Cases, 2) View all your open and closed cases, 3) Click on a case to see updates and responses. You''ll also receive email notifications when cases are updated.',
  'escalation',
  ARRAY['case status', 'check case', 'support ticket', 'my cases'],
  ARRAY['how_to', 'where'],
  ARRAY['escalation', 'support'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
),
(
  'Can I speak to someone directly?',
  'Yes, for urgent issues you can request a phone call. Create a support case with "Urgent" priority and select "Request Phone Call". Our team will call you during business hours. For non-urgent issues, support chat and email are typically faster.',
  'escalation',
  ARRAY['phone call', 'speak to someone', 'call support', 'phone support'],
  ARRAY['can_i', 'how_to'],
  ARRAY['escalation', 'support'],
  TRUE,
  7,
  '{"source": "support_faqs", "service": "general"}'::jsonb
);

-- ============================================================================
-- COMMENTS & METADATA
-- ============================================================================

COMMENT ON TABLE cs_faq_entries IS 'Support-oriented FAQs for existing TrueVow customers - covers technical, billing, account, service-specific, compliance, and escalation questions';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This seed script inserts 63 support-oriented FAQ entries across 13 categories.
-- All entries are marked as is_default = TRUE, making them available to all tenants.
-- Each entry includes:
--   - Question and answer text
--   - Category classification
--   - Match keywords for search
--   - Match intents for intent-based routing
--   - Tags for filtering
--   - Priority (higher = shown first)
--   - Metadata JSONB with source tracking
--
-- USAGE:
--   - Run this script to populate default support FAQs
--   - Script is idempotent - safe to run multiple times
--   - Existing entries with source='support_faqs' are deleted before insert
--   - All entries use metadata->>'source' = 'support_faqs' for identification
--
-- VERIFICATION:
--   After running, verify with:
--   SELECT COUNT(*) FROM cs_faq_entries WHERE metadata->>'source' = 'support_faqs';
--   Expected result: 63
-- ============================================================================
