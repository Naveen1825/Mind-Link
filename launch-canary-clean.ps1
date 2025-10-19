# Launch Chrome Canary Clean (No Unsupported Flags)
# For EPP Testing

Write-Host "=== Launching Chrome Canary Clean ===" -ForegroundColor Cyan
Write-Host ""

# Close all Chrome Canary instances
Write-Host "Closing Chrome Canary..." -ForegroundColor Yellow
Get-Process chrome* -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*SxS*" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Launching Chrome Canary..." -ForegroundColor Green
Write-Host ""

# Launch Chrome Canary without any command-line flags
# This ensures flags set in chrome://flags are respected
$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"

if (Test-Path $canaryPath) {
    & $canaryPath "chrome://flags"
    Write-Host ""
    Write-Host "✅ Chrome Canary opened!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NOW MANUALLY ENABLE THESE FLAGS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Search: prompt-api-for-gemini-nano" -ForegroundColor Cyan
    Write-Host "   Set to: Enabled" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Search: summarization-api-for-gemini-nano" -ForegroundColor Cyan
    Write-Host "   Set to: Enabled" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Search: optimization-guide-on-device-model" -ForegroundColor Cyan
    Write-Host "   Set to: Enabled BypassPerfRequirement" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Search: translation-api" -ForegroundColor Cyan
    Write-Host "   Set to: Enabled" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Click the BLUE 'Relaunch' button at the bottom" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After relaunch, press Enter here to test..." -ForegroundColor Green
    Read-Host
    
    # Test after relaunch
    & $canaryPath "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
    
    Write-Host ""
    Write-Host "✅ Test page opened!" -ForegroundColor Green
    Write-Host "Check if self.ai is now TRUE!" -ForegroundColor Cyan
} else {
    Write-Host "Chrome Canary not found!" -ForegroundColor Red
}
