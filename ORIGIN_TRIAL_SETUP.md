# Chrome Built-in AI Origin Trial Setup

## Current Status
- ❌ APIs not accessible (window.ai is deprecated)
- ✅ Model downloaded and ready (v3Nano 2025.06.30.1229)
- ❌ Need Origin Trial token for production use

## What is Origin Trial?
Chrome's built-in AI APIs are experimental features that require an **Origin Trial token** to use. This ensures controlled rollout and feedback collection.

## Steps to Enable Built-in AI APIs

### Method 1: Register for Origin Trial (Recommended for Production)

1. **Visit the Origin Trials Console:**
   - Go to: https://developer.chrome.com/origintrials/#/trials/active
   - Search for: "Built-in AI" or "Prompt API" or "Summarization API"

2. **Register Your Extension:**
   - Click "Register" on the relevant trial
   - Provide your extension ID (from chrome://extensions)
   - Select "Chrome Extension" as the platform
   - Agree to the terms

3. **Get Your Token:**
   - After registration, you'll receive an Origin Trial token
   - This is a long string like: "A1B2C3D4..."

4. **Add Token to manifest.json:**
   ```json
   {
     "name": "PhishGuard Vision",
     "version": "2.0.0",
     "manifest_version": 3,
     "trial_tokens": [
       "YOUR_ORIGIN_TRIAL_TOKEN_HERE"
     ],
     ...
   }
   ```

5. **Reload Extension:**
   - Go to chrome://extensions
   - Click "Reload" on your extension
   - Test: Open console and check `self.ai`

### Method 2: Enable Developer Mode Bypass (For Local Testing)

For **local development only**, you can bypass Origin Trial:

1. **Enable the bypass flag:**
   - Go to: chrome://flags
   - Search for: **"disable-webplatform-origin-trial"**
   - Set to: **Enabled**
   - Click "Relaunch"

2. **Alternative flag (if available):**
   - Search for: **"enable-experimental-web-platform-features"**
   - Set to: **Enabled**
   - Click "Relaunch"

3. **Test in console:**
   ```javascript
   console.log('AI Available?', !!self.ai);
   console.log('Prompt API?', !!self.ai?.languageModel);
   console.log('Summarizer?', !!self.ai?.summarizer);
   ```

### Method 3: Use Chrome Canary with Dev Flags (For Testing)

Launch Chrome Canary with special flags:

```powershell
# Close all Chrome instances first
Get-Process chrome* | Stop-Process -Force

# Launch Canary with dev flags
& "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" `
  --enable-features=AIPromptAPI,AITextSession,AISummarizerAPI,AIRewriterAPI `
  --disable-features=AiSettingsPageRefresh `
  --enable-experimental-web-platform-features `
  --disable-blink-features=WebPlatformOriginTrial
```

## Verify Setup

After any method, verify in console:

```javascript
// Test basic availability
console.log('Built-in AI:', {
  available: !!self.ai,
  languageModel: !!self.ai?.languageModel,
  summarizer: !!self.ai?.summarizer,
  rewriter: !!self.ai?.rewriter
});

// Test creating a session
(async () => {
  try {
    const model = await self.ai.languageModel.create();
    console.log('✅ Model created successfully!');
    const result = await model.prompt('Say hello!');
    console.log('Result:', result);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
```

## Important Notes

### Current API Status (October 2025)
- **Prompt API**: Early preview, requires Origin Trial
- **Summarization API**: Early preview, requires Origin Trial  
- **Rewriter API**: Early preview, requires Origin Trial
- **window.ai**: ⚠️ **DEPRECATED** - Use `self.ai` instead

### Extension vs Web Page APIs
- Extensions use: `self.ai` (in service workers) or `chrome.ai` (in content scripts)
- Web pages use: `self.ai` (with Origin Trial token in headers)
- Never use: `window.ai` (deprecated)

### Model Availability
Your system shows:
- Model: v3Nano version 2025.06.30.1229
- Status: Ready
- Location: C:\Users\admin\AppData\Local\Google\Chrome\User Data\OptGuideOnDeviceModel\2025.8.8.1141

The model is downloaded and ready - you just need the Origin Trial token or bypass flag!

## Next Steps

1. **For immediate testing:**
   - Try Method 2 (bypass flag) or Method 3 (Canary with flags)
   
2. **For production deployment:**
   - Register for Origin Trial (Method 1)
   - Add token to manifest.json
   - Publish to Chrome Web Store

3. **After enabling:**
   - Reload extension at chrome://extensions
   - Test all features
   - Check console for errors

## Troubleshooting

### "self.ai is undefined"
- Ensure Origin Trial token is in manifest.json OR bypass flag is enabled
- Restart Chrome after enabling flags
- Check chrome://version for correct flags

### "NotSupportedError: Not supported"
- Model may still be downloading (check chrome://on-device-internals/)
- Chrome version may not support the API
- Try Chrome Canary instead

### "Feature not available"
- Some features may not be in your Chrome version yet
- Try updating to latest Chrome/Canary
- Check feature availability at chrome://flags

## Resources

- **Origin Trials:** https://developer.chrome.com/origintrials/
- **Built-in AI Docs:** https://developer.chrome.com/docs/ai/built-in-apis
- **Prompt API:** https://developer.chrome.com/docs/ai/built-in#prompt_api
- **Summarization API:** https://developer.chrome.com/docs/ai/built-in#summarization_api
- **API Reference:** https://github.com/explainers-by-googlers/prompt-api

---

**Current Action Required:** Choose Method 1 (Origin Trial) for production or Method 2/3 for testing!
