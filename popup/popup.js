// Popup script: Display trust score and ads blocked count
(async function () {
  const contentDiv = document.getElementById('content');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) {
      showError('Unable to access current tab');
      return;
    }

    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot analyze Chrome internal pages');
      return;
    }

    const hostname = new URL(tab.url).hostname;

    // Get trust score from storage
    const storageKey = `trustScore_${hostname}`;
    const adsKey = `adsBlocked_${hostname}`;

    const result = await chrome.storage.local.get([storageKey, adsKey, 'totalAdsBlocked']);

    const trustScore = result[storageKey] || null;
    const adsBlocked = result[adsKey] || 0;
    const totalAdsBlocked = result.totalAdsBlocked || 0;

    displayData(trustScore, adsBlocked, totalAdsBlocked, hostname);

  } catch (e) {
    console.error('Popup error:', e);
    showError('Error loading data');
  }
})();

function displayData(trustScore, adsBlocked, totalAdsBlocked, hostname) {
  const contentDiv = document.getElementById('content');

  let trustHTML = '';

  if (trustScore !== null) {
    let cardClass = '';
    let emoji = '🔍';
    let label = 'Not Rated';
    let message = 'No analysis available yet';

    if (trustScore <= 2) {
      cardClass = 'danger';
      emoji = '🛑';
      label = 'Dangerous';
      message = 'This site looks very suspicious';
    } else if (trustScore === 3) {
      cardClass = 'warning';
      emoji = '⚠️';
      label = 'Warning';
      message = 'This site may be suspicious';
    } else if (trustScore >= 4) {
      cardClass = 'safe';
      emoji = '✅';
      label = 'Safe';
      message = 'This site appears safe';
    }

    trustHTML = `
      <div class="trust-score-section">
        <div class="section-title">Trust Score</div>
        <div class="trust-score-card ${cardClass}">
          <div class="trust-score-emoji">${emoji}</div>
          <div class="trust-score-value">${trustScore}/5</div>
          <div class="trust-score-label">${label}</div>
          <div class="trust-score-message">${message}</div>
        </div>
      </div>
    `;
  } else {
    trustHTML = `
      <div class="trust-score-section">
        <div class="section-title">Trust Score</div>
        <div class="trust-score-card">
          <div class="trust-score-emoji">🔍</div>
          <div class="trust-score-value">—</div>
          <div class="trust-score-label">Not Analyzed</div>
          <div class="trust-score-message">Analysis will run automatically when you visit suspicious sites</div>
        </div>
      </div>
    `;
  }

  contentDiv.innerHTML = `
    ${trustHTML}
    
    <div class="ads-blocked-section">
      <div class="ads-blocked-info">
        <div class="ads-blocked-icon">🚫</div>
        <div class="ads-blocked-text">
          <h3>Ads Blocked</h3>
          <p>On this site</p>
        </div>
      </div>
      <div class="ads-blocked-count">${adsBlocked}</div>
    </div>
    
    <button class="refresh-btn" id="refreshBtn" type="button">
      🔄 Refresh Analysis
    </button>
  `;

  // Add refresh button listener
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        // Trigger a new phishing check
        chrome.tabs.sendMessage(tab.id, { type: 'RECHECK_PHISHING' });
        window.close();
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  });
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="error">
      <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

