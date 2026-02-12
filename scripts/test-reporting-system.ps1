# PowerShell script to test the Reporting System
# This script runs the TypeScript test file

Write-Host "🚀 Testing Reporting System..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're in the project root
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found. Some tests may fail." -ForegroundColor Yellow
}

# Set environment variables if needed
$env:TEST_TENANT_ID = if ($env:TEST_TENANT_ID) { $env:TEST_TENANT_ID } else { "00000000-0000-0000-0000-000000000000" }
$env:TEST_USER_ID = if ($env:TEST_USER_ID) { $env:TEST_USER_ID } else { "user_test_123" }

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   TEST_TENANT_ID: $env:TEST_TENANT_ID"
Write-Host "   TEST_USER_ID: $env:TEST_USER_ID"
Write-Host ""

# Check if tsx is installed (for running TypeScript directly)
if (-not (Get-Command tsx -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing tsx for TypeScript execution..." -ForegroundColor Yellow
    npm install -g tsx
}

# Run the test script
Write-Host "▶️  Running test script..." -ForegroundColor Green
Write-Host ""

try {
    # Use tsx to run TypeScript directly, or compile first
    if (Get-Command tsx -ErrorAction SilentlyContinue) {
        tsx scripts/test-reporting-system.ts
    } else {
        # Fallback: compile and run
        Write-Host "⚠️  tsx not found. Attempting to compile TypeScript..." -ForegroundColor Yellow
        npx tsc scripts/test-reporting-system.ts --module commonjs --target es2020 --esModuleInterop
        node scripts/test-reporting-system.js
    }
    
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Some tests failed (exit code: $exitCode)" -ForegroundColor Red
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "❌ Error running test script: $_" -ForegroundColor Red
    exit 1
}
