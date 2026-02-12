# Simple API Test Script for Reporting System
# Run this after starting the dev server (npm run dev)

$baseUrl = "http://localhost:3003"
$tenantId = "YOUR_TENANT_ID_HERE"  # Replace with actual tenant ID

Write-Host "🧪 Testing Reporting System API" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if server is running
Write-Host "1️⃣  Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running. Please start with: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Manual Testing Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run the database migration first:" -ForegroundColor Yellow
Write-Host "   Execute: database/migrations/019_reporting_system.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create a test template (POST /api/v1/reports/templates):" -ForegroundColor Yellow
Write-Host @"
   POST $baseUrl/api/v1/reports/templates
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
     "tenant_id": "$tenantId",
     "is_active": true
   }
"@ -ForegroundColor Gray
Write-Host ""
Write-Host "3. Generate a report (POST /api/v1/reports/generate):" -ForegroundColor Yellow
Write-Host @"
   POST $baseUrl/api/v1/reports/generate
   Content-Type: application/json
   
   {
     "template_id": "TEMPLATE_ID_FROM_STEP_2",
     "tenant_id": "$tenantId",
     "period_start": "2026-01-01T00:00:00Z",
     "period_end": "2026-01-11T23:59:59Z"
   }
"@ -ForegroundColor Gray
Write-Host ""
Write-Host "4. Retrieve a report (GET /api/v1/reports/:id):" -ForegroundColor Yellow
Write-Host "   GET $baseUrl/api/v1/reports/REPORT_ID?tenant_id=$tenantId" -ForegroundColor Gray
Write-Host ""
Write-Host "5. List all reports (GET /api/v1/reports):" -ForegroundColor Yellow
Write-Host "   GET $baseUrl/api/v1/reports?tenant_id=$tenantId" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See docs/setup/REPORTING_SYSTEM_TEST.md for detailed instructions" -ForegroundColor Cyan
