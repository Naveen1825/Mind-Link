# 🚀 Quick Start Testing Guide

## Current Status: ✅ All API Updates Complete

All 10 required changes have been successfully applied to the extension.

---

## 🎯 Quick 3-Step Testing Process

### **Step 1: Load the Extension** (2 minutes)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select this folder: `/Users/gauthamkrishna/Projects/Mind-Link`
5. ✅ Extension should load without errors

### **Step 2: Check Service Worker** (1 minute)

1. On the extensions page, find "Mind-Link"
2. Click the **"service worker"** link
3. In the console that opens, paste and run:

```javascript
// Quick API test
chrome.runtime.sendMessage({
  type: 'AI_REQUEST',
  action: 'checkAIAvailability'
}, (response) => {
  console.log('✅ API Check:', response);
});
```

**Expected output:**
```javascript
{
  success: true,
  available: {
    languageModel: true,
    summarizer: true,
    translator: true,
    rewriter: true
  }
}
```

### **Step 3: Run Automated Tests** (3 minutes)

1. Open in Chrome: `file:///Users/gauthamkrishna/Projects/Mind-Link/test-updated-apis.html`
2. Click **"▶️ Run All Tests"**
3. ✅ All 4 tests should pass

---

## 🐛 Troubleshooting

### If APIs show as "not available":

1. **Enable Chrome Flags:**
   - Go to `chrome://flags/`
   - Search and enable:
     - `#prompt-api-for-gemini-nano`
     - `#summarization-api-for-gemini-nano`
     - `#translation-api`
     - `#optimization-guide-on-device-model` (set to "Enabled BypassPerfRequirement")
   - **Restart Chrome**

2. **Download AI Model:**
   - Go to `chrome://on-device-internals`
   - Check if "Gemini Nano" shows as "Ready"
   - If downloading, wait 10-20 minutes

### If extension has errors:

1. Click **"Errors"** button in `chrome://extensions/`
2. Common issues:
   - **"systemPrompt not valid"** → Extension not reloaded. Click reload icon ↻
   - **"tl;dr not valid"** → Old code cached. Clear cache and reload
   - **"LanguageModel not defined"** → Chrome flags not enabled

---

## ✅ What Changed?

| Old Code | New Code | Why? |
|----------|----------|------|
| `systemPrompt: 'text'` | `initialPrompts: [{ role: 'system', content: 'text' }]` | Chrome updated the API structure |
| `type: 'tl;dr'` | `type: 'tldr'` | Removed semicolon from type name |
| `self.ai.languageModel` | `LanguageModel` | Direct API access (no namespace) |

---

## 📁 Test Files Available

- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **test-updated-apis.html** - Interactive automated test suite
- **quick-test.sh** - Command-line validation script
- **check-api-availability.html** - Original API checker

---

## 🎯 Expected Behavior

After successful testing:

✅ **Extension loads** without errors  
✅ **Service worker** runs without errors  
✅ **LanguageModel API** works with `initialPrompts`  
✅ **Summarizer API** works with `'tldr'` type  
✅ **Phishing detection** runs on web pages  
✅ **Page summarization** feature works  

---

## 📞 Next Steps

1. ✅ **Load extension** in Chrome
2. ✅ **Run quick test** (service worker console)
3. ✅ **Run automated tests** (test-updated-apis.html)
4. ✅ **Test on real pages** (try phishing detection, summarization)

---

## 🎉 Success Indicators

You'll know everything works when:

- Extension icon appears in toolbar
- No errors in service worker console
- Test page shows "✅ All tests passed!"
- Phishing detection analyzes pages without errors
- Page summarization generates summaries

---

**Need more details?** See `TESTING_GUIDE.md`

**Found an issue?** Check the troubleshooting section above

**Ready to test?** Start with Step 1! 🚀
