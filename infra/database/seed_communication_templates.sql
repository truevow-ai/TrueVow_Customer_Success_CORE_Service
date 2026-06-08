-- ============================================================================
-- SEED COMMUNICATION TEMPLATES
-- ============================================================================
-- Inserts communication templates (email, SMS, in-app) for onboarding sequences
-- These templates support the law firm customer onboarding journey

-- Template 1: Pre-Onboarding Preparation Email (Day 0)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'pre_onboarding_email_1',
    'Pre-Onboarding Preparation Email',
    'Welcome email sent by CSM when lead/prospect is assigned, includes preparation checklist',
    'email',
    'pre_onboarding',
    'law_firm_pre_onboarding',
    NULL,
    'Preparing for Your TrueVow Onboarding Call',
    'Hi [Customer Name],

Welcome to TrueVow! We''re excited to help you get started with INTAKE.

I''m [CSM Name], your Customer Success Manager. I''ll be guiding you through the onboarding process to ensure you get the most out of TrueVow.

Before we schedule your 45-minute onboarding call, please take a few minutes to prepare the following information. This will help us make the most of our time together:

📋 **Pre-Onboarding Checklist:**

1. **Firm Information**
   - Firm legal name
   - Practice areas
   - State(s) of practice
   - Firm timezone

2. **Team Member Information**
   - List of attorneys and staff who will use TrueVow
   - Email addresses for each team member
   - Roles and responsibilities
   - Calendar types (Google/Outlook)

3. **Phone Number Setup**
   - Decide: New Twilio number(s) or forward existing office line
   - Area code preferences (if new number)

4. **Calendar & Email Integration**
   - Prepare calendar account access for OAuth
   - Identify firm-wide calendar (if applicable)

5. **Compliance & Data Settings**
   - Review zero-knowledge architecture information
   - Decide on optional 7-day transcript access

📝 **Complete Checklist:** [Link to Pre-Onboarding Checklist]

Once you''ve completed the checklist, you can book your 45-minute onboarding call here:
📅 [Calendly Booking Link - Unlocked when checklist complete]

**What Happens Next:**
1. Complete the pre-onboarding checklist
2. Book your onboarding call (link unlocks when checklist is complete)
3. During the call, I''ll help you set up your TrueVow profile
4. After the call, our team will configure your account
5. You''ll receive a go-live notification when ready

**Questions?**
If you have any questions while preparing, please:
- Reply to this email
- Create a support ticket: [Support Portal Link]
- Call us: [Support Phone Number]

I look forward to helping you get started with TrueVow!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
[CSM Email] | [CSM Phone]',
    NULL, -- HTML version can be added later
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"},
        {"name": "Link to Pre-Onboarding Checklist", "key": "checklist_link", "required": true, "description": "Link to checklist in customer portal"},
        {"name": "Calendly Booking Link", "key": "calendly_link", "required": true, "description": "Calendar booking link (unlocked when checklist complete)"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "Support Phone Number", "key": "support_phone", "required": true, "description": "Support phone number"}
    ]'::jsonb,
    'manual',
    NULL,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    description = EXCLUDED.description,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- Template 2: Checklist Reminder SMS (Day 2)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'pre_onboarding_sms_1',
    'Checklist Reminder SMS',
    'SMS reminder sent on Day 2 if checklist not complete',
    'sms',
    'pre_onboarding',
    'law_firm_pre_onboarding',
    NULL,
    NULL,
    'Hi [Customer Name], this is [CSM Name] from TrueVow. Just checking in - have you had a chance to review the pre-onboarding checklist? Completing it will unlock your onboarding call booking. Questions? Reply here or email [CSM Email]. [Link to Checklist]',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "Link to Checklist", "key": "checklist_link", "required": true, "description": "Link to checklist"}
    ]'::jsonb,
    'date_offset',
    NULL,
    2,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 3: Checklist Completion Confirmation Email (When Customer Books Call)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'pre_onboarding_email_2',
    'Checklist Completion Confirmation',
    'Email sent when customer completes checklist and books onboarding call',
    'email',
    'pre_onboarding',
    'law_firm_pre_onboarding',
    NULL,
    'Onboarding Call Confirmed - [Call Date]',
    'Hi [Customer Name],

Great! I''ve received your onboarding call booking for:

📅 **Date:** [Call Date]
🕐 **Time:** [Call Time] ([Timezone])
⏱️ **Duration:** 45 minutes
🔗 **Meeting Link:** [Zoom/Meeting Link]

**What to Prepare:**
- Have your pre-onboarding checklist available
- Have calendar/email accounts ready for OAuth connection
- Have any questions ready

**What We''ll Cover:**
1. Firm & Team Profile Setup
2. Phone Number Configuration
3. Calendar & Email Integration
4. Compliance & Data Settings
5. Review & Submit

**Before the Call:**
- Review your checklist one more time
- Make sure you have access to your calendar/email accounts
- Prepare any questions you have

I''m looking forward to helping you get started with TrueVow!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Call Date", "key": "call_date", "required": true, "description": "Scheduled call date"},
        {"name": "Call Time", "key": "call_time", "required": true, "description": "Scheduled call time"},
        {"name": "Timezone", "key": "timezone", "required": true, "description": "Customer''s timezone"},
        {"name": "Zoom/Meeting Link", "key": "meeting_link", "required": true, "description": "Meeting link"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"}
    ]'::jsonb,
    'event',
    NULL,
    NULL,
    'call_booked',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 4: Pre-Call Reminder Email (1 Hour Before)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'onboarding_call_email_2',
    'Pre-Call Reminder',
    'Email reminder sent 1 hour before onboarding call',
    'email',
    'onboarding_call',
    'law_firm_onboarding_call',
    NULL,
    'Reminder: Your TrueVow Onboarding Call in 1 Hour',
    'Hi [Customer Name],

Just a friendly reminder that your TrueVow onboarding call is in 1 hour:

📅 **Date:** [Call Date]
🕐 **Time:** [Call Time] ([Timezone])
🔗 **Meeting Link:** [Zoom/Meeting Link]

**Quick Checklist:**
- ✅ Pre-onboarding checklist completed
- ✅ Calendar/email accounts ready for OAuth
- ✅ Questions prepared

**What to Expect:**
- 45-minute guided setup session
- I''ll help you fill in your profile information
- We''ll configure your phone numbers and calendar integrations
- We''ll review compliance settings
- You''ll have time to ask questions

See you soon!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Call Date", "key": "call_date", "required": true, "description": "Scheduled call date"},
        {"name": "Call Time", "key": "call_time", "required": true, "description": "Scheduled call time"},
        {"name": "Timezone", "key": "timezone", "required": true, "description": "Customer''s timezone"},
        {"name": "Zoom/Meeting Link", "key": "meeting_link", "required": true, "description": "Meeting link"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"}
    ]'::jsonb,
    'event',
    NULL,
    NULL,
    'call_reminder_1hour',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 5: Post-Call Summary Email (After Call)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'onboarding_call_email_3',
    'Post-Call Summary',
    'Email sent after onboarding call is completed',
    'email',
    'onboarding_call',
    'law_firm_onboarding_call',
    NULL,
    'Onboarding Call Complete - Next Steps',
    'Hi [Customer Name],

Thank you for taking the time to complete your TrueVow onboarding call today! It was great working with you.

**What We Accomplished:**
✅ Firm & Team Profile Setup
✅ Phone Number Configuration
✅ Calendar & Email Integration
✅ Compliance & Data Settings
✅ Profile Submitted for Configuration

**What Happens Next:**
1. Our internal team will configure your account based on the information we collected
2. This typically takes 1-2 business days
3. You''ll receive a go-live notification when your account is ready
4. You can then start testing TrueVow INTAKE

**Timeline:**
- **Account Configuration:** 1-2 business days
- **Go-Live Notification:** You''ll receive an email when ready
- **Testing Period:** You can test INTAKE as soon as you receive the notification

**Support During Configuration:**
If you have any questions or need to make changes, please:
- Reply to this email
- Create a support ticket: [Support Portal Link]
- Call us: [Support Phone Number]

**Next Steps:**
- Keep an eye on your email for the go-live notification
- Prepare any questions you have about using INTAKE
- Review the TrueVow documentation: [Documentation Link]

I''ll be here to help you throughout your first 90 days with TrueVow. Don''t hesitate to reach out if you need anything!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
[CSM Email] | [CSM Phone]',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "Support Phone Number", "key": "support_phone", "required": true, "description": "Support phone number"},
        {"name": "Documentation Link", "key": "documentation_link", "required": true, "description": "Link to TrueVow documentation"}
    ]'::jsonb,
    'event',
    NULL,
    NULL,
    'onboarding_call_completed',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 6: Go-Live Notification Email (When Account Ready)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'onboarding_call_email_4',
    'Go-Live Notification',
    'Email sent when account is configured and ready for testing',
    'email',
    'onboarding_call',
    'law_firm_onboarding_call',
    NULL,
    '🎉 Your TrueVow System is Ready!',
    'Hi [Customer Name],

Great news! Your TrueVow account is now configured and ready to use.

🚀 **You can now start testing TrueVow INTAKE!**

**What You Can Do Now:**
✅ Test incoming calls with your new phone number
✅ Test calendar integration and scheduling
✅ Test intake workflows
✅ Explore TrueVow features

**Getting Started:**
1. **Login:** [Login Link]
2. **Test Phone Number:** [Phone Number]
3. **Documentation:** [Documentation Link]
4. **Support:** [Support Portal Link]

**First 90 Days Support:**
During your first 90 days, you have:
- ✅ Priority support from our CSM team
- ✅ 24/7 AI agent assistance
- ✅ Weekly check-ins (first 30 days)
- ✅ Proactive issue detection

**Need Help?**
- **AI Agent:** Available 24/7 in your dashboard
- **Support Tickets:** Create a ticket anytime
- **CSM:** [CSM Name] - [CSM Email] | [CSM Phone]

**What''s Next:**
- Start testing INTAKE with test calls
- Set up your intake workflows
- Train your team on TrueVow features
- Monitor your first real calls

I''ll be checking in with you regularly during your first 90 days. If you have any questions or run into any issues, don''t hesitate to reach out!

Welcome to TrueVow! 🎉

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Login Link", "key": "login_link", "required": true, "description": "Link to TrueVow login"},
        {"name": "Phone Number", "key": "phone_number", "required": true, "description": "Assigned phone number"},
        {"name": "Documentation Link", "key": "documentation_link", "required": true, "description": "Link to documentation"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"}
    ]'::jsonb,
    'event',
    NULL,
    NULL,
    'account_go_live',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 7: Week 1 Check-In Email (Day 7)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_email_2',
    'Week 1 Check-In',
    'Email check-in sent 7 days after go-live',
    'email',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    'Week 1 Check-In - How''s TrueVow Working for You?',
    'Hi [Customer Name],

It''s been a week since you went live with TrueVow! I wanted to check in and see how things are going.

**Quick Questions:**
- How are you finding TrueVow so far?
- Have you had a chance to test INTAKE?
- Any questions or issues?

**Resources:**
- 📚 Documentation: [Documentation Link]
- 🎥 Video Tutorials: [Tutorials Link]
- 💬 AI Agent: Available 24/7 in your dashboard
- 🎫 Support: [Support Portal Link]

**I''m Here to Help:**
If you have any questions or need assistance, please don''t hesitate to reach out:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

I''ll be checking in with you regularly during your first 90 days. Looking forward to hearing how TrueVow is helping your practice!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Documentation Link", "key": "documentation_link", "required": true, "description": "Link to documentation"},
        {"name": "Tutorials Link", "key": "tutorials_link", "required": true, "description": "Link to video tutorials"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"}
    ]'::jsonb,
    'date_offset',
    NULL,
    7,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 8: Week 2 Check-In Email (Day 14)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_email_3',
    'Week 2 Check-In',
    'Email check-in sent 14 days after go-live',
    'email',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    'Week 2 Check-In - TrueVow Progress Update',
    'Hi [Customer Name],

We''re two weeks in! I hope TrueVow is starting to become a natural part of your workflow.

**How Are Things Going?**
- Are you seeing value from TrueVow?
- Any features you''d like to explore more?
- Any challenges we can help with?

**Pro Tips:**
- 💡 Use the AI agent for quick questions (available 24/7)
- 💡 Review your intake analytics in the dashboard
- 💡 Customize your intake workflows to match your process
- 💡 Set up automated follow-ups for leads

**Support:**
Remember, I''m here to help:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]
- AI Agent: Available 24/7 in your dashboard

**Next Check-In:**
I''ll be checking in with you again at the end of Month 1. In the meantime, don''t hesitate to reach out if you need anything!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"}
    ]'::jsonb,
    'date_offset',
    NULL,
    14,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 9: Month 1 Summary Email (Day 30)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_email_4',
    'Month 1 Summary',
    'Email summary sent 30 days after go-live with usage stats',
    'email',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    'Month 1 Summary - Your TrueVow Journey',
    'Hi [Customer Name],

Congratulations on completing your first month with TrueVow! 🎉

**Your Month 1 Stats:**
- 📞 Total Calls: [Call Count]
- 📋 Intakes Completed: [Intake Count]
- ⏱️ Average Response Time: [Response Time]
- 📈 Usage Trend: [Trend Description]

**What''s Working Well:**
Based on your usage, here''s what we''re seeing:
- ✅ [Positive Metric 1]
- ✅ [Positive Metric 2]
- ✅ [Positive Metric 3]

**Opportunities:**
- 💡 [Suggestion 1]
- 💡 [Suggestion 2]
- 💡 [Suggestion 3]

**Support Summary:**
- 🎫 Support Tickets: [Ticket Count]
- 🤖 AI Agent Resolutions: [AI Resolution Count]
- 👤 CSM Escalations: [Escalation Count]

**Next 30 Days:**
- We''ll continue to support you with bi-weekly check-ins
- AI agent remains available 24/7
- CSM team available for complex issues

**Questions or Feedback?**
I''d love to hear about your experience so far:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

Thank you for being a TrueVow customer. I''m excited to see your continued success!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Call Count", "key": "call_count", "required": false, "description": "Total calls in month 1"},
        {"name": "Intake Count", "key": "intake_count", "required": false, "description": "Total intakes completed"},
        {"name": "Response Time", "key": "response_time", "required": false, "description": "Average response time"},
        {"name": "Trend Description", "key": "trend_description", "required": false, "description": "Usage trend description"},
        {"name": "Positive Metric 1", "key": "positive_metric_1", "required": false, "description": "Positive metric from analytics"},
        {"name": "Positive Metric 2", "key": "positive_metric_2", "required": false, "description": "Positive metric from analytics"},
        {"name": "Positive Metric 3", "key": "positive_metric_3", "required": false, "description": "Positive metric from analytics"},
        {"name": "Suggestion 1", "key": "suggestion_1", "required": false, "description": "Suggestion based on usage"},
        {"name": "Suggestion 2", "key": "suggestion_2", "required": false, "description": "Suggestion based on usage"},
        {"name": "Suggestion 3", "key": "suggestion_3", "required": false, "description": "Suggestion based on usage"},
        {"name": "Ticket Count", "key": "ticket_count", "required": false, "description": "Support tickets in month 1"},
        {"name": "AI Resolution Count", "key": "ai_resolution_count", "required": false, "description": "AI agent resolutions"},
        {"name": "Escalation Count", "key": "escalation_count", "required": false, "description": "CSM escalations"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"}
    ]'::jsonb,
    'date_offset',
    NULL,
    30,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 10: Month 2 Check-In Email (Day 60)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_email_5',
    'Month 2 Check-In',
    'Email check-in sent 60 days after go-live',
    'email',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    'Month 2 Check-In - How Can We Help?',
    'Hi [Customer Name],

You''re two months into your TrueVow journey! I hope you''re seeing great results.

**How''s Everything Going?**
- Are you happy with TrueVow?
- Any features you''d like to explore?
- Any challenges we can help with?

**Support:**
- 🤖 AI Agent: Available 24/7 for quick questions
- 👤 CSM Team: Available for complex issues
- 🎫 Support Tickets: [Support Portal Link]

**Resources:**
- 📚 Documentation: [Documentation Link]
- 🎥 Video Tutorials: [Tutorials Link]
- 💡 Best Practices: [Best Practices Link]

**Next Check-In:**
I''ll check in with you again at the end of Month 3. In the meantime, don''t hesitate to reach out!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "Documentation Link", "key": "documentation_link", "required": true, "description": "Link to documentation"},
        {"name": "Tutorials Link", "key": "tutorials_link", "required": true, "description": "Link to video tutorials"},
        {"name": "Best Practices Link", "key": "best_practices_link", "required": true, "description": "Link to best practices"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"}
    ]'::jsonb,
    'date_offset',
    NULL,
    60,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 11: Month 3 Check-In Email (Day 90)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_email_6',
    'Month 3 Check-In',
    'Email check-in sent 90 days after go-live, transitioning to standard support',
    'email',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    'Month 3 Check-In - Transitioning to Standard Support',
    'Hi [Customer Name],

Congratulations on completing your first 90 days with TrueVow! 🎉

**Your 90-Day Journey:**
- 📞 Total Calls: [Total Call Count]
- 📋 Intakes Completed: [Total Intake Count]
- ✅ Support Tickets Resolved: [Total Ticket Count]
- 📈 Usage Growth: [Growth Description]

**What''s Next:**
You''re now transitioning from intensive onboarding support to our standard support model:
- 🤖 AI Agent: Primary support (available 24/7)
- 👤 CSM Team: Available for critical issues
- 📅 Monthly Check-Ins: Instead of weekly/bi-weekly
- 🎫 Support Tickets: Always available

**Thank You:**
Thank you for being a TrueVow customer. I''ve enjoyed working with you during your first 90 days, and I''m excited to see your continued success!

**Support:**
- AI Agent: Available 24/7 in your dashboard
- Support Tickets: [Support Portal Link]
- CSM Team: Available for critical issues

**Feedback:**
I''d love to hear about your experience:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

Best regards,
[CSM Name]
Customer Success Manager
TrueVow',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Total Call Count", "key": "total_call_count", "required": false, "description": "Total calls in 90 days"},
        {"name": "Total Intake Count", "key": "total_intake_count", "required": false, "description": "Total intakes in 90 days"},
        {"name": "Total Ticket Count", "key": "total_ticket_count", "required": false, "description": "Total support tickets"},
        {"name": "Growth Description", "key": "growth_description", "required": false, "description": "Usage growth description"},
        {"name": "Support Portal Link", "key": "support_portal_link", "required": true, "description": "Link to support portal"},
        {"name": "CSM Name", "key": "csm_name", "required": true, "description": "Assigned CSM''s name"},
        {"name": "CSM Email", "key": "csm_email", "required": true, "description": "CSM''s email address"},
        {"name": "CSM Phone", "key": "csm_phone", "required": false, "description": "CSM''s phone number"}
    ]'::jsonb,
    'date_offset',
    NULL,
    90,
    NULL,
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 12: Critical Issue SMS Notification
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_sms_critical',
    'Critical Issue SMS Notification',
    'SMS sent when critical support ticket is created or escalated',
    'sms',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    NULL,
    'Hi [Customer Name], we''ve received your support ticket #[Ticket ID] and our team is working on it. You can track it here: [Ticket Link]. For urgent issues, call [Support Phone].',
    NULL,
    '[
        {"name": "Customer Name", "key": "customer_name", "required": true, "description": "Customer''s full name"},
        {"name": "Ticket ID", "key": "ticket_id", "required": true, "description": "Support ticket ID"},
        {"name": "Ticket Link", "key": "ticket_link", "required": true, "description": "Link to support ticket"},
        {"name": "Support Phone", "key": "support_phone", "required": true, "description": "Support phone number"}
    ]'::jsonb,
    'event',
    NULL,
    NULL,
    'critical_ticket_created',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Template 13: AI Agent Welcome Message (In-App)
INSERT INTO cs_communication_templates (
    template_key,
    template_name,
    description,
    template_type,
    category,
    sequence_template_key,
    milestone_key,
    subject,
    body,
    body_html,
    variables,
    trigger_type,
    trigger_milestone_key,
    trigger_days_offset,
    trigger_event,
    send_from_email,
    send_from_name,
    is_active,
    is_default,
    tenant_id,
    created_at
) VALUES (
    'post_onboarding_in_app_welcome',
    'AI Agent Welcome Message',
    'In-app welcome message shown when customer first accesses dashboard after go-live',
    'in_app',
    'post_onboarding',
    'law_firm_post_onboarding_90_days',
    NULL,
    NULL,
    '👋 Welcome to TrueVow! I''m your AI assistant, here to help 24/7.

I can help you with:
- Setting up intake workflows
- Understanding TrueVow features
- Troubleshooting issues
- Best practices

What would you like to know?',
    NULL,
    '[]'::jsonb,
    'event',
    NULL,
    NULL,
    'first_dashboard_access',
    NULL,
    NULL,
    TRUE,
    TRUE,
    NULL,
    NOW()
) ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Add comments
COMMENT ON TABLE cs_communication_templates IS 'Communication templates seeded for onboarding sequences - 13 templates total (9 emails, 2 SMS, 1 in-app, 1 call confirmation)';

-- Add comments
COMMENT ON TABLE cs_communication_templates IS 'Communication templates seeded for onboarding sequences - 13 templates total (9 emails, 2 SMS, 1 in-app, 1 call confirmation)';
