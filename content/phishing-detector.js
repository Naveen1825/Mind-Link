// Phishing Detection: Analyzes page for suspicious indicators
// Designed to protect elderly users from phishing attacks
(function () {

  let phishingCheckInProgress = false;
  let warningOverlay = null;

  // Rate limiting state
  let lastCheckTime = 0;
  let lastCheckedHostname = '';
  const MIN_CHECK_INTERVAL = 5000; // 5 seconds between checks for same domain

  function collectPageData() {
    try {
      // Collect visible button text and form labels (LIMIT TO 5 for efficiency)
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button'))
        .map(el => el.textContent?.trim() || el.value?.trim() || '')
        .filter(text => text.length > 0 && text.length < 50)
        .slice(0, 5); // Reduced from 10 to 5

      // Check for common brand names in page text
      const pageText = document.body.innerText.toLowerCase();
      const commonBrands = ['paypal', 'amazon', 'microsoft', 'google', 'apple', 'bank', 'facebook', 'netflix'];
      const mentionedBrands = commonBrands.filter(brand => pageText.includes(brand));

      return {
        url: location.href,
        hostname: location.hostname,
        title: document.title || '',
        hasPasswordField: !!document.querySelector('input[type="password"]'),
        hasLoginForm: !!document.querySelector('form[action*="login"], form[id*="login"], form[class*="login"]'),
        urgentLanguage: document.body.innerText.toLowerCase().includes('act now') ||
          document.body.innerText.toLowerCase().includes('account suspended') ||
          document.body.innerText.toLowerCase().includes('verify immediately') ||
          document.body.innerText.toLowerCase().includes('urgent action required'),
        suspiciousLinks: Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(href => href && !href.startsWith(location.origin))
          .slice(0, 3), // Reduced from 10 to 3
        metaDescription: (document.querySelector('meta[name="description"]')?.content || '').slice(0, 200), // Truncate to 200 chars
        buttonTexts: buttons,
        mentionedBrands: mentionedBrands
      };
    } catch (e) {
      return null;
    }
  }

  function createWarningOverlay(trustScore, reason) {
    // Remove existing overlay if any
    removeWarningOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'mindlink-phishing-warning';

    // Determine severity
    let borderColor = '#f59e0b'; // orange (warning)
    let title = '⚠️ Warning: This site may be suspicious';
    let emoji = '⚠️';

    if (trustScore <= 2) {
      borderColor = '#ef4444'; // red (danger)
      title = '🛑 Danger: This site looks very suspicious';
      emoji = '🛑';
    } else if (trustScore >= 4) {
      borderColor = '#10b981'; // green (safe)
      title = '✅ This site appears safe';
      emoji = '✅';
    }

    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '2147483647',
      background: '#ffffff',
      borderBottom: `4px solid ${borderColor}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '16px 20px',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    });

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">${emoji}</span>
        <div>
          <div style="font-weight: 600; font-size: 18px; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${reason}</div>
          <div style="font-size: 13px; color: #888; margin-top: 4px;">Trust Score: ${trustScore}/5</div>
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.type = 'button';
    Object.assign(closeBtn.style, {
      border: 'none',
      background: 'transparent',
      fontSize: '28px',
      cursor: 'pointer',
      padding: '0 8px',
      color: '#666'
    });
    closeBtn.addEventListener('click', removeWarningOverlay);

    overlay.appendChild(content);
    overlay.appendChild(closeBtn);
    document.documentElement.appendChild(overlay);
    warningOverlay = overlay;
  }

  function removeWarningOverlay() {
    if (warningOverlay && warningOverlay.parentNode) {
      warningOverlay.parentNode.removeChild(warningOverlay);
    }
    warningOverlay = null;
  }

  async function captureScreenshot(retryCount = 0, allowAutomatic = false) {
    try {
      // Allow screenshot capture for:
      // 1. Manual rechecks (user-initiated)
      // 2. Critical scores (final score ≤ 2) - allowAutomatic flag
      // NOTE: Screenshots require the tab to be active/visible
      if (!window.__manualRecheckRequested && !allowAutomatic) {
        console.log("[Mind-Link] Skipping screenshot - not manual recheck or critical score");
        return null;
      }

      // Log capture attempt type
      if (window.__manualRecheckRequested) {
        console.log("[Mind-Link] Capturing screenshot (manual recheck)");
      } else if (allowAutomatic) {
        console.log("[Mind-Link] Capturing screenshot (critical score - automatic)");
      }

      // Progressive delay strategy: wait longer for each attempt
      // This ensures we respect Chrome's rate limits
      const delays = [1000, 3000]; // 1s for first attempt, 3s for retry
      if (retryCount < delays.length) {
        await new Promise(resolve => setTimeout(resolve, delays[retryCount]));
      }

      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' });

      if (response && response.success && response.screenshot) {
        console.log("[Mind-Link] Screenshot captured successfully");
        return response.screenshot;
      }

      // Check if it's a rate limit, readback error, permission error, or tab visibility error
      const errorMsg = response?.error || "";
      const isRateLimitError = errorMsg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
      const isReadbackError = errorMsg.includes('image readback failed');
      const isPermissionError = errorMsg.includes('activeTab') || errorMsg.includes('not in effect');
      const isTabNotReady = errorMsg.includes('not fully loaded');
      const isTabNotVisible = errorMsg.includes('must be visible') || errorMsg.includes('not active');

      // Don't retry permission errors, tab not ready, or tab not visible errors
      if (isPermissionError || isTabNotReady || isTabNotVisible) {
        if (isTabNotVisible) {
          console.log("[Mind-Link] Screenshot unavailable - tab must be visible/active for capture");
        } else {
          console.log("[Mind-Link] Screenshot unavailable:", errorMsg);
        }
        return null;
      }

      // Only retry once for rate limit or readback errors
      if ((isRateLimitError || isReadbackError) && retryCount === 0) {
        console.warn("[Mind-Link] Screenshot failed, waiting 3 seconds before single retry...");
        return captureScreenshot(1); // One retry only
      }

      // For all other cases, skip visual analysis
      console.log("[Mind-Link] Proceeding without visual analysis:", errorMsg);
      return null;
    } catch (e) {
      // On exception, check if it's worth retrying
      const errorMsg = String(e.message || e);
      const isRateLimitError = errorMsg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
      const isReadbackError = errorMsg.includes('image readback failed');
      const isPermissionError = errorMsg.includes('activeTab') || errorMsg.includes('not in effect');
      const isTabNotVisible = errorMsg.includes('must be visible') || errorMsg.includes('not active');

      if (isPermissionError || isTabNotVisible) {
        if (isTabNotVisible) {
          console.log("[Mind-Link] Screenshot requires tab to be visible/active");
        } else {
          console.log("[Mind-Link] Screenshot requires user interaction, proceeding with text-only analysis");
        }
        return null;
      }

      if ((isRateLimitError || isReadbackError) && retryCount === 0) {
        console.warn("[Mind-Link] Screenshot exception, waiting 3 seconds before single retry...");
        return captureScreenshot(1);
      }

      console.log("[Mind-Link] Skipping visual analysis:", errorMsg);
      return null;
    }
  }

  async function analyzeVisual(screenshotDataUrl, pageData) {
    try {
      const visualPrompt = `You are analyzing a webpage screenshot to detect visual phishing indicators. This is to protect elderly users with low technical literacy.

Context:
- URL: ${pageData.hostname}
- Mentioned brands: ${pageData.mentionedBrands.join(', ') || 'none'}
- Button texts: ${pageData.buttonTexts.join(', ') || 'none'}

IMPORTANT: Analyze the visual appearance of the screenshot for:
1. **Spoofed Logos**: Does the logo look like a fake/poor quality imitation of a known brand (blurry, pixelated, wrong colors)?
2. **Suspicious Buttons**: Are there oversized, flashy, or misleading buttons (e.g., fake "Download" buttons, bright red "URGENT" buttons)?
3. **Fake Security Badges**: Are there security/trust badges that look fake or misplaced?
4. **Poor Design Quality**: Does the page have unprofessional design, mismatched fonts, or poor layout?
5. **Brand Mismatch**: If a brand is mentioned, does the visual design match that brand's authentic style?
6. **Form Design**: Are there suspicious forms requesting sensitive info (SSN, credit card) with poor design?

Describe what you see in the screenshot and evaluate visual trustworthiness.

Return ONLY JSON:
{
  "visualSuspicious": boolean,
  "visualTrustScore": number (1-5, where 5 is visually trustworthy),
  "visualFindings": "brief description of visual red flags or why it looks safe"
}`;

      const result = await window.__notesio_api.callChromeAI(visualPrompt);

      let parsed = null;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
      } catch (e) {
        console.error("[Mind-Link] Failed to parse visual analysis:", result);
        return null;
      }

      return parsed;
    } catch (e) {
      console.error("[Mind-Link] Visual analysis error:", e);
      return null;
    }
  }

  async function checkDomainLegitimacy(hostname) {
    try {
      console.log(`[Mind-Link] Checking domain legitimacy for: ${hostname}`);

      // Check cache first (24-hour validity)
      const cacheKey = `domainCache_${hostname}`;
      const cached = await chrome.storage.local.get(cacheKey);

      if (cached[cacheKey]) {
        const cacheAge = Date.now() - cached[cacheKey].timestamp;
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < CACHE_DURATION) {
          console.log(`[Mind-Link] Using cached domain analysis (age: ${Math.round(cacheAge / 60000)} minutes)`);
          return cached[cacheKey].result;
        } else {
          console.log(`[Mind-Link] Cache expired (age: ${Math.round(cacheAge / 60000)} minutes), re-analyzing`);
        }
      }

      const prompt = `You are a security expert analyzing domain legitimacy. Evaluate if this domain is likely legitimate or suspicious.

Domain: ${hostname}

Analyze:
1. **Well-known brands/services**: Is this a recognized company, service, or platform? (e.g., google.com, amazon.com, notion.so, chatgpt.com, spotify.com, github.com)
2. **Common legitimate patterns**: Does it follow standard naming? (company-name.com, service.io, app.co, brand.net)
3. **Typosquatting**: Are there misspellings of known brands? (g00gle.com, arnazon.com, paypa1.com, microsft.com)
4. **TLD analysis**: 
   - SAFE: .com, .org, .net, .edu, .gov, .io, .co, .ai, .app, .cloud, .dev, .tech
   - RISKY: .tk, .ml, .ga, .cf, .gq (often used for scams)
5. **Suspicious patterns**: Multiple hyphens, random letters, excessive length (>30 chars), IP addresses, unusual Unicode

Be generous with legitimate sites - only flag clear red flags like typosquatting or known scam patterns.

Return ONLY JSON:
{
  "isLikelyLegitimate": boolean,
  "confidence": number (1-5, where 5 is very confident),
  "reason": "brief explanation"
}`;

      const result = await window.__notesio_api.callChromeAI(prompt);

      let parsed = null;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
      } catch (e) {
        console.error("[Mind-Link] Failed to parse domain legitimacy result:", result);
        return { isLikelyLegitimate: true, confidence: 3, reason: "Unable to analyze" };
      }

      // Cache the result
      await chrome.storage.local.set({
        [cacheKey]: {
          result: parsed,
          timestamp: Date.now()
        }
      });
      console.log(`[Mind-Link] Domain analysis cached for 24 hours`);

      console.log(`[Mind-Link] Domain legitimacy result:`, parsed);
      return parsed;
    } catch (e) {
      console.error("[Mind-Link] Domain legitimacy check error:", e);
      // Default to allowing the domain if check fails
      return { isLikelyLegitimate: true, confidence: 3, reason: "Check failed" };
    }
  }

  async function checkForPhishing() {
    if (phishingCheckInProgress) {
      console.log("[Mind-Link] Phishing check already in progress, skipping");
      return;
    }

    // Rate limiting: Prevent rapid repeated checks
    const currentHostname = location.hostname;
    const now = Date.now();

    if (currentHostname === lastCheckedHostname && (now - lastCheckTime) < MIN_CHECK_INTERVAL) {
      const remainingTime = Math.round((MIN_CHECK_INTERVAL - (now - lastCheckTime)) / 1000);
      console.log(`[Mind-Link] Rate limit: Check throttled (retry in ${remainingTime}s)`);
      return;
    }

    lastCheckTime = now;
    lastCheckedHostname = currentHostname;

    // Only whitelist the absolute top most-visited sites globally to avoid unnecessary AI calls
    // This is a performance optimization for the most common sites
    const topGlobalSites = [
      // Search & Social
      'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
      'twitter.com', 'x.com', 'reddit.com', 'linkedin.com', 'tiktok.com',
      'pinterest.com', 'tumblr.com', 'snapchat.com',

      // E-commerce
      'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'etsy.com',
      'shopify.com', 'aliexpress.com',

      // Tech & Productivity
      'microsoft.com', 'apple.com', 'github.com', 'gitlab.com', 'bitbucket.org',
      'stackoverflow.com', 'stackexchange.com', 'npmjs.com', 'pypi.org',
      'notion.so', 'trello.com', 'asana.com', 'slack.com', 'discord.com',
      'zoom.us', 'teams.microsoft.com', 'meet.google.com',

      // Streaming & Entertainment
      'netflix.com', 'hulu.com', 'disneyplus.com', 'spotify.com',
      'twitch.tv', 'soundcloud.com', 'vimeo.com',

      // Cloud & Storage
      'dropbox.com', 'box.com', 'drive.google.com', 'onedrive.live.com',
      'icloud.com',

      // Education & Reference
      'wikipedia.org', 'medium.com', 'quora.com', 'coursera.org',
      'udemy.com', 'khanacademy.org', 'edx.org',

      // News
      'nytimes.com', 'bbc.com', 'cnn.com', 'theguardian.com', 'reuters.com',

      // Finance
      'paypal.com', 'stripe.com', 'square.com',

      // Development
      'localhost', '127.0.0.1'
    ];
    const specialProtocols = ['chrome://', 'chrome-extension://', 'about:', 'file://'];

    // Skip special protocol pages (can't capture screenshots)
    if (specialProtocols.some(p => location.href.startsWith(p))) {
      return;
    }

    // Fast-path for top global sites (no AI call needed)
    if (topGlobalSites.some(d => location.hostname.includes(d))) {
      console.log(`[Mind-Link] Skipping analysis - top global site: ${location.hostname}`);
      return;
    }

    // Check if Chrome AI is available
    if (!window.__notesio_apiAvailable) {
      console.log("[Mind-Link] Chrome AI not available, skipping phishing check");
      return;
    }

    // STEP 1: AI-powered domain legitimacy check with error handling
    let legitimacy;
    try {
      legitimacy = await checkDomainLegitimacy(location.hostname);
    } catch (e) {
      console.error("[Mind-Link] Domain legitimacy check failed:", e);
      // Fallback to safe default on error
      legitimacy = { isLikelyLegitimate: true, confidence: 3, reason: "Check failed - proceeding with caution" };
    }

    // Smart decision tree based on confidence level
    if (legitimacy.isLikelyLegitimate && legitimacy.confidence >= 4) {
      // HIGH CONFIDENCE - Site is likely safe, store positive result and skip analysis
      console.log(`[Mind-Link] Domain appears legitimate with high confidence (${legitimacy.confidence}/5) - ${legitimacy.reason}`);
      const storageKey = `trustScore_${location.hostname}`;
      await chrome.storage.local.set({ [storageKey]: 4 });
      return;
    }

    if (!legitimacy.isLikelyLegitimate && legitimacy.confidence >= 4) {
      // HIGH CONFIDENCE THREAT - Domain is clearly suspicious, proceed with full analysis
      console.log(`[Mind-Link] High-confidence threat detected (${legitimacy.confidence}/5) - ${legitimacy.reason}`);
      // Continue to full analysis below
    } else if (legitimacy.confidence <= 2) {
      // HIGH THREAT - Low confidence or suspicious, needs full analysis with screenshot
      console.log(`[Mind-Link] High-risk domain (confidence: ${legitimacy.confidence}/5) - Full analysis required`);
      // Continue to full analysis below
    } else if (legitimacy.confidence === 3) {
      // MEDIUM THREAT - Borderline case, do text-only analysis for efficiency
      console.log(`[Mind-Link] Medium-risk domain (confidence: ${legitimacy.confidence}/5) - Text-only analysis`);
      // Continue to full analysis but skip screenshot (handled in screenshot logic)
    } else {
      // Fallback for any edge cases
      console.log(`[Mind-Link] Domain requires analysis (confidence: ${legitimacy.confidence}/5) - ${legitimacy.reason}`);
    }

    phishingCheckInProgress = true;

    try {
      const pageData = collectPageData();
      if (!pageData) return;

      // STEP 1: Capture screenshot for visual analysis
      let screenshot = null;
      if (legitimacy.confidence <= 2 || window.__manualRecheckRequested) {
        // High threat (confidence ≤ 2) OR manual recheck → always capture screenshot
        console.log("[Mind-Link] High-risk site detected - Capturing screenshot for visual analysis");

        try {
          screenshot = await captureScreenshot();
          if (screenshot) {
            console.log("[Mind-Link] Screenshot captured successfully");
          } else {
            console.log("[Mind-Link] Screenshot capture failed, proceeding with text-only analysis");
          }
        } catch (e) {
          console.error("[Mind-Link] Screenshot error:", e);
        }
      } else if (legitimacy.confidence === 3) {
        // Medium threat - skip screenshot for performance
        console.log("[Mind-Link] Medium-risk site - Skipping screenshot (text-only analysis)");
      } else {
        // Low threat - no screenshot needed
        console.log("[Mind-Link] Low-risk site - No screenshot needed");
      }

      // STEP 2: Perform visual analysis if screenshot available
      let visualAnalysis = null;
      if (screenshot) {
        console.log("[Mind-Link] Analyzing visual indicators...");
        visualAnalysis = await analyzeVisual(screenshot, pageData);
      } else {
        console.log("[Mind-Link] Screenshot not available, proceeding with text-only analysis");
      }

      // STEP 3: Perform textual analysis
      console.log("[Mind-Link] Analyzing textual indicators...");
      const prompt = `Analyze this webpage for phishing indicators. This is to protect elderly users with low technical literacy.

Domain Legitimacy Pre-check: ${legitimacy.reason} (Confidence: ${legitimacy.confidence}/5)

Page Information:
- URL: ${pageData.url.slice(0, 100)}${pageData.url.length > 100 ? '...' : ''}
- Hostname: ${pageData.hostname}
- Title: ${pageData.title.slice(0, 100)}
- Has password field: ${pageData.hasPasswordField}
- Has login form: ${pageData.hasLoginForm}
- Contains urgent language: ${pageData.urgentLanguage}
- Sample external links (${pageData.suspiciousLinks.length} total): ${pageData.suspiciousLinks.slice(0, 3).join(', ')}
- Sample button texts: ${pageData.buttonTexts.join(', ') || 'none'}
- Mentioned brands: ${pageData.mentionedBrands.join(', ') || 'none'}

Evaluate for:
1. Suspicious URL (misspellings, unusual TLDs, typosquatting)
2. Fake urgency language ("act now", "account suspended")
3. Suspicious login forms
4. Mismatched branding (claims to be a brand but URL doesn't match)
5. Poor grammar/spelling

IMPORTANT: The domain pre-check already found: "${legitimacy.reason}". Factor this into your analysis.

Return ONLY JSON:
{
  "textualSuspicious": boolean,
  "textualTrustScore": number (1-5, where 5 is very trustworthy),
  "textualFindings": "brief, simple explanation suitable for elderly users"
}`;

      const result = await window.__notesio_api.callChromeAI(prompt);

      let textualAnalysis = null;
      try {
        // Try to extract JSON from the response (AI might add extra text)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          textualAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          textualAnalysis = JSON.parse(result);
        }
      } catch (e) {
        console.error("[Mind-Link] Failed to parse textual analysis result:", result);
        return;
      }

      // STEP 4: Combine domain, visual, and textual analysis with confidence weighting
      let finalTrustScore = textualAnalysis.textualTrustScore || 3;
      let combinedFindings = textualAnalysis.textualFindings || "";

      // Calculate weighted trust score based on available indicators and their confidence
      const indicators = [];

      // Domain analysis (always available)
      indicators.push({
        score: legitimacy.isLikelyLegitimate ? 5 : (6 - legitimacy.confidence), // Invert confidence for suspicious domains
        weight: 0.35, // 35% weight
        confidence: legitimacy.confidence / 5,
        name: 'domain'
      });

      // Textual analysis (always performed)
      indicators.push({
        score: textualAnalysis.textualTrustScore,
        weight: 0.30, // 30% weight
        confidence: 1.0, // Textual analysis always runs
        name: 'textual'
      });

      // Visual analysis (if available)
      if (visualAnalysis && typeof visualAnalysis.visualTrustScore === 'number') {
        indicators.push({
          score: visualAnalysis.visualTrustScore,
          weight: 0.35, // 35% weight (equal to domain)
          confidence: 1.0,
          name: 'visual'
        });

        // Combine findings
        if (visualAnalysis.visualSuspicious) {
          combinedFindings += ` Visual warning: ${visualAnalysis.visualFindings}`;
        }
      }

      // Calculate confidence-weighted score
      let totalWeight = 0;
      let weightedSum = 0;

      for (const indicator of indicators) {
        const effectiveWeight = indicator.weight * indicator.confidence;
        weightedSum += indicator.score * effectiveWeight;
        totalWeight += effectiveWeight;
      }

      finalTrustScore = Math.round(weightedSum / totalWeight);

      // Apply safety bounds
      finalTrustScore = Math.max(1, Math.min(5, finalTrustScore));

      console.log("[Mind-Link] Trust score calculation:", {
        domain: indicators[0].score,
        textual: indicators[1].score,
        visual: indicators[2]?.score || 'N/A',
        finalScore: finalTrustScore,
        weights: indicators.map(i => `${i.name}: ${i.weight}`)
      });

      // CRITICAL SCORE ENHANCEMENT: If final score is ≤ 2 and we don't have visual analysis yet,
      // capture screenshot for visual confirmation to improve accuracy
      if (finalTrustScore <= 2 && !visualAnalysis && legitimacy.confidence <= 3) {
        console.log("[Mind-Link] CRITICAL: Final score ≤ 2 detected - Capturing screenshot for visual confirmation");

        try {
          // Pass allowAutomatic=true to enable screenshot for critical scores
          const criticalScreenshot = await captureScreenshot(0, true);
          if (criticalScreenshot) {
            console.log("[Mind-Link] Critical screenshot captured, performing visual analysis...");
            const criticalVisualAnalysis = await analyzeVisual(criticalScreenshot, pageData);

            if (criticalVisualAnalysis && typeof criticalVisualAnalysis.visualTrustScore === 'number') {
              // Add visual indicator and recalculate
              indicators.push({
                score: criticalVisualAnalysis.visualTrustScore,
                weight: 0.35,
                confidence: 1.0,
                name: 'visual'
              });

              // Recalculate trust score with visual data
              totalWeight = 0;
              weightedSum = 0;

              for (const indicator of indicators) {
                const effectiveWeight = indicator.weight * indicator.confidence;
                weightedSum += indicator.score * effectiveWeight;
                totalWeight += effectiveWeight;
              }

              finalTrustScore = Math.round(weightedSum / totalWeight);
              finalTrustScore = Math.max(1, Math.min(5, finalTrustScore));

              // Update findings
              if (criticalVisualAnalysis.visualSuspicious) {
                combinedFindings += ` Visual warning: ${criticalVisualAnalysis.visualFindings}`;
              }

              console.log("[Mind-Link] Recalculated trust score with visual analysis:", {
                domain: indicators[0].score,
                textual: indicators[1].score,
                visual: indicators[2].score,
                finalScore: finalTrustScore,
                improvement: 'Added visual confirmation'
              });
            }
          } else {
            console.log("[Mind-Link] Critical screenshot unavailable, proceeding with text-only score");
          }
        } catch (e) {
          console.error("[Mind-Link] Critical screenshot capture failed:", e);
          // Continue with original score
        }
      }

      // Store trust score in chrome.storage for popup access
      const storageKey = `trustScore_${pageData.hostname}`;
      await chrome.storage.local.set({ [storageKey]: finalTrustScore });
      console.log("[Mind-Link] Trust score stored:", finalTrustScore);

      if (finalTrustScore <= 3) {
        // Show warning for low trust scores
        createWarningOverlay(
          finalTrustScore,
          combinedFindings || "This website shows signs of being unsafe."
        );

        // Optional: notify family member if configured
        // (This would require additional implementation)
      }

    } catch (e) {
      console.error("[Mind-Link] Phishing check error:", e);
    } finally {
      phishingCheckInProgress = false;
    }
  }

  // Listen for manual recheck requests from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'RECHECK_PHISHING') {
      console.log("[Mind-Link] Manual phishing recheck triggered");
      phishingCheckInProgress = false; // Reset flag
      window.__manualRecheckRequested = true; // Enable screenshot for manual checks
      checkForPhishing().finally(() => {
        window.__manualRecheckRequested = false; // Reset after check
      });
    }
  });

  // Run phishing check after page load with proper timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for page to fully settle before checking
      setTimeout(checkForPhishing, 3000); // Wait 3s for page to settle
    }, { once: true });
  } else if (document.readyState === 'interactive') {
    // Page is still loading but DOM is ready
    setTimeout(checkForPhishing, 3000);
  } else {
    // Page is already complete
    setTimeout(checkForPhishing, 2000);
  }

  // Also expose for manual checks
  window.__notesio_phishing = { checkForPhishing, removeWarningOverlay };
})();
