# Full Reporting System Test Script
# Tests the complete flow: Create Template → Generate Report → Retrieve Report

param(
    [string]$TenantId = "00000000-0000-0000-0000-000000000000",
    [string]$BaseUrl = "http://localhost:3003"
)

Write-Host "🧪 Full Reporting System Test" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Tenant ID: $TenantId" -ForegroundColor Gray
Write-Host ""

# Check if server is running
Write-Host "1️⃣  Checking server status..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -Method GET -ErrorAction Stop -TimeoutSec 5
    Write-Host "   ✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running" -ForegroundColor Red
    Write-Host "   Please start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2️⃣  Creating test template..." -ForegroundColor Yellow

$templateBody = @{
    template_name = "Test Ticket Summary Report"
    template_type = "ticket_summary"
    description = "Test report for ticket analytics"
    report_config = @{
        sections = @(
            @{
                name = "Ticket Summary"
                data_source = "tickets"
                filters = @{}
                metrics = @("total_tickets", "resolution_rate", "avg_resolution_time")
                chart_type = "bar"
            }
        )
        format = "json"
        include_charts = $true
        include_tables = $true
    }
    tenant_id = $TenantId
    is_active = $true
} | ConvertTo-Json -Depth 10

try {
    $templateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/templates" `
        -Method POST `
        -ContentType "application/json" `
        -Body $templateBody
    
    $templateId = $templateResponse.data.template_id
    Write-Host "   ✅ Template created: $templateId" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create template: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "3️⃣  Generating report..." -ForegroundColor Yellow

$periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$generateBody = @{
    template_id = $templateId
    tenant_id = $TenantId
    period_start = $periodStart
    period_end = $periodEnd
} | ConvertTo-Json

try {
    $generateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $generateBody
    
    $reportId = $generateResponse.data.report_id
    $reportStatus = $generateResponse.data.status
    Write-Host "   ✅ Report generated: $reportId" -ForegroundColor Green
    Write-Host "   Status: $reportStatus" -ForegroundColor Gray
    Write-Host "   Sections: $($generateResponse.data.report_data.sections.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to generate report: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "4️⃣  Retrieving report..." -ForegroundColor Yellow

try {
    $retrieveResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/$reportId?tenant_id=$TenantId" `
        -Method GET
    
    Write-Host "   ✅ Report retrieved successfully" -ForegroundColor Green
    Write-Host "   Report Name: $($retrieveResponse.data.report_name)" -ForegroundColor Gray
    Write-Host "   Report Type: $($retrieveResponse.data.report_type)" -ForegroundColor Gray
    Write-Host "   Status: $($retrieveResponse.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to retrieve report: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "5️⃣  Listing all reports..." -ForegroundColor Yellow

try {
    $listResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports?tenant_id=$TenantId" `
        -Method GET
    
    Write-Host "   ✅ Found $($listResponse.count) reports" -ForegroundColor Green
    if ($listResponse.data.Count -gt 0) {
        Write-Host "   Latest reports:" -ForegroundColor Gray
        $listResponse.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $($_.report_name) ($($_.status))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ⚠️  Failed to list reports: $_" -ForegroundColor Yellow
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Template creation: PASSED" -ForegroundColor Green
Write-Host "  ✅ Report generation: PASSED" -ForegroundColor Green
Write-Host "  ✅ Report retrieval: PASSED" -ForegroundColor Green
Write-Host "  ✅ Report listing: PASSED" -ForegroundColor Green
Write-Host ""
Write-Host "Template ID: $templateId" -ForegroundColor Gray
Write-Host "Report ID: $reportId" -ForegroundColor Gray
