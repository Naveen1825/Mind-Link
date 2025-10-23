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

      const createOptions = {
        outputLanguage: 'en' // Specify English to prevent warnings and improve quality
      };
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

      console.log("[Mind-Link] Calling Summarizer API, text length:", text.length);

      // Check availability before creating
      const availability = await Summarizer.availability();
      console.log("[Mind-Link] Summarizer availability:", availability);

      if (availability === 'no') {
        throw new Error("Summarizer not available on this device");
      }

      // More conservative token estimation (1 token ≈ 5 characters to be safe)
      const estimatedTokens = text.length / 5;
      const MAX_TOKENS = 2500; // Very conservative limit (was 3500)

      console.log(`[Mind-Link] Estimated tokens: ${Math.round(estimatedTokens)}, Max: ${MAX_TOKENS}`);

      // If text is too large, chunk it immediately
      if (estimatedTokens > MAX_TOKENS) {
        console.log(`[Mind-Link] Text exceeds safe limit (${Math.round(estimatedTokens)} tokens). Using chunk-based approach...`);
        return await summarizeInChunks(text, options);
      }

      // Text is within safe limits, try direct summarization
      const summarizer = await Summarizer.create({
        type: options.type || "tldr",
        format: options.format || "markdown",
        length: options.length || "short" // Use "short" by default for safety
      });

      console.log("[Mind-Link] Summarizer created, processing text...");
      const result = await summarizer.summarize(text);
      summarizer.destroy();

      console.log("[Mind-Link] Summarization successful, result length:", result.length);
      return result.trim();

    } catch (error) {
      const errorMessage = error instanceof DOMException
        ? `${error.name}: ${error.message}`
        : error.message || String(error);

      console.error("[Mind-Link] Summarizer error:", errorMessage, error);

      // If quota exceeded, try chunking
      if (error.name === 'QuotaExceededError') {
        console.log("[Mind-Link] QuotaExceededError caught. Switching to chunk-based summarization...");
        try {
          return await summarizeInChunks(text, options);
        } catch (chunkError) {
          console.error("[Mind-Link] Chunking also failed:", chunkError);
          // Continue to Prompt API fallback below
        }
      }

      // Ultimate fallback to Prompt API
      console.log("[Mind-Link] Falling back to Prompt API for summarization...");
      try {
        const prompt = `Summarize the following text concisely in 200 words or less. Focus on key points about pricing, costs, subscriptions, and important terms:\n\n${text.slice(0, 15000)}`;
        return await callChromeAI(prompt);
      } catch (promptError) {
        console.error("[Mind-Link] Prompt API fallback also failed:", promptError);
        throw new Error("All summarization methods failed. Text may be too large or APIs unavailable.");
      }
    }
  }

  // Helper: Summarize large text in chunks with progressive size reduction
  async function summarizeInChunks(text, options = {}) {
    console.log('[Mind-Link] Starting chunk-based summarization...');

    // Start with conservative chunk size (much smaller to avoid quota errors)
    let MAX_CHUNK_SIZE = 8000; // ~2000 tokens (safer limit)
    let chunks = [];

    // Split text into chunks by paragraphs to maintain context
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      // If single paragraph is too large, split it by sentences
      if (para.length > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // Split large paragraph into sentences
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let sentenceChunk = '';

        for (const sentence of sentences) {
          if ((sentenceChunk + sentence).length > MAX_CHUNK_SIZE) {
            if (sentenceChunk) chunks.push(sentenceChunk);
            sentenceChunk = sentence;
          } else {
            sentenceChunk += sentence;
          }
        }
        if (sentenceChunk) chunks.push(sentenceChunk);
        continue;
      }

      if ((currentChunk + para).length > MAX_CHUNK_SIZE) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    console.log(`[Mind-Link] Split into ${chunks.length} chunks`);

    // Summarize each chunk with retry logic
    const chunkSummaries = [];
    let summarizer = null;

    try {
      summarizer = await Summarizer.create({
        type: options.type || "tldr",
        format: options.format || "markdown",
        length: "short" // Use short length for chunks
      });

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[Mind-Link] Summarizing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

        let retryCount = 0;
        let success = false;
        let summary = '';

        while (!success && retryCount < 3) {
          try {
            summary = await summarizer.summarize(chunks[i]);
            chunkSummaries.push(summary);
            success = true;
            console.log(`[Mind-Link] Chunk ${i + 1} summarized successfully`);
          } catch (error) {
            retryCount++;
            console.warn(`[Mind-Link] Chunk ${i + 1} attempt ${retryCount} failed:`, error.name);

            if (error.name === 'QuotaExceededError' && retryCount < 3) {
              // Chunk is still too large, split it further
              console.log(`[Mind-Link] Chunk ${i + 1} too large, splitting further...`);
              const halfSize = Math.floor(chunks[i].length / 2);
              const part1 = chunks[i].substring(0, halfSize);
              const part2 = chunks[i].substring(halfSize);

              // Try to summarize each part
              try {
                const sum1 = await summarizer.summarize(part1);
                const sum2 = await summarizer.summarize(part2);
                chunkSummaries.push(sum1 + ' ' + sum2);
                success = true;
                console.log(`[Mind-Link] Chunk ${i + 1} split and summarized successfully`);
              } catch (splitError) {
                console.error(`[Mind-Link] Even split chunks failed:`, splitError.name);
                // Last resort: use Prompt API for this chunk
                if (retryCount === 2) {
                  console.log(`[Mind-Link] Falling back to Prompt API for chunk ${i + 1}`);
                  try {
                    const promptSummary = await callChromeAI(
                      `Summarize this text in 100 words or less:\n\n${chunks[i].slice(0, 12000)}`
                    );
                    chunkSummaries.push(promptSummary);
                    success = true;
                  } catch (promptError) {
                    console.error(`[Mind-Link] Prompt API also failed for chunk ${i + 1}`);
                    // Ultimate fallback: use truncated original text
                    chunkSummaries.push(chunks[i].slice(0, 500) + '... [content truncated]');
                    success = true;
                  }
                }
              }
            } else {
              // Non-quota error or max retries reached
              console.error(`[Mind-Link] Chunk ${i + 1} failed after ${retryCount} attempts`);
              chunkSummaries.push(chunks[i].slice(0, 500) + '... [summarization failed]');
              success = true;
            }
          }
        }
      }

      // Combine summaries
      const combined = chunkSummaries.join('\n\n');
      console.log(`[Mind-Link] Combined summary length: ${combined.length} chars`);

      // If combined is still too long, summarize the summaries
      if (combined.length > 10000) {
        console.log('[Mind-Link] Combined summaries too long. Final condensation...');
        try {
          const final = await summarizer.summarize(combined.slice(0, 13000));
          return final.trim();
        } catch (finalError) {
          console.warn('[Mind-Link] Final summarization failed, using Prompt API');
          const promptSummary = await callChromeAI(
            `Condense these summaries into one concise summary (200 words max):\n\n${combined.slice(0, 12000)}`
          );
          return promptSummary.trim();
        }
      }

      return combined.trim();

    } catch (error) {
      console.error('[Mind-Link] Chunk summarization failed:', error);
      throw error;
    } finally {
      if (summarizer) {
        summarizer.destroy();
      }
    }
  }

  // Chrome Translator API wrapper (for jargon simplification)
  async function simplifyJargon(text, options = {}) {
    // Fallback to Prompt API
    const prompt = `Rewrite the following text in simple, easy-to-understand language suitable for elderly users with low technical literacy. Remove jargon and use plain language:\n\n${text}`;
    return await callChromeAI(prompt);
  }

  // Chrome Rewriter API wrapper (for T&C simplification)
  async function rewriteText(text, options = {}) {
    try {
      if (!isRewriterAvailable()) {
        throw new Error("Rewriter API not available");
      }

      console.log("[Mind-Link] Calling Rewriter API");

      // Check availability before creating
      const availability = await Rewriter.availability();
      console.log("[Mind-Link] Rewriter availability:", availability);

      if (availability === 'no') {
        throw new Error("Rewriter not available on this device");
      }

      const rewriter = await Rewriter.create({
        tone: options.tone || "more-casual",
        format: options.format || "plain-text",
        length: options.length || "shorter",
        sharedContext: options.sharedContext || "Rewrite in simple language that a 5th grader can understand"
      });

      const result = await rewriter.rewrite(text, {
        context: options.context || ""
      });

      rewriter.destroy();

      console.log("[Mind-Link] Received rewriter response");
      return result.trim();

    } catch (error) {
      const errorMessage = error instanceof DOMException
        ? `${error.name}: ${error.message}`
        : error.message || String(error);

      console.error("[Mind-Link] Rewriter error:", errorMessage, error);
      // Fallback to Prompt API
      console.log("[Mind-Link] Falling back to Prompt API for rewriting...");
      const prompt = `Rewrite this text in simple, honest language that a 5th grader can understand. Keep the same meaning but remove confusing words and expose any hidden tricks:\n\n${text.slice(0, 10000)}`;
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
    rewriteText,

    // Feature detection (return values, not functions, since isolated world can't call MAIN world functions)
    isChromeAIAvailable: () => isChromeAIAvailable(),
    isSummarizerAvailable: () => isSummarizerAvailable(),
    isTranslatorAvailable: () => isTranslatorAvailable(),
    isRewriterAvailable: () => isRewriterAvailable(),

    // Store availability as properties too
    __apiAvailable: isChromeAIAvailable(),
    __summarizerAvailable: isSummarizerAvailable(),
    __rewriterAvailable: isRewriterAvailable()
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
          case 'rewriteText':
            return await rewriteText(text, options);
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
