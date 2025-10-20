// Background service worker: persists learned ad rules and applies dynamic DNR rules
// Also handles Chrome AI API calls (service workers have access to AI APIs)
// Storage schema (chrome.storage.local):
// {
//   ad_rules: { [host: string]: { selectors: string[], urlFilters: string[], ruleIds: number[] } },
//   nextRuleId: number
// }

const DNR_MAX_RULES = 1000;

// Rate limiting for screenshot capture (Chrome allows max 2 per second)
let lastScreenshotTime = 0;
const SCREENSHOT_MIN_INTERVAL = 1000; // 1 second between captures (safe buffer)

// Chrome AI API Handler (Service Worker has access to AI APIs)
async function handleAIRequest(request) {
  console.log('[Background] Handling AI request:', request.action);

  try {
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

    if (request.action === 'callSummarizer') {
      if (typeof Summarizer !== 'undefined') {
        console.log('[Background] Using Summarizer API');
        const summarizer = await Summarizer.create({
          type: request.type || 'tldr',
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

    if (request.action === 'analyzeScreenshot') {
      if (typeof LanguageModel !== 'undefined') {
        console.log('[Background] Analyzing screenshot for phishing');

        const createOptions = {
          temperature: request.temperature || 0.7,
          topK: request.topK || 3
        };

        if (request.systemPrompt) {
          createOptions.initialPrompts = [
            { role: 'system', content: request.systemPrompt }
          ];
        }

        const session = await LanguageModel.create(createOptions);
        const result = await session.prompt(request.prompt);
        session.destroy();
        console.log('[Background] Visual analysis completed');
        return { success: true, result: result.trim() };
      } else {
        throw new Error('LanguageModel API not available for visual analysis');
      }
    }

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

    throw new Error('Unknown AI action: ' + request.action);
  } catch (error) {
    console.error('[Background] AI request error:', error);
    return { success: false, error: error.message };
  }
}

async function getLocal(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
async function setLocal(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

async function ensureInit() {
  const current = await getLocal(['nextRuleId', 'ad_rules']);
  if (typeof current.nextRuleId !== 'number') {
    await setLocal({ nextRuleId: 10000 }); // start dynamic ids at 10k
  }
  if (!current.ad_rules) {
    await setLocal({ ad_rules: {} });
  }
}

async function applyDynamicRulesForHost(host, urlFilters) {
  await ensureInit();
  const state = await getLocal(['ad_rules', 'nextRuleId']);
  const adRules = state.ad_rules || {};
  const existing = adRules[host] || { selectors: [], urlFilters: [], ruleIds: [] };

  // Build new rules from urlFilters
  const addRules = [];
  let nextId = state.nextRuleId || 10000;
  const limited = (urlFilters || []).map(String).filter(Boolean).slice(0, 50);
  for (const f of limited) {
    if (addRules.length >= 50) break;
    addRules.push({
      id: nextId++,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: f,
        resourceTypes: [
          'script', 'xmlhttprequest', 'image', 'sub_frame', 'media', 'font'
        ]
      }
    });
  }

  // Remove previous rules for this host
  const removeRuleIds = Array.isArray(existing.ruleIds) ? existing.ruleIds : [];
  const addRuleIds = addRules.map(r => r.id);

  // Respect a global cap on rules to avoid errors
  if (nextId - (state.nextRuleId || 10000) + removeRuleIds.length > DNR_MAX_RULES) {
    // If too many, drop to zero additions
    addRules.length = 0;
  }

  if (removeRuleIds.length || addRules.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  }

  // Persist new mapping
  adRules[host] = {
    selectors: existing.selectors || [],
    urlFilters: limited,
    ruleIds: addRuleIds
  };
  await setLocal({ ad_rules: adRules, nextRuleId: nextId });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    // Handle screenshot capture request
    if (msg && msg.type === 'CAPTURE_SCREENSHOT') {
      try {
        if (!sender.tab || !sender.tab.id) {
          console.warn('[Background] Screenshot request without valid tab ID');
          sendResponse({ success: false, error: 'No tab ID available' });
          return;
        }

        // Rate limiting: ensure minimum interval between captures
        const now = Date.now();
        const timeSinceLastCapture = now - lastScreenshotTime;
        if (timeSinceLastCapture < SCREENSHOT_MIN_INTERVAL) {
          const waitTime = SCREENSHOT_MIN_INTERVAL - timeSinceLastCapture;
          console.log(`[Background] Rate limiting: waiting ${waitTime}ms before capture`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Get tab info and validate state
        const tab = await chrome.tabs.get(sender.tab.id);
        
        // Check if tab is fully loaded
        if (tab.status !== 'complete') {
          console.warn('[Background] Tab not fully loaded, status:', tab.status);
          sendResponse({ success: false, error: 'Tab not fully loaded' });
          return;
        }

        // Check if the tab URL is capturable (not chrome:// or extension pages)
        const uncapturableProtocols = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];
        if (uncapturableProtocols.some(p => tab.url?.startsWith(p))) {
          console.warn('[Background] Cannot capture screenshot of system page');
          sendResponse({ success: false, error: 'Cannot capture system pages' });
          return;
        }

        // Ensure tab is visible in the current window
        if (!tab.active) {
          console.warn('[Background] Tab is not active - may not have activeTab permission');
          // Try to make it active first (requires user interaction)
          try {
            await chrome.tabs.update(tab.id, { active: true });
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait for activation
          } catch (e) {
            console.warn('[Background] Could not activate tab:', e.message);
            sendResponse({ success: false, error: 'Tab activation required for screenshot' });
            return;
          }
        }

        // Add a small delay to ensure page is stable
        await new Promise(resolve => setTimeout(resolve, 300));

        // Capture screenshot - use JPEG for better reliability and smaller size
        const screenshotDataUrl = await chrome.tabs.captureVisibleTab(
          tab.windowId,
          { format: 'jpeg', quality: 80 }
        );

        lastScreenshotTime = Date.now(); // Update timestamp on success
        console.log('[Background] Screenshot captured successfully');
        sendResponse({ success: true, screenshot: screenshotDataUrl });
      } catch (e) {
        console.error('[Background] Screenshot capture failed:', e);
        sendResponse({ success: false, error: String(e.message || e) });
      }
      return;
    }

    // Handle AI API requests from content scripts
    if (msg && msg.type === 'AI_REQUEST') {
      const result = await handleAIRequest(msg);
      sendResponse(result);
      return;
    }

    if (msg && msg.type === 'AD_RULES_LEARNED') {
      try {
        const { host, selectors = [], urlFilters = [] } = msg.payload || {};
        if (!host) return sendResponse({ ok: false, error: 'missing host' });
        // Save selectors for cosmetic use
        const state = await getLocal(['ad_rules']);
        const adRules = state.ad_rules || {};
        const existing = adRules[host] || { selectors: [], urlFilters: [], ruleIds: [] };
        const mergedSelectors = Array.from(new Set([...(existing.selectors || []), ...selectors.map(String)])).slice(0, 200);
        adRules[host] = { selectors: mergedSelectors, urlFilters: existing.urlFilters || [], ruleIds: existing.ruleIds || [] };
        await setLocal({ ad_rules: adRules });
        // Apply network rules
        await applyDynamicRulesForHost(host, urlFilters);
        return sendResponse({ ok: true });
      } catch (e) {
        return sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    } else if (msg && msg.type === 'GET_COSMETIC_SELECTORS') {
      const { host } = msg.payload || {};
      const state = await getLocal(['ad_rules']);
      const adRules = state.ad_rules || {};
      const selectors = (adRules[host]?.selectors) || [];
      return sendResponse({ ok: true, selectors });
    }
  })();
  return true; // keep channel open for async
});

// Re-apply dynamic rules on startup (optional: read all hosts and re-add)
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getLocal(['ad_rules', 'nextRuleId']);
  const adRules = state.ad_rules || {};
  let nextId = state.nextRuleId || 10000;
  const addRules = [];
  const hosts = Object.keys(adRules);
  for (const host of hosts) {
    const filters = (adRules[host]?.urlFilters) || [];
    for (const f of filters.slice(0, 50)) {
      addRules.push({
        id: nextId++,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: f,
          resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame', 'media', 'font']
        }
      });
    }
  }
  if (addRules.length) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [], addRules });
      await setLocal({ nextRuleId: nextId });
    } catch (e) {
      // Ignore errors; user can reload
    }
  }
});
