// Chrome Built-in AI API wrapper
// Replaces generic Gemini API with Chrome's native AI capabilities
(function(){
  
  // Content scripts don't have direct access to LanguageModel, need to inject script
  let pageContextAPIAvailable = false;
  
  // Inject API accessor into page context
  function injectPageContextScript() {
    const script = document.createElement('script');
    script.textContent = `
      window.__chromeAI_pageContext = {
        async callLanguageModel(promptText, options = {}) {
          if (typeof LanguageModel === 'undefined') {
            throw new Error('LanguageModel not available in page context');
          }
          const session = await LanguageModel.create({
            outputLanguage: options.outputLanguage || 'en',
            systemPrompt: options.systemPrompt || ''
          });
          const result = await session.prompt(promptText);
          session.destroy();
          return result;
        },
        async callSummarizer(text, options = {}) {
          if (typeof Summarizer === 'undefined') {
            throw new Error('Summarizer not available in page context');
          }
          const summarizer = await Summarizer.create({
            type: options.type || 'tl;dr',
            format: options.format || 'markdown',
            length: options.length || 'medium'
          });
          const result = await summarizer.summarize(text);
          summarizer.destroy();
          return result;
        },
        isAvailable() {
          return typeof LanguageModel !== 'undefined';
        }
      };
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    
    // Check if injection worked
    return new Promise((resolve) => {
      setTimeout(() => {
        const checkScript = document.createElement('script');
        checkScript.textContent = `
          window.postMessage({ 
            type: '__chromeAI_check', 
            available: typeof window.__chromeAI_pageContext !== 'undefined' && window.__chromeAI_pageContext.isAvailable()
          }, '*');
        `;
        (document.head || document.documentElement).appendChild(checkScript);
        checkScript.remove();
        
        window.addEventListener('message', function checkListener(event) {
          if (event.data.type === '__chromeAI_check') {
            pageContextAPIAvailable = event.data.available;
            window.removeEventListener('message', checkListener);
            resolve(event.data.available);
          }
        });
      }, 100);
    });
  }
  
  // Call page context API via postMessage
  function callPageContextAPI(method, ...args) {
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36).substring(7);
      
      const listener = (event) => {
        if (event.data.type === '__chromeAI_response' && event.data.id === messageId) {
          window.removeEventListener('message', listener);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      window.addEventListener('message', listener);
      
      // Inject execution script
      const script = document.createElement('script');
      script.textContent = `
        (async () => {
          try {
            const result = await window.__chromeAI_pageContext.${method}(${JSON.stringify(args[0])}, ${JSON.stringify(args[1] || {})});
            window.postMessage({
              type: '__chromeAI_response',
              id: '${messageId}',
              result: result
            }, '*');
          } catch (err) {
            window.postMessage({
              type: '__chromeAI_response',
              id: '${messageId}',
              error: err.message
            }, '*');
          }
        })();
      `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', listener);
        reject(new Error('API call timeout'));
      }, 30000);
    });
  }
  
  // Initialize injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => injectPageContextScript());
  } else {
    injectPageContextScript();
  }
  
  // Feature detection helpers
  function isChromeAIAvailable() {
    return pageContextAPIAvailable;
  }

  function isSummarizerAvailable() {
    return pageContextAPIAvailable;
  }

  function isTranslatorAvailable() {
    return false; // Translator needs different approach
  }

  function isRewriterAvailable() {
    return false; // Rewriter needs different approach
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
      
      // Provide helpful error messages
      if (error.message.includes('not available')) {
        throw new Error("Chrome AI not available. Please ensure you're using Chrome 138+ with EPP enrollment and the model downloaded at chrome://on-device-internals/");
      } else {
        throw new Error(`Chrome AI failed: ${error.message}`);
      }
    }
  }

  // Chrome Summarizer API wrapper (optimized for text summarization)
  async function summarizeText(text, options = {}) {
    if (!isSummarizerAvailable()) {
      throw new Error(
        "Chrome Summarizer API not available. Please ensure you're using Chrome 138+ and have enabled Built-in AI."
      );
    }

    try {
      // Use new Chrome 138+ Summarizer API
      const useNewAPI = typeof Summarizer !== 'undefined';
      
      if (useNewAPI) {
        console.log("[Mind-Link] Using Chrome 138+ Summarizer API");
        
        const summarizer = await Summarizer.create({
          type: options.type || "tl;dr", // 'tl;dr', 'key-points', 'teaser', 'headline'
          format: options.format || "markdown", // 'plain-text' or 'markdown'
          length: options.length || "medium" // 'short', 'medium', 'long'
        });

        const summary = await summarizer.summarize(text);
        summarizer.destroy();
        
        return summary.trim();
      }
      
      // Fallback to old API
      const capabilities = await self.ai.summarizer.capabilities();
      if (capabilities.available === "no") {
        throw new Error("Summarizer not available on this device");
      }

      const summarizer = await self.ai.summarizer.create({
        type: options.type || "tl;dr",
        format: options.format || "markdown",
        length: options.length || "medium"
      });

      const summary = await summarizer.summarize(text);
      await summarizer.destroy();
      
      return summary.trim();
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
    if (!isRewriterAvailable()) {
      // Fallback to Prompt API if Rewriter not available
      const prompt = `Rewrite the following text in simple, easy-to-understand language suitable for elderly users with low technical literacy. Remove jargon and use plain language:\n\n${text}`;
      return await callChromeAI(prompt);
    }

    try {
      const capabilities = await self.ai.rewriter.capabilities();
      if (capabilities.available === "no") {
        throw new Error("Rewriter not available");
      }

      const rewriter = await self.ai.rewriter.create({
        tone: "casual",
        format: "plain-text",
        length: "as-is"
      });

      const simplified = await rewriter.rewrite(text, {
        context: "Simplify for elderly users with low technical knowledge"
      });
      
      await rewriter.destroy();
      return simplified.trim();
    } catch (error) {
      console.error("Rewriter error:", error);
      // Fallback to Prompt API
      const prompt = `Rewrite in simple language for elderly users:\n\n${text}`;
      return await callChromeAI(prompt);
    }
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
  console.log("[Mind-Link] Chrome AI APIs availability:", {
    promptAPI: isChromeAIAvailable(),
    summarizer: isSummarizerAvailable(),
    translator: isTranslatorAvailable(),
    rewriter: isRewriterAvailable()
  });
})();

