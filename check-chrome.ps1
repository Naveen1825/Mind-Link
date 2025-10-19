# Chrome AI Detection Script - Simple Version
# Helps determine which Chrome version to use

Write-Host "Chrome AI Diagnostic Tool" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check Chrome Stable
$stablePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $stablePath) {
    $version = (Get-Item $stablePath).VersionInfo.FileVersion
    Write-Host "[OK] Chrome Stable: $version" -ForegroundColor Green
    $majorVersion = [int]($version -split '\.')[0]
    if ($majorVersion -ge 128) {
        Write-Host "     Version OK for Chrome AI" -ForegroundColor Green
        Write-Host "     WARNING: API may not be enabled in Stable yet" -ForegroundColor Yellow
    } else {
        Write-Host "     Too old (need 128+)" -ForegroundColor Red
    }
} else {
    Write-Host "[X] Chrome Stable: Not found" -ForegroundColor Red
}

Write-Host ""

# Check Chrome Canary
$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"
if (Test-Path $canaryPath) {
    $version = (Get-Item $canaryPath).VersionInfo.FileVersion
    Write-Host "[OK] Chrome Canary: $version" -ForegroundColor Green
    Write-Host "     RECOMMENDED: Use Canary for Chrome AI" -ForegroundColor Cyan
    Write-Host "     Path: $canaryPath" -ForegroundColor Gray
} else {
    Write-Host "[X] Chrome Canary: Not found" -ForegroundColor Red
    Write-Host "     Download from: https://www.google.com/chrome/canary/" -ForegroundColor Yellow
}

Write-Host ""

# Check Chrome Dev
$devPath = "$env:LOCALAPPDATA\Google\Chrome Dev\Application\chrome.exe"
if (Test-Path $devPath) {
    $version = (Get-Item $devPath).VersionInfo.FileVersion
    Write-Host "[OK] Chrome Dev: $version" -ForegroundColor Green
    Write-Host "     ALTERNATIVE: Use Dev for Chrome AI" -ForegroundColor Cyan
} else {
    Write-Host "[X] Chrome Dev: Not found" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "RECOMMENDATION:" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

if (Test-Path $canaryPath) {
    Write-Host "USE CHROME CANARY!" -ForegroundColor Green
    Write-Host "Chrome AI works best in Canary." -ForegroundColor White
    Write-Host "`nSteps:" -ForegroundColor Yellow
    Write-Host "1. Close all Chrome windows" -ForegroundColor White
    Write-Host "2. Open Chrome Canary" -ForegroundColor White
    Write-Host "3. Go to chrome://flags" -ForegroundColor White
    Write-Host "4. Enable: prompt-api-for-gemini-nano" -ForegroundColor White
    Write-Host "5. Enable: summarization-api-for-gemini-nano" -ForegroundColor White
    Write-Host "6. Enable: rewriter-api-for-gemini-nano" -ForegroundColor White
    Write-Host "7. Restart Canary" -ForegroundColor White
    Write-Host "8. Load extension in Canary" -ForegroundColor White
    Write-Host "9. Test - it will work!" -ForegroundColor White
} else {
    Write-Host "INSTALL CHROME CANARY!" -ForegroundColor Yellow
    Write-Host "Chrome Stable doesn't have Chrome AI enabled yet." -ForegroundColor White
    Write-Host "`nDownload from:" -ForegroundColor Yellow
    Write-Host "https://www.google.com/chrome/canary/" -ForegroundColor Cyan
    
    Write-Host "`nOpen download page now? (Y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Start-Process "https://www.google.com/chrome/canary/"
        Write-Host "Opening browser..." -ForegroundColor Green
    }
}

Write-Host "`nDiagnostic complete!`n" -ForegroundColor Green
