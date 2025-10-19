# Mind-Link - AI-Powered Web Assistant

> A Chrome extension using **Chrome's Built-in AI APIs** for summarization, definitions, ad blocking, phishing detection, and text simplification.

## 🚀 What Changed - Migration from Generic Gemini API to Chrome Built-in AI

This extension has been **fully migrated** from using generic Gemini API (with API keys) to Chrome's native Built-in AI APIs. This provides:

✅ **Better Security** - No API keys exposed in code  
✅ **Better Privacy** - All AI processing happens locally on-device  
✅ **Better Performance** - No network latency, works offline  
✅ **No Costs** - Free unlimited usage  
✅ **Better Reliability** - No API quotas or rate limits  

### Migration Details

See **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** for the complete migration strategy and implementation checklist.

---

## ✨ Features

### 1. **Page Summarization** 🤓
- Click the extension icon → "Summarize" to get a concise markdown summary
- Uses **Chrome Summarizer API** (native, optimized)
- Fallback to **Prompt API** if Summarizer unavailable
- Perfect for long articles, documentation, or news

### 2. **Word Definitions** 📖
- **Double-click any word** → Click "Define" button
- Get instant, concise definitions
- Uses **Chrome Prompt API**
- Great for learning new vocabulary

### 3. **Intelligent Ad Blocking** 🚫
- Automatically learns site-specific ad patterns using AI
- Blocks ads at the network level (declarativeNetRequest)
- Hides ad containers with cosmetic CSS
- Uses **Chrome Prompt API** for ad detection

### 4. **Phishing Detection** 🛡️ (NEW!)
- Automatically scans pages for phishing indicators
- Shows clear warnings for suspicious sites
- Analyzes:
  - Suspicious URLs
  - Fake urgency language
  - Mismatched branding
  - Suspicious login forms
- Displays trust score (1-5 stars)
- Uses **Chrome Prompt API**

### 5. **Jargon Simplification** 💬 (NEW!)
- Select complex text → Press **Ctrl+Shift+S** (or **Cmd+Shift+S** on Mac)
- Translates technical jargon to simple language
- Perfect for elderly users or non-technical users
- Uses **Chrome Rewriter API** with Prompt API fallback

---

## 🔧 Requirements

### Chrome Version
- **Chrome 128+** (for Origin Trial access)
- **Chrome 131+** recommended (stable Built-in AI APIs)

### Enable Built-in AI

1. Open `chrome://flags`
2. Search for "Built-in AI"
3. Enable the following flags:
   - `#prompt-api-for-gemini-nano`
   - `#summarization-api-for-gemini-nano`
   - `#rewriter-api-for-gemini-nano`
4. Restart Chrome
5. Wait for AI model to download (may take a few minutes on first use)

### Check AI Availability

After enabling, you can verify AI is available by:
1. Opening Chrome DevTools (F12)
2. Going to Console
3. Running:
   ```javascript
   await ai.languageModel.capabilities()
   ```
   Should return `{ available: "readily" }`

---

## 📦 Installation

### Option 1: Load Unpacked (for development)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the extension folder (`Mind-Link`)
6. The extension should now be active!

### Option 2: Build & Install (recommended for users)

```powershell
# Package the extension
Compress-Archive -Path * -DestinationPath mind-link.zip

# Then load the .zip in chrome://extensions
```

---

## 🎯 Usage Guide

### Summarize a Page
1. Navigate to any webpage
2. Click the Mind-Link extension icon
3. Click "Summarize"
4. A summary panel appears in the bottom-right corner

### Define a Word
1. **Double-click** any word on a page
2. A "Define" button appears
3. Click it to see the definition
4. Click outside to close

### Simplify Complex Text
1. **Select** complex text (legal jargon, technical terms, etc.)
2. Press **Ctrl+Shift+S** (Windows/Linux) or **Cmd+Shift+S** (Mac)
3. A "Simplify" button appears
4. Click to see simplified version

### Phishing Detection
- Automatic! Just browse normally
- If a page looks suspicious, you'll see a warning banner at the top
- Trust scores:
  - 🛑 **1-2**: Dangerous (red warning)
  - ⚠️ **3**: Suspicious (orange warning)
  - ✅ **4-5**: Safe (green or no warning)

### Ad Blocking
- Automatic! The extension learns and blocks ads as you browse
- Works on all websites
- Combines AI-detected ads with pre-defined blocklists

---

## 🧪 Testing the Extension

### Test Summarization
1. Visit a long article (e.g., Wikipedia, news site)
2. Click extension → Summarize
3. Check the summary panel appears with markdown content

### Test Dictionary
1. Visit any page with text
2. Double-click a word like "artificial"
3. Click "Define" → should see definition

### Test Jargon Simplifier
1. Visit a page with complex text (e.g., terms of service)
2. Select a sentence or paragraph
3. Press Ctrl+Shift+S
4. Check simplified version appears

### Test Phishing Detection
1. Visit a known safe site (e.g., github.com)
   - Should see no warning
2. Create a test HTML file with suspicious indicators:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Your account will be suspended!</h1>
     <p>Act now to verify your identity!</p>
     <form>
       <input type="password" name="pwd">
     </form>
   </body>
   </html>
   ```
3. Open the file in Chrome → should trigger warning

### Test Ad Blocking
1. Visit a site with ads
2. Ads should be hidden/blocked
3. Check Console for `[Mind-Link]` logs

---

## 🏗️ Architecture

### Files Overview

```
Mind-Link/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (ad rule persistence)
├── popup/
│   ├── index.html            # Extension popup UI
│   └── popup.js              # Popup logic
├── content/
│   ├── api.js                # ✨ Chrome AI API wrapper (NEW)
│   ├── utils.js              # Utility functions
│   ├── summarize.js          # ✨ Summarizer API integration (UPDATED)
│   ├── dictionary.js         # ✨ Prompt API for definitions (UPDATED)
│   ├── ads-learner.js        # ✨ Prompt API for ad detection (UPDATED)
│   ├── phishing-detector.js  # ✨ Phishing detection (NEW)
│   ├── jargon-simplifier.js  # ✨ Text simplification (NEW)
│   ├── summaryPanel.js       # Summary UI panel
│   └── cosmetic.js           # CSS-based ad hiding
└── rules/
    ├── basic-blocklist.json  # Basic ad blocking rules
    └── extended-blocklist.json # Extended ad blocking rules
```

### Chrome AI APIs Used

| Feature | Chrome API | Fallback |
|---------|-----------|----------|
| **Summarization** | `ai.summarizer` | `ai.languageModel` (Prompt API) |
| **Word Definitions** | `ai.languageModel` (Prompt API) | None |
| **Ad Detection** | `ai.languageModel` (Prompt API) | None |
| **Phishing Detection** | `ai.languageModel` (Prompt API) | None |
| **Jargon Simplifier** | `ai.rewriter` | `ai.languageModel` (Prompt API) |

---

## 🐛 Troubleshooting

### "Chrome AI not available" Error

**Cause**: Built-in AI APIs are not enabled or model not downloaded

**Solution**:
1. Ensure Chrome 128+ is installed
2. Enable flags at `chrome://flags` (see Requirements above)
3. Restart Chrome
4. Wait for model download (check `chrome://components` for "Optimization Guide On Device Model")
5. Verify availability in Console:
   ```javascript
   await ai.languageModel.capabilities()
   ```

### Summarization Not Working

**Cause**: Summarizer API may not be available yet

**Solution**:
- The extension automatically falls back to Prompt API
- Check Console for `[Mind-Link]` logs
- Ensure page has readable content (not images/video only)

### Definitions Not Showing

**Cause**: API not initialized or word too short

**Solution**:
- Check Console for errors
- Try double-clicking a longer word (3+ characters)
- Ensure Built-in AI is enabled

### Phishing Warning Not Appearing

**Cause**: Site is on safe list or AI unavailable

**Solution**:
- Known-safe domains (google.com, github.com, etc.) are skipped
- Check Console for `[Mind-Link]` logs
- Ensure AI is enabled

---

## 🔐 Privacy & Security

### Data Processing
- **100% on-device**: All AI processing happens locally using Chrome's Built-in AI
- **No external API calls**: No data sent to Google, OpenAI, or any third party
- **No API keys**: No credentials stored or exposed
- **No tracking**: Extension doesn't collect or transmit user data

### Permissions Explained
- `tabs`, `activeTab`: To access current page content for summarization
- `declarativeNetRequest`: To block ads at network level
- `storage`: To persist learned ad rules locally
- `aiOriginTrial`: To access Chrome's Built-in AI APIs
- `<all_urls>`: To run content scripts on all pages (required for features)

---

## 🛠️ Development

### Project Structure

```javascript
// content/api.js - Main AI wrapper
window.__notesio_api = {
  callChromeAI,        // Prompt API
  summarizeText,       // Summarizer API
  simplifyJargon,      // Rewriter API / Prompt API
  isChromeAIAvailable, // Feature detection
  // ...
};
```

### Adding New AI Features

1. Check API availability:
   ```javascript
   if (!window.__notesio_api.isChromeAIAvailable()) {
     // Handle gracefully
     return;
   }
   ```

2. Use the wrapper:
   ```javascript
   const result = await window.__notesio_api.callChromeAI("Your prompt here");
   ```

3. Handle errors:
   ```javascript
   try {
     const result = await window.__notesio_api.callChromeAI(prompt);
   } catch (error) {
     console.error("AI error:", error);
     // Show user-friendly message
   }
   ```

### Building for Production

1. Test all features in Chrome 128+
2. Update version in `manifest.json`
3. Package:
   ```powershell
   Compress-Archive -Path manifest.json,background.js,popup,content,rules -DestinationPath mind-link-v2.0.0.zip
   ```
4. Upload to Chrome Web Store

---

## 📚 Resources

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Guide](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API Guide](https://developer.chrome.com/docs/ai/summarizer-api)
- [Rewriter API Guide](https://developer.chrome.com/docs/ai/rewriter-api)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style
4. Test thoroughly with Chrome's Built-in AI
5. Submit a pull request

---

## 📝 License

MIT License - feel free to use and modify for your projects!

---

## 🎉 What's New in v2.0.0

### ✅ Migration Complete
- ✅ Removed all generic Gemini API dependencies
- ✅ Migrated to Chrome's Built-in AI APIs
- ✅ No more API keys needed
- ✅ 100% local, private AI processing

### 🆕 New Features
- 🛡️ **Phishing Detection** - Automatic scanning with trust scores
- 💬 **Jargon Simplification** - Convert complex text to simple language
- 🚀 **Better Error Handling** - Clear messages when AI unavailable
- 📊 **Feature Detection** - Graceful fallbacks when APIs unavailable

### 🔧 Improvements
- ⚡ Faster summarization (native Summarizer API)
- 🔒 Better privacy (no external API calls)
- 💰 No costs (no API usage fees)
- 📱 Works offline (after model download)

---

**Made with ❤️ for protecting elderly users and simplifying the web**
