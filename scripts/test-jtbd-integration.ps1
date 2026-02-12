# Test Script for JTBD Integration
# Tests the Jobs To Be Done (JTBD) integration with onboarding sequences

param(
    [string]$BaseUrl = "http://localhost:3003",
    [switch]$SkipServerCheck = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 JTBD Integration Tests" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# Check server health
if (-not $SkipServerCheck) {
    Write-Host "🔍 Checking server health..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Server is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Server is not running. Please start with: npm run dev" -ForegroundColor Red
        Write-Host "   Or run with -SkipServerCheck to test anyway" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping server health check" -ForegroundColor Yellow
}

# Run the TypeScript test script
Write-Host "`n🚀 Running JTBD integration tests..." -ForegroundColor Cyan
Write-Host ""

try {
    # Set environment variables for the test script
    $env:TEST_BASE_URL = $BaseUrl
    
    # Run the test script using tsx
    npx tsx scripts/test-jtbd-integration.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ All tests completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n⚠️  Some tests failed or had warnings" -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "`n❌ Failed to run tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
