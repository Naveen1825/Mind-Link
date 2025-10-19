# Enable Chrome AI Origin Trial - Complete Guide

## 🎯 What You Found
You saw the model is ready at chrome://on-device-internals/
But the JavaScript APIs (self.ai) are still not available.

This is because the APIs are behind an **Origin Trial**.

---

## ✅ Method 1: Enable Origin Trial Bypass (Easiest)

### In Chrome, go to chrome://flags and try these:

1. **Search for:** `enable-experimental-web-platform-features`
   **Set to:** Enabled

2. **Search for:** `enable-ai-origin-trial`
   **Set to:** Enabled (if it exists)

3. **Search for:** `bypass-origin-trial`
   **Set to:** Enabled (if it exists)

4. **Restart Chrome**

5. **Test again:**
```javascript
console.log('AI?', !!self.ai);
```

---

## ✅ Method 2: Register for Origin Trial (Official Way)

If the bypass doesn't work, you need to register for the Origin Trial:

### Step 1: Get an Origin Trial Token

1. Go to: https://developer.chrome.com/origintrials/#/trials/active
2. Look for "Built-in AI APIs" trial
3. Click "Register"
4. Enter your website origin (for testing, use `http://localhost` or `file://`)
5. Get your token (a long string)

### Step 2: Add Token to Your Extension

In your `manifest.json`, add:

```json
{
  "trial_tokens": [
    "YOUR_LONG_TOKEN_STRING_HERE"
  ]
}
```

OR add a meta tag to your HTML:

```html
<meta http-equiv="origin-trial" content="YOUR_TOKEN_HERE">
```

---

## ✅ Method 3: Launch Chrome with Origin Trial Disabled

Close Chrome and run:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-features=Gemini,GeminiNano --disable-features=OriginTrials
```

---

## 🔍 Quick Diagnostic

Run this in Console to see what's blocking the APIs:

```javascript
// Check feature status
console.log('Feature Detection:');
console.log('=================');
console.log('self.ai:', !!self.ai);
console.log('Experimental features:', document.featurePolicy?.features());

// Check if origin trial is the issue
if (!self.ai) {
  console.log('\n❌ AI APIs not available');
  console.log('Possible reasons:');
  console.log('1. Origin Trial not enabled');
  console.log('2. Need to register for trial token');
  console.log('3. Chrome version too old');
  console.log('4. APIs not rolled out to your region yet');
}
```

---

## 🎯 What to Try RIGHT NOW:

### Option A: Enable Experimental Features Flag
1. Go to `chrome://flags`
2. Search: `enable-experimental-web-platform-features`
3. Set to: **Enabled**
4. Click Relaunch
5. Wait 30 seconds
6. Test: `console.log('AI?', !!self.ai);`

### Option B: Check if There's a Specific AI Origin Trial Flag
1. Go to `chrome://flags`
2. Search for: `origin trial` (see what comes up)
3. Search for: `bypass` (see if there's a bypass flag)
4. Enable any that look related to AI or origin trials
5. Restart
6. Test again

---

## 📋 Tell me:

After trying the experimental features flag, what do you see?

Also, in `chrome://flags`, search for:
- "origin trial"
- "experimental"
- "bypass"

Tell me what flags you find! One of them might be the key to unlocking the APIs.
