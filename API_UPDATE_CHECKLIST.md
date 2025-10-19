# 📋 Chrome AI API Update Checklist

## Overview
This document tracks all required changes to align our Chrome Extension with the latest Chrome AI API documentation.

---

## 🎯 Files That Need Updates

### **1. `/content/api.js`**

#### Issues Found:
- [x] **Line 32-34**: Change `systemPrompt` parameter to `initialPrompts` array
- [x] **Line 57-59**: Change `systemPrompt` parameter to `initialPrompts` array (in fallback)
- [x] **Line 93**: Change `type: "tl;dr"` to `type: "tldr"`

#### Changes Required:

**Change #1 (Line 32-34) - First occurrence:**
```javascript
// OLD:
const session = await LanguageModel.create({
  systemPrompt: options.systemPrompt || ''
});

// NEW:
const session = await LanguageModel.create({
  initialPrompts: options.systemPrompt ? [
    { role: 'system', content: options.systemPrompt }
  ] : []
});
```

**Change #2 (Line 57-59) - Fallback occurrence:**
```javascript
// OLD:
const session = await LanguageModel.create({
  systemPrompt: options.systemPrompt || ''
});

// NEW:
const session = await LanguageModel.create({
  initialPrompts: options.systemPrompt ? [
    { role: 'system', content: options.systemPrompt }
  ] : []
});
```

**Change #3 (Line 93) - Summarizer type:**
```javascript
// OLD:
const summarizer = await Summarizer.create({
  type: options.type || "tl;dr",
  format: options.format || "markdown",
  length: options.length || "medium"
});

// NEW:
const summarizer = await Summarizer.create({
  type: options.type || "tldr",  // ✅ Removed semicolon
  format: options.format || "markdown",
  length: options.length || "medium"
});
```

---

### **2. `/background.js`**

#### Issues Found:
- [x] **Line 17-26**: Remove `self.ai` namespace, use direct `LanguageModel` access
- [x] **Line 24-26**: Change `systemPrompt` parameter to `initialPrompts` array
- [x] **Line 38-54**: Remove `self.ai` namespace for Summarizer, use direct access
- [x] **Line 45**: Change `type: 'tl;dr'` to `type: 'tldr'`
- [x] **Line 56-67**: Remove `self.ai` namespace for availability check

#### Changes Required:

**Change #1 (Line 17-26) - LanguageModel API:**
```javascript
// OLD:
if (request.action === 'callLanguageModel') {
  const aiNamespace = typeof self.ai !== 'undefined' ? self.ai : (typeof ai !== 'undefined' ? ai : null);
  
  if (aiNamespace && aiNamespace.languageModel) {
    console.log('[Background] Using ai.languageModel API');
    const session = await aiNamespace.languageModel.create({
      systemPrompt: request.systemPrompt || '',
      temperature: request.temperature || 0.7,
      topK: request.topK || 3
    });
    const result = await session.prompt(request.prompt);
    session.destroy();
    console.log('[Background] AI response received:', result.slice(0, 100));
    return { success: true, result: result.trim() };
  } else {
    throw new Error('AI languageModel not available in service worker context');
  }
}

// NEW:
if (request.action === 'callLanguageModel') {
  if (typeof LanguageModel !== 'undefined') {
    console.log('[Background] Using LanguageModel API');
    
    const createOptions = {
      temperature: request.temperature || 0.7,
      topK: request.topK || 3
    };
    
    // Add initialPrompts if systemPrompt is provided
    if (request.systemPrompt) {
      createOptions.initialPrompts = [
        { role: 'system', content: request.systemPrompt }
      ];
    }
    
    const session = await LanguageModel.create(createOptions);
    const result = await session.prompt(request.prompt);
    session.destroy();
    console.log('[Background] AI response received:', result.slice(0, 100));
    return { success: true, result: result.trim() };
  } else {
    throw new Error('LanguageModel API not available in service worker context');
  }
}
```

**Change #2 (Line 38-54) - Summarizer API:**
```javascript
// OLD:
if (request.action === 'callSummarizer') {
  const aiNamespace = typeof self.ai !== 'undefined' ? self.ai : (typeof ai !== 'undefined' ? ai : null);
  
  if (aiNamespace && aiNamespace.summarizer) {
    console.log('[Background] Using ai.summarizer API');
    const summarizer = await aiNamespace.summarizer.create({
      type: request.type || 'tl;dr',
      format: request.format || 'markdown',
      length: request.length || 'medium'
    });
    const result = await summarizer.summarize(request.text);
    summarizer.destroy();
    console.log('[Background] Summarizer response received:', result.slice(0, 100));
    return { success: true, result: result.trim() };
  } else {
    throw new Error('Summarizer API not available in service worker context');
  }
}

// NEW:
if (request.action === 'callSummarizer') {
  if (typeof Summarizer !== 'undefined') {
    console.log('[Background] Using Summarizer API');
    const summarizer = await Summarizer.create({
      type: request.type || 'tldr',  // ✅ Changed from 'tl;dr'
      format: request.format || 'markdown',
      length: request.length || 'medium'
    });
    const result = await summarizer.summarize(request.text);
    summarizer.destroy();
    console.log('[Background] Summarizer response received:', result.slice(0, 100));
    return { success: true, result: result.trim() };
  } else {
    throw new Error('Summarizer API not available in service worker context');
  }
}
```

**Change #3 (Line 56-67) - Availability Check:**
```javascript
// OLD:
if (request.action === 'checkAIAvailability') {
  const aiNamespace = typeof self.ai !== 'undefined' ? self.ai : (typeof ai !== 'undefined' ? ai : null);
  return {
    success: true,
    available: {
      languageModel: !!(aiNamespace && aiNamespace.languageModel),
      summarizer: !!(aiNamespace && aiNamespace.summarizer),
      translator: !!(aiNamespace && aiNamespace.translator),
      rewriter: !!(aiNamespace && aiNamespace.rewriter)
    }
  };
}

// NEW:
if (request.action === 'checkAIAvailability') {
  return {
    success: true,
    available: {
      languageModel: typeof LanguageModel !== 'undefined',
      summarizer: typeof Summarizer !== 'undefined',
      translator: typeof Translator !== 'undefined',
      rewriter: typeof Rewriter !== 'undefined'
    }
  };
}
```

---

### **3. `/content/api-bridge.js`**

#### Issues Found:
- [x] **Line 34**: Change `type: 'tl;dr'` to `type: 'tldr'`

#### Changes Required:

**Change #1 (Line 34) - Summarizer type:**
```javascript
// OLD:
chrome.runtime.sendMessage({
  type: 'AI_REQUEST',
  action: 'callSummarizer',
  text,
  type: options.type || 'tl;dr',  // ❌
  format: options.format || 'markdown',
  length: options.length || 'medium'
}, (response) => {
  // ...
});

// NEW:
chrome.runtime.sendMessage({
  type: 'AI_REQUEST',
  action: 'callSummarizer',
  text,
  type: options.type || 'tldr',  // ✅ Changed
  format: options.format || 'markdown',
  length: options.length || 'medium'
}, (response) => {
  // ...
});
```

**Note:** The `systemPrompt` parameter being passed (Line 11, 52-53) is fine here since it's just passing data. The background script will handle the conversion to `initialPrompts`.

---

### **4. `/check-api-availability.js`**

#### Issues Found:
- [x] **Line 78**: Change `type: 'tl;dr'` to `type: 'tldr'`

#### Changes Required:

**Change #1 (Line 78) - Summarizer type:**
```javascript
// OLD:
const summarizer = await Summarizer.create({
  type: 'tl;dr',
  format: 'markdown',
  length: 'medium'
});

// NEW:
const summarizer = await Summarizer.create({
  type: 'tldr',  // ✅ Changed from 'tl;dr' to 'tldr'
  format: 'markdown',
  length: 'medium'
});
```

---

## ✅ Files That Are Already Correct

- [x] **Verify** `content/phishing-detector.js` - Only calls wrapper functions
- [x] **Verify** `content/jargon-simplifier.js` - Only calls wrapper functions
- [x] **Verify** `content/summarize.js` - Only calls wrapper functions
- [x] **Verify** `manifest.json` - Permissions are correct

---

## 📊 Summary Table

| File | Total Changes | Status |
|------|---------------|--------|
| `content/api.js` | 3 changes | ✅ Complete |
| `background.js` | 5 changes | ✅ Complete |
| `content/api-bridge.js` | 1 change | ✅ Complete |
| `check-api-availability.js` | 1 change | ✅ Complete |
| **TOTAL** | **10 changes** | ✅ Complete |

---

## 🎯 Key Changes Summary

### 1. **systemPrompt → initialPrompts**
Replace all instances of:
```javascript
systemPrompt: 'text'
```
With:
```javascript
initialPrompts: [{ role: 'system', content: 'text' }]
```

### 2. **"tl;dr" → "tldr"**
Replace all instances of:
```javascript
type: 'tl;dr'
```
With:
```javascript
type: 'tldr'
```

### 3. **self.ai Namespace Removal**
Replace all instances of:
```javascript
self.ai.languageModel
self.ai.summarizer
```
With direct access:
```javascript
LanguageModel
Summarizer
```

---

## 🧪 Testing Checklist

After making all changes, verify:
- [x] Extension loads without errors
- [x] LanguageModel API works (test with phishing detector)
- [x] Summarizer API works (test page summarization)
- [x] Jargon simplifier works
- [x] Background service worker API calls work
- [x] No console errors related to AI APIs
- [x] Check `chrome://on-device-internals` for model status

---

## 📚 References

- Prompt API Documentation: `/documentations/prompt-api.txt`
- Summarizer API Documentation: `/documentations/summarizer_api.txt`
- Translator API Documentation: `/documentations/translator-api.txt`
- Rewriter API Documentation: `/documentations/rewriter-api.txt`
- Writer API Documentation: `/documentations/writer-api.txt`
- Proofreader API Documentation: `/documentations/proof-reader.txt`
- Language Detector Documentation: `/documentations/language-detector.txt`

---

**Last Updated:** October 19, 2025

---

## ✅ ALL CHANGES COMPLETED

All 10 required changes have been successfully implemented across 4 files:

1. ✅ **content/api.js** - Updated `systemPrompt` to `initialPrompts` (2 occurrences) and changed `"tl;dr"` to `"tldr"`
2. ✅ **background.js** - Removed `self.ai` namespace, updated to direct API access, changed `systemPrompt` to `initialPrompts`, and fixed `"tl;dr"` to `"tldr"`
3. ✅ **content/api-bridge.js** - Changed `"tl;dr"` to `"tldr"`
4. ✅ **check-api-availability.js** - Changed `"tl;dr"` to `"tldr"`

The extension is now fully compliant with the latest Chrome AI API documentation.
