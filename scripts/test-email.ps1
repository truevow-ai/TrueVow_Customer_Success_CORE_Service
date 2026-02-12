# Test Resend Email Script
$body = @{
    to = "yasha.afghan@gmail.com"
} | ConvertTo-Json

try {
    Write-Host "Sending test email..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/v1/test/resend-email" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host ""
    Write-Host "SUCCESS! Email sent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $json = $response.Content | ConvertFrom-Json
    Write-Host "  Email ID: $($json.emailId)" -ForegroundColor White
    Write-Host "  Status: $($json.status)" -ForegroundColor White
    Write-Host "  To: $($json.to)" -ForegroundColor White
    Write-Host ""
    Write-Host "Check your inbox at yasha.afghan@gmail.com" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Make sure the dev server is running: npm run dev" -ForegroundColor Yellow
}
