# Automated Resend Email Test Script
# Restarts server and tests email sending

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resend Email Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing Node processes on port 3003
Write-Host "Step 1: Stopping existing server..." -ForegroundColor Yellow
$existing = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($existing) {
    $processId = (Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped existing server (PID: $processId)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "  No existing server found" -ForegroundColor Gray
}

# Step 2: Start dev server in background
Write-Host ""
Write-Host "Step 2: Starting dev server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}

Write-Host "  Server starting in background..." -ForegroundColor Gray

# Step 3: Wait for server to be ready
Write-Host ""
Write-Host "Step 3: Waiting for server to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 2
    $attempt++
    $test = Test-NetConnection -ComputerName localhost -Port 3003 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($test) {
        $serverReady = $true
        Write-Host "  Server is ready! (attempt $attempt/$maxAttempts)" -ForegroundColor Green
    } else {
        Write-Host "  Waiting... (attempt $attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if (-not $serverReady) {
    Write-Host ""
    Write-Host "ERROR: Server did not start in time" -ForegroundColor Red
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    exit 1
}

# Step 4: Send test email
Write-Host ""
Write-Host "Step 4: Sending test email..." -ForegroundColor Yellow
$body = @{
    to = "yasha.afghan@gmail.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/v1/test/resend-email" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Email sent!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Email Details:" -ForegroundColor Cyan
    Write-Host "  Email ID: $($json.emailId)" -ForegroundColor White
    Write-Host "  Status: $($json.status)" -ForegroundColor White
    Write-Host "  To: $($json.to)" -ForegroundColor White
    Write-Host "  Unsubscribe Token: $($json.unsubscribeToken)" -ForegroundColor White
    Write-Host ""
    Write-Host "Check your inbox at: yasha.afghan@gmail.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The email should include:" -ForegroundColor Cyan
    Write-Host "  - HTML formatting" -ForegroundColor White
    Write-Host "  - Compliance footer" -ForegroundColor White
    Write-Host "  - UTM tracking on links" -ForegroundColor White
    Write-Host "  - Unsubscribe link" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Failed to send email" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Check server logs for more details" -ForegroundColor Yellow
}

# Step 5: Cleanup
Write-Host ""
Write-Host "Step 5: Server is still running in background" -ForegroundColor Yellow
Write-Host "  To stop the server, run: Stop-Job -Id $($serverJob.Id); Remove-Job -Id $($serverJob.Id)" -ForegroundColor Gray
Write-Host "  Or check server output: Receive-Job -Id $($serverJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
