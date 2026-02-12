# Onboarding Sequence Mapping Strategy

## Overview

The onboarding sequence system maps customers through predefined stages and milestones, triggering automated communications and tracking progress.

## Mapping Architecture

### 1. Sequence Templates

**Purpose**: Reusable onboarding templates with stages, milestones, and communication flows.

**Structure**:
```typescript
{
  sequence_id: UUID
  name: "Default Onboarding"
  stages: [
    { stage_key: "account_setup", milestones: [...] },
    { stage_key: "initial_config", milestones: [...] },
    ...
  ]
  milestones: [
    { milestone_key: "account_created", trigger_email: true, ... },
    { milestone_key: "first_login", trigger_sms: true, ... },
    ...
  ]
  communication_flows: [...]
}
```

### 2. Customer Progress Tracking

**Purpose**: Track each customer's individual progress through their assigned sequence.

**Mapping Flow**:
```
Customer Signs Up
    ↓
Assign Default Sequence (or custom)
    ↓
Create Onboarding Progress Record
    ↓
Set current_milestone = first milestone
    ↓
Trigger First Communication (if configured)
    ↓
Wait for Milestone Completion
    ↓
Detect Completion (webhook/API/manual)
    ↓
Update Progress:
  - Add to milestones_completed
  - Remove from milestones_pending
  - Set current_milestone = next milestone
  - Update onboarding_stage
  - Calculate completion_percentage
    ↓
Trigger Next Communication (if configured)
    ↓
Repeat until all milestones complete
    ↓
Mark onboarding_stage = 'completed'
```

### 3. Milestone Detection Methods

#### A. Webhook Events (Automatic)
**Source**: Platform Service, Tenant App, INTAKE, DRAFT services

**Mapping**:
```typescript
Platform Event → Milestone Key
'account.created' → 'account_created'
'user.login.first' → 'first_login'
'user.email.verified' → 'email_verified'
'feature.used.first' → 'first_feature_used'
...
```

**Webhook Endpoint**: `POST /api/v1/webhooks/platform/milestone`

**Flow**:
1. Platform Service sends webhook with event
2. CS Support maps event to milestone key
3. Completes milestone automatically
4. Triggers next communication
5. Updates progress

#### B. Manual CSM Updates
**Source**: CSM manually marks milestone complete

**API**: `POST /api/v1/onboarding/milestone/complete`

**Use Cases**:
- CSM had a call and confirmed milestone
- CSM verified completion through other means
- Override automatic detection

#### C. API Calls from Other Services
**Source**: Other TrueVow services (Tenant App, INTAKE, DRAFT)

**API**: `POST /api/v1/onboarding/milestone/complete`

**Use Cases**:
- Tenant App detects feature usage
- INTAKE detects document creation
- DRAFT detects workflow execution

### 4. Communication Triggers

**When**: After milestone completion

**Types**:
- **Email**: Welcome emails, feature guides, tips
- **SMS**: Quick check-ins, reminders
- **Call**: Scheduled calls for important milestones

**Scheduling**:
- Immediate (delay_hours: 0)
- Delayed (delay_hours: 24, 48, etc.)
- Conditional (based on customer behavior)

**Templates**:
- Email templates stored in `cs_email_templates`
- SMS templates stored in `cs_sms_templates`
- Call scripts stored in `cs_call_scripts`

### 5. Stage Progression

**Stages**:
1. `not_started` - Onboarding not started
2. `account_setup` - Account creation and verification
3. `initial_config` - Basic configuration
4. `first_use` - First interactions with features
5. `training` - Training and education
6. `go_live` - Production deployment
7. `completed` - Onboarding complete

**Progression Logic**:
- Stage advances when all milestones in current stage are completed
- Can skip stages if milestones are completed out of order
- Stage is determined by highest completed stage

### 6. Milestone Mapping Examples

#### Example 1: Account Created
```
Event: 'account.created'
Milestone: 'account_created'
Stage: 'account_setup'
Actions:
  - Trigger welcome email
  - Set next_milestone = 'email_verified'
  - Schedule email verification reminder (24h)
```

#### Example 2: First Login
```
Event: 'user.login.first'
Milestone: 'first_login'
Stage: 'initial_config'
Actions:
  - Trigger "Getting Started" email
  - Set next_milestone = 'settings_configured'
  - Schedule settings configuration guide (2h)
```

#### Example 3: First Feature Used
```
Event: 'feature.used.first'
Milestone: 'first_feature_used'
Stage: 'first_use'
Actions:
  - Trigger feature tips email
  - Set next_milestone = 'first_document_created'
  - Schedule document creation guide (24h)
```

### 7. Integration Points

#### Platform Service Integration
- **Webhooks**: Receive milestone events
- **API Calls**: Query customer data if needed
- **Mapping**: Event → Milestone Key

#### Email Service (SendGrid)
- **Templates**: Store email templates
- **Sending**: Trigger emails on milestone completion
- **Tracking**: Track opens, clicks, replies

#### SMS Service (Twilio)
- **Templates**: Store SMS templates
- **Sending**: Trigger SMS on milestone completion
- **Tracking**: Track delivery, replies

#### Call Service (Twilio)
- **Scripts**: Store call scripts
- **Scheduling**: Schedule calls for important milestones
- **Tracking**: Track call completion, duration

### 8. Default Sequence Structure

```json
{
  "stages": [
    {
      "stage_key": "account_setup",
      "milestones": ["account_created", "email_verified", "profile_completed"]
    },
    {
      "stage_key": "initial_config",
      "milestones": ["first_login", "settings_configured", "team_members_added"]
    },
    {
      "stage_key": "first_use",
      "milestones": ["first_feature_used", "first_document_created", "first_workflow_run"]
    },
    {
      "stage_key": "training",
      "milestones": ["training_completed", "resources_viewed", "support_contacted"]
    },
    {
      "stage_key": "go_live",
      "milestones": ["production_deployed", "first_production_use", "monitoring_setup"]
    },
    {
      "stage_key": "completed",
      "milestones": ["onboarding_complete"]
    }
  ],
  "milestones": [
    {
      "milestone_key": "account_created",
      "trigger_email": true,
      "days_after_previous": 0
    },
    {
      "milestone_key": "first_login",
      "trigger_email": true,
      "days_after_previous": 1
    },
    ...
  ]
}
```

### 9. Progress Calculation

```typescript
completion_percentage = (milestones_completed.length / total_milestones) * 100

current_stage = highest_stage_where_all_milestones_completed()

next_milestone = first_milestone_in_pending_list()
```

### 10. CSM Notifications

**When**: 
- Milestone completed
- Milestone overdue
- Customer stuck on milestone
- Onboarding complete

**Channels**:
- In-app notifications
- Email alerts
- Dashboard widgets

## Security Considerations

1. **Webhook Verification**: Verify webhook signatures from Platform Service
2. **API Authentication**: All API endpoints require team member authentication
3. **Tenant Isolation**: Customers can only access their own tenant's onboarding
4. **Rate Limiting**: Prevent abuse of milestone completion API

## Future Enhancements

1. **A/B Testing**: Test different onboarding sequences
2. **Personalization**: Customize sequences based on customer type
3. **Analytics**: Track which sequences lead to best outcomes
4. **ML Optimization**: Use ML to optimize milestone timing and content
