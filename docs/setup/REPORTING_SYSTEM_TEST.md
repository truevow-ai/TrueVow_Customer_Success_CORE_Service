# Reporting System - Testing Guide

**Date:** January 11, 2026  
**Status:** Ready for Testing

## Prerequisites

1. **Database Migration**: Run the migration file first:
   ```sql
   -- Execute: database/migrations/019_reporting_system.sql
   ```

2. **Environment Variables**: Ensure `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Testing Steps

### Step 1: Verify Migration

Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'cs_report%';
```

Expected tables:
- `cs_report_templates`
- `cs_reports`
- `cs_scheduled_report_executions`
- `cs_report_access_logs`

### Step 2: Test via API Endpoints

#### 2.1 Create a Test Template

```bash
POST http://localhost:3003/api/v1/reports/templates
Content-Type: application/json

{
  "template_name": "Test Ticket Summary",
  "template_type": "ticket_summary",
  "description": "Test report",
  "report_config": {
    "sections": [
      {
        "name": "Ticket Summary",
        "data_source": "tickets",
        "filters": {},
        "metrics": ["total_tickets", "resolution_rate"],
        "chart_type": "bar"
      }
    ],
    "format": "json",
    "include_charts": true
  },
  "tenant_id": "YOUR_TENANT_ID",
  "is_active": true
}
```

#### 2.2 Generate a Report

```bash
POST http://localhost:3003/api/v1/reports/generate
Content-Type: application/json

{
  "template_id": "TEMPLATE_ID_FROM_STEP_2.1",
  "tenant_id": "YOUR_TENANT_ID",
  "period_start": "2026-01-01T00:00:00Z",
  "period_end": "2026-01-11T23:59:59Z"
}
```

#### 2.3 Retrieve a Report

```bash
GET http://localhost:3003/api/v1/reports/REPORT_ID?tenant_id=YOUR_TENANT_ID
```

#### 2.4 List All Reports

```bash
GET http://localhost:3003/api/v1/reports?tenant_id=YOUR_TENANT_ID
```

### Step 3: Test Scheduled Reports

#### 3.1 Create a Scheduled Template

```bash
POST http://localhost:3003/api/v1/reports/templates
Content-Type: application/json

{
  "template_name": "Daily Ticket Report",
  "template_type": "ticket_summary",
  "report_config": {
    "sections": [
      {
        "name": "Daily Summary",
        "data_source": "tickets",
        "metrics": ["total_tickets", "resolution_rate"]
      }
    ],
    "format": "json"
  },
  "schedule_type": "daily",
  "schedule_config": {
    "time": "09:00",
    "timezone": "America/New_York",
    "recipients": ["admin@example.com"]
  },
  "tenant_id": "YOUR_TENANT_ID",
  "is_active": true
}
```

#### 3.2 Get Scheduled Templates

```bash
GET http://localhost:3003/api/v1/reports/scheduled?tenant_id=YOUR_TENANT_ID
```

#### 3.3 Execute Scheduled Reports (Cron Job)

```bash
POST http://localhost:3003/api/v1/reports/scheduled/execute
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "execution_id": "OPTIONAL_EXECUTION_ID"
}
```

## Manual Testing Checklist

- [ ] Migration file executed successfully
- [ ] Tables created in database
- [ ] Can create report template via API
- [ ] Can generate report from template
- [ ] Report data contains expected sections
- [ ] Can retrieve generated report
- [ ] Can list all reports for tenant
- [ ] Can create scheduled report template
- [ ] Scheduled executions are created
- [ ] Report access logging works

## Expected Results

### Successful Report Generation

```json
{
  "data": {
    "report_id": "uuid",
    "report_name": "Test Ticket Summary",
    "report_type": "ticket_summary",
    "report_data": {
      "sections": [
        {
          "name": "Ticket Summary",
          "data": {
            "total_tickets": 100,
            "resolved_tickets": 85,
            "resolution_rate": 85.0,
            ...
          }
        }
      ]
    },
    "status": "completed",
    "generated_at": "2026-01-11T..."
  }
}
```

## Troubleshooting

### Issue: "Template not found"
- **Solution**: Ensure template was created and `template_id` is correct

### Issue: "No data in report"
- **Solution**: Check if tenant has tickets/analytics data in the specified period

### Issue: "Migration failed"
- **Solution**: Check PostgreSQL version (requires 12+), ensure UUID extension is enabled

### Issue: "RLS policy violation"
- **Solution**: Ensure user has proper tenant access, check RLS policies

## Next Steps

After successful testing:
1. Create default report templates
2. Set up cron job for scheduled reports
3. Implement PDF generation (currently JSON only)
4. Add email delivery for scheduled reports
