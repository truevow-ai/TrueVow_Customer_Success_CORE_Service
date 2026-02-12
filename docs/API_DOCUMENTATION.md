# CS-Support Service - API Documentation

**Version:** 1.0  
**Date:** January 11, 2026  
**Base URL:** `http://localhost:3003/api/v1` (Development)  
**Production URL:** `https://cs-support.truevow.com/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Tickets API](#tickets-api)
3. [Analytics API](#analytics-api)
4. [Onboarding API](#onboarding-api)
5. [Reports API](#reports-api)
6. [Integrations API](#integrations-api)
7. [Customer Portal API](#customer-portal-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Clerk Authentication

Most endpoints require Clerk authentication. Include the session token in requests:

```http
Authorization: Bearer <clerk_session_token>
```

### API Key Authentication

For service-to-service calls, use API key:

```http
X-API-Key: <service_api_key>
```

---

## Tickets API

### Create Ticket

```http
POST /api/v1/tickets
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "uuid",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "subject": "Ticket Subject",
  "message": "Ticket message",
  "channel": "email",
  "priority": "medium",
  "status": "open"
}
```

**Response:**
```json
{
  "data": {
    "ticket_id": "uuid",
    "tenant_id": "uuid",
    "customer_email": "customer@example.com",
    "subject": "Ticket Subject",
    "status": "open",
    "created_at": "2026-01-11T12:00:00Z"
  }
}
```

### Get Ticket

```http
GET /api/v1/tickets/:id
Authorization: Bearer <token>
```

### List Tickets

```http
GET /api/v1/tickets?tenant_id=uuid&status=open&limit=20&offset=0
Authorization: Bearer <token>
```

### Update Ticket

```http
PUT /api/v1/tickets/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "resolved",
  "assigned_to": "user-id"
}
```

---

## Analytics API

### Agent Performance

```http
GET /api/v1/analytics/agent/:agentId?tenant_id=uuid&period_start=2026-01-01T00:00:00Z&period_end=2026-01-11T23:59:59Z
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": {
    "agent_id": "uuid",
    "agent_name": "John Doe",
    "tickets_assigned": 50,
    "tickets_resolved": 45,
    "resolution_rate": 90.0,
    "avg_response_time": 120.5,
    "avg_resolution_time": 3600.0,
    "csat_score": 4.5,
    "sla_compliance_rate": 95.0
  }
}
```

### Team Performance

```http
GET /api/v1/analytics/team?tenant_id=uuid&period_start=2026-01-01T00:00:00Z&period_end=2026-01-11T23:59:59Z
Authorization: Bearer <token>
```

### Usage Analytics

```http
POST /api/v1/analytics/usage/event
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "uuid",
  "event_type": "feature_used",
  "feature_name": "ticket_creation",
  "metadata": {}
}
```

```http
GET /api/v1/analytics/usage/summary?tenant_id=uuid&period_start=2026-01-01T00:00:00Z&period_end=2026-01-11T23:59:59Z
Authorization: Bearer <token>
```

---

## Onboarding API

### Law Firm Onboarding - Step 1 (Firm Profile)

```http
POST /api/v1/onboarding/law-firm/step-1
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "uuid",
  "firm_name": "Example Law Firm",
  "firm_type": "solo",
  "practice_areas": ["PI", "Family Law"],
  "number_of_attorneys": 5,
  "number_of_staff": 10
}
```

### Law Firm Onboarding - Step 2 (Phone Config)

```http
POST /api/v1/onboarding/law-firm/step-2
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "uuid",
  "phone_number": "+1234567890",
  "sms_enabled": true,
  "call_enabled": true
}
```

### Law Firm Onboarding - Step 3 (Calendar Integration)

```http
POST /api/v1/onboarding/law-firm/step-3
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenant_id": "uuid",
  "team_member_email": "attorney@example.com",
  "calendar_type": "google",
  "calendar_connected": true,
  "is_master_calendar": false
}
```

### Get Onboarding Progress

```http
GET /api/v1/onboarding/law-firm/progress?tenant_id=uuid
Authorization: Bearer <token>
```

---

## Reports API

### Create Report Template

```http
POST /api/v1/reports/templates
Content-Type: application/json
Authorization: Bearer <token>

{
  "template_name": "Ticket Summary Report",
  "template_type": "ticket_summary",
  "description": "Monthly ticket summary",
  "report_config": {
    "sections": [
      {
        "name": "Ticket Summary",
        "data_source": "tickets",
        "metrics": ["total_tickets", "resolution_rate"]
      }
    ],
    "format": "json"
  },
  "tenant_id": "uuid",
  "is_active": true
}
```

### Generate Report

```http
POST /api/v1/reports/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "template_id": "uuid",
  "tenant_id": "uuid",
  "period_start": "2026-01-01T00:00:00Z",
  "period_end": "2026-01-11T23:59:59Z"
}
```

### Get Report

```http
GET /api/v1/reports/:id?tenant_id=uuid
Authorization: Bearer <token>
```

### List Reports

```http
GET /api/v1/reports?tenant_id=uuid&report_type=ticket_summary&status=completed&limit=20&offset=0
Authorization: Bearer <token>
```

---

## Integrations API

### Internal Ops - Create Task

```http
POST /api/v1/integrations/internal-ops/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Follow up with customer",
  "description": "Customer needs assistance",
  "assigned_to": "user-id",
  "priority": "high",
  "related_ticket_id": "ticket-uuid"
}
```

### Internal Ops - Time Tracking

```http
POST /api/v1/integrations/internal-ops/time-tracking
Content-Type: application/json
Authorization: Bearer <token>

{
  "activity_type": "support_ticket",
  "ticket_id": "ticket-uuid",
  "user_id": "user-id",
  "start_time": "2026-01-11T10:00:00Z",
  "end_time": "2026-01-11T10:30:00Z",
  "duration_minutes": 30
}
```

### Integration Status

```http
GET /api/v1/integrations/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": {
    "overall_status": "healthy",
    "integrations": [
      {
        "integration_type": "sales_crm",
        "integration_name": "Sales-CRM Service",
        "status": "healthy",
        "last_check": "2026-01-11T12:00:00Z",
        "response_time_ms": 45
      }
    ],
    "last_updated": "2026-01-11T12:00:00Z"
  }
}
```

---

## Customer Portal API

### AI Chat (Benjamin)

```http
POST /api/v1/customer-portal/ai/chat?tenant_id=uuid
Content-Type: application/json
X-API-Key: <tenant_service_api_key>

{
  "message": "How do I create a ticket?",
  "conversation_id": "conv-uuid",
  "tenant_id": "uuid",
  "customer_id": "customer-uuid"
}
```

### Submit Ticket

```http
POST /api/v1/customer-portal/tickets
Content-Type: application/json
X-API-Key: <tenant_service_api_key>

{
  "tenant_id": "uuid",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "subject": "Support Request",
  "message": "I need help with...",
  "channel": "form",
  "priority": "medium"
}
```

### Search Knowledge Base

```http
GET /api/v1/customer-portal/kb/search?tenant_id=uuid&q=how+to+create+ticket&limit=10
X-API-Key: <tenant_service_api_key>
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Example Error Response

```json
{
  "error": "Failed to create ticket",
  "details": "tenant_id is required",
  "code": "VALIDATION_ERROR"
}
```

---

## Rate Limiting

### Rate Limits

- **Authenticated Users**: 100 requests/minute
- **API Key**: 1000 requests/minute
- **Customer Portal**:
  - Chat: 30 requests/minute per tenant
  - Tickets: 10 requests/hour per tenant
  - KB Search: 60 requests/minute per tenant

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641900000
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Pagination

### Pagination Parameters

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

### Pagination Response

```json
{
  "data": [...],
  "count": 50,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

## Filtering and Sorting

### Common Filters

- `status`: Filter by status
- `priority`: Filter by priority
- `channel`: Filter by channel
- `assigned_to`: Filter by assignee
- `tenant_id`: Filter by tenant (required for most endpoints)

### Sorting

- `order_by`: Field to sort by (e.g., `created_at`)
- `order`: Sort direction (`asc` or `desc`)

### Example

```http
GET /api/v1/tickets?tenant_id=uuid&status=open&priority=high&order_by=created_at&order=desc
```

---

## Webhooks

### Resend Webhook

```http
POST /api/webhooks/resend
Content-Type: application/json
X-Resend-Signature: <signature>

{
  "type": "email.sent",
  "data": {
    "email_id": "uuid",
    "to": "recipient@example.com",
    "status": "delivered"
  }
}
```

### Platform Service Webhook

```http
POST /api/v1/webhooks/platform/milestone
Content-Type: application/json
X-API-Key: <platform_service_api_key>

{
  "event": "onboarding.started",
  "tenant_id": "uuid",
  "data": {}
}
```

---

## Best Practices

1. **Always include `tenant_id`** in requests when applicable
2. **Use pagination** for list endpoints
3. **Handle rate limits** with exponential backoff
4. **Validate responses** before processing
5. **Use appropriate HTTP methods** (GET for read, POST for create, PUT for update)
6. **Include error handling** in all API calls
7. **Cache responses** when appropriate
8. **Use webhooks** for real-time updates instead of polling

---

**End of API Documentation**
