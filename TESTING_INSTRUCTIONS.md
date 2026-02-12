# Testing Instructions - Quick Reference

## 🚀 Start Testing

### Step 1: Start the Development Server

Open a terminal and run:
```bash
npm run dev
```

Wait for the server to start (you'll see "Ready on http://localhost:3003")

### Step 2: Run Tests

Open **another terminal** (keep server running) and run:

#### Option A: Comprehensive Test Suite
```powershell
.\scripts\test-all-features.ps1
```

This tests:
- Server health
- Report templates
- Report generation
- Integration status
- Analytics endpoints

#### Option B: Reporting System Only
```powershell
.\scripts\test-reporting-full.ps1
```

### Step 3: Review Results

The test script will show:
- ✅ Passed tests (green)
- ❌ Failed tests (red with error messages)
- Summary at the end

---

## 📝 What Gets Tested

### Reporting System
- ✅ Create report template
- ✅ Generate report
- ✅ Retrieve report
- ✅ List reports

### Analytics
- ✅ Agent performance metrics
- ✅ Team performance metrics
- ✅ Integration status

### Integrations
- ✅ Integration health checks
- ✅ Service connectivity

---

## 🐛 Common Issues

### "Server is not running"
**Fix:** Start server with `npm run dev` first

### "Unauthorized" errors
**Fix:** You may need to be logged in via Clerk, or tests use API keys

### "Template not found" or database errors
**Fix:** Ensure migration `019_reporting_system.sql` has been run

### Tests show zero data
**Expected:** If your test tenant has no tickets/analytics, reports will still generate with empty data. This is normal.

---

## ✅ Success Criteria

All tests should show:
- ✅ Server Health Check
- ✅ Create Report Template
- ✅ Generate Report
- ✅ Retrieve Report
- ✅ Integration Status Check
- ✅ Agent Performance Endpoint
- ✅ Team Performance Analytics

---

## 📚 More Information

- `docs/TESTING_QUICK_START.md` - Detailed testing guide
- `docs/TESTING_GUIDE.md` - Comprehensive testing documentation
- `docs/API_DOCUMENTATION.md` - API reference

---

**Ready to test!** Start the server and run the test scripts.
