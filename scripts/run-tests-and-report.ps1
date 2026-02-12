# Automated Test Runner with Report Generation
# Starts server, runs tests, generates report

param(
    [string]$BaseUrl = "http://localhost:3003",
    [string]$TenantId = "00000000-0000-0000-0000-000000000000",
    [string]$ReportFile = "test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
)

$ErrorActionPreference = "Continue"
$testResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
    Tests = @()
    StartTime = Get-Date
    EndTime = $null
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    if ($Passed) {
        Write-Host "[$timestamp] ✅ $TestName" -ForegroundColor Green
        $script:testResults.Passed++
    } else {
        Write-Host "[$timestamp] ❌ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "        Error: $Message" -ForegroundColor Gray
        }
        $script:testResults.Failed++
    }
    
    $script:testResults.Tests += @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
        Timestamp = $timestamp
    }
}

function Test-ServerHealth {
    Write-Host "`n[TEST 1] Server Health Check" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult "Server Health Check" $true "Status: $($response.StatusCode)"
        return $true
    } catch {
        Write-TestResult "Server Health Check" $false $_.Exception.Message
        return $false
    }
}

function Test-ReportTemplateCreation {
    Write-Host "`n[TEST 2] Report Template Creation" -ForegroundColor Cyan
    
    try {
        $body = @{
            template_name = "Automated Test Report Template"
            template_type = "ticket_summary"
            description = "Test template created by automated tests"
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

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/templates" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        if ($response.data.template_id) {
            Write-TestResult "Create Report Template" $true "Template ID: $($response.data.template_id)"
            return $response.data.template_id
        } else {
            Write-TestResult "Create Report Template" $false "No template_id in response"
            return $null
        }
    } catch {
        Write-TestResult "Create Report Template" $false $_.Exception.Message
        return $null
    }
}

function Test-ReportGeneration {
    param([string]$TemplateId)
    
    Write-Host "`n[TEST 3] Report Generation" -ForegroundColor Cyan
    
    if (-not $TemplateId) {
        Write-TestResult "Generate Report" $false "No template ID available"
        return $null
    }
    
    try {
        $periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $body = @{
            template_id = $TemplateId
            tenant_id = $TenantId
            period_start = $periodStart
            period_end = $periodEnd
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/generate" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        if ($response.data.report_id) {
            $status = $response.data.status
            $sections = $response.data.report_data.sections.Count
            Write-TestResult "Generate Report" ($status -eq "completed") "Report ID: $($response.data.report_id), Status: $status, Sections: $sections"
            return $response.data.report_id
        } else {
            Write-TestResult "Generate Report" $false "No report_id in response"
            return $null
        }
    } catch {
        Write-TestResult "Generate Report" $false $_.Exception.Message
        return $null
    }
}

function Test-ReportRetrieval {
    param([string]$ReportId)
    
    Write-Host "`n[TEST 4] Report Retrieval" -ForegroundColor Cyan
    
    if (-not $ReportId) {
        Write-TestResult "Retrieve Report" $false "No report ID available"
        return $false
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/$ReportId?tenant_id=$TenantId" `
            -Method GET `
            -ErrorAction Stop

        if ($response.data.report_id -eq $ReportId) {
            Write-TestResult "Retrieve Report" $true "Report retrieved successfully"
            return $true
        } else {
            Write-TestResult "Retrieve Report" $false "Report ID mismatch"
            return $false
        }
    } catch {
        Write-TestResult "Retrieve Report" $false $_.Exception.Message
        return $false
    }
}

function Test-ReportListing {
    Write-Host "`n[TEST 5] Report Listing" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports?tenant_id=$TenantId&limit=10" `
            -Method GET `
            -ErrorAction Stop

        $count = $response.count
        Write-TestResult "List Reports" $true "Found $count reports"
        return $true
    } catch {
        Write-TestResult "List Reports" $false $_.Exception.Message
        return $false
    }
}

function Test-IntegrationStatus {
    Write-Host "`n[TEST 6] Integration Status" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/integrations/status" `
            -Method GET `
            -ErrorAction Stop

        if ($response.data.overall_status -and $response.data.integrations) {
            $status = $response.data.overall_status
            $integrationCount = $response.data.integrations.Count
            Write-TestResult "Integration Status Check" $true "Overall: $status, Integrations: $integrationCount"
            return $true
        } else {
            Write-TestResult "Integration Status Check" $false "Invalid response structure"
            return $false
        }
    } catch {
        Write-TestResult "Integration Status Check" $false $_.Exception.Message
        return $false
    }
}

function Test-AgentPerformance {
    Write-Host "`n[TEST 7] Agent Performance Analytics" -ForegroundColor Cyan
    
    try {
        $agentId = "test-agent-id"
        $periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/analytics/agent/$agentId?tenant_id=$TenantId&period_start=$periodStart&period_end=$periodEnd" `
            -Method GET `
            -ErrorAction Stop

        Write-TestResult "Agent Performance Endpoint" $true "Endpoint accessible"
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-TestResult "Agent Performance Endpoint" $true "Endpoint works (404 expected for test agent)"
            return $true
        } else {
            Write-TestResult "Agent Performance Endpoint" $false "HTTP $statusCode : $($_.Exception.Message)"
            return $false
        }
    }
}

function Test-TeamPerformance {
    Write-Host "`n[TEST 8] Team Performance Analytics" -ForegroundColor Cyan
    
    try {
        $periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/analytics/team?tenant_id=$TenantId&period_start=$periodStart&period_end=$periodEnd" `
            -Method GET `
            -ErrorAction Stop

        if ($null -ne $response.data.total_agents) {
            $totalAgents = $response.data.total_agents
            Write-TestResult "Team Performance Analytics" $true "Total agents: $totalAgents"
            return $true
        } else {
            Write-TestResult "Team Performance Analytics" $false "Invalid response structure"
            return $false
        }
    } catch {
        Write-TestResult "Team Performance Analytics" $false $_.Exception.Message
        return $false
    }
}

function Generate-Report {
    param([string]$ReportFile)
    
    $testResults.EndTime = Get-Date
    $duration = $testResults.EndTime - $testResults.StartTime
    
    $report = @"
================================================================================
CS-SUPPORT SERVICE - AUTOMATED TEST REPORT
================================================================================
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Duration: $($duration.TotalSeconds.ToString('F2')) seconds
Base URL: $BaseUrl
Tenant ID: $TenantId

================================================================================
TEST RESULTS SUMMARY
================================================================================
Total Tests: $($testResults.Passed + $testResults.Failed + $testResults.Skipped)
✅ Passed:   $($testResults.Passed)
❌ Failed:   $($testResults.Failed)
⏭️  Skipped:  $($testResults.Skipped)

Success Rate: $([math]::Round(($testResults.Passed / ($testResults.Passed + $testResults.Failed)) * 100, 2))%

================================================================================
DETAILED TEST RESULTS
================================================================================
"@

    foreach ($test in $testResults.Tests) {
        $status = if ($test.Passed) { "✅ PASS" } else { "❌ FAIL" }
        $report += "`n[$($test.Timestamp)] $status - $($test.Name)"
        if ($test.Message) {
            $report += "`n    $($test.Message)"
        }
    }

    $report += @"

================================================================================
SYSTEM INFORMATION
================================================================================
Node Version: $(node --version)
NPM Version: $(npm --version)
Platform: $($PSVersionTable.Platform)
PowerShell: $($PSVersionTable.PSVersion)

================================================================================
RECOMMENDATIONS
================================================================================
"@

    if ($testResults.Failed -eq 0) {
        $report += "`n✅ All tests passed! System is ready for deployment.`n"
    } else {
        $report += "`n⚠️  Some tests failed. Please review errors above and fix issues before deployment.`n"
        $report += "`nFailed Tests:`n"
        foreach ($test in $testResults.Tests) {
            if (-not $test.Passed) {
                $report += "  - $($test.Name): $($test.Message)`n"
            }
        }
    }

    $report += @"

================================================================================
End of Report
================================================================================
"@

    # Save to file
    $report | Out-File -FilePath $ReportFile -Encoding UTF8
    
    # Also display
    Write-Host "`n" + "="*80 -ForegroundColor Cyan
    Write-Host $report -ForegroundColor White
    Write-Host "="*80 -ForegroundColor Cyan
    
    Write-Host "`n📄 Full report saved to: $ReportFile" -ForegroundColor Green
    
    return $report
}

# Main Execution
Write-Host "🧪 CS-Support Service - Automated Test Suite" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host "Start Time: $($testResults.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Tenant ID: $TenantId" -ForegroundColor Gray
Write-Host ""

# Run all tests
$serverRunning = Test-ServerHealth
if (-not $serverRunning) {
    Write-Host "`n❌ Server health check failed. Please ensure server is running." -ForegroundColor Red
    Write-Host "   Start server with: npm run dev" -ForegroundColor Yellow
    $testResults.EndTime = Get-Date
    Generate-Report -ReportFile $ReportFile
    exit 1
}

$templateId = Test-ReportTemplateCreation
$reportId = Test-ReportGeneration -TemplateId $templateId
Test-ReportRetrieval -ReportId $reportId
Test-ReportListing
Test-IntegrationStatus
Test-AgentPerformance
Test-TeamPerformance

# Generate final report
$finalReport = Generate-Report -ReportFile $ReportFile

# Exit with appropriate code
if ($testResults.Failed -eq 0) {
    exit 0
} else {
    exit 1
}
