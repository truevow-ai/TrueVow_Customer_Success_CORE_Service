# CSAT/NPS Auto-Survey System

## Overview

The CSAT/NPS Auto-Survey system automatically sends customer satisfaction surveys after ticket resolution, tracks responses, and provides analytics for customer success teams.

## Features

### 1. Automated Survey Sending
- **Trigger**: Automatically triggered when a ticket is resolved or closed
- **Delay**: Configurable delay (default: 24 hours after resolution)
- **Channels**: Email, SMS, or in-app notifications
- **Reminders**: Configurable reminder system (default: 1 reminder after 72 hours)

### 2. Survey Types
- **CSAT (Customer Satisfaction)**: 1-5 scale rating
- **NPS (Net Promoter Score)**: 0-10 scale rating
- **Both**: Send both CSAT and NPS surveys

### 3. Automation Rules
- **Conditional Triggers**: Based on ticket status, priority, channel, resolution time
- **Exclusion Rules**: Exclude surveys for specific users, reopened tickets, etc.
- **Priority System**: Multiple rules with priority ordering
- **Tenant-Specific**: Custom rules per tenant or default rules

### 4. Response Tracking
- **Response Recording**: Track scores, feedback, and additional responses
- **Follow-up Flags**: Automatic follow-up flags for low scores
- **Response Channel**: Track how customer responded (email, SMS, web, in-app)

### 5. Analytics
- **CSAT Metrics**: Average score, distribution, total responses
- **NPS Metrics**: NPS score, promoters/passives/detractors breakdown
- **Response Rates**: Survey send vs. response rates
- **Trend Analysis**: Period-based statistics

## Database Schema

### Tables

1. **cs_survey_templates**: Survey templates with content and timing
2. **cs_survey_responses**: Survey responses with feedback and follow-up tracking
3. **cs_survey_automation_rules**: Rules for automatically sending surveys
4. **cs_survey_reminders**: Reminder tracking and scheduling

### Enhanced Tables

- **cs_survey_csat**: Enhanced with `auto_sent`, `sent_at`, `reminder_sent_at`, `survey_channel`, `survey_link`
- **cs_survey_nps**: Enhanced with `auto_sent`, `sent_at`, `reminder_sent_at`, `survey_channel`, `survey_link`

## API Endpoints

### 1. Process Ticket Resolution
```
POST /api/v1/surveys/process-resolution
```
Called when a ticket is resolved to queue surveys.

**Request:**
```json
{
  "ticketId": "uuid"
}
```

**Security**: API key protected (`SURVEY_API_KEY`)

### 2. Send Scheduled Surveys
```
POST /api/v1/surveys/send-scheduled
```
Called by background job/cron to send scheduled surveys.

**Security**: API key protected (`CRON_API_KEY` or `SURVEY_API_KEY`)

### 3. Record Survey Response
```
POST /api/v1/surveys/response
```
Record a survey response (called by survey form submission).

**Request:**
```json
{
  "surveyId": "uuid",
  "surveyType": "csat" | "nps",
  "score": 1-5 (CSAT) or 0-10 (NPS),
  "feedbackText": "optional feedback",
  "responses": { "additional": "data" }
}
```

### 4. Get Survey Statistics
```
GET /api/v1/surveys/stats?tenant_id=...&period_start=...&period_end=...
```
Get CSAT/NPS statistics for a tenant.

**Response:**
```json
{
  "csat": {
    "average": 4.2,
    "total_responses": 150,
    "distribution": {
      "5": 80,
      "4": 50,
      "3": 15,
      "2": 3,
      "1": 2
    }
  },
  "nps": {
    "score": 45,
    "total_responses": 120,
    "promoters": 60,
    "passives": 30,
    "detractors": 30,
    "distribution": {
      "9-10": 60,
      "7-8": 30,
      "0-6": 30
    }
  },
  "response_rate": {
    "surveys_sent": 200,
    "surveys_responded": 150,
    "response_rate": 75
  }
}
```

## Integration Points

### 1. Ticket Resolution Trigger
The system uses a database trigger (`trigger_auto_survey_on_resolution`) that fires when a ticket status changes to `resolved` or `closed`. This trigger:
- Sends a PostgreSQL notification (`survey_queue`)
- Can be listened to by a background worker
- Alternatively, the ticket update API can call `processTicketResolution()` directly

### 2. Background Job/Cron
A background job should call `/api/v1/surveys/send-scheduled` periodically (e.g., every 5 minutes) to:
- Process scheduled surveys
- Send reminders
- Update survey statuses

### 3. Survey Form
The survey form should:
- Submit responses to `/api/v1/surveys/response`
- Include survey ID from the survey link
- Validate score ranges (1-5 for CSAT, 0-10 for NPS)

## Configuration

### Environment Variables
- `SURVEY_API_KEY`: API key for survey endpoints
- `CRON_API_KEY`: API key for cron jobs (can use `SURVEY_API_KEY`)
- `NEXT_PUBLIC_APP_URL`: Base URL for survey links

### Default Survey Templates
Default templates should be created in the database:
- CSAT template with 1-5 rating
- NPS template with 0-10 rating
- Default automation rule for all tickets

## Follow-up Workflows

When a survey response indicates low satisfaction:
- **CSAT ≤ 2**: Flagged for follow-up
- **NPS ≤ 6**: Flagged for follow-up
- **Negative Sentiment**: Detected in feedback text

Follow-up actions:
- Create internal ticket for CS team
- Notify assigned CSM
- Schedule follow-up call
- Add to health score calculation

## Best Practices

1. **Timing**: Send surveys 24-48 hours after resolution (not immediately)
2. **Frequency**: Don't send multiple surveys for the same customer in a short period
3. **Channel Selection**: Use email for longer surveys, SMS for quick ratings
4. **Reminders**: Limit to 1-2 reminders to avoid annoyance
5. **Follow-up**: Always follow up on low scores within 24 hours
6. **Analytics**: Track trends over time, not just point-in-time scores

## Security

- All endpoints are rate-limited
- API key protection for automated endpoints
- Team member authentication for stats endpoints
- Input validation and sanitization
- Tenant isolation enforced
