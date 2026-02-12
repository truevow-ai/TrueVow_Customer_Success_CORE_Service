# Testing Quick Start Guide

**Date:** January 11, 2026  
**Status:** Ready for Testing

---

## 🚀 Quick Start

### Step 1: Install Dependencies (if needed)

```bash
npm install --save-dev jest jest-environment-jsdom @types/jest tsx
```

### Step 2: Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3003`

### Step 3: Run Tests

#### Option A: Comprehensive Test Suite (Recommended)

```powershell
.\scripts\test-all-features.ps1
```

This will test:
- ✅ Server health
- ✅ Report template creation
- ✅ Report generation
- ✅ Report retrieval
- ✅ Integration status
- ✅ Agent performance analytics
- ✅ Team performance analytics

#### Option B: Reporting System Only

```powershell
.\scripts\test-reporting-full.ps1
```

#### Option C: Manual API Testing

Use Postman, Insomnia, or curl to test individual endpoints.

---

## 📋 Test Checklist

### Reporting System Tests

- [ ] Create report template
- [ ] Generate report from template
- [ ] Retrieve generated report
- [ ] List all reports
- [ ] Get scheduled templates

### Analytics Tests

- [ ] Get agent performance metrics
- [ ] Get team performance metrics
- [ ] Get agent comparison
- [ ] Record usage event
- [ ] Get usage analytics summary

### Integration Tests

- [ ] Check integration status
- [ ] Check integration health
- [ ] Get integration errors
- [ ] Create task in Internal Ops
- [ ] Log time tracking
- [ ] Log RevOps activity

### Customer Portal Tests

- [ ] Submit ticket via customer portal
- [ ] Get customer tickets
- [ ] Search knowledge base
- [ ] AI chat endpoint (placeholder)

---

## 🧪 Manual Testing Examples

### Test Report Template Creation

```bash
curl -X POST http://localhost:3003/api/v1/reports/templates \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "Test Report",
    "template_type": "ticket_summary",
    "report_config": {
      "sections": [{
        "name": "Summary",
        "data_source": "tickets",
        "metrics": ["total_tickets"]
      }],
      "format": "json"
    },
    "tenant_id": "YOUR_TENANT_ID",
    "is_active": true
  }'
```

### Test Integration Status

```bash
curl http://localhost:3003/api/v1/integrations/status
```

### Test Agent Performance

```bash
curl "http://localhost:3003/api/v1/analytics/team?tenant_id=YOUR_TENANT_ID&period_start=2026-01-01T00:00:00Z&period_end=2026-01-11T23:59:59Z"
```

---

## ✅ Expected Results

### Successful Test Run

```
🧪 CS-Support Service - Comprehensive Feature Tests
======================================================================

1️⃣  Testing Server Health...
  ✅ Server Health Check

2️⃣  Testing Report Template Creation...
  ✅ Create Report Template

3️⃣  Testing Report Generation...
  ✅ Generate Report

4️⃣  Testing Report Retrieval...
  ✅ Retrieve Report

5️⃣  Testing Integration Status...
  ✅ Integration Status Check

6️⃣  Testing Agent Performance Analytics...
  ✅ Agent Performance Endpoint

7️⃣  Testing Team Performance Analytics...
  ✅ Team Performance Analytics

======================================================================
📊 Test Summary
  ✅ Passed: 7
  ❌ Failed: 0
  ⏭️  Skipped: 0

🎉 All tests passed!
```

---

## 🐛 Troubleshooting

### Server Not Running

**Error:** `Server is not running or unreachable`

**Solution:**
```bash
npm run dev
```

### Authentication Errors

**Error:** `401 Unauthorized`

**Solution:**
- Ensure you're logged in via Clerk
- Or provide valid API key in headers

### Database Errors

**Error:** `Template not found` or `Table does not exist`

**Solution:**
- Run migration: `database/migrations/019_reporting_system.sql`
- Verify tables exist in Supabase

### No Data in Reports

**Expected:** Reports will generate with zero/empty data if tenant has no tickets/analytics
- This is normal for test tenants
- Reports will still generate successfully

---

## 📝 Next Steps After Testing

1. **Review Test Results**: Check which tests passed/failed
2. **Fix Any Issues**: Address failed tests
3. **Add More Tests**: Write unit tests for specific services
4. **Test with Real Data**: Use actual tenant data for more realistic testing
5. **Performance Testing**: Test with larger datasets

---

## 🔗 Related Documentation

- `docs/TESTING_GUIDE.md` - Comprehensive testing guide
- `docs/API_DOCUMENTATION.md` - Complete API reference
- `docs/REPORTING_SYSTEM_QUICK_TEST.md` - Reporting system specific tests

---

**Ready to test!** Start the server and run the test scripts.
