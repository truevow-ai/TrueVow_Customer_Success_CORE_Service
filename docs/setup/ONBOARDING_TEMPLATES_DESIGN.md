# Onboarding Templates Design Plan

## Overview

The onboarding sequence infrastructure is complete and ready. We now need to design the **actual templates and content** for law firm customer onboarding.

## Templates to Design

### 1. Law Firm Customer Profile Account Creation
**Stage**: `account_setup`  
**Milestone**: `account_created`

**What to Design**:
- Welcome email template
- Account setup guide
- Profile completion checklist
- Initial configuration walkthrough

**Content Needed**:
- Email subject lines
- Email body content
- SMS messages (if applicable)
- Call scripts (if applicable)
- In-app notifications

**Integration Points**:
- Platform Service: Account creation event
- CS Support: Trigger welcome communication
- Tenant App: Profile setup UI

---

### 2. Tenant Spin Up
**Stage**: `account_setup` → `initial_config`  
**Milestones**: `tenant_created`, `tenant_configured`, `initial_settings_complete`

**What to Design**:
- Tenant creation workflow
- Initial configuration templates
- Settings setup guide
- Team member invitation process

**Content Needed**:
- Step-by-step tenant setup guide
- Configuration checklist
- Email templates for team invitations
- SMS reminders for incomplete setup
- Call scripts for setup assistance

**Integration Points**:
- Platform Service: Tenant creation event
- Tenant App: Configuration UI
- CS Support: Track progress, send reminders

---

### 3. Intake Initial Config
**Stage**: `initial_config` → `first_use`  
**Milestones**: `intake_configured`, `intake_forms_created`, `intake_workflow_setup`

**What to Design**:
- Intake system setup guide
- Form creation templates
- Workflow configuration guide
- Integration setup (if needed)

**Content Needed**:
- Intake setup email series
- Form template library
- Workflow examples
- SMS check-ins during setup
- Call scripts for complex configurations

**Integration Points**:
- INTAKE Service: Configuration events
- CS Support: Track milestones, send guides
- Platform Service: Feature usage tracking

---

### 4. Calendar Integration Steps
**Stage**: `initial_config`  
**Milestones**: `calendar_integration_setup`, `calendar_synced`, `multiple_calendars_added`, `master_calendar_configured`

**What to Design**:
- Calendar integration setup guide (Google Calendar, Outlook, etc.)
- Multiple calendar support documentation
- Calendar sync confirmation
- **Master calendar setup guide** (firm-wide calendar)
- Best practices for calendar management

**Content Needed**:
- Calendar integration setup emails
- Step-by-step OAuth connection guides
- Multiple calendar setup guides
- **Master calendar configuration guide** (firm-wide events, court dates, team coordination)
- SMS reminders for calendar setup
- Call scripts for calendar integration support
- **Call script for master calendar setup** (important - may need call support)

**Integration Points**:
- Calendar Service: Integration setup events
- CS Support: Track calendar milestones
- Platform Service: Calendar sync status events

### 5. Integration Phone and SMS Steps
**Stage**: `initial_config` → `first_use`  
**Milestones**: `phone_integration_setup`, `sms_integration_setup`, `first_call_made`, `first_sms_sent`

**What to Design**:
- Phone integration setup guide
- SMS integration setup guide
- First call/SMS tutorials
- Best practices documentation

**Content Needed**:
- Integration setup emails
- Step-by-step integration guides
- Video tutorials (links)
- SMS reminders for setup completion
- Call scripts for integration support

**Integration Points**:
- Twilio/Plivo: Integration setup
- CS Support: Track integration milestones
- Platform Service: Integration status events

---

## Template Structure

Each template will include:

### Email Templates
```json
{
  "template_id": "uuid",
  "name": "Welcome Email - Account Created",
  "subject": "Welcome to TrueVow! Let's get you started",
  "body_html": "...",
  "body_text": "...",
  "variables": ["customer_name", "tenant_name", "next_steps"],
  "milestone_key": "account_created"
}
```

### SMS Templates
```json
{
  "template_id": "uuid",
  "name": "Setup Reminder SMS",
  "message": "Hi {{customer_name}}, don't forget to complete your TrueVow setup! {{setup_link}}",
  "variables": ["customer_name", "setup_link"],
  "milestone_key": "tenant_configured"
}
```

### Call Scripts
```json
{
  "script_id": "uuid",
  "name": "Welcome Call - Account Setup",
  "script": [
    "Welcome to TrueVow!",
    "Let's walk through your account setup...",
    "..."
  ],
  "milestone_key": "account_created",
  "estimated_duration_minutes": 15
}
```

---

## Design Process

### Phase 1: Content Creation
1. **Law Firm Research**
   - Common onboarding pain points
   - Typical setup workflows
   - Best practices for legal tech onboarding

2. **Content Writing**
   - Email copywriting
   - SMS message crafting
   - Call script development
   - Documentation creation

3. **Template Design**
   - Visual design (if HTML emails)
   - Brand consistency
   - Mobile responsiveness

### Phase 2: Template Implementation
1. **Create Templates in Database**
   - Insert email templates
   - Insert SMS templates
   - Insert call scripts

2. **Link to Milestones**
   - Associate templates with milestones
   - Configure trigger conditions
   - Set timing/delays

3. **Test Sequences**
   - Test email delivery
   - Test SMS delivery
   - Test call scheduling
   - Verify milestone completion

### Phase 3: Customization
1. **A/B Testing**
   - Test different email subject lines
   - Test different SMS messages
   - Test different call scripts

2. **Personalization**
   - Customize by law firm size
   - Customize by practice area
   - Customize by customer type

3. **Optimization**
   - Track open rates
   - Track click rates
   - Track completion rates
   - Optimize based on data

---

## Integration Checklist

### Platform Service Integration
- [ ] Account creation webhook configured
- [ ] Tenant creation webhook configured
- [ ] Feature usage events configured
- [ ] Integration status events configured

### CS Support Integration
- [ ] Email templates stored in database
- [ ] SMS templates stored in database
- [ ] Call scripts stored in database
- [ ] Milestone → template mapping configured
- [ ] Communication scheduling working

### Tenant App Integration
- [ ] Profile setup UI complete
- [ ] Configuration UI complete
- [ ] Integration setup UI complete
- [ ] Progress tracking UI complete

### INTAKE Service Integration
- [ ] Intake configuration events
- [ ] Form creation events
- [ ] Workflow setup events

---

## Default Sequence Structure (Placeholder)

```json
{
  "name": "Law Firm Onboarding - Default",
  "stages": [
    {
      "stage_key": "account_setup",
      "milestones": [
        "account_created",
        "email_verified",
        "profile_completed"
      ]
    },
    {
      "stage_key": "initial_config",
      "milestones": [
        "tenant_created",
        "tenant_configured",
        "team_members_added",
        "calendar_integration_setup",
        "calendar_synced",
        "multiple_calendars_added",
        "master_calendar_configured",
        "phone_integration_setup",
        "sms_integration_setup"
      ]
    },
    {
      "stage_key": "first_use",
      "milestones": [
        "intake_configured",
        "intake_forms_created",
        "intake_workflow_setup",
        "first_call_made",
        "first_sms_sent"
      ]
    },
    {
      "stage_key": "training",
      "milestones": [
        "training_completed",
        "resources_viewed",
        "support_contacted"
      ]
    },
    {
      "stage_key": "go_live",
      "milestones": [
        "production_deployed",
        "first_production_use",
        "monitoring_setup"
      ]
    }
  ]
}
```

---

## Next Steps

1. **Content Design** (Future)
   - Hire content writer or use AI to generate templates
   - Review with legal tech experts
   - Get customer feedback

2. **Template Creation** (Future)
   - Create templates in database
   - Link to milestones
   - Configure triggers

3. **Testing** (Future)
   - Test with beta customers
   - Iterate based on feedback
   - Optimize conversion rates

---

## Current Status

✅ **Infrastructure Complete**
- Database schema ready
- Service layer ready
- API endpoints ready
- Webhook handlers ready
- Milestone detection ready

⏳ **Templates Pending**
- Email templates: To be designed
- SMS templates: To be designed
- Call scripts: To be designed
- Content: To be written

---

## Notes

- The infrastructure is **flexible** - we can add/remove milestones easily
- Templates can be **customized** per tenant or customer type
- Sequences can be **A/B tested** for optimization
- All communications are **tracked** for analytics

The system is ready - we just need to design the actual content and templates!
