// Chrome Built-in AI API wrapper
// Uses background service worker to access AI APIs
(function(){
  
  // Feature detection helpers (check via background service worker)
  async function isChromeAIAvailable() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        action: 'checkAIAvailability'
      });
      return response.success && response.available.languageModel;
    } catch {
      return false;
    }
  }

  async function isSummarizerAvailable() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        action: 'checkAIAvailability'
      });
      return response.success && response.available.summarizer;
    } catch {
      return false;
    }
  }

  function isTranslatorAvailable() {
    return false; // Not implemented yet
  }

  function isRewriterAvailable() {
    return false; // Not implemented yet
  }

  // Chrome Prompt API wrapper (uses background service worker)
  async function callChromeAI(promptText, options = {}) {
    try {
      console.log("[Mind-Link] Calling AI via background service worker");
      
      // Send request to background service worker
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        action: 'callLanguageModel',
        prompt: promptText,
        systemPrompt: options.systemPrompt || ''
      });
      
      if (!response.success) {
        throw new Error(response.error || 'AI request failed');
      }
      
      console.log("[Mind-Link] Received AI response");
      return response.result;
      
    } catch (error) {
      console.error("[Mind-Link] Chrome AI error:", error);
      throw new Error(`Chrome AI failed: ${error.message}`);
    }
  }

  // Chrome Summarizer API wrapper (uses background service worker)
  async function summarizeText(text, options = {}) {
    try {
      console.log("[Mind-Link] Calling Summarizer via background service worker");
      
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        action: 'callSummarizer',
        text: text,
        type: options.type || "tl;dr",
        format: options.format || "markdown",
        length: options.length || "medium"
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Summarizer request failed');
      }
      
      console.log("[Mind-Link] Received summarizer response");
      return response.result;
      
    } catch (error) {
      console.error("Summarizer error:", error);
      // Fallback to Prompt API if Summarizer fails
      console.log("Falling back to Prompt API for summarization...");
      const prompt = `Summarize the following text concisely in markdown format:\n\n${text.slice(0, 15000)}`;
      return await callChromeAI(prompt);
    }
  }

  // Chrome Translator API wrapper (for jargon simplification)
  async function simplifyJargon(text, options = {}) {
    // Fallback to Prompt API
    const prompt = `Rewrite the following text in simple, easy-to-understand language suitable for elderly users with low technical literacy. Remove jargon and use plain language:\n\n${text}`;
    return await callChromeAI(prompt);
  }

  // Export API functions
  window.__notesio_api = {
    // Main AI function (replaces old callGemini)
    callGemini: callChromeAI, // Keep old name for backwards compatibility
    callChromeAI,
    
    // Specialized functions
    summarizeText,
    simplifyJargon,
    
    // Feature detection
    isChromeAIAvailable,
    isSummarizerAvailable,
    isTranslatorAvailable,
    isRewriterAvailable
  };

  // Log availability on load
  (async () => {
    const available = await isChromeAIAvailable();
    console.log("[Mind-Link] Chrome AI API available via background worker:", available);
  })();
})();
