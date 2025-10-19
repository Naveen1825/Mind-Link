# Quick Start Guide - Chrome Built-in AI Migration

## 🎯 For Developers: What You Need to Know

### Before vs. After

#### ❌ OLD WAY (Generic Gemini API)
```javascript
// Exposed API key
const GEMINI_API_KEY = "AIzaSy...";

// Network call required
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
  { method: 'POST', body: JSON.stringify({ contents: [...] }) }
);
```

#### ✅ NEW WAY (Chrome Built-in AI)
```javascript
// No API key needed
// Local on-device processing

const session = await self.ai.languageModel.create();
const result = await session.prompt("Your prompt here");
await session.destroy();
```

---

## 📦 Setup (5 minutes)

### Step 1: Enable Chrome AI
1. Open `chrome://flags`
2. Enable these flags:
   - `#prompt-api-for-gemini-nano`
   - `#summarization-api-for-gemini-nano`
   - `#rewriter-api-for-gemini-nano`
3. Restart Chrome

### Step 2: Install Extension
```powershell
# Navigate to project folder
cd d:\Projects\Mind-Link

# Load unpacked in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select this folder
```

### Step 3: Test
Open Console (F12) and check:
```javascript
// Should log availability status
// Look for: [Mind-Link] Chrome AI APIs availability: ...
```

---

## 🔑 Key API Changes

### Summarization

**Before:**
```javascript
const prompt = "Summarize: " + text;
const result = await callGemini(prompt);
```

**After:**
```javascript
const summarizer = await self.ai.summarizer.create({
  type: 'tl;dr',
  format: 'markdown',
  length: 'medium'
});
const result = await summarizer.summarize(text);
await summarizer.destroy();
```

### Prompting

**Before:**
```javascript
const result = await fetch(GEMINI_API_URL, {
  method: 'POST',
  body: JSON.stringify({ contents: [...] })
});
```

**After:**
```javascript
const session = await self.ai.languageModel.create({
  temperature: 0.7,
  topK: 40
});
const result = await session.prompt("Your prompt");
await session.destroy();
```

### Feature Detection

**Always check availability first:**
```javascript
if (!self.ai?.languageModel) {
  console.error("Chrome AI not available");
  return;
}

const capabilities = await self.ai.languageModel.capabilities();
if (capabilities.available === "no") {
  console.error("AI model not available on this device");
  return;
}

// Good to go!
```

---

## 🧪 Testing Your Changes

### Test Summarization
```javascript
// In Console
const text = "Your long text here...";
const summary = await window.__notesio_api.summarizeText(text);
console.log(summary);
```

### Test Prompt API
```javascript
// In Console
const result = await window.__notesio_api.callChromeAI("What is AI?");
console.log(result);
```

### Test Feature Detection
```javascript
// In Console
console.log({
  prompt: window.__notesio_api.isChromeAIAvailable(),
  summarizer: window.__notesio_api.isSummarizerAvailable(),
  rewriter: window.__notesio_api.isRewriterAvailable()
});
```

---

## 🐛 Common Issues

### Issue: "Chrome AI not available"
**Fix**: 
1. Check Chrome version (need 128+)
2. Enable flags at `chrome://flags`
3. Restart Chrome
4. Wait for model download

### Issue: "AI model downloading"
**Fix**: 
- Go to `chrome://components`
- Find "Optimization Guide On Device Model"
- Wait for download to complete
- May take 5-10 minutes

### Issue: APIs return errors
**Fix**:
```javascript
// Check capabilities
const caps = await self.ai.languageModel.capabilities();
console.log(caps); // Should be { available: "readily" }
```

---

## 📖 Documentation

- **README.md**: Full user & developer guide
- **MIGRATION_PLAN.md**: Detailed migration strategy
- **MIGRATION_SUMMARY.md**: What changed overview
- **This file**: Quick start for developers

---

## 🚀 Adding New Features

### Template for AI-powered features:

```javascript
// content/my-new-feature.js
(function(){
  async function myAIFeature(input) {
    // 1. Check availability
    if (!window.__notesio_api?.isChromeAIAvailable()) {
      console.error("Chrome AI not available");
      return;
    }

    try {
      // 2. Call AI
      const prompt = `Your prompt here: ${input}`;
      const result = await window.__notesio_api.callChromeAI(prompt);
      
      // 3. Process result
      console.log(result);
      return result;
    } catch (error) {
      // 4. Handle errors gracefully
      console.error("AI error:", error);
      // Show user-friendly message
    }
  }

  // Export
  window.__notesio_myFeature = { myAIFeature };
})();
```

Then add to `manifest.json`:
```json
{
  "content_scripts": [{
    "js": [
      "content/utils.js",
      "content/api.js",
      "content/my-new-feature.js"  // <-- Add here
    ]
  }]
}
```

---

## 📝 Code Style

### Naming Convention
- API wrapper functions: `camelCase`
- Internal functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Global namespace: `window.__notesio_*`

### Error Handling
Always provide user-friendly error messages:
```javascript
try {
  // AI operation
} catch (error) {
  console.error("[Mind-Link] Error:", error);
  
  let userMessage = "Something went wrong.";
  if (error.message.includes("not available")) {
    userMessage = "⚠️ Chrome AI not available. Enable at chrome://flags";
  }
  
  // Show to user
  alert(userMessage);
}
```

---

## 🔍 Debugging

### Enable Verbose Logging
```javascript
// In Console
localStorage.setItem('mindlink-debug', 'true');
// Reload page
```

### Check AI Status
```javascript
// In Console
await ai.languageModel.capabilities()
// { available: "readily" } ✅
// { available: "after-download" } ⏳
// { available: "no" } ❌
```

### Monitor Network
- Open DevTools → Network tab
- Should see **NO** requests to `generativelanguage.googleapis.com`
- All AI processing is local

---

## 📊 Performance Tips

### 1. Destroy Sessions
Always clean up:
```javascript
const session = await ai.languageModel.create();
const result = await session.prompt("...");
await session.destroy(); // ← Important!
```

### 2. Limit Prompt Size
```javascript
// Truncate large inputs
const text = document.body.innerText.slice(0, 20000);
```

### 3. Use Appropriate APIs
- **Summarization** → Use `ai.summarizer` (faster, optimized)
- **General prompts** → Use `ai.languageModel`
- **Text rewriting** → Use `ai.rewriter`

---

## ✅ Checklist Before Committing

- [ ] No API keys in code
- [ ] Feature detection implemented
- [ ] Error handling with user-friendly messages
- [ ] Sessions properly destroyed
- [ ] Console logs use `[Mind-Link]` prefix
- [ ] Tested with AI enabled and disabled
- [ ] Updated manifest.json if needed
- [ ] Updated README.md if new feature

---

## 🎓 Learn More

- [Chrome AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)

---

**Happy coding! 🚀**
