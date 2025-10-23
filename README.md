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

### 3. **Hidden Fee Detector with T&C Simplification** 💰
**APIs Used:** Summarizer API + Rewriter API + Prompt API (Three-Stage Pipeline)

Protects users from subscription traps hidden in complex Terms & Conditions:

**🆕 NEW: Manual Trigger Button**
- Fixed button in bottom-right corner of every page
- **Button States:**
  - 🔍 **"Analyze Terms"** (Blue) - Click to analyze current page
  - 📋 **"View T&C Analysis"** (Green) - Analysis complete, click to view
  - ⏳ **"Analyzing..."** (Orange) - Processing in progress
  - ❌ **"Not a T&C Page"** (Gray) - Page doesn't contain analyzable terms

**Enhanced Page Detection:**
- **ALL Terms & Conditions pages** - Privacy policies, user agreements, license agreements, refund policies
- **ALL Pricing/Subscription pages** - Pricing tables, plan comparisons, checkout pages, trial offers
- Smart detection using URL, title, content analysis, and UI element recognition

**How It Works:**
1. **Stage 1 - Summarizer API:** Condenses 5000+ word T&C to ~200 words
2. **Stage 2 - Rewriter API:** Simplifies legal jargon to plain, elderly-friendly language
3. **Stage 3 - Prompt API:** Analyzes simplified text for hidden fees and traps

**Detects:**
- Auto-renewal clauses (surprise $99/month charges)
- Hidden fees after trial period
- Non-refundable charges
- Difficult cancellation requirements
- Early termination fees
- Price increases without notice

**User Experience:**

**Automatic Mode:**
- Extension automatically detects T&C and pricing pages in background
- Runs analysis and caches results (24-hour cache)
- Button shows green "View T&C Analysis" when ready
- High-severity findings trigger warning banner automatically

**Manual Mode:**
- User clicks button on any page
- Extension validates if page contains terms or pricing info
- If valid: Runs 3-stage analysis and shows results
- If invalid: Shows error "Not a T&C Page" for 5 seconds

**Example Warning:**
```
⚠️ WARNING: Hidden Fees Detected!

• $1 trial auto-renews at $99.99/month
• Must cancel 7 days before renewal or charged
• Early termination fee: $600

[View Full Analysis] [Dismiss]
```

**Cache System:**
- 24-hour cache prevents redundant analysis
- Manual trigger reuses cached analysis instantly
- Cache stores: summary, simplified text, findings, severity, page type

---

### 3. Test Hidden Fee Detection
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

### 🆕 Manual Terms Analysis Button

**New Feature:** Fixed button in bottom-right corner on every page

**How to Use:**
1. **Look for the button** - Appears on all pages in bottom-right
2. **Check the button state:**
   - 🔍 Blue "Analyze Terms" - Click to analyze current page
   - 📋 Green "View T&C Analysis" - Results ready, click to view
   - ⏳ Orange "Analyzing..." - Processing (15-30 seconds)
   - ❌ Gray "Not a T&C Page" - Page has no analyzable terms

3. **On Terms/Pricing Pages:**
   - Button automatically runs analysis in background
   - Turns green when complete
   - Click to view detailed 3-stage analysis

4. **On Other Pages:**
   - Click button to check if page has hidden terms
   - If not T&C page, shows error notification
   - Button resets after 5 seconds

**What Gets Analyzed:**
- ✅ Terms of Service pages
- ✅ Privacy Policies
- ✅ Pricing/subscription pages
- ✅ User agreements
- ✅ Refund policies
- ✅ Checkout pages with trial offers
- ❌ Regular content pages (blog posts, articles, etc.)

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
