// Chrome Built-in AI API wrapper
// Runs in MAIN world to access LanguageModel API directly
(function(){
  
  // Feature detection helpers
  function isChromeAIAvailable() {
    return typeof LanguageModel !== 'undefined';
  }

  function isSummarizerAvailable() {
    return typeof Summarizer !== 'undefined';
  }

  function isTranslatorAvailable() {
    return typeof Translator !== 'undefined';
  }

  function isRewriterAvailable() {
    return typeof Rewriter !== 'undefined';
  }

  // Chrome Prompt API wrapper (direct access in MAIN world)
  async function callChromeAI(promptText, options = {}) {
    try {
      if (!isChromeAIAvailable()) {
        throw new Error("LanguageModel API not available. Enable chrome://flags and download model.");
      }
      
      console.log("[Mind-Link] Calling LanguageModel API with prompt:", promptText.slice(0, 100));
      
      const session = await LanguageModel.create({
        systemPrompt: options.systemPrompt || ''
      });
      
      console.log("[Mind-Link] Session created, prompting with timeout...");
      
      // Use Promise.race to add a timeout to the prompt call
      const promptPromise = session.prompt(promptText);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Prompt execution timeout')), 25000)
      );
      
      const result = await Promise.race([promptPromise, timeoutPromise]);
      
      console.log("[Mind-Link] Received AI response:", result.slice(0, 100));
      session.destroy();
      
      console.log("[Mind-Link] Returning result");
      return result.trim();
      
    } catch (error) {
      console.error("[Mind-Link] Chrome AI error:", error);
      
      // Try to use streamingPrompt as fallback
      if (error.message.includes('timeout')) {
        console.log("[Mind-Link] Trying streamingPrompt fallback...");
        try {
          const session = await LanguageModel.create({
            systemPrompt: options.systemPrompt || ''
          });
          
          let fullResponse = '';
          const stream = session.promptStreaming(promptText);
          
          for await (const chunk of stream) {
            fullResponse = chunk;
          }
          
          session.destroy();
          console.log("[Mind-Link] Streaming response received:", fullResponse.slice(0, 100));
          return fullResponse.trim();
        } catch (streamError) {
          console.error("[Mind-Link] Streaming also failed:", streamError);
        }
      }
      
      throw new Error(`Chrome AI failed: ${error.message}`);
    }
  }

  // Chrome Summarizer API wrapper (direct access in MAIN world)
  async function summarizeText(text, options = {}) {
    try {
      if (!isSummarizerAvailable()) {
        throw new Error("Summarizer API not available");
      }
      
      console.log("[Mind-Link] Calling Summarizer API");
      
      const summarizer = await Summarizer.create({
        type: options.type || "tl;dr",
        format: options.format || "markdown",
        length: options.length || "medium"
      });
      
      const result = await summarizer.summarize(text);
      summarizer.destroy();
      
      console.log("[Mind-Link] Received summarizer response");
      return result.trim();
      
    } catch (error) {
      console.error("Summarizer error:", error);
      // Fallback to Prompt API
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
    
    // Feature detection (return values, not functions, since isolated world can't call MAIN world functions)
    isChromeAIAvailable: () => isChromeAIAvailable(),
    isSummarizerAvailable: () => isSummarizerAvailable(),
    isTranslatorAvailable: () => isTranslatorAvailable(),
    isRewriterAvailable: () => isRewriterAvailable(),
    
    // Store availability as properties too
    __apiAvailable: isChromeAIAvailable(),
    __summarizerAvailable: isSummarizerAvailable()
  };

  // Dispatch custom event to notify isolated world scripts
  const availabilityEvent = new CustomEvent('__notesio_api_ready', {
    detail: {
      languageModel: isChromeAIAvailable(),
      summarizer: isSummarizerAvailable(),
      translator: isTranslatorAvailable(),
      rewriter: isRewriterAvailable()
    }
  });
  document.dispatchEvent(availabilityEvent);

  // Listen for API requests from isolated world
  document.addEventListener('__notesio_api_request', async (event) => {
    const { requestId, type, promptText, text, options } = event.detail;
    
    console.log(`[Mind-Link MAIN] Received request:`, { requestId, type });
    
    try {
      let result;
      
      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request handler timeout')), 35000);
      });
      
      const workPromise = (async () => {
        switch(type) {
          case 'callChromeAI':
            return await callChromeAI(promptText, options);
          case 'summarizeText':
            return await summarizeText(text, options);
          case 'simplifyJargon':
            return await simplifyJargon(text, options);
          default:
            throw new Error(`Unknown request type: ${type}`);
        }
      })();
      
      result = await Promise.race([workPromise, timeoutPromise]);
      
      console.log(`[Mind-Link MAIN] Sending response for ${requestId}`);
      
      document.dispatchEvent(new CustomEvent('__notesio_api_response', {
        detail: { requestId, result }
      }));
      
    } catch (error) {
      console.log(`[Mind-Link MAIN] Sending error for ${requestId}:`, error.message);
      
      document.dispatchEvent(new CustomEvent('__notesio_api_response', {
        detail: { requestId, error: error.message }
      }));
    }
  });

  // Listen for API check requests
  document.addEventListener('__notesio_api_check', () => {
    console.log('[Mind-Link] Received API check request, re-dispatching availability');
    document.dispatchEvent(availabilityEvent);
  });

  // Log availability on load
  console.log("[Mind-Link] Chrome AI APIs availability:", {
    LanguageModel: isChromeAIAvailable(),
    Summarizer: isSummarizerAvailable(),
    Translator: isTranslatorAvailable(),
    Rewriter: isRewriterAvailable()
  });
})();
