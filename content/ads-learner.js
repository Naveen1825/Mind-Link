// Learns site-specific ad selectors and URL filters using Gemini, then persists via background
(function () {
  const MAX_TEXT_PER_ELEM = 160;
  const MAX_CANDIDATES = 80;

  function getHost() {
    try { return location.host || new URL(location.href).host; } catch { return ''; }
  }

  function collectDomSignals() {
    const candidates = [];
    const elems = document.querySelectorAll('[class], [id], iframe[src], img[src], script[src], div, section, aside');
    for (const el of elems) {
      const tag = el.tagName.toLowerCase();
      const id = el.getAttribute('id') || '';
      const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
      const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
      const role = el.getAttribute('role') || '';
      const aria = el.getAttribute('aria-label') || '';
      const text = (el.innerText || '').trim().slice(0, MAX_TEXT_PER_ELEM);
      const hint = [id, ...cls, role, aria, src, tag].join(' ').toLowerCase();
      // heuristic prefilter to reduce payload
      if (/\b(ad|ads|advert|sponsor|promoted|promotion|affiliate)\b/.test(hint)) {
        candidates.push({ tag, id, classes: cls.slice(0, 6), src: src.slice(0, 200), role, aria: aria.slice(0, 60), text });
        if (candidates.length >= MAX_CANDIDATES) break;
      }
    }
    return candidates;
  }

  function collectUrlSignals() {
    const urls = new Set();
    const add = (u) => { try { if (u && u.length < 300) urls.add(String(u)); } catch { } };
    document.querySelectorAll('script[src], img[src], iframe[src], link[href]')
      .forEach(n => add(n.getAttribute('src') || n.getAttribute('href') || ''));
    // Also check inline data-ad related attributes
    document.querySelectorAll('[data-ad],[data-ads],[data-advertising]')
      .forEach(n => add(n.getAttribute('data-src') || n.getAttribute('src') || ''));
    return Array.from(urls).filter(u => /ad|ads|doubleclick|syndication|sponsor|tracking|beacon|promo/i.test(u)).slice(0, 120);
  }

  async function learnAdRules() {
    const host = getHost();
    if (!host) return;

    // Check if site is already flagged as suspicious - don't waste resources on scam sites
    const trustScoreKey = `trustScore_${host}`;
    try {
      const stored = await chrome.storage.local.get(trustScoreKey);
      if (stored[trustScoreKey] && stored[trustScoreKey] < 3) {
        console.log("[Mind-Link] Skipping ad learning on untrusted site (trust score:", stored[trustScoreKey], ")");
        return;
      }
    } catch (e) {
      // If storage check fails, continue with ad learning (fail open)
      console.log("[Mind-Link] Could not check trust score, continuing with ad learning");
    }

    // Whitelist trusted domains (don't learn ad rules for these)
    const trustedDomains = [
      'mail.google.com',
      'gmail.com',
      'docs.google.com',
      'drive.google.com',
      'calendar.google.com',
      'meet.google.com',
      'outlook.office.com',
      'outlook.live.com',
      'office.com',
      'login.microsoftonline.com',
      'accounts.google.com',
      'myaccount.google.com'
    ];

    if (trustedDomains.some(domain => host.includes(domain))) {
      console.log("[Mind-Link] Skipping ad learning for trusted domain:", host);
      return;
    }

    // Check if Chrome AI is available before proceeding (use bridge variable)
    if (!window.__notesio_apiAvailable) {
      console.log("[Mind-Link] Chrome AI not available, skipping ad learning");
      return;
    }

    try {
      const dom = collectDomSignals();
      const urls = collectUrlSignals();
      if (dom.length === 0 && urls.length === 0) return;

      const prompt = `You are helping build an ad/tracker blocker. From the DOM candidates and URLs below, propose conservative CSS selectors that hide ad containers and URL filters appropriate for a Chrome declarativeNetRequest "urlFilter" (no regex, just substrings).

IMPORTANT RULES:
- DO NOT target elements with classes/IDs that are part of essential application UI (e.g., "address", "header", "admin", "thread", "read", "add", etc.)
- ONLY target elements that are CLEARLY advertisements based on MULTIPLE indicators
- Prefer very specific selectors that combine multiple attributes
- Avoid overly broad patterns like [class*='ad'] which can match legitimate UI elements
- Focus on known ad networks and promotional content

Return ONLY JSON with shape: {
  "selectors": string[],
  "urlFilters": string[]
}
Rules:
- Prefer specific selectors (e.g., [data-ad-slot], .google-ad-banner, #sponsored-content) over generic ones.
- Limit to at most 15 selectors and 15 urlFilters.
- Each urlFilter should be a short substring safely matching ad/tracker URLs (e.g., 'doubleclick.net', '/ads/').
- Do NOT include comments or explanations.

DOM candidates (JSON):
${JSON.stringify(dom).slice(0, 18000)}

URLs (JSON array):
${JSON.stringify(urls).slice(0, 8000)}`;

      const output = await window.__notesio_api.callChromeAI(prompt);
      let parsed = null;
      try { parsed = JSON.parse(output); } catch { }
      if (!parsed || typeof parsed !== 'object') return;
      const selectors = Array.isArray(parsed.selectors) ? parsed.selectors.map(String).slice(0, 15) : [];
      const urlFilters = Array.isArray(parsed.urlFilters) ? parsed.urlFilters.map(String).slice(0, 15) : [];
      if (selectors.length === 0 && urlFilters.length === 0) return;

      chrome.runtime.sendMessage({
        type: 'AD_RULES_LEARNED',
        payload: { host, selectors, urlFilters }
      }, (resp) => {
        // Optional: could log resp
      });
    } catch (e) {
      // swallow errors to avoid breaking the page
      console.log("[Mind-Link] Ad learning error (non-critical):", e.message);
    }
  }

  // Also request already learned selectors for immediate cosmetic application
  function applyLearnedSelectors() {
    const host = getHost();
    if (!host) return;
    chrome.runtime.sendMessage({ type: 'GET_COSMETIC_SELECTORS', payload: { host } }, (resp) => {
      try {
        const list = (resp && resp.ok && Array.isArray(resp.selectors)) ? resp.selectors : [];
        if (!list.length) return;
        const id = 'notesio-cosmetic-learned';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `${list.join(',\n')} { display: none !important; }`;
        document.documentElement.appendChild(style);
      } catch { }
    });
  }

  // Kick off learning after load to reduce jank
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { applyLearnedSelectors(); setTimeout(learnAdRules, 500); }, { once: true });
  } else {
    applyLearnedSelectors();
    setTimeout(learnAdRules, 500);
  }
})();
