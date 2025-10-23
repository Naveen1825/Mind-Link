# PhishGuard Vision - AI-Powered Safety Shield

> A Chrome extension using **Chrome's Built-in AI APIs** to protect vulnerable users from phishing, scams, and deceptive online practices.

## 🚀 What is PhishGuard Vision?

**PhishGuard Vision** is an intelligent safety extension that protects elderly users and those with low technical literacy from online threats. Using **3 Chrome Built-in AI APIs** (Prompt, Summarizer, Rewriter) with **Gemini Nano**, it creates a multi-layer defense system that works entirely on-device—no external servers, no API keys, complete privacy.

### **Why PhishGuard Vision?**

✅ **On-Device Privacy** - All AI processing happens locally with Gemini Nano  
✅ **Multi-Layer Protection** - Combines domain, text, and visual analysis  
✅ **Elderly-Friendly** - Simplifies complex scam language automatically  
✅ **Zero Cost** - No subscriptions, no API fees, completely free  
✅ **Works Offline** - Threat detection works without internet connection  

---

## ✨ Core Features

### 1. **Multi-Tier Phishing Detection** 🛡️
**APIs Used:** Prompt API (text + multimodal)

Protects users with intelligent 4-tier analysis system:

- **Tier 1 - Domain Analysis** (Always runs)
  - Detects lookalike domains (e.g., "paypa1.com" vs "paypal.com")
  - Flags suspicious TLDs (.tk, .ml, .ga)
  - Identifies URL obfuscation and homograph attacks
  - Verifies HTTPS and certificate validity

- **Tier 2 - Text Analysis** (Triggered when confidence ≤ 3)
  - Detects urgency language ("Act now!", "Account suspended")
  - Identifies scam patterns (fake giveaways, prizes)
  - Analyzes form fields for suspicious data requests

- **Tier 3 - Visual Analysis** (Triggered when confidence ≤ 2)
  - **Multimodal screenshot analysis** with Prompt API
  - Detects spoofed logos (blurry, pixelated, wrong colors)
  - Identifies fake security warnings and scareware
  - Finds deceptive UI elements (fake download buttons)

- **Trust Score System**
  - 🛑 **RED (1-2):** Confirmed phishing/scam
  - ⚠️ **ORANGE (3):** Suspicious, proceed with caution
  - ✅ **GREEN (4-5):** Safe to use

---

### 2. **AI-Learned Ad Blocker** 🚫
**APIs Used:** Prompt API + chrome.declarativeNetRequest

Dynamic ad blocking that learns patterns instead of using static lists:

- Analyzes page DOM structure with Prompt API
- Learns site-specific ad patterns automatically
- Only learns from trusted sites (trust score ≥ 3)
- Blocks malvertising and fake download buttons

---

### Test Hidden Fee Detection
- Visit subscription sites with long T&C
- Look for inline warnings about auto-renewals
- Verify T&C is condensed (5000+ words → 200 words summary)
- Verify simplified version appears (legal jargon → plain language)
- Check that red flags are highlighted (auto-renewal, hidden fees)

---

---

## 🎯 How to Use

### Automatic Protection (No Action Required)

**PhishGuard Vision works automatically!** Just browse normally:

1. Visit any website - Extension analyzes in the background
2. If threat detected - Warning banner appears at the top
3. Trust score displayed - Color-coded indicator (red/orange/green)

**Example Warning:**
```
🛑 DANGER: This site is pretending to be PayPal

Why we flagged this:
• Domain "paypa1.com" looks like "paypal.com" (lookalike)
• Logo is blurry and low quality
• Requesting password on suspicious site

Recommendation: Close this tab immediately.
```

---

### Manual Features

#### **Extension Popup**
Click the extension icon to see:
- Current page trust score
- Statistics (threats blocked, ads blocked)
- "Recheck" button to bypass cache

---

## 🏗️ Technical Architecture

### Chrome Built-in AI APIs

**1. Prompt API (60% of functionality)**
- Domain threat analysis
- Text content analysis
- Multimodal screenshot analysis
- Ad pattern learning
- Red flag detection in T&C summaries

**2. Summarizer API (20% of functionality)**
- Condense T&C from 5000+ words to ~200 words
- Extract key terms and pricing information

**3. Rewriter API (20% of functionality)**
- Simplify complex legal jargon in T&C
- Convert subscription terms to plain language (5th-grade level)
- Make hidden costs clear and honest

### File Structure
```
Mind-Link/
├── manifest.json              # Extension config
├── background.js              # Service worker (screenshots, ad rules)
├── popup/
│   ├── index.html            # Extension popup UI
│   └── popup.js              # Trust score display
├── content/
│   ├── api-bridge.js         # Chrome AI wrapper
│   ├── phishing-detector.js  # Multi-tier detection
│   ├── ads-learner.js        # Dynamic ad blocker
│   ├── terms-analyzer.js     # T&C analysis (Summarizer + Rewriter + Prompt)
│   └── utils.js              # Shared utilities
└── rules/
    ├── basic-blocklist.json  # Pre-defined ad domains
    └── extended-blocklist.json
```

**Performance Optimizations:**
- 24-hour domain caching (80% quota reduction)
- 5-second rate limiting per domain
- 60+ site whitelist (Google, GitHub, Amazon, etc.)
- Smart sequencing (only visual analysis on suspicious sites)
- Payload optimization (30-40% smaller prompts)

---

**Made with ❤️ to protect elderly users from online scams**

*PhishGuard Vision - Because everyone deserves safe, simple web browsing*