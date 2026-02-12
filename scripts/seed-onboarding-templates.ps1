# Seed Onboarding Sequence Templates
# Automatically executes the seed SQL file

# Prefer session pooler for short-lived script connections; fallback to direct DB URL
param(
    [string]$DatabaseUrl,
    [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)
if (-not $DatabaseUrl) {
    $DatabaseUrl = $env:CS_SUPPORT_DATABASE_SESSION_POOLER_URL
    if (-not $DatabaseUrl) { $DatabaseUrl = $env:CS_SUPPORT_DATABASE_URL }
    if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }
}

$ErrorActionPreference = "Stop"

Write-Host "🌱 Seeding Onboarding Sequence Templates..." -ForegroundColor Cyan
Write-Host ""

# Check for required environment variables
if (-not $DatabaseUrl -and -not $SupabaseUrl) {
    Write-Host "❌ Error: Database connection not configured" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set one of:" -ForegroundColor Yellow
    Write-Host "  • DATABASE_URL (PostgreSQL connection string)" -ForegroundColor White
    Write-Host "  • NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run the SQL file manually in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "  database/seed_onboarding_sequence_templates.sql" -ForegroundColor White
    exit 1
}

$seedFile = Join-Path $PSScriptRoot "..\database\seed_onboarding_sequence_templates.sql"
$ensureFile = Join-Path $PSScriptRoot "..\database\migrations\ensure_cs_onboarding_sequences_for_seed.sql"

if (-not (Test-Path $seedFile)) {
    Write-Host "Error: Seed file not found: $seedFile" -ForegroundColor Red
    exit 1
}

Write-Host "Found seed file: $seedFile" -ForegroundColor Green
if (Test-Path $ensureFile) { Write-Host "Ensure-migration: $ensureFile" -ForegroundColor Gray }
Write-Host ""

# Try to use psql if a Postgres URL is available (prefer session pooler)
if ($DatabaseUrl) {
    $urlLabel = "DATABASE_URL"
    if ($env:CS_SUPPORT_DATABASE_SESSION_POOLER_URL -and ($DatabaseUrl -eq $env:CS_SUPPORT_DATABASE_SESSION_POOLER_URL)) { $urlLabel = "SESSION_POOLER_URL" }
    Write-Host "Using psql with $urlLabel..." -ForegroundColor Cyan

    $psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psqlCheck) {
        Write-Host "  psql not found in PATH" -ForegroundColor Yellow
    } else {
        Write-Host "  Executing SQL..." -ForegroundColor Gray
        $beforeAt = ($DatabaseUrl -split '@')[0]
        if ($beforeAt -match ':([^:]+)$') { $env:PGPASSWORD = $Matches[1] }
        $errPref = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        if (Test-Path $ensureFile) {
            $null = & psql $DatabaseUrl -f $ensureFile -q 2>&1
        }
        $seedOut = & psql $DatabaseUrl -f $seedFile -q 2>&1
        $ErrorActionPreference = $errPref
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-Host "Seed script executed successfully!" -ForegroundColor Green
            exit 0
        }
        Write-Host "  seed psql exit code: $exitCode" -ForegroundColor Yellow
        if ($seedOut) { Write-Host $seedOut -ForegroundColor Gray }
    }
}

# Fallback: Provide instructions for manual execution
Write-Host "💡 Manual Execution Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please run the SQL file manually:" -ForegroundColor White
Write-Host "  1. Open Supabase Dashboard" -ForegroundColor Cyan
Write-Host "  2. Go to SQL Editor" -ForegroundColor Cyan
Write-Host "  3. Copy contents of: database/seed_onboarding_sequence_templates.sql" -ForegroundColor Cyan
Write-Host "  4. Paste and execute" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use psql directly:" -ForegroundColor White
Write-Host "  psql `$DATABASE_URL -f database/seed_onboarding_sequence_templates.sql" -ForegroundColor Cyan
Write-Host ""

exit 0
