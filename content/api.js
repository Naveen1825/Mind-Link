// Chrome Built-in AI API wrapper
// Runs in MAIN world to access LanguageModel API directly
(function () {

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
        throw new Error("LanguageModel API not available. Enable chrome://flags/#prompt-api-for-gemini-nano and download model.");
      }

      console.log("[Mind-Link] Calling LanguageModel API with prompt:", promptText.slice(0, 100));

      // Check availability status before creating session
      const availability = await LanguageModel.availability();
      console.log("[Mind-Link] LanguageModel availability:", availability);

      if (availability === 'no') {
        throw new Error("LanguageModel not available on this device. Check chrome://on-device-internals for requirements.");
      }

      if (availability === 'after-download') {
        console.log("[Mind-Link] Model needs to be downloaded. Initiating download...");
      }

      const createOptions = {};
      if (options.systemPrompt) {
        createOptions.initialPrompts = [
          { role: 'system', content: options.systemPrompt }
        ];
      }

      // Add download progress monitoring if downloading
      if (availability === 'after-download') {
        createOptions.monitor = (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`[Mind-Link] Model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        };
      }

      const session = await LanguageModel.create(createOptions);

      console.log("[Mind-Link] Session created, prompting with extended timeout...");

      // Use Promise.race to add a timeout to the prompt call (increased to 45s)
      const promptPromise = session.prompt(promptText);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Prompt execution timeout')), 45000)
      );

      const result = await Promise.race([promptPromise, timeoutPromise]);

      console.log("[Mind-Link] Received AI response:", result.slice(0, 100));
      session.destroy();

      console.log("[Mind-Link] Returning result");
      return result.trim();

    } catch (error) {
      // Properly handle DOMException and other error types
      const errorMessage = error instanceof DOMException
        ? `${error.name}: ${error.message}`
        : error.message || String(error);

      console.error("[Mind-Link] Chrome AI error:", errorMessage, error);

      // Try to use streamingPrompt as fallback
      if (errorMessage.includes('timeout')) {
        console.log("[Mind-Link] Trying streamingPrompt fallback...");
        try {
          const createOptions = {};
          if (options.systemPrompt) {
            createOptions.initialPrompts = [
              { role: 'system', content: options.systemPrompt }
            ];
          }

          const session = await LanguageModel.create(createOptions);

          let fullResponse = '';
          const stream = session.promptStreaming(promptText);

          for await (const chunk of stream) {
            fullResponse = chunk;
          }

          session.destroy();
          console.log("[Mind-Link] Streaming response received:", fullResponse.slice(0, 100));
          return fullResponse.trim();
        } catch (streamError) {
          const streamErrorMsg = streamError instanceof DOMException
            ? `${streamError.name}: ${streamError.message}`
            : streamError.message || String(streamError);
          console.error("[Mind-Link] Streaming also failed:", streamErrorMsg, streamError);
        }
      }

      throw new Error(`Chrome AI failed: ${errorMessage}`);
    }
  }

  // Chrome Summarizer API wrapper (direct access in MAIN world)
  async function summarizeText(text, options = {}) {
    try {
      if (!isSummarizerAvailable()) {
        throw new Error("Summarizer API not available");
      }

      console.log("[Mind-Link] Calling Summarizer API");

      // Check availability before creating
      const availability = await Summarizer.availability();
      console.log("[Mind-Link] Summarizer availability:", availability);

      if (availability === 'no') {
        throw new Error("Summarizer not available on this device");
      }

      const summarizer = await Summarizer.create({
        type: options.type || "tldr",
        format: options.format || "markdown",
        length: options.length || "medium"
      });

      const result = await summarizer.summarize(text);
      summarizer.destroy();

      console.log("[Mind-Link] Received summarizer response");
      return result.trim();

    } catch (error) {
      const errorMessage = error instanceof DOMException
        ? `${error.name}: ${error.message}`
        : error.message || String(error);

      console.error("[Mind-Link] Summarizer error:", errorMessage, error);
      // Fallback to Prompt API
      console.log("[Mind-Link] Falling back to Prompt API for summarization...");
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
        switch (type) {
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
      const errorMessage = error instanceof DOMException
        ? `${error.name}: ${error.message}`
        : error.message || String(error);

      console.log(`[Mind-Link MAIN] Sending error for ${requestId}:`, errorMessage);

      document.dispatchEvent(new CustomEvent('__notesio_api_response', {
        detail: { requestId, error: errorMessage }
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
