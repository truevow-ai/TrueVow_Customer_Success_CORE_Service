# Reporting System - Quick Test Guide

## ✅ Pre-Test Checklist

- [ ] Database migration `019_reporting_system.sql` has been executed
- [ ] Development server is running (`npm run dev`)
- [ ] You have a valid `tenant_id` for testing
- [ ] Environment variables are configured (`.env.local`)

## 🚀 Quick Test (5 minutes)

### Step 1: Verify Tables Exist

Run this SQL query in your Supabase SQL editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'cs_report_templates',
    'cs_reports',
    'cs_scheduled_report_executions',
    'cs_report_access_logs'
  );
```

Expected: 4 rows returned

### Step 2: Test Report Generation (via API)

#### 2a. Create a Simple Template

**Using curl:**
```bash
curl -X POST http://localhost:3003/api/v1/reports/templates \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "Quick Test Report",
    "template_type": "ticket_summary",
    "report_config": {
      "sections": [{
        "name": "Summary",
        "data_source": "tickets",
        "metrics": ["total_tickets", "resolution_rate"]
      }],
      "format": "json"
    },
    "tenant_id": "YOUR_TENANT_ID",
    "is_active": true
  }'
```

**Using PowerShell:**
```powershell
$body = @{
    template_name = "Quick Test Report"
    template_type = "ticket_summary"
    report_config = @{
        sections = @(
            @{
                name = "Summary"
                data_source = "tickets"
                metrics = @("total_tickets", "resolution_rate")
            }
        )
        format = "json"
    }
    tenant_id = "YOUR_TENANT_ID"
    is_active = $true
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3003/api/v1/reports/templates" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Save the `template_id` from the response**

#### 2b. Generate a Report

```bash
curl -X POST http://localhost:3003/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "TEMPLATE_ID_FROM_2A",
    "tenant_id": "YOUR_TENANT_ID",
    "period_start": "2026-01-01T00:00:00Z",
    "period_end": "2026-01-11T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "report_id": "uuid",
    "report_name": "Quick Test Report",
    "status": "completed",
    "report_data": {
      "sections": [
        {
          "name": "Summary",
          "data": {
            "total_tickets": 0,
            "resolution_rate": 0
          }
        }
      ]
    }
  }
}
```

#### 2c. Retrieve the Report

```bash
curl "http://localhost:3003/api/v1/reports/REPORT_ID?tenant_id=YOUR_TENANT_ID"
```

#### 2d. List All Reports

```bash
curl "http://localhost:3003/api/v1/reports?tenant_id=YOUR_TENANT_ID"
```

## ✅ Success Criteria

- ✅ Template created successfully
- ✅ Report generated with status "completed"
- ✅ Report data contains expected sections
- ✅ Report can be retrieved by ID
- ✅ Report appears in list

## 🐛 Common Issues

### "Template not found"
- **Cause**: Template ID is incorrect or template wasn't created
- **Fix**: Re-run Step 2a and verify the template_id

### "No data in report"
- **Cause**: Tenant has no tickets/analytics data in the period
- **Fix**: This is expected if you're testing with empty data. The report will still generate with zeros.

### "Unauthorized"
- **Cause**: Missing authentication (Clerk or API key)
- **Fix**: Ensure you're logged in or provide API key header

### "Migration not run"
- **Cause**: Tables don't exist
- **Fix**: Run `database/migrations/019_reporting_system.sql` in Supabase SQL editor

## 📊 Next Steps

Once basic tests pass:
1. Test with real data (tickets, analytics)
2. Test scheduled reports
3. Test different report types (agent_performance, usage_analytics, etc.)
4. Test report access logging
