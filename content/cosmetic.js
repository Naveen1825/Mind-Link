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
    const style = document.createElement('style');
    style.id = STYLE_ID;
    // Bulletproof selectors - catches ALL common ad patterns
    const selectors = [
      // Generic ad classes
      '.ad', '.ads', '.adsbox', '.ad-container', '.ad-slot', '.ad-banner',
      '.ad-wrapper', '.ad-frame', '.ad-content', '.ad-block', '.ad-space',
      '.advertisement', '.advertising', '.advert', '.adverts',
      '.sponsored', '.sponsor', '.sponsorship', '.sponsor-content',
      '.adsbygoogle', '.google-ad', '.google-ads',

      // Specific ad networks
      '.doubleclick', '.taboola', '.outbrain', '.mgid', '.revcontent',
      '.zergnet', '.adblade', '.content-ad', '.native-ad',

      // Social tracking/ads
      '.fb-ad', '.twitter-ad', '.instagram-ad', '.tiktok-ad',

      // Video ads
      '.video-ad', '.preroll-ad', '.midroll-ad', '.overlay-ad',
      '.player-ad', '.ad-overlay',

      // Banner patterns
      '.banner', '.top-banner', '.bottom-banner', '.side-banner',
      '.header-ad', '.footer-ad', '.sidebar-ad',

      // Mobile patterns
      '.mobile-ad', '.app-ad', '.interstitial',

      // Data attributes
      '[data-ad]', '[data-ads]', '[data-advertising]', '[data-ad-slot]',
      '[data-google-query-id]', '[data-ad-client]',
      '[aria-label="advertisement"]', '[aria-label="sponsored"]',

      // ID patterns (more aggressive)
      '[id^="ad_"]', '[id^="ads_"]', '[id^="ad-"]', '[id^="ads-"]',
      '[id*="-ad-"]', '[id*="_ad_"]', '[id*="google_ads"]',
      '[id*="sponsor"]', '[id*="banner"]',

      // Class patterns (more aggressive)
      '[class^="ad_"]', '[class^="ads_"]', '[class^="ad-"]', '[class^="ads-"]',
      '[class*="-ad-"]', '[class*="_ad_"]', '[class*="-ads-"]', '[class*="_ads_"]',
      '[class*="sponsor"]', '[class*="banner"]', '[class*="promo"]',
      '[class*="advertising"]', '[class*="advert"]',

      // Tracking pixels
      'img[width="1"][height="1"]', 'img[style*="width: 1px"]',
      'iframe[width="1"][height="1"]',

      // Known ad sizes (IAB standard sizes)
      'iframe[width="300"][height="250"]', // Medium Rectangle
      'iframe[width="728"][height="90"]',  // Leaderboard
      'iframe[width="160"][height="600"]', // Wide Skyscraper
      'iframe[width="300"][height="600"]', // Half Page
      'iframe[width="970"][height="250"]', // Billboard
      'iframe[width="320"][height="50"]',  // Mobile Banner

      // Additional suspicious patterns
      '[class*="monetization"]', '[class*="native-ad"]',
      '[class*="promoted"]', '[class*="paid-content"]',
      'a[href*="doubleclick.net"]', 'a[href*="googlesyndication.com"]',
      'a[href*="/ad?"]', 'a[href*="/ads?"]'
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

  // Observe for dynamically added ads (bulletproof detection)
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      // Comprehensive selector list for dynamic ads
      const dynamicAdSelectors = [
        '.ad', '.ads', '.advertisement', '.sponsored', '.adsbygoogle',
        '.banner', '.promo', '.native-ad', '.content-ad', '.video-ad',
        '[data-ad]', '[data-ads]', '[id*="ad-"]', '[class*="ad-"]',
        '[class*="sponsor"]', '[class*="banner"]', 'iframe[width="300"][height="250"]',
        'iframe[width="728"][height="90"]', '.taboola', '.outbrain'
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

      // Also remove any iframes that load ad scripts
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          const src = iframe.src || '';
          const adPatterns = [
            'doubleclick', 'googlesyndication', 'adservice', 'ads.', '/ads/',
            'googleadservices', 'adnxs', 'taboola', 'outbrain', 'amazon-adsystem'
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

  // Block script tags that inject ads
  if (typeof MutationObserver !== 'undefined') {
    const scriptObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT') {
            const src = node.src || '';
            const adScripts = [
              'doubleclick', 'googlesyndication', 'adsbygoogle', 'googleadservices',
              'adservice', '/ads.js', '/ad.js', 'taboola', 'outbrain'
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
