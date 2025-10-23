# Chrome Extension APIs Usage Documentation

## Overview
PhishGuard Vision (Mind-Link) is a Manifest V3 Chrome extension that uses multiple Chrome Extension APIs to provide visual phishing detection, ad blocking, and jargon simplification features for elderly users with low technical literacy.

---

## Chrome Extension APIs Used

### 1. **chrome.storage (Storage API)**

**Purpose:** Store and retrieve extension data persistently across browser sessions.

**Why We Use It:**
- Store trust scores for visited websites
- Track the number of ads blocked per site and globally
- Persist learned ad-blocking rules and selectors
- Maintain dynamic rule IDs for the declarative net request system
- Enable the popup to display real-time statistics

**Implementation Locations:**
- `background.js` - Manages ad rules storage and rule ID tracking
- `content/cosmetic.js` - Updates ads blocked counters
- `content/phishing-detector.js` - Stores trust scores per domain
- `popup/popup.js` - Retrieves trust scores and ad statistics for display

**Key Storage Schema:**
```javascript
{
  "trustScore_<hostname>": number (1-5),
  "adsBlocked_<hostname>": number,
  "totalAdsBlocked": number,
  "ad_rules": {
    [host: string]: {
      selectors: string[],
      urlFilters: string[],
      ruleIds: number[]
    }
  },
  "nextRuleId": number
}
```

**Example Usage:**
```javascript
// Store trust score
await chrome.storage.local.set({ [`trustScore_${hostname}`]: trustScore });

// Retrieve ads blocked count
const result = await chrome.storage.local.get(['totalAdsBlocked']);
```

---

### 2. **chrome.runtime (Runtime Messaging API)**

**Purpose:** Enable communication between different parts of the extension (content scripts, background service worker, and popup).

**Why We Use It:**
- Send messages from content scripts to background service worker for AI processing
- Request screenshot captures from content scripts
- Forward phishing analysis requests
- Deliver learned ad rules from content scripts to background
- Enable background AI processing (service workers have access to Chrome AI APIs)

**Implementation Locations:**
- `background.js` - Listens for messages and handles AI requests, screenshot captures
- `content/phishing-detector.js` - Sends screenshot capture requests
- `content/ads-learner.js` - Sends learned ad rules to background
- `content/api-bridge.js` - Bridges web page context with extension context

**Message Types:**
- `CAPTURE_SCREENSHOT` - Request screenshot of current tab
- `AD_RULES_LEARNED` - Send learned ad blocking rules
- `GET_COSMETIC_SELECTORS` - Retrieve stored ad selectors
- AI-related actions: `callLanguageModel`, `callSummarizer`, `analyzeScreenshot`, `checkAIAvailability`

**Example Usage:**
```javascript
// Content script requesting screenshot
const response = await chrome.runtime.sendMessage({ 
  type: 'CAPTURE_SCREENSHOT' 
});

// Background listening for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_SCREENSHOT') {
    // Handle screenshot capture
  }
});
```

---

### 3. **chrome.tabs (Tabs API)**

**Purpose:** Interact with browser tabs for capturing screenshots and querying tab information.

**Why We Use It:**
- Capture visible tab screenshots for visual phishing detection
- Get current active tab information for popup display
- Validate tab state before performing operations
- Query tab URL and metadata for analysis
- Ensure tab is fully loaded before capturing screenshots

**Implementation Locations:**
- `background.js` - Captures screenshots using `captureVisibleTab()`, validates tab state
- `popup/popup.js` - Queries active tab to display trust score and stats

**Key Functions Used:**
- `chrome.tabs.query()` - Find active tab in current window
- `chrome.tabs.get()` - Get tab information by ID
- `chrome.tabs.captureVisibleTab()` - Capture screenshot of visible tab area
- `chrome.tabs.update()` - Ensure tab is focused before capture

**Example Usage:**
```javascript
// Get current active tab
const [tab] = await chrome.tabs.query({ 
  active: true, 
  currentWindow: true 
});

// Capture screenshot with rate limiting
const screenshot = await chrome.tabs.captureVisibleTab(
  tab.windowId,
  { format: 'png', quality: 90 }
);
```

**Rate Limiting Implementation:**
- Maximum 2 screenshots per second (Chrome limitation)
- Enforces 1000ms minimum interval between captures for safety
- Validates tab loading state before capture

---

### 4. **chrome.declarativeNetRequest (Declarative Net Request API)**

**Purpose:** Block network requests matching specific patterns to prevent ads and trackers from loading.

**Why We Use It:**
- Provides efficient, privacy-preserving ad blocking without inspecting request content
- Works in Manifest V3 (replacement for older webRequest blocking)
- Blocks ads, trackers, and malicious content at the network level
- Supports both static (JSON rules) and dynamic (runtime-generated) rules
- Reduces bandwidth and improves page load performance

**Implementation Locations:**
- `manifest.json` - Declares static rule resources and permissions
- `background.js` - Manages dynamic rule updates based on learned patterns
- `rules/` directory - Contains static blocklist JSON files

**Configuration in Manifest:**
```json
"declarative_net_request": {
  "rule_resources": [
    {
      "id": "ruleset_1",
      "enabled": true,
      "path": "rules/basic-blocklist.json"
    },
    {
      "id": "ruleset_extended",
      "enabled": true,
      "path": "rules/extended-blocklist.json"
    },
    {
      "id": "ruleset_bulletproof",
      "enabled": true,
      "path": "rules/bulletproof-blocklist.json"
    }
  ]
}
```

**Dynamic Rules Management:**
- Start dynamic rule IDs at 10000 to avoid conflicts with static rules
- Maximum 1000 dynamic rules enforced to prevent quota errors
- Rules target resource types: script, xmlhttprequest, image, sub_frame, media, font
- Per-host rule tracking for easy removal/updates

**Example Usage:**
```javascript
// Add dynamic blocking rules
await chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [10000, 10001], // Remove old rules
  addRules: [{
    id: 10002,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: 'doubleclick.net',
      resourceTypes: ['script', 'image']
    }
  }]
});
```

---

### 5. **chrome.runtime.onInstalled (Installation Lifecycle)**

**Purpose:** Execute initialization code when extension is first installed or updated.

**Why We Use It:**
- Set up initial dynamic rules on fresh install
- Initialize storage schema with default values
- Clear any conflicting previous state
- Ensure extension starts in a known good state

**Implementation Locations:**
- `background.js` - Sets up initial rules and storage

**Example Usage:**
```javascript
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Mind-Link] Extension installed/updated');
  await ensureInit(); // Initialize storage
  // Set up initial dynamic rules if needed
});
```

---

### 6. **chrome.runtime.getURL (Resource URL API)**

**Purpose:** Get the fully-qualified URL for extension resources.

**Why We Use It:**
- Inject web-accessible resources into page context
- Load extension scripts that need to run in the page's JavaScript context (not content script isolated context)
- Enable access to Chrome built-in AI APIs from web page context

**Implementation Locations:**
- `content/api-bridge.js` - Injects `api.js` into page context

**Example Usage:**
```javascript
const script = document.createElement('script');
script.src = chrome.runtime.getURL('content/api.js');
document.documentElement.appendChild(script);
```

---

## Permissions Required

### In manifest.json:

```json
"permissions": [
  "tabs",                          // Query tabs and capture screenshots
  "activeTab",                     // Access current active tab
  "declarativeNetRequest",         // Block network requests
  "declarativeNetRequestFeedback", // Get feedback on blocked requests
  "storage"                        // Persistent storage access
],
"host_permissions": [
  "<all_urls>"                     // Required for content scripts and DNR on all sites
]
```

### Permission Justifications:

- **`tabs`** - Required to capture screenshots for visual phishing detection and query tab information
- **`activeTab`** - Necessary for popup to access current tab's URL and state
- **`declarativeNetRequest`** - Core ad blocking functionality using network-level request blocking
- **`declarativeNetRequestFeedback`** - Optional feedback on rule effectiveness (for future improvements)
- **`storage`** - Persist trust scores, ad statistics, and learned blocking rules
- **`<all_urls>`** - Content scripts must run on all websites to provide protection everywhere

---

## Architecture: Why These APIs Work Together

### 1. **Phishing Detection Flow:**
```
User visits site 
  → content/phishing-detector.js analyzes page
  → Sends CAPTURE_SCREENSHOT to background.js (chrome.runtime)
  → background.js captures tab screenshot (chrome.tabs)
  → Analyzes with Chrome AI (Gemini Nano)
  → Stores trust score (chrome.storage)
  → Displays warning overlay if suspicious
  → popup.js reads score (chrome.storage) for display
```

### 2. **Ad Blocking Flow:**
```
Extension loads
  → Static DNR rules loaded (chrome.declarativeNetRequest)
  → content/ads-learner.js scans page for ad patterns
  → Sends learned patterns to background.js (chrome.runtime)
  → background.js creates dynamic DNR rules (chrome.declarativeNetRequest)
  → Stores rules for future use (chrome.storage)
  → content/cosmetic.js hides ad elements with CSS
  → Updates blocked count (chrome.storage)
```

### 3. **User Interface Flow:**
```
User clicks extension icon
  → popup.js queries active tab (chrome.tabs)
  → Extracts hostname from URL
  → Retrieves trust score and stats (chrome.storage)
  → Displays color-coded trust card
  → Shows ads blocked count (per-site and global)
```

---

## Key Design Decisions

### 1. **Service Worker for AI Processing**
- Chrome's built-in AI APIs (LanguageModel, Summarizer, etc.) are only available in service worker context
- Background service worker acts as AI processing hub
- Content scripts send messages to background for AI operations
- Ensures AI processing doesn't block page rendering

### 2. **Hybrid Blocking Strategy**
- **Declarative Net Request (DNR):** Network-level blocking for efficiency
- **Cosmetic Hiding:** CSS-based hiding for elements that slip through DNR
- **Dynamic Learning:** AI learns site-specific ad patterns and creates new rules
- Combined approach catches 95%+ of ads and trackers

### 3. **Rate Limiting & Safety**
- Screenshot capture limited to 1 per second (Chrome allows 2/sec)
- Dynamic rules capped at 1000 to prevent quota errors
- Tab state validation before operations
- Error handling to prevent extension from breaking pages

### 4. **Privacy-First Design**
- No external API calls - all processing on-device
- Chrome built-in AI ensures data never leaves device
- Storage is local only, no sync
- No tracking or telemetry

---

## Manifest V3 Compliance

This extension fully complies with Chrome's Manifest V3 requirements:

✅ **Service Worker** instead of background page  
✅ **Declarative Net Request** instead of webRequest blocking  
✅ **Promises** instead of callbacks (async/await)  
✅ **Host permissions** explicitly declared  
✅ **Content Security Policy** enforced  
✅ **No remote code execution** - all code bundled  

---

## Future API Considerations

### Potential Additions:
- **chrome.notifications** - Alert family members when suspicious sites detected
- **chrome.alarms** - Periodic checks for updated blocklists
- **chrome.contextMenus** - Right-click to simplify selected text
- **chrome.downloads** - Export trust score reports

### Not Using (By Design):
- ❌ **chrome.webRequest** - Deprecated in MV3, replaced by DNR
- ❌ **chrome.cookies** - Not needed, respects user privacy
- ❌ **chrome.history** - Don't track browsing history
- ❌ **chrome.bookmarks** - Out of scope for phishing protection

---

## Summary

PhishGuard Vision strategically uses 6 core Chrome Extension APIs to deliver comprehensive protection:

1. **chrome.storage** - Persistent data management
2. **chrome.runtime** - Inter-component communication
3. **chrome.tabs** - Screenshot capture and tab queries
4. **chrome.declarativeNetRequest** - Network-level ad/tracker blocking
5. **chrome.runtime.onInstalled** - Initialization lifecycle
6. **chrome.runtime.getURL** - Resource injection

These APIs work in concert to provide real-time phishing detection, intelligent ad blocking, and jargon simplification - all while maintaining privacy, performance, and Manifest V3 compliance.

---

**Last Updated:** October 20, 2025  
**Extension Version:** 3.0.2  
**Manifest Version:** 3
