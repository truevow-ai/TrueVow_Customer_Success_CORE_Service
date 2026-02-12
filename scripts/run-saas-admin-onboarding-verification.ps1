# Run SaaS Admin onboarding verification from this (CS-Support) workspace.
# Use when the SaaS Admin window hangs or you want one command from here.
# Run in PowerShell: .\scripts\run-saas-admin-onboarding-verification.ps1
# Or: powershell -ExecutionPolicy Bypass -File scripts/run-saas-admin-onboarding-verification.ps1

$SaaSAdmin = "C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\2025-TrueVow-SaaS-Administration"
if (-not (Test-Path $SaaSAdmin)) {
    Write-Host "SaaS Admin path not found: $SaaSAdmin"
    exit 1
}

$env:BYPASS_AUTH = "true"
Push-Location $SaaSAdmin

# Check if server is already up
$base = "http://localhost:3000"
try {
    $r = Invoke-WebRequest -Uri $base -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    $alreadyUp = $r.StatusCode -lt 500
} catch {
    $alreadyUp = $false
}

if (-not $alreadyUp) {
    Write-Host "Starting Next.js dev server in background..."
    Start-Process -NoNewWindow npm -ArgumentList "run","dev" -PassThru
    Write-Host "Waiting 90s for server..."
    Start-Sleep -Seconds 90
}

Write-Host "Running onboarding verification (endpoints + unit tests)..."
node scripts/run-onboarding-verification-auto.js --skip-start
$vc = $LASTEXITCODE

Write-Host "Running onboarding unit tests (Jest)..."
npm test -- tests/services/onboarding-sequences.test.ts --passWithNoTests --forceExit 2>&1
$tc = $LASTEXITCODE

Pop-Location
if ($vc -ne 0 -or $tc -ne 0) { exit 1 }
exit 0
