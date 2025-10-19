// Background service worker: persists learned ad rules and applies dynamic DNR rules
// Also handles Chrome AI API calls (service workers have access to AI APIs)
// Storage schema (chrome.storage.local):
// {
//   ad_rules: { [host: string]: { selectors: string[], urlFilters: string[], ruleIds: number[] } },
//   nextRuleId: number
// }

const DNR_MAX_RULES = 1000;

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
