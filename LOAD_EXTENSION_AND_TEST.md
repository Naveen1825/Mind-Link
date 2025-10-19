# Load Extension and Test AI APIs

## Step 1: Load the Extension in Chrome Canary

1. Open Chrome Canary and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to: `d:\Projects\Mind-Link`
5. Click "Select Folder"

## Step 2: Open the Test Page

After loading the extension:
1. Click on the extension icon in the toolbar
2. Or click "Service worker" link in the extension card
3. Or right-click extension icon → Inspect popup

Then manually navigate to:
```
chrome-extension://[YOUR-EXTENSION-ID]/popup/test-extension-ai.html
```

## Step 3: Test the APIs

Click the buttons in order:
1. "Check API Availability" - Should show `self.ai: true`
2. "Test Prompt API" - Should generate a response
3. "Test Summarizer API" - Should create a summary

---

## Quick PowerShell Command

Run this to open Chrome Canary extensions page:
```powershell
Start-Process "$env:LOCALAPPDATA\Google\Chrome SxS\Application\chrome.exe" -ArgumentList "chrome://extensions/"
```

---

## Why Test from Extension Context?

According to Chrome docs for Chrome 138+:
- **Web pages**: Need Origin Trial token
- **Extensions**: APIs work directly (no token needed!)

The model is ready, EPP is enrolled, so testing from extension context should work!

---

## Expected Result

```
self.ai: true
self.ai.languageModel: true
self.ai.summarizer: true
✅ AI APIs are available and ready!
```

Then clicking "Test Prompt API" should generate:
```
✅ Response:
Hello! I'm Gemma, ready to help!
```
