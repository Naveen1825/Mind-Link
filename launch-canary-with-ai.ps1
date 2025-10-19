# Launch Chrome Canary with AI Features Enabled
# This bypasses flag settings and forces AI features

Write-Host "Launching Chrome Canary with AI Features" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"

if (-not (Test-Path $canaryPath)) {
    Write-Host "[ERROR] Chrome Canary not found at:" -ForegroundColor Red
    Write-Host $canaryPath -ForegroundColor Gray
    exit
}

Write-Host "[OK] Found Chrome Canary" -ForegroundColor Green
Write-Host "Closing any existing Canary instances...`n" -ForegroundColor Yellow

# Close existing Canary instances
Get-Process -Name "chrome" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Chrome SxS*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Launching Canary with AI features enabled...`n" -ForegroundColor Green

# Launch with AI flags
$flags = @(
    "--enable-features=Gemini,GeminiNano,BypassPerfRequirementForGemini,PromptAPIForGeminiNano,SummarizationAPIForGeminiNano,RewriterAPIForGeminiNano"
    "--no-first-run"
    "--user-data-dir=$env:LOCALAPPDATA\Google\Chrome SxS\User Data"
    "d:\Projects\Mind-Link\test-chrome-ai.html"
)

Start-Process $canaryPath -ArgumentList $flags

Write-Host "✅ Canary launched with AI features!" -ForegroundColor Green
Write-Host "`nIMPORTANT:" -ForegroundColor Yellow
Write-Host "1. Wait 30 seconds for APIs to initialize" -ForegroundColor White
Write-Host "2. Press F12 to open DevTools" -ForegroundColor White
Write-Host "3. Go to Console tab" -ForegroundColor White
Write-Host "4. Paste this quick test:`n" -ForegroundColor White

Write-Host "console.log('AI available?', !!self.ai);" -ForegroundColor Cyan

Write-Host "`nIf it shows 'true' -> AI is working!" -ForegroundColor Green
Write-Host "If it shows 'false' -> Wait longer or try updating Canary`n" -ForegroundColor Yellow
