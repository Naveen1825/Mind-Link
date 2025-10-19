# Launch Chrome with ALL Built-in AI Flags Enabled
# This script properly enables Chrome AI APIs for Chrome 138+

Write-Host "=== Chrome Built-in AI Launcher ===" -ForegroundColor Cyan
Write-Host ""

# Close all Chrome instances first
Write-Host "Closing all Chrome instances..." -ForegroundColor Yellow
Get-Process chrome* -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Find Chrome installation
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromePath = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chromePath) {
    Write-Host "Chrome not found in standard locations." -ForegroundColor Red
    Write-Host "Please check your Chrome installation." -ForegroundColor Red
    exit 1
}

# Get Chrome version
$chromeVersion = (Get-Item $chromePath).VersionInfo.FileVersion
Write-Host "Found Chrome: $chromeVersion" -ForegroundColor Green

# Check if version is 138+
$majorVersion = [int]($chromeVersion.Split('.')[0])
if ($majorVersion -lt 138) {
    Write-Host "Warning: Chrome $majorVersion is older than 138. AI APIs may not work." -ForegroundColor Red
    Read-Host "Press Enter to continue anyway or Ctrl+C to cancel"
}

Write-Host ""
Write-Host "Launching Chrome with ALL AI feature flags enabled..." -ForegroundColor Green
Write-Host ""

# Launch Chrome with all AI flags enabled
& $chromePath `
    --enable-features="PromptAPIForGeminiNano,SummarizationAPI,TranslationAPI,LanguageDetectionAPI,RewriterAPI,AIPromptAPI,AITextSession,AISummarizerAPI,AIRewriterAPI,AILanguageModelOriginTrial" `
    --disable-features="AiSettingsPageRefresh" `
    --enable-optimization-guide-on-device-model=BypassPerfRequirement `
    --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data" `
    "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"

Write-Host ""
Write-Host "✅ Chrome launched with AI flags!" -ForegroundColor Green
Write-Host ""
Write-Host "What to do next:" -ForegroundColor Cyan
Write-Host "1. Wait for the test page to load" -ForegroundColor White
Write-Host "2. Check if APIs show 'true' in the availability check" -ForegroundColor White
Write-Host "3. Click 'Test Prompt API' and 'Test Summarizer API' buttons" -ForegroundColor White
Write-Host "4. If they work, your extension will work too!" -ForegroundColor White
Write-Host ""
Write-Host "Note: The test page should auto-run the availability check." -ForegroundColor Yellow
Write-Host ""
