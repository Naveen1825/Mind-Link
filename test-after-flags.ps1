# Test Chrome AI APIs After Enabling Flags
# Run this after relaunching Chrome Canary with flags enabled

Write-Host "=== Testing Chrome AI APIs ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening test page in Chrome Canary..." -ForegroundColor Green

Start-Process "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" -ArgumentList "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Test page opened!" -ForegroundColor Green
Write-Host ""
Write-Host "What to check:" -ForegroundColor Yellow
Write-Host "1. Look at 'API Availability Check' section" -ForegroundColor White
Write-Host "2. self.ai should now be TRUE ✅" -ForegroundColor White
Write-Host "3. Click 'Test Prompt API' button" -ForegroundColor White
Write-Host "4. Should generate a response like you saw in On-Device Internals!" -ForegroundColor White
Write-Host ""
Write-Host "If it works, we'll load your extension! 🚀" -ForegroundColor Cyan
Write-Host ""
