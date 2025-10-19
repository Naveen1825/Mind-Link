# Enable Flags in Canary - Step by Step Guide

## ⚠️ IMPORTANT: Use Regular Canary Launch

Don't use command line flags - they create a separate profile.
Instead, use the normal Canary with flags enabled in chrome://flags.

## Step-by-Step:

### 1. Close ALL Canary Windows
```powershell
Get-Process -Name "chrome" | Where-Object { $_.Path -like "*Chrome SxS*" } | Stop-Process -Force
```

### 2. Open Canary Normally
- Use Start Menu or Desktop shortcut
- Or double-click: %LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe

### 3. Go to chrome://flags

### 4. Enable These Flags (search for each):

✅ `prompt-api-for-gemini-nano` → **Enabled**
✅ `summarization-api-for-gemini-nano` → **Enabled**  
✅ `rewriter-api-for-gemini-nano` → **Enabled**
✅ `optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

### 5. Click "Relaunch" Button at Bottom

### 6. After Canary Restarts:
- Wait 30 seconds
- Press F12
- Go to Console
- Run: `console.log('AI?', !!self.ai);`

### 7. If Still False:
- Update Canary: chrome://settings/help
- Restart again
- Try the test

---

## If Chrome AI APIs Aren't in Canary Yet

The APIs might not be fully rolled out to all Canary users yet.

**Alternative: Wait for stable release OR create fallback version of extension**

Would you like me to create a version that works without Chrome AI?
