# Enable Chrome AI Flags in Canary (EPP Profile)

## Issue
Model is "Ready" but APIs still return `false` in EPP-enrolled Chrome Canary profile.

## Solution: Enable Flags in Chrome Canary

### Step 1: Open Chrome Flags
1. In Chrome Canary, go to: `chrome://flags`
2. You should see the flags page

### Step 2: Enable These Required Flags

**Copy and paste each flag name to search:**

#### 1. Prompt API ⭐ CRITICAL
```
prompt-api-for-gemini-nano
```
Set to: **Enabled**

#### 2. Summarization API ⭐ CRITICAL
```
summarization-api-for-gemini-nano
```
Set to: **Enabled**

#### 3. Optimization Guide ⭐ MOST CRITICAL
```
optimization-guide-on-device-model
```
Set to: **Enabled BypassPerfRequirement**

#### 4. Translation API
```
translation-api
```
Set to: **Enabled**

#### 5. Language Detection
```
language-detection-api
```
Set to: **Enabled**

#### 6. Rewriter API (if available)
```
rewriter-api
```
Set to: **Enabled**

### Step 3: Relaunch Chrome Canary
- Click the blue **"Relaunch"** button at the bottom of the flags page
- Chrome Canary will restart

### Step 4: Test Again
After relaunch, the test page should auto-reload. Check if `self.ai` is now `true`.

---

## Quick Access Commands

```powershell
# Open Chrome Canary flags page
Start-Process "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" -ArgumentList "chrome://flags"
```

After enabling flags and relaunching:
```powershell
# Open test page again
Start-Process "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" -ArgumentList "file:///d:/Projects/Mind-Link/test-chrome-138-apis.html"
```

---

## Why This Is Needed

Even with EPP enrollment and the model downloaded:
- **Flags act as feature gates** that must be explicitly enabled
- EPP gives you *permission* to use the APIs
- Flags actually *enable* the APIs in the browser

Think of it like:
- EPP = You have the key to the building ✅
- Flags = You need to unlock each door inside 🔑

---

## Expected Result After Enabling Flags

```json
{
  "self.ai": true,  ← Will be TRUE!
  "self.ai.languageModel": true,
  "self.ai.summarizer": true,
  "self.ai.translator": true
}
```

Then the test buttons will work! 🎉
