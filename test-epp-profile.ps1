# Quick EPP Profile Testing Script
# Use this in your EPP-enrolled Chrome profile

Write-Host "=== EPP Chrome AI Testing ===" -ForegroundColor Cyan
Write-Host ""

# Function to open Chrome pages
function Open-ChromePage {
    param($url)
    Start-Process "chrome.exe" -ArgumentList $url
}

Write-Host "Choose an action:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Check model download status (chrome://on-device-internals/)"
Write-Host "2. Test AI APIs (open test page)"
Write-Host "3. Open Extensions page (to load the extension)"
Write-Host "4. Do all of the above"
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Opening on-device internals..." -ForegroundColor Green
        Open-ChromePage "chrome://on-device-internals/"
    }
    "2" {
        Write-Host "Opening AI test page..." -ForegroundColor Green
        Open-ChromePage "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
    }
    "3" {
        Write-Host "Opening extensions page..." -ForegroundColor Green
        Open-ChromePage "chrome://extensions/"
    }
    "4" {
        Write-Host "Opening all pages..." -ForegroundColor Green
        Open-ChromePage "chrome://on-device-internals/"
        Start-Sleep -Seconds 1
        Open-ChromePage "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
        Start-Sleep -Seconds 1
        Open-ChromePage "chrome://extensions/"
    }
    default {
        Write-Host "Invalid choice. Opening test page..." -ForegroundColor Yellow
        Open-ChromePage "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
    }
}

Write-Host ""
Write-Host "✅ Pages opened in Chrome!" -ForegroundColor Green
Write-Host ""
Write-Host "What to check:" -ForegroundColor Cyan
Write-Host "1. In chrome://on-device-internals/ - Wait for 'Ready' status"
Write-Host "2. In test page - Check if self.ai shows as 'true'"
Write-Host "3. In test page - Click 'Test Prompt API' button"
Write-Host "4. In chrome://extensions/ - Load your extension when APIs work"
Write-Host ""
