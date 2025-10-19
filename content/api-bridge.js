// API Bridge - Runs in Isolated World to communicate with background service worker
(function() {
  console.log('[Mind-Link Bridge] Initializing...');
  
  // Track API availability
  window.__notesio_apiAvailable = false;
  window.__notesio_summarizerAvailable = false;

  // Create wrapper API that communicates with background service worker
  window.__notesio_api = {
    async callChromeAI(promptText, options = {}) {
      console.log(`[Mind-Link Bridge] Sending AI request to background`);
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'AI_REQUEST',
          action: 'callLanguageModel',
          prompt: promptText,
          systemPrompt: options.systemPrompt || '',
          temperature: options.temperature,
          topK: options.topK
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!response.success) {
            reject(new Error(response.error));
          } else {
            console.log(`[Mind-Link Bridge] Received AI response from background`);
            resolve(response.result);
          }
        });
      });
    },

    async summarizeText(text, options = {}) {
      console.log(`[Mind-Link Bridge] Sending summarize request to background`);
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'AI_REQUEST',
          action: 'callSummarizer',
          text,
          type: options.type || 'tl;dr',
          format: options.format || 'markdown',
          length: options.length || 'medium'
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!response.success) {
            reject(new Error(response.error));
          } else {
            console.log(`[Mind-Link Bridge] Received summarize response from background`);
            resolve(response.result);
          }
        });
      });
    },

    async simplifyJargon(text) {
      // Use language model with specific prompt
      const prompt = `Rewrite the following text in simple, easy-to-understand language suitable for elderly users with low technical literacy. Remove jargon and use plain language:\n\n${text}`;
      return await this.callChromeAI(prompt, {
        systemPrompt: 'You are a helpful assistant that simplifies complex text for elderly users.'
      });
    }
  };

  // Check AI availability from background
  chrome.runtime.sendMessage({ 
    type: 'AI_REQUEST',
    action: 'checkAIAvailability' 
  }, (response) => {
    if (response && response.success) {
      console.log('[Mind-Link Bridge] Received API availability from background:', response.available);
      window.__notesio_apiAvailable = response.available.languageModel || false;
      window.__notesio_summarizerAvailable = response.available.summarizer || false;
      console.log('[Mind-Link Bridge] Flags set - LanguageModel:', window.__notesio_apiAvailable);
    } else {
      console.error('[Mind-Link Bridge] Failed to check API availability:', response);
    }
  });
  
  console.log('[Mind-Link Bridge] Initialized with background service worker communication');
})();
