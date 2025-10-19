# Enable Chrome Built-in AI APIs - Complete Guide

## Current Issue
All APIs returning `false` on Chrome 141, despite being stable in Chrome 138+.

```json
{
  "self.ai": false,
  "self.ai.languageModel": false,
  "self.ai.summarizer": false,
  "self.ai.translator": false,
  "self.ai.rewriter": false,
  "self.ai.languageDetector": false,
  "chrome.aiOriginTrial": false
}
```

## Root Cause
Even "stable" Chrome AI APIs require **explicit flag enablement** until general availability. The model is downloaded (verified at `chrome://on-device-internals/`) but JavaScript APIs are not exposed.

---

## ✅ Solution: Enable Required Flags

### Step 1: Open Chrome Flags
1. Open Chrome (Stable or Canary)
2. Go to: `chrome://flags`
3. Search for each flag below and enable it

### Step 2: Enable These Specific Flags

#### 🔴 REQUIRED FLAGS (Must enable all):

**Flag 1: Prompt API for Gemini Nano**
```
chrome://flags/#prompt-api-for-gemini-nano
```
- Search: `prompt-api-for-gemini-nano`
- Set to: **Enabled**
- Purpose: Enables the Prompt API (`self.ai.languageModel`)

**Flag 2: Summarization API for Gemini Nano**
```
chrome://flags/#summarization-api-for-gemini-nano
```
- Search: `summarization-api-for-gemini-nano`
- Set to: **Enabled**
- Purpose: Enables the Summarizer API (`self.ai.summarizer`)

**Flag 3: Translation API**
```
chrome://flags/#translation-api
```
- Search: `translation-api`
- Set to: **Enabled**
- Purpose: Enables the Translator API (`self.ai.translator`)

**Flag 4: Rewriter API (Optional)**
```
chrome://flags/#rewriter-api
```
- Search: `rewriter-api`
- Set to: **Enabled** (if available)
- Purpose: Enables the Rewriter API (`self.ai.rewriter`)

**Flag 5: Language Detector API**
```
chrome://flags/#language-detection-api
```
- Search: `language-detection-api`
- Set to: **Enabled**
- Purpose: Enables the Language Detector API (`self.ai.languageDetector`)

**Flag 6: Enable Optimization Guide On Device Model** ⚠️ CRITICAL
```
chrome://flags/#optimization-guide-on-device-model
```
- Search: `optimization-guide-on-device-model`
- Set to: **Enabled BypassPerfRequirement**
- Purpose: Allows Gemini Nano to run (bypasses hardware checks)

### Step 3: Relaunch Chrome
1. After enabling all flags, click **"Relaunch"** button at bottom
2. Chrome will restart with AI APIs enabled

### Step 4: Verify Model Status
1. Go to: `chrome://on-device-internals/`
2. Check "Foundational model state" should show: **Ready**
3. Model version should be: **v3Nano 2025.06.30.1229** (or newer)

### Step 5: Test APIs
1. Open: `d:\Projects\Mind-Link\test-chrome-138-apis.html`
2. All checks should now show `true`:
   ```json
   {
     "self.ai": true,
     "self.ai.languageModel": true,
     "self.ai.summarizer": true,
     "self.ai.translator": true,
     "self.ai.languageDetector": true
   }
   ```

---

## 🔧 Alternative: PowerShell Script to Launch with Flags

If manual flag setting doesn't work, use this script:

```powershell
# Close all Chrome instances
Get-Process chrome* -ErrorAction SilentlyContinue | Stop-Process -Force

# Launch Chrome with all AI flags enabled
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"

if (Test-Path $chromePath) {
    & $chromePath `
        --enable-features="PromptAPIForGeminiNano,SummarizationAPI,TranslationAPI,LanguageDetectionAPI,RewriterAPI,AIPromptAPI,AITextSession,AISummarizerAPI,AIRewriterAPI" `
        --enable-optimization-guide-on-device-model=BypassPerfRequirement `
        --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data" `
        "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
} else {
    Write-Host "Chrome not found at: $chromePath"
}
```

Save as `launch-chrome-with-ai-flags.ps1` and run:
```powershell
& "d:\Projects\Mind-Link\launch-chrome-with-ai-flags.ps1"
```

---

## 🎯 For Chrome Extensions

Once flags are enabled, your extension will have access to all APIs **without** Origin Trial tokens because:

1. **Extensions have privileged access** to stable APIs (Chrome 138+)
2. **Prompt API** is stable for extensions since Chrome 138
3. **Summarizer API** is stable everywhere since Chrome 138
4. **Translator API** is stable everywhere since Chrome 138

### Extension Permissions Required

Your `manifest.json` should have:
```json
{
  "permissions": [
    "aiLanguageModelOriginTrial"
  ]
}
```

**Note:** The permission name is still "Origin Trial" but it's for API access, not actual Origin Trial registration.

---

## 📝 Troubleshooting

### Issue: Flags are missing in chrome://flags

**Solution:** Try Chrome Canary instead:
```powershell
# Check Canary version
$canaryPath = "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe"
& $canaryPath --version
```

### Issue: Model shows "Ready" but APIs still false

**Solutions:**
1. Enable the **"optimization-guide-on-device-model"** flag (most important!)
2. Set it to **"Enabled BypassPerfRequirement"** (not just "Enabled")
3. Restart Chrome completely (close all windows)
4. Check again

### Issue: APIs work in test page but not in extension

**Solutions:**
1. Reload extension at `chrome://extensions`
2. Check `manifest.json` has correct permissions
3. Try accessing from background script (service worker) instead of content script
4. Content scripts may need to use `chrome.runtime.sendMessage()` to background script

---

## ✅ Quick Checklist

- [ ] Chrome version 138+ (you have 141 ✅)
- [ ] Model downloaded and "Ready" at chrome://on-device-internals/ (✅)
- [ ] Flag: `prompt-api-for-gemini-nano` = Enabled
- [ ] Flag: `summarization-api-for-gemini-nano` = Enabled
- [ ] Flag: `translation-api` = Enabled
- [ ] Flag: `optimization-guide-on-device-model` = **Enabled BypassPerfRequirement**
- [ ] Chrome restarted after enabling flags
- [ ] Test page shows `self.ai = true`
- [ ] Extension reloaded at chrome://extensions

---

## 🚀 Next Steps

1. **Enable the 6 flags listed above in chrome://flags**
2. **Relaunch Chrome**
3. **Reload the test page** (`test-chrome-138-apis.html`)
4. **Report back** which APIs now show `true`
5. If all show `true`, we can test the extension!

---

**The key flag you might be missing is:** `#optimization-guide-on-device-model` set to **BypassPerfRequirement**

This is the flag that actually enables the model to be used by JavaScript APIs!
