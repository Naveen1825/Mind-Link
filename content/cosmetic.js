// Cosmetic ad hiding: injects CSS to hide common ad containers
(function () {
  const STYLE_ID = 'notesio-cosmetic-style';
  let adsBlockedCount = 0;

  function getHostname() {
    try {
      return location.hostname || '';
    } catch {
      return '';
    }
  }

  async function incrementAdsBlocked(count) {
    try {
      const hostname = getHostname();
      if (!hostname) return;

      const adsKey = `adsBlocked_${hostname}`;
      const result = await chrome.storage.local.get([adsKey, 'totalAdsBlocked']);

      const currentSiteCount = (result[adsKey] || 0) + count;
      const totalCount = (result.totalAdsBlocked || 0) + count;

      await chrome.storage.local.set({
        [adsKey]: currentSiteCount,
        totalAdsBlocked: totalCount
      });

      console.log(`[Mind-Link] Ads blocked: ${count} (Site total: ${currentSiteCount}, Global total: ${totalCount})`);
    } catch (e) {
      console.error('[Mind-Link] Failed to update ads count:', e);
    }
  }

  function ensureCosmeticStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const hostname = getHostname();

    // Whitelist: Skip cosmetic blocking entirely for trusted domains
    const trustedDomains = [
      'mail.google.com',
      'gmail.com',
      'docs.google.com',
      'drive.google.com',
      'calendar.google.com',
      'meet.google.com',
      'outlook.office.com',
      'outlook.live.com',
      'office.com',
      'login.microsoftonline.com',
      'accounts.google.com',
      'myaccount.google.com',
      'app.slack.com',
      'web.whatsapp.com',
      'teams.microsoft.com'
    ];

    if (trustedDomains.some(domain => hostname.includes(domain))) {
      console.log('[Mind-Link] Skipping cosmetic blocking for trusted domain:', hostname);
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;

    // More conservative selectors - only block OBVIOUS ads
    const selectors = [
      // Very specific ad classes (exact match)
      '.advertisement', '.advertising', '.adsbygoogle', '.google-ads',

      // Specific ad networks (exact match)
      '.doubleclick', '.taboola', '.outbrain', '.mgid', '.revcontent',
      '.zergnet', '.adblade',

      // Video ads (exact match)
      '.video-ad', '.preroll-ad', '.midroll-ad', '.player-ad',

      // Data attributes (very specific)
      '[data-ad-slot]', '[data-google-query-id]', '[data-ad-client]',
      '[aria-label="advertisement"]',

      // ID patterns (very specific - starts with ad_ or ads_)
      '[id^="ad_"]', '[id^="ads_"]', '[id^="google_ads"]',

      // Class patterns (very specific - starts with ad_ or ads_)
      '[class^="ad_"]', '[class^="ads_"]',

      // Tracking pixels
      'img[width="1"][height="1"]',
      'iframe[width="1"][height="1"]',

      // Known ad sizes (IAB standard sizes for iframes only)
      'iframe[width="300"][height="250"]', // Medium Rectangle
      'iframe[width="728"][height="90"]',  // Leaderboard
      'iframe[width="160"][height="600"]', // Wide Skyscraper
      'iframe[width="300"][height="600"]', // Half Page
      'iframe[width="970"][height="250"]', // Billboard
      'iframe[width="320"][height="50"]',  // Mobile Banner

      // Known ad domains in links
      'a[href*="doubleclick.net"]', 'a[href*="googlesyndication.com"]'
    ];

    style.textContent = `${selectors.join(',\n')} { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; position: absolute !important; left: -9999px !important; }`;
    document.documentElement.appendChild(style);

    // Count how many ad elements were hidden
    setTimeout(() => {
      try {
        const hiddenAds = document.querySelectorAll(selectors.join(','));
        const count = hiddenAds.length;
        if (count > 0) {
          adsBlockedCount += count;
          incrementAdsBlocked(count);
        }
      } catch (e) {
        console.error('[Mind-Link] Error counting ads:', e);
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCosmeticStyles, { once: true });
  } else {
    ensureCosmeticStyles();
  }

  // Observe for dynamically added ads (conservative detection)
  if (typeof MutationObserver !== 'undefined') {
    const hostname = getHostname();

    // Skip mutation observer for trusted domains
    const trustedDomains = [
      'mail.google.com', 'gmail.com', 'docs.google.com', 'drive.google.com',
      'calendar.google.com', 'meet.google.com', 'outlook.office.com',
      'outlook.live.com', 'office.com', 'accounts.google.com'
    ];

    if (trustedDomains.some(domain => hostname.includes(domain))) {
      console.log('[Mind-Link] Skipping mutation observer for trusted domain');
      return;
    }

    const observer = new MutationObserver(() => {
      // Conservative selector list for dynamic ads (only obvious ads)
      const dynamicAdSelectors = [
        '.advertisement', '.adsbygoogle', '.google-ads',
        '.taboola', '.outbrain', '[data-ad-slot]',
        '[id^="google_ads"]', 'iframe[width="300"][height="250"]',
        'iframe[width="728"][height="90"]'
      ];

      const adElements = document.querySelectorAll(dynamicAdSelectors.join(','));
      const newAds = Array.from(adElements).filter(el => {
        try {
          // Skip media elements to avoid overflow: visible warnings
          const isMediaElement = ['IMG', 'VIDEO', 'CANVAS'].includes(el.tagName);
          if (isMediaElement) {
            return false;
          }

          const isHidden = window.getComputedStyle(el).display === 'none';
          const notCounted = !el.dataset.mindlinkCounted;
          if (isHidden && notCounted) {
            el.dataset.mindlinkCounted = 'true';
            return true;
          }
          return false;
        } catch (e) {
          // Ignore errors from getComputedStyle on certain elements
          return false;
        }
      });

      if (newAds.length > 0) {
        adsBlockedCount += newAds.length;
        incrementAdsBlocked(newAds.length);
      }

      // Only block iframes with obvious ad sources
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          const src = iframe.src || '';
          const adPatterns = [
            'doubleclick', 'googlesyndication', 'googleadservices',
            'adnxs', 'taboola.com', 'outbrain.com', 'amazon-adsystem'
          ];

          if (adPatterns.some(pattern => src.includes(pattern)) && !iframe.dataset.mindlinkBlocked) {
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';
            iframe.dataset.mindlinkBlocked = 'true';
            adsBlockedCount++;
            incrementAdsBlocked(1);
          }
        } catch (e) {
          // Cross-origin iframe - can't access src
        }
      });
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Block script tags that inject ads (conservative list)
  if (typeof MutationObserver !== 'undefined') {
    const scriptObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT') {
            const src = node.src || '';
            const adScripts = [
              'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
              'taboola.com', 'outbrain.com', 'amazon-adsystem.com'
            ];

            if (adScripts.some(pattern => src.includes(pattern))) {
              node.remove();
              console.log('[Mind-Link] Blocked ad script:', src);
            }
          }
        });
      });
    });

    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
