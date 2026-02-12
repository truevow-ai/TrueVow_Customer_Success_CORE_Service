# Comprehensive Test Script for CS-Support Service
# Tests all major features implemented today

param(
    [string]$BaseUrl = "http://localhost:3003",
    [string]$TenantId = "00000000-0000-0000-0000-000000000000",
    [switch]$SkipServerCheck = $false
)

$ErrorActionPreference = "Stop"
$testResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
    Tests = @()
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = ""
    )
    
    if ($Passed) {
        Write-Host "  ✅ $TestName" -ForegroundColor Green
        $script:testResults.Passed++
    } else {
        Write-Host "  ❌ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "     $Message" -ForegroundColor Gray
        }
        $script:testResults.Failed++
    }
    
    $script:testResults.Tests += @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
    }
}

function Test-ServerHealth {
    Write-Host "`n1️⃣  Testing Server Health..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult "Server Health Check" $true
        return $true
    } catch {
        Write-TestResult "Server Health Check" $false "Server not running or unreachable"
        return $false
    }
}

function Test-ReportTemplateCreation {
    Write-Host "`n2️⃣  Testing Report Template Creation..." -ForegroundColor Cyan
    
    try {
        $body = @{
            template_name = "Test Ticket Summary"
            template_type = "ticket_summary"
            description = "Test report template"
            report_config = @{
                sections = @(
                    @{
                        name = "Ticket Summary"
                        data_source = "tickets"
                        filters = @{}
                        metrics = @("total_tickets", "resolution_rate")
                        chart_type = "bar"
                    }
                )
                format = "json"
                include_charts = $true
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
            Write-TestResult "Create Report Template" $true
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
    
    Write-Host "`n3️⃣  Testing Report Generation..." -ForegroundColor Cyan
    
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

        if ($response.data.report_id -and $response.data.status -eq "completed") {
            Write-TestResult "Generate Report" $true
            return $response.data.report_id
        } else {
            Write-TestResult "Generate Report" $false "Report not completed: $($response.data.status)"
            return $null
        }
    } catch {
        Write-TestResult "Generate Report" $false $_.Exception.Message
        return $null
    }
}

function Test-ReportRetrieval {
    param([string]$ReportId)
    
    Write-Host "`n4️⃣  Testing Report Retrieval..." -ForegroundColor Cyan
    
    if (-not $ReportId) {
        Write-TestResult "Retrieve Report" $false "No report ID available"
        return $false
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/reports/$ReportId?tenant_id=$TenantId" `
            -Method GET `
            -ErrorAction Stop

        if ($response.data.report_id -eq $ReportId) {
            Write-TestResult "Retrieve Report" $true
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

function Test-IntegrationStatus {
    Write-Host "`n5️⃣  Testing Integration Status..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/integrations/status" `
            -Method GET `
            -ErrorAction Stop

        if ($response.data.overall_status -and $response.data.integrations) {
            Write-TestResult "Integration Status Check" $true "Status: $($response.data.overall_status)"
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
    Write-Host "`n6️⃣  Testing Agent Performance Analytics..." -ForegroundColor Cyan
    
    try {
        # First, we need a valid agent ID - this will likely fail without real data
        $agentId = "test-agent-id"
        $periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/analytics/agent/$agentId?tenant_id=$TenantId&period_start=$periodStart&period_end=$periodEnd" `
            -Method GET `
            -ErrorAction Stop

        # Even if agent not found, endpoint should return 404, not 500
        Write-TestResult "Agent Performance Endpoint" $true "Endpoint accessible"
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-TestResult "Agent Performance Endpoint" $true "Endpoint works (404 expected for test agent)"
            return $true
        } else {
            Write-TestResult "Agent Performance Endpoint" $false $_.Exception.Message
            return $false
        }
    }
}

function Test-TeamPerformance {
    Write-Host "`n7️⃣  Testing Team Performance Analytics..." -ForegroundColor Cyan
    
    try {
        $periodStart = (Get-Date).AddDays(-30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $periodEnd = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/analytics/team?tenant_id=$TenantId&period_start=$periodStart&period_end=$periodEnd" `
            -Method GET `
            -ErrorAction Stop

        if ($response.data.total_agents -ge 0) {
            Write-TestResult "Team Performance Analytics" $true "Total agents: $($response.data.total_agents)"
            return $true
        } else {
            Write-TestResult "Team Performance Analytics" $false "Invalid response"
            return $false
        }
    } catch {
        Write-TestResult "Team Performance Analytics" $false $_.Exception.Message
        return $false
    }
}

# Main Test Execution
Write-Host "🧪 CS-Support Service - Comprehensive Feature Tests" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Tenant ID: $TenantId" -ForegroundColor Gray
Write-Host ""

# Check server
if (-not $SkipServerCheck) {
    $serverRunning = Test-ServerHealth
    if (-not $serverRunning) {
        Write-Host "`n❌ Server is not running. Please start with: npm run dev" -ForegroundColor Red
        Write-Host "   Or run with -SkipServerCheck to test endpoints anyway" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping server health check" -ForegroundColor Yellow
}

# Run tests
$templateId = Test-ReportTemplateCreation
$reportId = Test-ReportGeneration -TemplateId $templateId
Test-ReportRetrieval -ReportId $reportId
Test-IntegrationStatus
Test-AgentPerformance
Test-TeamPerformance

# Summary
Write-Host "`n" + "=" * 70 -ForegroundColor Gray
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "  ❌ Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host "  ⏭️  Skipped: $($testResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Review errors above." -ForegroundColor Yellow
    exit 1
}
