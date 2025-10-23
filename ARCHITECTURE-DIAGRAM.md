# Three-Stage Pipeline Architecture

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER VISITS WEBSITE                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT DETECTION LAYER                           │
│                                                                      │
│  • Scans for T&C links ("terms", "conditions", "agreement")        │
│  • Checks if current page IS a T&C page                            │
│  • Extracts content from modals, iframes, expanded sections        │
│  • Filters: Only analyze if > 500 words                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CACHE CHECK LAYER                             │
│                                                                      │
│  • Check chrome.storage.local for cached analysis                   │
│  • Key: URL, Value: {summary, simplified, findings, timestamp}     │
│  • Cache TTL: 24 hours                                              │
│                                                                      │
│  IF CACHED → Load instantly (< 1 second)                           │
│  IF NOT → Proceed to Stage 1                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌═════════════════════════════════════════════════════════════════════┐
║                  STAGE 1: SUMMARIZER API                            ║
║                                                                     ║
║  INPUT:  Full T&C text (5000+ words)                                ║
║          "By subscribing to FluxAntivirus Pro, you hereby           ║
║          acknowledge and agree to be bound by these Terms and       ║
║          Conditions. The Service is provided by FluxTech            ║
║          Solutions LLC, a Delaware corporation... [4900 more words]"║
║                                                                     ║
║  PROCESS: Summarizer API with options:                              ║
║           • type: "tldr"                                            ║
║           • format: "plain-text"                                    ║
║           • length: "short"                                         ║
║                                                                     ║
║  OUTPUT: Condensed summary (~200 words)                             ║
║          "FluxAntivirus Pro offers a $1 trial for 30 days. After    ║
║          the trial, it automatically renews at $99.99/month unless  ║
║          cancelled 7 days before renewal. All fees are non-         ║
║          refundable. Early termination within 12 months incurs a    ║
║          50% fee of remaining payments..."                          ║
║                                                                     ║
║  TIME: ~3-5 seconds                                                 ║
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌═════════════════════════════════════════════════════════════════════┐
║                  STAGE 2: REWRITER API                              ║
║                                                                     ║
║  INPUT:  Summary from Stage 1 (~200 words)                          ║
║          "FluxAntivirus Pro offers a $1 trial for 30 days. After    ║
║          the trial, it automatically renews at $99.99/month..."     ║
║                                                                     ║
║  PROCESS: Rewriter API with options:                                ║
║           • tone: "more-casual"                                     ║
║           • format: "plain-text"                                    ║
║           • length: "as-is"                                         ║
║           • sharedContext: "Terms for subscription service"         ║
║           • context: "Rewrite for elderly users"                    ║
║                                                                 ║
║  OUTPUT: Simplified language (~200 words)                           ║
║          "You pay $1 now for a 30-day trial. After 30 days, you'll  ║
║          be charged $99.99 every month automatically. To cancel,    ║
║          you must send a letter at least 7 days before your next    ║
║          payment. You can't get refunds. If you quit within a year, ║
║          you pay a $600 cancellation fee..."                        ║
║                                                                     ║
║  TIME: ~2-4 seconds                                                 ║
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌═════════════════════════════════════════════════════════════════════┐
║                  STAGE 3: PROMPT API                                ║
║                                                                     ║
║  INPUT:  Simplified text from Stage 2 (~200 words)                  ║
║          "You pay $1 now for a 30-day trial. After 30 days..."      ║
║                                                                     ║
║  PROCESS: Prompt API with detection instructions:                   ║
║           "Analyze this terms of service for:                       ║
║           1. Auto-renewal clauses                                   ║
║           2. Hidden fees after trial                                ║
║           3. Non-refundable charges                                 ║
║           4. Automatic credit card charges                          ║
║           5. Price increases without notice                         ║
║           6. Difficult cancellation requirements                    ║
║           7. Early termination fees                                 ║
║           Return JSON: {hasHiddenFees, severity, findings}"         ║
║                                                                     ║
║  OUTPUT: Structured analysis (JSON)                                 ║
║          {                                                          ║
║            "hasHiddenFees": true,                                   ║
║            "severity": 4,                                           ║
║            "findings": [                                            ║
║              "$1 trial auto-renews at $99.99/month",                ║
║              "Must cancel 7 days before renewal",                   ║
║              "Early termination fee: $600",                         ║
║              "All charges non-refundable"                           ║
║            ]                                                        ║
║          }                                                          ║
║                                                                     ║
║  TIME: ~3-6 seconds                                                 ║
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                        CACHE & DISPLAY                             │
│                                                                    │
│  1. SAVE to chrome.storage.local:                                  │
│     • Key: URL                                                     │
│     • Value: {summary, simplified, findings, severity, timestamp}  │
│                                                                    │
│  2. CREATE WARNING BANNER:                                         │
│     ┌────────────────────────────────────────┐                     │
│     │ ⚠️ WARNING: Potential Hidden Costs     │                     │
│     │                                        │                     │
│     │ • $1 trial auto-renews at $99.99/month │                     │
│     │ • Must cancel 7 days before renewal    │                     │
│     │ • Early termination fee: $600          │                     │
│     │ • All charges non-refundable           │                     │
│     │                                        │                     │
│     │ [View Full Analysis] [Dismiss]         │                     │
│     └────────────────────────────────────────┘                     │
│                                                                    │
│  3. PREPARE DETAILED MODAL:                                        │
│     • Section 1: Summary (Stage 1 output)                          │
│     • Section 2: Simplified (Stage 2 output)                       │
│     • Section 3: Key Findings (Stage 3 output)                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Timeline

```
Timeline (First Analysis - Cold Start):
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 0s │ 1s │ 2s │ 3s │ 4s │ 5s │ 6s │ 7s │ 8s │ 9s │10s │11s │12s │13s │14s │15s
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
  │                                                                         │
  ├─► Content Detection (< 1s)                                            │
  │                                                                         │
  ├─────────► STAGE 1: Summarizer API (3-5s)                              │
  │                                                                         │
  │              ├─────────► STAGE 2: Rewriter API (2-4s)                 │
  │                                                                         │
  │                            ├─────────────► STAGE 3: Prompt API (3-6s) │
  │                                                                         │
  │                                                  ├──► Cache & Display  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────► DONE

Total Time: 10-15 seconds


Timeline (Cached Analysis - Warm Start):
┌────┐
│ 0s │ 1s
└────┘
  │
  ├─► Cache Hit
  │
  └──► Display
       
Total Time: < 1 second (instant)
```

---

## 🔀 API Fallback Chain

```
STAGE 2: Rewriter API
        │
        ├─── Available? ──YES──► Use Rewriter API
        │                         │
        └─── Available? ──NO───► Use Prompt API (Fallback)
                                  │
                                  "Rewrite in simple language..."


STAGE 3: Prompt API
        │
        ├─── Response Valid JSON? ──YES──► Parse & Use
        │                                   │
        └─── Response Valid JSON? ──NO───► Manual Parsing (Fallback)
                                            │
                                            Extract key phrases
```

---

## 🎯 Data Size Reduction

```
┌──────────────────────────────────────────────────────────────┐
│                    INPUT: Full T&C                            │
│                                                               │
│  Size: ~5000 words (~30,000 characters)                      │
│  Reading Time: 25 minutes                                    │
│  Complexity: Legal jargon, complex sentences                 │
│                                                               │
│  "By subscribing to FluxAntivirus Pro ("the Service"),       │
│  you hereby acknowledge and agree to be bound by these       │
│  Terms and Conditions. The Service is provided by            │
│  FluxTech Solutions LLC, a Delaware corporation              │
│  registered at... [4950 more words]"                         │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼ STAGE 1: Summarizer
                            │ (94% reduction)
┌───────────────────────────┴──────────────────────────────────┐
│               STAGE 1 OUTPUT: Summary                         │
│                                                               │
│  Size: ~200 words (~1,200 characters)                        │
│  Reading Time: 1 minute                                      │
│  Complexity: Still formal, but condensed                     │
│                                                               │
│  "FluxAntivirus Pro offers a $1 trial for 30 days.          │
│  After the trial, it automatically renews at $99.99/month    │
│  unless cancelled 7 days before renewal. All fees are        │
│  non-refundable. Early termination within 12 months          │
│  incurs a 50% fee..."                                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼ STAGE 2: Rewriter
                            │ (Simplification)
┌───────────────────────────┴──────────────────────────────────┐
│             STAGE 2 OUTPUT: Simplified                        │
│                                                               │
│  Size: ~200 words (~1,200 characters)                        │
│  Reading Time: 1 minute                                      │
│  Complexity: Plain language, easy to understand              │
│                                                               │
│  "You pay $1 now for a 30-day trial. After 30 days,         │
│  you'll be charged $99.99 every month automatically.         │
│  To cancel, you must send a letter at least 7 days          │
│  before your next payment. You can't get refunds.            │
│  If you quit within a year, you pay a $600 fee..."          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼ STAGE 3: Prompt
                            │ (Extraction)
┌───────────────────────────┴──────────────────────────────────┐
│              STAGE 3 OUTPUT: Key Findings                     │
│                                                               │
│  Size: 4 bullet points (~60 words)                           │
│  Reading Time: 15 seconds                                    │
│  Complexity: Action items, clear warnings                    │
│                                                               │
│  • $1 trial auto-renews at $99.99/month                      │
│  • Must cancel 7 days before renewal                         │
│  • Early termination fee: $600                               │
│  • All charges non-refundable                                │
└──────────────────────────────────────────────────────────────┘

FINAL REDUCTION: 5000 words → 4 bullet points (98% reduction)
USER BENEFIT: 25 minutes → 15 seconds (99% time saved)
```

---

## 🧠 AI API Synergy

```
┌────────────────────────────────────────────────────────────┐
│                 WHY THREE STAGES?                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  OPTION A: Single Prompt API Call                          │
│  ❌ Problem: Token limit (5000 words exceeds context)      │
│  ❌ Problem: Expensive (one large prompt)                  │
│  ❌ Problem: Less accurate (too much noise)                │
│                                                             │
│  OPTION B: Three-Stage Pipeline ✅                         │
│  ✅ Summarizer: Purpose-built for condensing               │
│  ✅ Rewriter: Purpose-built for simplification             │
│  ✅ Prompt: Analyzes clean, focused input                  │
│  ✅ Result: More accurate, faster, better UX               │
│                                                             │
│  SYNERGY EFFECT:                                            │
│  Each API does what it's best at, feeding the next stage   │
│  Like a relay race - each runner specialized for their leg │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER EXPERIENCE FLOW                                        │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  1. User visits subscription site                            │
│     └─► Sees "$1 Trial" offer                               │
│         └─► Clicks "Terms & Conditions" link                │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Extension detects T&C content                            │
│     └─► Console: "Starting three-stage analysis..."         │
│         └─► (10-15 seconds pass)                            │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Warning banner slides in                                 │
│     ┌──────────────────────────────────────┐                │
│     │ ⚠️ WARNING: Potential Hidden Costs   │                │
│     │                                      │                │
│     │ • $1 trial auto-renews at $99.99/mo │                │
│     │ • Must cancel 7 days before renewal │                │
│     │ • Early termination fee: $600       │                │
│     │ • All charges non-refundable        │                │
│     │                                      │                │
│     │ [View Full Analysis] [Dismiss]      │                │
│     └──────────────────────────────────────┘                │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User clicks "View Full Analysis"                         │
│     └─► Modal opens with 3 sections                         │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Modal shows detailed breakdown                           │
│     ┌──────────────────────────────────────┐                │
│     │ 📝 Summary (Stage 1: Summarizer API) │                │
│     │ [Condensed 200-word version]         │                │
│     │                                      │                │
│     │ ✏️ Simplified (Stage 2: Rewriter)    │                │
│     │ [Plain language version]             │                │
│     │                                      │                │
│     │ ⚠️ Key Findings (Stage 3: Prompt)    │                │
│     │ • Finding 1                          │                │
│     │ • Finding 2                          │                │
│     │ • Finding 3                          │                │
│     │                                      │                │
│     │ [Close]                              │                │
│     └──────────────────────────────────────┘                │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. User decision                                            │
│     ├─► Understands hidden fees                             │
│     ├─► Calculates cost: $99 × 12 = $1,188/year            │
│     └─► Declines offer, closes tab                          │
│                                                              │
│  💰 OUTCOME: User saved $1,188 per year                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Privacy & Security

```
┌────────────────────────────────────────────────────────────┐
│            ON-DEVICE PROCESSING ONLY                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ All AI processing: Local (Gemini Nano)                 │
│  ✅ No data sent: To external servers                      │
│  ✅ No API keys: Required or stored                        │
│  ✅ No tracking: Of user behavior                          │
│  ✅ Cache stored: Locally (chrome.storage.local)           │
│                                                             │
│  USER DATA FLOW:                                            │
│  T&C Text → Gemini Nano → Cache → Display                  │
│      └──────► Never leaves device ◄──────┘                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

This architecture diagram shows how PhishGuard Vision's Hidden Fee Detector uses a sophisticated three-stage AI pipeline to transform complex legal documents into clear, actionable warnings—all while maintaining complete user privacy through on-device processing.
