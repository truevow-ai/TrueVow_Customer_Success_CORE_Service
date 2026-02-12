# Run Seed SQL File
# Simple script to execute the seed SQL file

$seedFile = Join-Path $PSScriptRoot "..\database\seed_onboarding_sequence_templates.sql"

Write-Host "🌱 Running Onboarding Templates Seed Script" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $seedFile)) {
    Write-Host "❌ Seed file not found: $seedFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Seed file: $seedFile" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To execute this SQL file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Supabase Dashboard" -ForegroundColor Cyan
Write-Host "  1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "  2. Copy contents of: database/seed_onboarding_sequence_templates.sql" -ForegroundColor White
Write-Host "  3. Paste and click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: psql (use session pooler or direct URL)" -ForegroundColor Cyan
Write-Host "  .\scripts\seed-onboarding-templates.ps1" -ForegroundColor White
Write-Host "  (Uses CS_SUPPORT_DATABASE_SESSION_POOLER_URL or CS_SUPPORT_DATABASE_URL or DATABASE_URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 This will insert 5 templates:" -ForegroundColor Yellow
Write-Host "  • compliance_magnet_loop" -ForegroundColor White
Write-Host "  • founder_authority_sprint" -ForegroundColor White
Write-Host "  • outbound_precision_sprint" -ForegroundColor White
Write-Host "  • partner_influencer_push" -ForegroundColor White
Write-Host "  • selective_paid_capture" -ForegroundColor White
Write-Host ""

# Try to open the file for easy copying
$openFile = Read-Host "Open seed file in editor? (y/n)"
if ($openFile -eq 'y' -or $openFile -eq 'Y') {
    notepad $seedFile
}

Write-Host ""
Write-Host "✅ Ready to seed!" -ForegroundColor Green
