// Phishing Detection: Analyzes page for suspicious indicators
// Designed to protect elderly users from phishing attacks
(function () {

  let phishingCheckInProgress = false;
  let warningOverlay = null;

  function collectPageData() {
    try {
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
        metaDescription: document.querySelector('meta[name="description"]')?.content || ''
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

  async function checkForPhishing() {
    if (phishingCheckInProgress) return;

    // Don't check on certain known-safe domains
    const safeDomains = ['google.com', 'github.com', 'microsoft.com', 'localhost'];
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

      const prompt = `Analyze this webpage for phishing indicators. This is to protect elderly users with low technical literacy.

Page Information:
- URL: ${pageData.url}
- Hostname: ${pageData.hostname}
- Title: ${pageData.title}
- Has password field: ${pageData.hasPasswordField}
- Has login form: ${pageData.hasLoginForm}
- Contains urgent language: ${pageData.urgentLanguage}
- External links: ${pageData.suspiciousLinks.length}

Evaluate for:
1. Suspicious URL (misspellings, unusual TLDs)
2. Fake urgency language ("act now", "account suspended")
3. Suspicious login forms
4. Mismatched branding
5. Poor grammar/spelling

Return ONLY JSON:
{
  "isSuspicious": boolean,
  "trustScore": number (1-5, where 5 is very trustworthy),
  "reason": "brief, simple explanation suitable for elderly users"
}`;

      const result = await window.__notesio_api.callChromeAI(prompt);

      let parsed = null;
      try {
        // Try to extract JSON from the response (AI might add extra text)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
      } catch (e) {
        console.error("[Mind-Link] Failed to parse phishing check result:", result);
        return;
      }

      if (parsed && typeof parsed.trustScore === 'number' && parsed.trustScore <= 3) {
        // Show warning for low trust scores
        createWarningOverlay(
          parsed.trustScore,
          parsed.reason || "This website shows signs of being unsafe."
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

  // Run phishing check after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkForPhishing, 2000); // Wait 2s for page to settle
    }, { once: true });
  } else {
    setTimeout(checkForPhishing, 2000);
  }

  // Also expose for manual checks
  window.__notesio_phishing = { checkForPhishing, removeWarningOverlay };
})();
