// Phishing Detection: Analyzes page for suspicious indicators
// Designed to protect elderly users from phishing attacks
(function () {

  let phishingCheckInProgress = false;
  let warningOverlay = null;

  function collectPageData() {
    try {
      // Collect visible button text and form labels
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button'))
        .map(el => el.textContent?.trim() || el.value?.trim() || '')
        .filter(text => text.length > 0 && text.length < 50)
        .slice(0, 10);

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
          .slice(0, 10),
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
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

  async function captureScreenshot(retryCount = 0) {
    try {
      // Skip screenshot capture for automatic checks - only allow for manual rechecks
      // This avoids the activeTab permission issue since automatic checks happen
      // without user interaction
      if (!window.__manualRecheckRequested) {
        console.log("[Mind-Link] Skipping automatic screenshot capture (requires user interaction)");
        return null;
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

      // Check if it's a rate limit, readback error, or permission error
      const errorMsg = response?.error || "";
      const isRateLimitError = errorMsg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
      const isReadbackError = errorMsg.includes('image readback failed');
      const isPermissionError = errorMsg.includes('activeTab') || errorMsg.includes('not in effect');
      const isTabNotReady = errorMsg.includes('not fully loaded');

      // Don't retry permission errors or tab not ready errors
      if (isPermissionError || isTabNotReady) {
        console.log("[Mind-Link] Screenshot unavailable:", errorMsg);
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

      if (isPermissionError) {
        console.log("[Mind-Link] Screenshot requires user interaction, proceeding with text-only analysis");
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

  async function checkForPhishing() {
    if (phishingCheckInProgress) return;

    // Don't check on certain known-safe domains and special pages
    const safeDomains = ['google.com', 'github.com', 'microsoft.com', 'localhost'];
    const specialProtocols = ['chrome://', 'chrome-extension://', 'about:', 'file://'];

    // Skip special protocol pages (can't capture screenshots)
    if (specialProtocols.some(p => location.href.startsWith(p))) {
      return;
    }

    if (safeDomains.some(d => location.hostname.includes(d))) {
      return;
    }

    // Check if Chrome AI is available
    if (!window.__notesio_apiAvailable) {
      console.log("[Mind-Link] Chrome AI not available, skipping phishing check");
      return;
    }

    phishingCheckInProgress = true;

    try {
      const pageData = collectPageData();
      if (!pageData) return;

      // STEP 1: Capture screenshot for visual analysis (only if user-initiated)
      let screenshot = null;
      if (window.__manualRecheckRequested) {
        console.log("[Mind-Link] Capturing screenshot for visual analysis...");
        screenshot = await captureScreenshot();
      } else {
        console.log("[Mind-Link] Automatic check - skipping screenshot (text-only analysis)");
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

Page Information:
- URL: ${pageData.url}
- Hostname: ${pageData.hostname}
- Title: ${pageData.title}
- Has password field: ${pageData.hasPasswordField}
- Has login form: ${pageData.hasLoginForm}
- Contains urgent language: ${pageData.urgentLanguage}
- External links: ${pageData.suspiciousLinks.length}
- Button texts: ${pageData.buttonTexts.join(', ') || 'none'}
- Mentioned brands: ${pageData.mentionedBrands.join(', ') || 'none'}

Evaluate for:
1. Suspicious URL (misspellings, unusual TLDs, typosquatting)
2. Fake urgency language ("act now", "account suspended")
3. Suspicious login forms
4. Mismatched branding (claims to be a brand but URL doesn't match)
5. Poor grammar/spelling

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

      // STEP 4: Combine visual and textual analysis
      let finalTrustScore = textualAnalysis.textualTrustScore || 3;
      let combinedFindings = textualAnalysis.textualFindings || "";

      if (visualAnalysis && typeof visualAnalysis.visualTrustScore === 'number') {
        // Average the two scores, but weight visual analysis slightly less (70% text, 30% visual)
        finalTrustScore = Math.round(
          (textualAnalysis.textualTrustScore * 0.7) +
          (visualAnalysis.visualTrustScore * 0.3)
        );

        // Combine findings
        if (visualAnalysis.visualSuspicious) {
          combinedFindings += ` Visual warning: ${visualAnalysis.visualFindings}`;
        }

        console.log("[Mind-Link] Combined analysis - Trust Score:", finalTrustScore);
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
