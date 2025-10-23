## 🧪 Testing

### Test Phishing Detection

**Test 1: Safe Sites**
- Visit `https://github.com` or `https://google.com`
- Should show ✅ green or no warning

**Test 2: Suspicious Patterns**
- Visit sites with:
  - Lookalike domains (e.g., "arnazon.com")
  - Suspicious TLDs (.tk, .ml)
  - Missing HTTPS
- Should show ⚠️ orange warning

**Test 3: Visual Threats**
- Visit sites with:
  - Fake security warnings
  - Blurry logos
  - Multiple "Download" buttons
- Should show 🛑 red warning with screenshot analysis

### Test Ad Blocking
- Visit ad-heavy sites (news, streaming)
- Open extension popup to see blocked count
- Verify page layout not broken

### Test Hidden Fee Detection
- Visit subscription sites with long T&C
- Look for inline warnings about auto-renewals
- Verify summary appears (condensed from 5000+ words)

### Test Language Simplifier
- Select complex legal text
- Press Ctrl+Shift+S
- Verify simplified version appears
- Check side-by-side comparison

---