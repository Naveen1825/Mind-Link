# 🔧 Chrome AI Setup Guide - Fix "Chrome AI not available"

## Problem
You see this error: "Chrome AI not available. Enable at chrome://flags"

## Root Cause
The **Gemini Nano AI model** hasn't been downloaded to your device yet.

---

## ✅ Solution (Step-by-Step)

### Step 1: Verify Chrome Version
```
1. Open chrome://version
2. Check: You need Chrome 128 or higher
3. If older, update Chrome
```

### Step 2: Enable AI Flags (DONE ✅)
You've already enabled these:
- ✅ `#prompt-api-for-gemini-nano` - Enabled
- ✅ `#summarization-api-for-gemini-nano` - Enabled  
- ✅ `#rewriter-api-for-gemini-nano` - Enabled

**Good! Now proceed to Step 3.**

---

### Step 3: Download the AI Model ⭐ (THIS IS THE KEY STEP)

The AI model needs to be downloaded to your computer. Here's how:

#### Option A: Automatic Download (Recommended)
```
1. Open chrome://components
2. Scroll down to find: "Optimization Guide On Device Model"
3. Click "Check for update" button
4. Wait 5-10 minutes for download to complete
5. Status should change to a recent date (e.g., "Version: 2024.10.19.0")
6. Restart Chrome
```

#### Option B: Force Download via Console
```
1. Open any webpage
2. Press F12 (open DevTools)
3. Go to Console tab
4. Paste this code:

(async () => {
  const capabilities = await ai.languageModel.capabilities();
  console.log("Status:", capabilities.available);
  
  if (capabilities.available === "after-download") {
    console.log("Starting download...");
    const session = await ai.languageModel.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Progress: ${e.loaded}/${e.total} bytes`);
        });
      }
    });
    console.log("Download initiated!");
  } else {
    console.log("Model status:", capabilities.available);
  }
})();

5. Press Enter
6. Watch the console for download progress
7. Wait for completion (may take 5-10 minutes)
```

---

### Step 4: Verify Installation

After download completes:

```javascript
// Open Console (F12) and run:
await ai.languageModel.capabilities()

// Expected output:
{ available: "readily", defaultTemperature: 0.8, ... }

// If you see "readily" ✅ - You're all set!
// If you see "no" ❌ - Your device doesn't support it
// If you see "after-download" ⏳ - Still downloading
```

---

### Step 5: Test the Extension

```
1. Reload your extension at chrome://extensions
2. Double-click any word on a webpage
3. Click "Define"
4. Should now show definition! ✅
```

---

## 🔍 Troubleshooting

### Issue: Model won't download
**Symptoms**: Status stays "after-download" forever

**Fixes**:
```
1. Check internet connection
2. Ensure you have ~1-2GB disk space
3. Check chrome://components for errors
4. Try restarting Chrome
5. Try disabling/re-enabling flags
6. Clear browsing data (chrome://settings/clearBrowserData)
```

### Issue: "Not supported on this device"
**Symptoms**: `capabilities.available === "no"`

**Possible reasons**:
- Old CPU without required instruction sets
- Insufficient RAM (need 4GB+)
- Operating system too old
- Chrome version too old

**What to do**:
- Update Chrome to latest version
- Update your OS
- Check Chrome Canary (may have newer model support)

### Issue: Model downloaded but still not working
**Symptoms**: Status shows recent version but API fails

**Fixes**:
```
1. Restart Chrome completely (not just reload)
2. Check Console for specific error messages
3. Verify flags are still enabled at chrome://flags
4. Try running test in Console (see Step 4)
```

---

## 📊 Check Model Download Status

### Via chrome://components
```
1. Go to chrome://components
2. Find: "Optimization Guide On Device Model"
3. Check Status:
   - "Version: 0.0.0.0" = Not downloaded ❌
   - "Version: 2024.x.x.x" = Downloaded ✅
   - "Status: Component updated" = Ready ✅
```

### Via Console
```javascript
// Check current status
const caps = await ai.languageModel.capabilities();
console.log(caps);

// Test if it actually works
const session = await ai.languageModel.create();
const result = await session.prompt("Say hello");
console.log(result);
await session.destroy();
// If this works, you're all set! ✅
```

---

## 🎯 Quick Checklist

Before asking for help, verify:

- [ ] Chrome version 128+ (`chrome://version`)
- [ ] Flags enabled at `chrome://flags`
- [ ] Chrome restarted after enabling flags
- [ ] Model downloaded at `chrome://components`
- [ ] Model version is NOT 0.0.0.0
- [ ] Console shows no errors for `ai.languageModel.capabilities()`
- [ ] Test prompt works in Console

---

## 💡 Expected Timeline

| Step | Time |
|------|------|
| Enable flags | 1 minute |
| Restart Chrome | 30 seconds |
| Download model | 5-10 minutes ⏳ |
| Verify installation | 1 minute |
| **Total** | **~10-15 minutes** |

---

## 🚀 Once It's Working

You'll have access to:
- ✅ **Word definitions** (double-click)
- ✅ **Page summarization** (click extension icon)
- ✅ **Text simplification** (Ctrl+Shift+S)
- ✅ **Phishing detection** (automatic)
- ✅ **Smart ad blocking** (automatic)

All **100% offline** after initial setup! 🎉

---

## 📝 Still Having Issues?

1. **Check Console logs**: Look for `[Mind-Link]` messages
2. **Run diagnostics**: Use the Console test scripts above
3. **Check model status**: Verify in `chrome://components`
4. **Try Chrome Canary**: May have newer/better model support
5. **Wait**: Sometimes the model download takes 15-20 minutes

---

## ⚡ Pro Tips

### Speed up download
- Good internet connection
- Don't close Chrome during download
- Don't put computer to sleep

### Verify it's working
```javascript
// Quick test - paste in Console
(async () => {
  try {
    const session = await ai.languageModel.create();
    const result = await session.prompt("Define 'test' in one sentence");
    console.log("✅ Working! Result:", result);
    await session.destroy();
  } catch (e) {
    console.error("❌ Not working:", e.message);
  }
})();
```

### Force re-check
If model seems stuck:
```
1. Go to chrome://components
2. Find "Optimization Guide On Device Model"  
3. Click "Check for update" multiple times
4. Wait 5 minutes between clicks
```

---

**Good luck! The first setup takes time, but after that it's instant! 🚀**
