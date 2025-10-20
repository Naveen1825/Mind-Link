// API Bridge - Injects api.js into MAIN world and bridges communication
(function () {
  console.log('[Mind-Link Bridge] Initializing...');

  // Skip initialization on file:// URLs to prevent extension context errors
  if (window.location.protocol === 'file:') {
    console.log('[Mind-Link Bridge] Skipping on file:// URLs');
    window.__notesio_apiAvailable = false;
    window.__notesio_summarizerAvailable = false;
    return;
  }

  // Inject api.js into MAIN world (where AI APIs are available)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/api.js');
  script.onload = function () {
    console.log('[Mind-Link Bridge] api.js injected into MAIN world');
    this.remove();
  };
  script.onerror = function(err) {
    console.error('[Mind-Link Bridge] Failed to load api.js:', err);
    window.__notesio_apiAvailable = false;
  };
  (document.head || document.documentElement).appendChild(script);

  // Track API availability
  window.__notesio_apiAvailable = false;
  window.__notesio_summarizerAvailable = false;

  // Listen for API ready event from MAIN world
  document.addEventListener('__notesio_api_ready', (event) => {
    console.log('[Mind-Link Bridge] Received API ready event:', event.detail);
    window.__notesio_apiAvailable = event.detail.languageModel || false;
    window.__notesio_summarizerAvailable = event.detail.summarizer || false;
  });

  // Create wrapper API that bridges to MAIN world using custom events
  let requestCounter = 0;
  const pendingRequests = new Map();

  // Listen for responses from MAIN world
  document.addEventListener('__notesio_api_response', (event) => {
    const { requestId, result, error } = event.detail;
    const pending = pendingRequests.get(requestId);

    if (pending) {
      pendingRequests.delete(requestId);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    }
  });

  window.__notesio_api = {
    async callChromeAI(promptText, options = {}) {
      const requestId = `req_${++requestCounter}_${Date.now()}`;

      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });

        // Send request to MAIN world
        document.dispatchEvent(new CustomEvent('__notesio_api_request', {
          detail: {
            requestId,
            type: 'callChromeAI',
            promptText,
            options
          }
        }));

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
    },

    async summarizeText(text, options = {}) {
      const requestId = `req_${++requestCounter}_${Date.now()}`;

      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });

        document.dispatchEvent(new CustomEvent('__notesio_api_request', {
          detail: {
            requestId,
            type: 'summarizeText',
            text,
            options
          }
        }));

        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
    },

    async simplifyJargon(text) {
      const requestId = `req_${++requestCounter}_${Date.now()}`;

      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });

        document.dispatchEvent(new CustomEvent('__notesio_api_request', {
          detail: {
            requestId,
            type: 'simplifyJargon',
            text
          }
        }));

        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
    }
  };

  console.log('[Mind-Link Bridge] Initialized with MAIN world API bridge');
})();
