# Chrome AI Detection Script
# Helps determine why Chrome AI isn't working

Write-Host "🔍 Chrome AI Diagnostic Tool" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check Chrome versions installed
Write-Host "📦 Checking installed Chrome versions...`n" -ForegroundColor Yellow

$chromeVersions = @()

# Chrome Stable
$stablePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $stablePath) {
    $version = (Get-Item $stablePath).VersionInfo.FileVersion
    $chromeVersions += [PSCustomObject]@{
        Channel = "Stable"
        Version = $version
        Path = $stablePath
        MajorVersion = [int]($version -split '\.')[0]
    }
    Write-Host "✅ Chrome Stable: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Chrome Stable: Not found" -ForegroundColor Red
}

# Chrome Canary
$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"
if (Test-Path $canaryPath) {
    $version = (Get-Item $canaryPath).VersionInfo.FileVersion
    $chromeVersions += [PSCustomObject]@{
        Channel = "Canary"
        Version = $version
        Path = $canaryPath
        MajorVersion = [int]($version -split '\.')[0]
    }
    Write-Host "✅ Chrome Canary: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Chrome Canary: Not found" -ForegroundColor Red
}

# Chrome Dev
$devPath = "$env:LOCALAPPDATA\Google\Chrome Dev\Application\chrome.exe"
if (Test-Path $devPath) {
    $version = (Get-Item $devPath).VersionInfo.FileVersion
    $chromeVersions += [PSCustomObject]@{
        Channel = "Dev"
        Version = $version
        Path = $devPath
        MajorVersion = [int]($version -split '\.')[0]
    }
    Write-Host "✅ Chrome Dev: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Chrome Dev: Not found" -ForegroundColor Red
}

Write-Host ""

# Analysis
if ($chromeVersions.Count -eq 0) {
    Write-Host "❌ No Chrome installation found!" -ForegroundColor Red
    Write-Host "   Download Chrome: https://www.google.com/chrome/" -ForegroundColor Yellow
    exit
}

Write-Host "📊 Analysis:" -ForegroundColor Cyan
Write-Host "============`n" -ForegroundColor Cyan

foreach ($chrome in $chromeVersions) {
    Write-Host "$($chrome.Channel) (v$($chrome.MajorVersion)):" -ForegroundColor Yellow
    
    if ($chrome.MajorVersion -ge 128) {
        Write-Host "  ✅ Version supports Chrome AI (128+)" -ForegroundColor Green
        
        if ($chrome.Channel -eq "Canary" -or $chrome.Channel -eq "Dev") {
            Write-Host "  ✅ Chrome AI APIs should work here!" -ForegroundColor Green
            Write-Host "  💡 Recommendation: Use this version for testing" -ForegroundColor Cyan
        } elseif ($chrome.Channel -eq "Stable") {
            Write-Host "  ⚠️  Chrome AI may not be enabled in Stable yet" -ForegroundColor Yellow
            Write-Host "  💡 Try Canary or Dev instead" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Version too old for Chrome AI (need 128+)" -ForegroundColor Red
        Write-Host "  💡 Update Chrome at chrome://settings/help" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Recommendations
Write-Host "`n🎯 Recommendations:" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan

$hasCanary = $chromeVersions | Where-Object { $_.Channel -eq "Canary" }
$hasDev = $chromeVersions | Where-Object { $_.Channel -eq "Dev" }
$hasStable = $chromeVersions | Where-Object { $_.Channel -eq "Stable" -and $_.MajorVersion -ge 128 }

if ($hasCanary) {
    Write-Host "✅ BEST: Use Chrome Canary" -ForegroundColor Green
    Write-Host "   Path: $($hasCanary.Path)" -ForegroundColor Gray
    Write-Host "   1. Close all Chrome windows" -ForegroundColor Gray
    Write-Host "   2. Open Chrome Canary" -ForegroundColor Gray
    Write-Host "   3. Enable flags at chrome://flags" -ForegroundColor Gray
    Write-Host "   4. Restart Canary" -ForegroundColor Gray
    Write-Host "   5. Test your extension" -ForegroundColor Gray
} elseif ($hasDev) {
    Write-Host "✅ GOOD: Use Chrome Dev" -ForegroundColor Green
    Write-Host "   Path: $($hasDev.Path)" -ForegroundColor Gray
} else {
    Write-Host "❌ Chrome Canary/Dev not found" -ForegroundColor Red
    Write-Host "   Download Canary: https://www.google.com/chrome/canary/" -ForegroundColor Yellow
    Write-Host "   OR Download Dev: https://www.google.com/chrome/dev/" -ForegroundColor Yellow
}

if ($hasStable) {
    Write-Host "`n⚠️  Chrome Stable:" -ForegroundColor Yellow
    Write-Host "   Version $($hasStable.Version) supports Chrome AI" -ForegroundColor Yellow
    Write-Host "   BUT: APIs may not be enabled in Stable yet" -ForegroundColor Yellow
    Write-Host "   Wait for Chrome to enable them, or use Canary/Dev now" -ForegroundColor Yellow
}

# Offer to open download page
Write-Host "`n"
$response = Read-Host "Open Chrome Canary download page? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process "https://www.google.com/chrome/canary/"
    Write-Host "✅ Opening Chrome Canary download page..." -ForegroundColor Green
}

Write-Host "`n✅ Diagnostic complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Download Chrome Canary (if not installed)" -ForegroundColor White
Write-Host "2. Open Canary and go to chrome://flags" -ForegroundColor White
Write-Host "3. Enable: #prompt-api-for-gemini-nano" -ForegroundColor White
Write-Host "4. Enable: #summarization-api-for-gemini-nano" -ForegroundColor White
Write-Host "5. Enable: #rewriter-api-for-gemini-nano" -ForegroundColor White
Write-Host "6. Restart Canary" -ForegroundColor White
Write-Host "7. Load your extension in Canary" -ForegroundColor White
Write-Host "8. Test! It should work! 🚀`n" -ForegroundColor White
