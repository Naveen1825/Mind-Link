// Cosmetic ad hiding: injects CSS to hide common ad containers
(function(){
  const STYLE_ID = 'notesio-cosmetic-style';

  function ensureCosmeticStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    // Safe, generic selectors. Intentionally conservative to avoid false positives.
    const selectors = [
      '.ad',
      '.ads',
      '.adsbox',
      '.ad-container',
      '.ad-slot',
      '.ad-banner',
      '.advertisement',
      '.sponsored',
      '.adsbygoogle',
      '[data-ad]',
      '[data-ads]',
      '[data-advertising]',
      '[aria-label="advertisement"]',
      '[id^="ad_"]',
      '[id^="ads_"]',
      '[id*="-ad-"]',
      '[id*="_ad_"]',
      '[class^="ad_"]',
      '[class^="ads_"]',
      '[class*="-ad-"]',
      '[class*="_ad_"]',
      '[class*="sponsor"]',
      '[id*="sponsor"]'
    ];
    style.textContent = `${selectors.join(',\n')} { display: none !important; visibility: hidden !important; }`;
    document.documentElement.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCosmeticStyles, { once: true });
  } else {
    ensureCosmeticStyles();
  }
})();
