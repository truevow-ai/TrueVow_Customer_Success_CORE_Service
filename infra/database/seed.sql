-- CS-Support Service Database Seed Data
-- Version: 2.0
-- Created: 2026-01-10
-- Updated: 2026-01-10 (Fixed table names, tenant_id for pre-sale, resolved_at values)
-- Description: Seed data for development and testing

-- ============================================================================
-- SUPPORT TEAM MEMBERS
-- ============================================================================

-- Note: These are placeholder user IDs. In production, these should be actual Clerk user IDs
-- mapped to internal user records.

INSERT INTO cs_team_members (user_id, clerk_user_id, role, is_active, timezone, work_schedule, skills, max_tickets) VALUES
-- Support Agents
('00000000-0000-0000-0000-000000000001', 'user_support_agent_1', 'support_agent', true, 'Asia/Karachi', 
 '{"start": "18:00", "end": "02:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['technical_support', 'billing', 'product_knowledge'], 10),

('00000000-0000-0000-0000-000000000002', 'user_support_agent_2', 'support_agent', true, 'Asia/Karachi',
 '{"start": "18:00", "end": "02:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['technical_support', 'api_integration', 'troubleshooting'], 10),

-- Support Manager
('00000000-0000-0000-0000-000000000010', 'user_support_manager_1', 'support_manager', true, 'Asia/Karachi',
 '{"start": "14:00", "end": "22:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['team_management', 'process_improvement', 'sla_management'], 0),

-- CSMs
('00000000-0000-0000-0000-000000000020', 'user_csm_1', 'csm', true, 'Asia/Karachi',
 '{"start": "14:00", "end": "22:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['account_management', 'onboarding', 'customer_success'], 5),

('00000000-0000-0000-0000-000000000021', 'user_csm_2', 'csm', true, 'Asia/Karachi',
 '{"start": "14:00", "end": "22:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['account_management', 'onboarding', 'customer_success'], 5),

-- Solutions Engineer
('00000000-0000-0000-0000-000000000030', 'user_solutions_engineer_1', 'solutions_engineer', true, 'Asia/Karachi',
 '{"start": "14:00", "end": "22:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
 ARRAY['technical_troubleshooting', 'api_integration', 'complex_issues', 'code_analysis'], 8);

-- ============================================================================
-- SLA POLICIES
-- ============================================================================

INSERT INTO cs_sla_policies (name, description, priority, first_response_time, resolution_time, is_active) VALUES
('Low Priority SLA', 'Standard SLA for low priority tickets', 'low', '4 hours', '48 hours', true),
('Medium Priority SLA', 'Standard SLA for medium priority tickets', 'medium', '2 hours', '24 hours', true),
('High Priority SLA', 'Standard SLA for high priority tickets', 'high', '1 hour', '12 hours', true),
('Urgent Priority SLA', 'Standard SLA for urgent priority tickets', 'urgent', '30 minutes', '4 hours', true);

-- ============================================================================
-- KNOWLEDGE BASE CATEGORIES
-- ============================================================================

INSERT INTO cs_kb_categories (category_id, name, description, parent_category_id, order_index) VALUES
('10000000-0000-0000-0000-000000000001', 'Getting Started', 'Articles for new users getting started with TrueVow', NULL, 1),
('10000000-0000-0000-0000-000000000002', 'Account Management', 'Articles about managing your account', NULL, 2),
('10000000-0000-0000-0000-000000000003', 'Billing & Payments', 'Articles about billing, payments, and subscriptions', NULL, 3),
('10000000-0000-0000-0000-000000000004', 'Technical Support', 'Technical articles and troubleshooting guides', NULL, 4),
('10000000-0000-0000-0000-000000000005', 'API Documentation', 'API integration guides and references', NULL, 5),
('10000000-0000-0000-0000-000000000006', 'FAQs', 'Frequently asked questions', NULL, 6);

-- ============================================================================
-- KNOWLEDGE BASE ARTICLES (Sample)
-- ============================================================================

INSERT INTO cs_kb_articles (article_id, title, content, excerpt, category_id, tags, status, author_id, published_at) VALUES
('20000000-0000-0000-0000-000000000001', 
 'Welcome to TrueVow Intake™',
 'TrueVow Intake™ is a comprehensive legal intake management platform designed to help law firms streamline their client intake process. This guide will help you get started with the platform and understand its key features.

## Getting Started

1. **Account Setup**: After signing up, you will receive an email with your account credentials.
2. **Initial Configuration**: Complete your profile and set up your practice areas.
3. **First Case**: Create your first intake case to familiarize yourself with the workflow.

## Key Features

- **Automated Intake Forms**: Create custom intake forms for different practice areas
- **Client Communication**: Integrated email and SMS communication
- **Case Management**: Track cases from initial contact to resolution
- **Reporting & Analytics**: Gain insights into your intake process

For more information, contact our support team.',
 'Get started with TrueVow Intake™ in minutes',
 '10000000-0000-0000-0000-000000000001',
 ARRAY['getting-started', 'onboarding'],
 'published',
 '00000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '30 days'),

('20000000-0000-0000-0000-000000000002',
 'How to Update Your Billing Information',
 'To update your billing information, navigate to Settings > Billing in your dashboard.

## Steps to Update Billing

1. Click on your profile icon in the top right corner
2. Select "Settings" from the dropdown menu
3. Navigate to the "Billing" tab
4. Click "Update Payment Method"
5. Enter your new payment details
6. Click "Save Changes"

Your billing information will be updated immediately. You will receive a confirmation email once the changes are processed.

## Security

All payment information is securely encrypted and processed through our payment partner. We never store your full credit card details.',
 'Learn how to update your payment method and billing address',
 '10000000-0000-0000-0000-000000000003',
 ARRAY['billing', 'account'],
 'published',
 '00000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '20 days'),

('20000000-0000-0000-0000-000000000003',
 'API Authentication Guide',
 'All API requests require authentication using API keys. This guide explains how to authenticate your API requests.

## Getting Your API Key

1. Log in to your TrueVow account
2. Navigate to Settings > API Keys
3. Click "Generate New API Key"
4. Copy and securely store your API key

## Using Your API Key

Include your API key in the Authorization header of all API requests:

```
Authorization: Bearer your-api-key-here
```

## Example Request

```bash
curl -X GET https://api.truevow.com/v1/cases \
  -H "Authorization: Bearer your-api-key-here"
```

## Security Best Practices

- Never commit API keys to version control
- Rotate API keys regularly
- Use different keys for different environments
- Revoke keys that are no longer needed',
 'Complete guide to authenticating API requests',
 '10000000-0000-0000-0000-000000000005',
 ARRAY['api', 'technical', 'integration'],
 'published',
 '00000000-0000-0000-0000-000000000030',
 NOW() - INTERVAL '15 days');

-- ============================================================================
-- SAMPLE SUPPORT TICKETS (For Testing)
-- ============================================================================

-- Note: tenant_id and customer_id are placeholders. In production, these should reference actual tenant and customer records.
-- Pre-sale tickets can have NULL tenant_id (they don't have a tenant yet)

INSERT INTO cs_tickets (
    ticket_id, tenant_id, customer_id, customer_email, customer_name, subject, message,
    channel, status, priority, stage, source, assigned_to, created_by, created_at, resolved_at
) VALUES
-- Open ticket
('30000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001',
 '50000000-0000-0000-0000-000000000001',
 'customer1@example.com',
 'John Doe',
 'Unable to access my account',
 'I cannot log in to my account. I keep getting an error message.',
 'email',
 'open',
 'medium',
 'post-sale',
 'customer',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 hours',
 NULL),

-- In progress ticket
('30000000-0000-0000-0000-000000000002',
 '40000000-0000-0000-0000-000000000001',
 '50000000-0000-0000-0000-000000000002',
 'customer2@example.com',
 'Jane Smith',
 'Billing question about subscription',
 'I have a question about my subscription renewal date.',
 'email',
 'in_progress',
 'low',
 'post-sale',
 'customer',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '1 day',
 NULL),

-- Resolved ticket
('30000000-0000-0000-0000-000000000003',
 '40000000-0000-0000-0000-000000000002',
 '50000000-0000-0000-0000-000000000003',
 'customer3@example.com',
 'Bob Johnson',
 'API integration help needed',
 'I need help integrating the API with my system.',
 'chat',
 'resolved',
 'high',
 'post-sale',
 'customer',
 '00000000-0000-0000-0000-000000000030',
 '00000000-0000-0000-0000-000000000030',
 NOW() - INTERVAL '3 days',
 NOW() - INTERVAL '2 days'),

-- Pre-sale ticket (for Sales team)
-- Note: tenant_id is NULL for pre-sale leads (they don't have a tenant yet)
('30000000-0000-0000-0000-000000000004',
 NULL, -- NULL tenant_id for pre-sale leads (allowed by schema)
 NULL,
 'lead1@example.com',
 'Alice Williams',
 'Interested in TrueVow for my law firm',
 'I am interested in learning more about TrueVow for my law firm.',
 'form',
 'open',
 'medium',
 'pre-sale',
 'lead',
 NULL,
 NULL,
 NOW() - INTERVAL '1 hour',
 NULL);

-- ============================================================================
-- SAMPLE SUPPORT MESSAGES
-- ============================================================================

INSERT INTO cs_messages (
    message_id, ticket_id, from_type, from_user_id, sender_id, sender_type, body, is_internal, created_at
) VALUES
-- Customer message
('40000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001',
 'customer',
 NULL,
 'customer1@example.com',
 'customer',
 'I cannot log in to my account. I keep getting an error message.',
 false,
 NOW() - INTERVAL '2 hours'),

-- Agent response
('40000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000001',
 'agent',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'agent',
 'Thank you for contacting us. I can help you with your login issue. Can you please try clearing your browser cache and cookies?',
 false,
 NOW() - INTERVAL '1 hour'),

-- Customer follow-up
('40000000-0000-0000-0000-000000000003',
 '30000000-0000-0000-0000-000000000001',
 'customer',
 NULL,
 'customer1@example.com',
 'customer',
 'I tried that but it still does not work.',
 false,
 NOW() - INTERVAL '30 minutes'),

-- Internal note
('40000000-0000-0000-0000-000000000004',
 '30000000-0000-0000-0000-000000000001',
 'agent',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'agent',
 'Customer is experiencing persistent login issues. May need to reset password or check account status.',
 true,
 NOW() - INTERVAL '25 minutes');

-- ============================================================================
-- SAMPLE ACTIVITY FEED ENTRIES
-- ============================================================================

-- Note: Activity feed entries are typically auto-generated by triggers,
-- but we'll add a few sample entries for testing

INSERT INTO cs_team_activity_feed (
    activity_id, ticket_id, user_id, activity_type, description, created_at
) VALUES
('50000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'ticket_created',
 'Ticket created by customer',
 NOW() - INTERVAL '2 hours'),

('50000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'ticket_assigned',
 'Ticket assigned to Support Agent 1',
 NOW() - INTERVAL '2 hours'),

('50000000-0000-0000-0000-000000000003',
 '30000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'message_sent',
 'Agent sent response to customer',
 NOW() - INTERVAL '1 hour');

-- ============================================================================
-- SAMPLE CUSTOMER HEALTH SCORES
-- ============================================================================

INSERT INTO cs_customer_health_scores (
    health_id, tenant_id, health_score, health_level, factors, previous_score, trend, calculated_at
) VALUES
('60000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001',
 85,
 'healthy',
 '{"usage": 30, "support_tickets": 20, "nps": 25, "payment": 15, "engagement": 10}'::jsonb,
 80,
 'improving',
 NOW() - INTERVAL '1 day'),

('60000000-0000-0000-0000-000000000002',
 '40000000-0000-0000-0000-000000000002',
 45,
 'at_risk',
 '{"usage": 15, "support_tickets": 10, "nps": 10, "payment": 5, "engagement": 5}'::jsonb,
 50,
 'declining',
 NOW() - INTERVAL '1 day');

-- ============================================================================
-- POST-ONBOARDING CUSTOMERS (For CSM Dashboard)
-- ============================================================================

-- Sample post-onboarding customers for dashboard testing
INSERT INTO cs_customer_post_onboarding (
  customer_id, 
  tenant_id, 
  customer_email, 
  go_live_date, 
  onboarding_completed_at, 
  transferred_from_onboarding_at,
  assigned_csm_id,
  health_score,
  churn_risk_level,
  notes,
  metadata
) VALUES
-- Healthy customer
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'john.doe@lawfirm.com', 
 '2026-01-01 10:00:00', '2025-12-28 15:30:00', '2026-01-01 11:00:00',
 '00000000-0000-0000-0000-000000000020', 85, 'low',
 'Active customer with good engagement',
 '{"industry": "Legal", "subscription_tier": "premium", "contract_value": 5000}'::jsonb),

-- At-risk customer
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'jane.smith@legalcorp.com',
 '2026-01-05 09:00:00', '2026-01-01 14:00:00', '2026-01-05 10:00:00',
 '00000000-0000-0000-0000-000000000021', 35, 'high',
 'Customer showing signs of disengagement',
 '{"industry": "Corporate Law", "subscription_tier": "standard", "contract_value": 2500}'::jsonb),

-- Medium-risk customer
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'bob.wilson@firm.com',
 '2025-12-20 11:30:00', '2025-12-15 16:45:00', '2025-12-20 12:00:00',
 '00000000-0000-0000-0000-000000000020', 65, 'medium',
 'Regular customer with occasional support needs',
 '{"industry": "Family Law", "subscription_tier": "basic", "contract_value": 1500}'::jsonb),

-- Critical customer
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'alice.johnson@partners.com',
 '2025-11-15 13:20:00', '2025-11-10 10:15:00', '2025-11-15 14:00:00',
 '00000000-0000-0000-0000-000000000021', 20, 'critical',
 'High churn risk - needs immediate attention',
 '{"industry": "Business Law", "subscription_tier": "enterprise", "contract_value": 10000}'::jsonb);

-- ============================================================================
-- SAMPLE COMMUNICATION DATA
-- ============================================================================

-- Email communications
INSERT INTO cs_email_sends (
  send_id,
  recipient_email,
  subject,
  body,
  status,
  sent_at,
  template_id
) VALUES
('30000000-0000-0000-0000-000000000001', 'john.doe@lawfirm.com', 'Welcome to TrueVow', 'Welcome message content...', 'sent', '2026-01-02 09:00:00', 'welcome'),
('30000000-0000-0000-0000-000000000002', 'jane.smith@legalcorp.com', 'Monthly Check-in', 'How are things going?', 'sent', '2026-01-06 10:30:00', 'checkin'),
('30000000-0000-0000-0000-000000000003', 'bob.wilson@firm.com', 'Product Update', 'New features available', 'sent', '2025-12-22 14:15:00', 'update');

-- SMS communications
INSERT INTO cs_sms_logs (
  log_id,
  to_number,
  message,
  status,
  sent_at,
  provider_response
) VALUES
('40000000-0000-0000-0000-000000000001', 'john.doe@lawfirm.com', 'Your monthly report is ready', 'delivered', '2026-01-03 08:30:00', 'Message delivered successfully'),
('40000000-0000-0000-0000-000000000002', 'jane.smith@legalcorp.com', 'Reminder: upcoming meeting', 'delivered', '2026-01-07 09:15:00', 'Message delivered successfully');

-- Call logs
INSERT INTO cs_call_logs (
  log_id,
  customer_email,
  call_type,
  duration_minutes,
  outcome,
  notes,
  created_at
) VALUES
('50000000-0000-0000-0000-000000000001', 'john.doe@lawfirm.com', 'support', 15, 'resolved', 'Answered questions about new features', '2026-01-04 11:00:00'),
('50000000-0000-0000-0000-000000000002', 'bob.wilson@firm.com', 'checkin', 22, 'follow_up_needed', 'Scheduled follow-up for next week', '2025-12-23 15:30:00');

-- ============================================================================
-- NOTES
-- ============================================================================

-- This seed data is for development and testing purposes only.
-- In production:
-- 1. Replace placeholder UUIDs with actual tenant, customer, and user IDs
-- 2. Ensure all foreign key relationships are valid
-- 3. Use actual Clerk user IDs for user_id and clerk_user_id mappings
-- 4. Adjust timestamps to be realistic for your use case
-- 5. Add more comprehensive test data as needed
-- 6. Pre-sale tickets can have NULL tenant_id (they don't have a tenant yet)
-- 7. All other tickets must have a valid tenant_id
