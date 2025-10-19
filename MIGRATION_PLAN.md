# Chrome Built-in AI APIs Migration Plan

## Overview
This document outlines the migration plan from **generic Gemini API** to **Chrome's built-in AI APIs** (Prompt API, Summarizer API, Translator API) for the Mind-Link Chrome Extension.

---

## Current State Analysis

### Files Using Generic Gemini API

1. **`content/api.js`** 
   - Contains hardcoded Gemini API key
   - Makes REST API calls to `generativelanguage.googleapis.com`
   - Used by: `summarize.js`, `dictionary.js`, `ads-learner.js`

2. **`content/summarize.js`**
   - Uses custom prompt-based summarization via Gemini API
   - Collects page text and sends to generic API
   - Returns markdown-formatted summary

3. **`content/dictionary.js`**
   - Fetches word definitions using Gemini API prompts
   - Shows definition in a floating button

4. **`content/ads-learner.js`**
   - Uses AI to analyze DOM and detect ad patterns
   - Generates CSS selectors and URL filters
   - Returns structured JSON for ad blocking

5. **`manifest.json`**
   - Includes host permission: `https://generativelanguage.googleapis.com/*`
   - Exposes API key in content scripts

---

## Migration Strategy

### Phase 1: Foundation Setup

#### 1.1 Update `manifest.json`
- **Remove**: Generic API host permission
- **Add**: Chrome AI Origin Trial token (if required)
- **Add**: Required permissions for built-in AI APIs

```json
{
  "permissions": [
    "tabs",
    "activeTab",
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "storage",
    "aiLanguageModelOriginTrial"
  ]
}
```

**Note**: Chrome's built-in AI APIs are currently in Origin Trial. You may need to:
- Register at [Chrome Origin Trials](https://developer.chrome.com/origintrials)
- Add the trial token to manifest or HTTP headers

---

### Phase 2: API Wrapper Migration

#### 2.1 Replace `content/api.js`
**Old Approach**: Direct HTTP calls to Gemini API
**New Approach**: Chrome's Prompt API wrapper

**Key Changes**:
- Replace `callGemini()` with `callChromeAI()`
- Use `chrome.ai.languageModel.create()` for Prompt API
- Add feature detection and fallback handling
- Remove API key dependency

**New Implementation**:
```javascript
// content/api.js - Chrome AI wrapper
async function callChromeAI(promptText, options = {}) {
  // Check if Chrome AI is available
  if (!chrome.aiOriginTrial?.languageModel) {
    throw new Error("Chrome AI not available");
  }

  const session = await chrome.aiOriginTrial.languageModel.create({
    temperature: options.temperature || 0.7,
    topK: options.topK || 40
  });

  const result = await session.prompt(promptText);
  await session.destroy();
  return result;
}
```

---

### Phase 3: Feature-Specific Migrations

#### 3.1 Update `content/summarize.js`
**Old**: Custom prompt-based summarization
**New**: Chrome's Summarizer API

**Migration Steps**:
1. Replace `window.__notesio_api.callGemini()` with `chrome.ai.summarizer`
2. Use native summarizer options:
   - `type: 'tl;dr'` or `'key-points'`
   - `format: 'markdown'`
   - `length: 'short'`, `'medium'`, or `'long'`

**Benefits**:
- Native API optimized for summarization
- No need for custom prompts
- Better performance and reliability

**Example Code**:
```javascript
async function summarizePage() {
  const pageText = collectPageText();
  const summarizer = await chrome.ai.summarizer.create({
    type: 'tl;dr',
    format: 'markdown',
    length: 'medium'
  });
  
  const summary = await summarizer.summarize(pageText);
  await summarizer.destroy();
  return summary;
}
```

---

#### 3.2 Update `content/dictionary.js`
**Old**: Gemini API with definition prompt
**New**: Chrome Prompt API

**Migration Steps**:
1. Replace `window.__notesio_api.callGemini()` with `callChromeAI()`
2. Keep the same prompt structure (it works well)
3. Add better error handling for unsupported words

**Changes**:
```javascript
async function fetchDefinition(word) {
  setButtonLoading();
  try {
    const prompt = `Provide a concise dictionary-style definition for the word: "${word}". Keep it to two or three short sentences, plain text.`;
    const text = await window.__notesio_api.callChromeAI(prompt);
    setButtonAsDefinition(text || 'No definition found.');
  } catch (err) {
    console.error('Chrome AI error:', err);
    setButtonAsDefinition('Definition unavailable. Chrome AI may not be enabled.');
  }
}
```

---

#### 3.3 Update `content/ads-learner.js`
**Old**: Gemini API for structured ad detection
**New**: Chrome Prompt API

**Migration Steps**:
1. Replace `window.__notesio_api.callGemini()` with `callChromeAI()`
2. Keep JSON-structured prompts
3. Add retry logic for JSON parsing failures

**Considerations**:
- Prompt API can handle structured outputs
- May need to adjust prompt for better JSON reliability
- Consider reducing payload size for better performance

---

### Phase 4: Enhanced Features

#### 4.1 Add Translator API (NEW Feature)
**Purpose**: Translate technical jargon and complex terms for elderly users

**Implementation**:
```javascript
// New file: content/translator.js
async function translateJargon(text) {
  const translator = await chrome.ai.translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'en-simple' // Simplified English
  });
  
  const simplified = await translator.translate(text);
  await translator.destroy();
  return simplified;
}
```

**Use Cases**:
- Simplify Terms & Conditions
- Explain privacy policies
- Translate technical error messages

---

#### 4.2 Phishing Detection (NEW Feature)
**Purpose**: Analyze page content for phishing indicators

**Implementation**:
```javascript
// New file: content/phishing-detector.js
async function detectPhishing(pageData) {
  const prompt = `Analyze this webpage for phishing indicators:
  - URL: ${pageData.url}
  - Title: ${pageData.title}
  - Suspicious urgency language
  - Fake login forms
  - Mismatched branding
  
  Return JSON: { "isSuspicious": boolean, "reason": string, "trustScore": 1-5 }`;
  
  const result = await callChromeAI(prompt);
  return JSON.parse(result);
}
```

---

### Phase 5: Error Handling & Fallbacks

#### 5.1 Feature Detection
Add checks before using Chrome AI APIs:

```javascript
function isChromeAIAvailable() {
  return !!(chrome.aiOriginTrial?.languageModel);
}

function isSummarizerAvailable() {
  return !!(chrome.ai?.summarizer);
}

function isTranslatorAvailable() {
  return !!(chrome.ai?.translator);
}
```

#### 5.2 Graceful Degradation
When Chrome AI is unavailable:
- Show user-friendly error messages
- Disable AI-powered features gracefully
- Provide manual alternatives (e.g., "AI features require Chrome 128+")

#### 5.3 Loading States
Add proper loading indicators:
- "Initializing AI..."
- "Processing with Chrome AI..."
- Clear error states

---

## Implementation Checklist

### Step 1: Preparation
- [ ] Read Chrome AI API documentation
- [ ] Register for Chrome Origin Trial (if needed)
- [ ] Test Chrome AI availability in target Chrome version

### Step 2: Core Migration
- [ ] Update `manifest.json` permissions
- [ ] Replace `content/api.js` with Chrome AI wrapper
- [ ] Update `content/summarize.js` to use Summarizer API
- [ ] Update `content/dictionary.js` to use Prompt API
- [ ] Update `content/ads-learner.js` to use Prompt API

### Step 3: New Features
- [ ] Create `content/translator.js` for jargon simplification
- [ ] Create `content/phishing-detector.js` for security analysis
- [ ] Add phishing warning UI overlay

### Step 4: Polish
- [ ] Add comprehensive error handling
- [ ] Implement feature detection
- [ ] Add loading states and user feedback
- [ ] Update popup UI for new features
- [ ] Test all features end-to-end

### Step 5: Documentation
- [ ] Update README with new features
- [ ] Document Chrome version requirements
- [ ] Add setup instructions for Origin Trial
- [ ] Create user guide for elderly users

---

## Benefits of Migration

### 1. **Security**
- ✅ No API keys exposed in code
- ✅ No external API calls (data stays local)
- ✅ Better privacy for users

### 2. **Performance**
- ✅ Local AI processing (no network latency)
- ✅ Faster response times
- ✅ Works offline

### 3. **Reliability**
- ✅ No API quota limits
- ✅ No rate limiting issues
- ✅ No dependency on external service uptime

### 4. **Cost**
- ✅ Free (no API usage costs)
- ✅ Unlimited usage

### 5. **User Experience**
- ✅ Native Chrome integration
- ✅ Consistent performance
- ✅ Better error handling

---

## Chrome AI API Requirements

### Minimum Chrome Version
- **Chrome 128+** (Stable with Origin Trial)
- **Chrome 131+** (Planned stable release without trial)

### API Availability Status (as of Oct 2025)
- **Prompt API**: ✅ Available in Origin Trial
- **Summarizer API**: ✅ Available in Origin Trial
- **Translator API**: ✅ Available in Origin Trial
- **Writer API**: ✅ Available in Origin Trial

### How to Enable (for testing)
1. Open `chrome://flags`
2. Enable "Built-in AI APIs"
3. Restart Chrome

---

## Testing Strategy

### 1. Unit Tests
- Test API wrapper functions
- Mock Chrome AI APIs
- Validate error handling

### 2. Integration Tests
- Test summarization on real pages
- Test dictionary on various words
- Test ad detection on known ad-heavy sites

### 3. User Acceptance Testing
- Test with elderly users (target audience)
- Validate UI clarity and simplicity
- Ensure error messages are understandable

### 4. Browser Compatibility
- Test on Chrome 128+ (Origin Trial)
- Test on Chrome Canary (latest features)
- Document minimum version requirements

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1-2)
- Implement core API migrations
- Test on development builds
- Fix critical bugs

### Phase 2: Beta Testing (Week 3-4)
- Deploy to limited user group
- Gather feedback
- Iterate on UX improvements

### Phase 3: Gradual Rollout (Week 5-6)
- Release to 10% of users
- Monitor error rates
- Expand to 50%, then 100%

### Phase 4: Full Migration (Week 7+)
- All users on Chrome AI APIs
- Remove legacy generic API code
- Update documentation

---

## Risk Mitigation

### Risk 1: Chrome AI Not Available
**Mitigation**: Feature detection + graceful degradation + clear user messaging

### Risk 2: API Behavior Differences
**Mitigation**: Extensive testing + prompt engineering adjustments

### Risk 3: Origin Trial Expiration
**Mitigation**: Plan migration timeline before trial ends + monitor Chrome release schedule

### Risk 4: User Chrome Version Too Old
**Mitigation**: Version checking + upgrade prompts + fallback to basic features

---

## Success Metrics

### Technical Metrics
- ✅ 100% of generic API calls replaced
- ✅ 0 exposed API keys
- ✅ <500ms response time for AI features
- ✅ <1% error rate

### User Metrics
- ✅ Feature usage rates maintained or improved
- ✅ User satisfaction scores (via feedback)
- ✅ Reduced support requests for API errors

---

## Next Steps

1. **Review this plan** with the development team
2. **Set up Chrome Origin Trial** registration
3. **Create feature branch** for migration work
4. **Start with Phase 1** (manifest.json + api.js wrapper)
5. **Test incrementally** after each phase

---

## Resources

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Guide](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API Guide](https://developer.chrome.com/docs/ai/summarizer-api)
- [Translator API Guide](https://developer.chrome.com/docs/ai/translator-api)
- [Chrome Origin Trials](https://developer.chrome.com/origintrials)

---

**Last Updated**: October 19, 2025
**Status**: Ready for Implementation
**Estimated Timeline**: 6-8 weeks for full migration
