# ✅ EXACT Chrome Canary Flags to Enable

## Go to chrome://flags in Canary and enable EXACTLY these:

### 1. Prompt API for Gemini Nano
**Search for:** `prompt-api-for-gemini-nano`
**Set to:** `Enabled`

### 2. Summarization API for Gemini Nano  
**Search for:** `summarization-api-for-gemini-nano`
**Set to:** `Enabled`

### 3. Rewriter API for Gemini Nano
**Search for:** `rewriter-api-for-gemini-nano`
**Set to:** `Enabled`

### 4. Optimization Guide On Device Model (IMPORTANT!)
**Search for:** `optimization-guide-on-device-model`
**Set to:** `Enabled BypassPerfRequirement`

### 5. (Optional but recommended) Writer API
**Search for:** `writer-api-for-gemini-nano`
**Set to:** `Enabled`

---

## ⚠️ CRITICAL: After Enabling Flags

1. Click "Relaunch" button at bottom of chrome://flags page
2. OR Close ALL Chrome Canary windows completely
3. Wait 10 seconds
4. Open Canary fresh
5. Wait 30 seconds for APIs to initialize
6. Run the test script again

---

## If APIs Still Don't Appear After Restart

Try this alternative approach:

### Option A: Launch Canary with Command Line Flags
Close Canary, then run this in PowerShell:

```powershell
& "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" --enable-features=Gemini,GeminiNano,BypassPerfRequirementForGemini --no-first-run
```

### Option B: Check Your Canary Version
Your Canary version: 143.0.7481.0

The AI APIs are experimental and may not be in every Canary build.

Check if you need to update:
1. Go to chrome://settings/help in Canary
2. Let it check for updates
3. If update available, install it
4. Restart Canary
5. Try again

---

## Test Script (Run After Restart)

```javascript
// Quick test
console.log("AI available?", !!self.ai);
console.log("If false, wait 30 seconds and try again");
```

If it shows `true`, then run the full diagnostic script again.

---

## Why self.ai is False

Possible reasons:
1. ❌ Flags not enabled properly
2. ❌ Canary not restarted after enabling flags
3. ❌ APIs not initialized yet (wait 30-60 seconds after restart)
4. ❌ Your Canary build doesn't have the APIs (try updating)
5. ❌ Windows/system requirements not met

---

## Next Steps:

1. ✅ Go to chrome://flags in Canary
2. ✅ Enable the 4 flags listed above (ignore the missing one)
3. ✅ Click "Relaunch" at the bottom
4. ✅ Wait 30 seconds after Canary reopens
5. ✅ Press F12, paste this:

```javascript
console.log("AI check:", !!self.ai);
```

If it shows `true` → Run full diagnostic
If it shows `false` → Try the command line launch method above
