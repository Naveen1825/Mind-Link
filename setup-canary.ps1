# Chrome Canary AI Model Setup Script
# Forces download of Gemini Nano model in Chrome Canary

Write-Host "Chrome Canary AI Model Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Canary is installed
$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"
if (-not (Test-Path $canaryPath)) {
    Write-Host "[ERROR] Chrome Canary not found!" -ForegroundColor Red
    Write-Host "Please install from: https://www.google.com/chrome/canary/" -ForegroundColor Yellow
    exit
}

Write-Host "[OK] Chrome Canary found" -ForegroundColor Green
$version = (Get-Item $canaryPath).VersionInfo.FileVersion
Write-Host "Version: $version`n" -ForegroundColor Gray

Write-Host "IMPORTANT STEPS:" -ForegroundColor Yellow
Write-Host "================`n" -ForegroundColor Yellow

Write-Host "1. Make sure you've RESTARTED Canary after enabling flags" -ForegroundColor White
Write-Host "   (Close ALL Canary windows, then reopen)" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Try these additional flags in chrome://flags:" -ForegroundColor White
Write-Host "   - optimization-guide-on-device-model" -ForegroundColor Cyan
Write-Host "   - optimization-guide-model-execution" -ForegroundColor Cyan
Write-Host "   Set both to 'Enabled BypassPerfRequirement'" -ForegroundColor Gray
Write-Host ""

Write-Host "3. After enabling those flags, restart Canary again" -ForegroundColor White
Write-Host ""

Write-Host "4. Then run this JavaScript in Canary Console:" -ForegroundColor White
Write-Host "   (Press F12 in Canary, go to Console tab, paste this)`n" -ForegroundColor Gray

$jsCode = @'
// Chrome Canary AI Test Script
console.clear();
console.log("=== Chrome AI Diagnostic ===\n");

// Step 1: Check if APIs exist
console.log("1. Checking API availability...");
console.log("   self.ai exists:", !!self.ai);
console.log("   self.ai.languageModel:", !!self.ai?.languageModel);
console.log("   self.ai.summarizer:", !!self.ai?.summarizer);
console.log("   self.ai.rewriter:", !!self.ai?.rewriter);

if (!self.ai?.languageModel) {
    console.error("\n❌ PROBLEM: Chrome AI APIs not found!");
    console.log("\n📋 Solutions:");
    console.log("1. Check chrome://flags - enable these:");
    console.log("   - prompt-api-for-gemini-nano");
    console.log("   - summarization-api-for-gemini-nano");
    console.log("   - rewriter-api-for-gemini-nano");
    console.log("   - optimization-guide-on-device-model (Enabled BypassPerfRequirement)");
    console.log("   - optimization-guide-model-execution (Enabled BypassPerfRequirement)");
    console.log("2. Close ALL Chrome Canary windows");
    console.log("3. Reopen Canary and run this test again");
} else {
    console.log("\n✅ APIs found! Checking model status...\n");
    
    // Step 2: Check capabilities
    (async () => {
        try {
            const caps = await self.ai.languageModel.capabilities();
            console.log("2. Model capabilities:", caps);
            
            if (caps.available === "no") {
                console.error("\n❌ PROBLEM: Model not available on this device");
                console.log("Your device may not meet requirements.");
                
            } else if (caps.available === "after-download") {
                console.log("\n⏳ Model needs download. Triggering now...\n");
                
                // Trigger download
                const session = await self.ai.languageModel.create({
                    monitor(m) {
                        m.addEventListener("downloadprogress", (e) => {
                            const pct = Math.round((e.loaded / e.total) * 100);
                            const mb = (e.loaded / 1024 / 1024).toFixed(1);
                            const totalMb = (e.total / 1024 / 1024).toFixed(1);
                            console.log(`📥 Downloading: ${pct}% (${mb}/${totalMb} MB)`);
                        });
                    }
                });
                
                console.log("✅ Download started!");
                console.log("This may take 5-10 minutes.");
                console.log("Keep this window open and watch for progress.");
                
                // Test it
                const result = await session.prompt("Say hello");
                console.log("\n🎉 SUCCESS! Model working!");
                console.log("Response:", result);
                await session.destroy();
                
            } else if (caps.available === "readily") {
                console.log("\n✅ Model is ready! Testing...\n");
                
                const session = await self.ai.languageModel.create();
                const result = await session.prompt("Define the word 'test' in one sentence.");
                console.log("🎉 SUCCESS!");
                console.log("Response:", result);
                await session.destroy();
                
                console.log("\n✅ Chrome AI is fully working!");
                console.log("Your extension should now work!");
            }
            
        } catch (error) {
            console.error("\n❌ ERROR:", error.message);
            console.log("\n📋 Troubleshooting:");
            console.log("1. Make sure ALL flags are enabled");
            console.log("2. Restart Canary (close all windows)");
            console.log("3. Wait 2 minutes after restart");
            console.log("4. Try this test again");
        }
    })();
}
'@

Write-Host $jsCode -ForegroundColor Cyan

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "READY TO TEST?" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "I'll now:" -ForegroundColor White
Write-Host "1. Open Chrome Canary" -ForegroundColor Gray
Write-Host "2. Open a test page where you can run the script" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Ready to open Canary? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    # Copy JS code to clipboard
    $jsCode | Set-Clipboard
    Write-Host "`n✅ JavaScript code copied to clipboard!" -ForegroundColor Green
    
    # Open Canary with test page
    $testPage = "d:\Projects\Mind-Link\test-chrome-ai.html"
    Start-Process $canaryPath $testPage
    
    Write-Host "✅ Opening Canary with test page..." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Press F12 in Canary (opens DevTools)" -ForegroundColor White
    Write-Host "2. Click 'Console' tab" -ForegroundColor White
    Write-Host "3. Paste the code (Ctrl+V) - it's already copied!" -ForegroundColor White
    Write-Host "4. Press Enter" -ForegroundColor White
    Write-Host "5. Watch the output - it will tell you what's wrong`n" -ForegroundColor White
}

Write-Host "`nALSO CHECK:" -ForegroundColor Yellow
Write-Host "============" -ForegroundColor Yellow
Write-Host "In Chrome Canary, go to: chrome://components" -ForegroundColor White
Write-Host "Look for: 'Optimization Guide On Device Model'" -ForegroundColor White
Write-Host "If Version is 0.0.0.0 - click 'Check for update'" -ForegroundColor Gray
Write-Host "Wait 5-10 minutes for download`n" -ForegroundColor Gray

Write-Host "Setup script complete!`n" -ForegroundColor Green
