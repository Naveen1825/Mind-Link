// Hidden Fee Detector with T&C Simplification  
// Three-stage pipeline: Summarizer → Rewriter → Prompt API
// NOW WITH: Manual trigger button + Enhanced page detection for ALL T&C and pricing pages
(function () {
    console.log('[Mind-Link Terms Analyzer] Initializing with manual trigger support...');

    // Skip on file:// URLs
    if (window.location.protocol === 'file:') {
        return;
    }

    // Cache analyzed terms to avoid re-analysis
    const analyzedTerms = new Set();
    const CACHE_KEY = 'mind-link-terms-cache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // Button states
    const BUTTON_STATES = {
        HIDDEN: 'hidden',
        READY: 'ready',
        ANALYZE: 'analyze',
        ANALYZING: 'analyzing',
        ERROR: 'error'
    };

    // Track current button instance
    let analysisButton = null;
    let currentButtonState = BUTTON_STATES.ANALYZE;
    let currentPageType = 'other';

    // Load cache from storage
    let termsCache = {};
    try {
        chrome.storage.local.get([CACHE_KEY], (result) => {
            if (result[CACHE_KEY]) {
                termsCache = result[CACHE_KEY];
                // Clean expired cache
                const now = Date.now();
                Object.keys(termsCache).forEach(key => {
                    if (now - termsCache[key].timestamp > CACHE_DURATION) {
                        delete termsCache[key];
                    }
                });
            }
        });
    } catch (error) {
        console.error('[Mind-Link Terms Analyzer] Cache load error:', error);
    }

    // Save cache to storage
    function saveCache() {
        try {
            chrome.storage.local.set({ [CACHE_KEY]: termsCache });
        } catch (error) {
            console.error('[Mind-Link Terms Analyzer] Cache save error:', error);
        }
    }

    // ========================================================================
    // FEATURE 1: Enhanced Page Type Detection (ALL T&C + Payment/Pricing Pages)
    // ========================================================================
    function detectPageType() {
        const pageText = document.body.innerText.toLowerCase();
        const title = document.title.toLowerCase();
        const url = window.location.href.toLowerCase();

        // T&C Detection Keywords
        const tcKeywords = [
            'terms of service', 'terms and conditions', 'user agreement',
            'privacy policy', 'acceptable use', 'service agreement',
            'license agreement', 'refund policy', 'cancellation policy',
            'end user license', 'eula', 'legal notice', 'disclaimer',
            'terms of use', 'subscriber agreement', 'membership agreement'
        ];

        // Payment/Subscription Detection Keywords  
        const paymentKeywords = [
            'pricing', 'plans', 'subscribe', 'subscription',
            'billing', 'payment', 'trial', 'free trial',
            'monthly', 'annually', 'per month', 'per year',
            'upgrade', 'premium', 'pro plan', 'choose a plan',
            'compare plans', 'pricing table', 'get started',
            'buy now', 'checkout', 'select plan'
        ];

        // Check for pricing tables/payment UI
        const hasPricingTable = document.querySelectorAll(
            '[class*="price"], [class*="plan"], [class*="pricing"], table'
        ).length > 2;

        // Check for payment forms
        const hasPaymentForm = document.querySelectorAll(
            'input[type="card"], input[name*="payment"], input[name*="card"]'
        ).length > 0;

        // Check for subscription buttons
        const hasSubscriptionButtons = document.querySelectorAll(
            'button[class*="subscribe"], a[class*="subscribe"], button[class*="upgrade"]'
        ).length > 0;

        // Calculate detection confidence
        let tcScore = 0;
        let paymentScore = 0;

        // Check URL
        tcKeywords.forEach(kw => {
            if (url.includes(kw.replace(/\s+/g, '-')) || url.includes(kw.replace(/\s+/g, ''))) {
                tcScore += 2;
            }
        });

        paymentKeywords.forEach(kw => {
            if (url.includes(kw)) {
                paymentScore += 2;
            }
        });

        // Check title
        tcKeywords.forEach(kw => {
            if (title.includes(kw)) {
                tcScore += 3;
            }
        });

        paymentKeywords.forEach(kw => {
            if (title.includes(kw)) {
                paymentScore += 3;
            }
        });

        // Check page text (sample first 5000 characters for performance)
        const sampleText = pageText.substring(0, 5000);

        tcKeywords.forEach(kw => {
            if (sampleText.includes(kw)) {
                tcScore += 1;
            }
        });

        paymentKeywords.forEach(kw => {
            if (sampleText.includes(kw)) {
                paymentScore += 1;
            }
        });

        // Add score for UI elements
        if (hasPricingTable) paymentScore += 4;
        if (hasPaymentForm) paymentScore += 5;
        if (hasSubscriptionButtons) paymentScore += 3;

        // Determine page type
        let pageType = 'other';
        let confidence = 1;

        if (tcScore >= 3) {
            pageType = 'terms';
            confidence = Math.min(5, Math.ceil(tcScore / 2));
        } else if (paymentScore >= 5) {
            pageType = 'payment';
            confidence = Math.min(5, Math.ceil(paymentScore / 3));
        }

        // Require substantial content (at least 500 words for T&C, 200 for payment)
        const wordCount = pageText.split(/\s+/).length;
        const minWords = pageType === 'terms' ? 500 : pageType === 'payment' ? 200 : 0;

        if (wordCount < minWords) {
            pageType = 'other';
            confidence = 1;
        }

        console.log('[Mind-Link Terms Analyzer] Page detection:', {
            type: pageType,
            confidence,
            tcScore,
            paymentScore,
            wordCount,
            hasPricingTable,
            hasPaymentForm,
            hasSubscriptionButtons
        });

        return { type: pageType, confidence };
    }

    // ========================================================================
    // FEATURE 2: Manual Trigger Button UI
    // ========================================================================
    function createAnalysisButton() {
        // Remove existing button if any
        if (analysisButton) {
            analysisButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'mind-link-tc-button';
        button.className = 'mind-link-analyze-btn';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483646;
            padding: 12px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        // Add hover effect
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });

        button.addEventListener('click', handleAnalysisClick);

        document.body.appendChild(button);
        analysisButton = button;

        return button;
    }

    // Update button state and appearance
    function updateButtonState(state) {
        if (!analysisButton) return;

        currentButtonState = state;

        const configs = {
            [BUTTON_STATES.READY]: {
                text: '📋 View T&C Analysis',
                tooltip: 'Analysis complete. Click to view findings.',
                disabled: false,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            },
            [BUTTON_STATES.ANALYZE]: {
                text: '� View T&C Analysis',
                tooltip: 'Click to analyze this page for hidden fees and privacy risks',
                disabled: false,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            },
            [BUTTON_STATES.ANALYZING]: {
                text: '⏳ Analyzing...',
                tooltip: 'Please wait, analyzing terms and conditions',
                disabled: true,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            },
            [BUTTON_STATES.ERROR]: {
                text: '❌ Not a T&C Page',
                tooltip: 'This page doesn\'t contain terms or pricing information',
                disabled: true,
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                boxShadow: '0 4px 15px rgba(107, 114, 128, 0.4)'
            },
            [BUTTON_STATES.HIDDEN]: {
                text: '',
                tooltip: '',
                disabled: true,
                background: 'transparent',
                boxShadow: 'none'
            }
        };

        const config = configs[state];

        analysisButton.textContent = config.text;
        analysisButton.title = config.tooltip;
        analysisButton.disabled = config.disabled;
        analysisButton.style.background = config.background;
        analysisButton.style.boxShadow = config.boxShadow;
        analysisButton.style.cursor = config.disabled ? 'not-allowed' : 'pointer';
        analysisButton.style.opacity = state === BUTTON_STATES.HIDDEN ? '0' : '1';
        analysisButton.style.pointerEvents = state === BUTTON_STATES.HIDDEN ? 'none' : 'auto';
    }

    // ========================================================================
    // FEATURE 3: Manual Analysis Handler
    // ========================================================================
    async function handleAnalysisClick() {
        console.log('[Mind-Link Terms Analyzer] Manual analysis triggered');

        const cacheKey = window.location.href;

        // Check if analysis already exists in cache
        if (termsCache[cacheKey]) {
            console.log('[Mind-Link Terms Analyzer] Showing cached analysis');
            const cached = termsCache[cacheKey];
            showAnalysisResults(
                cached.summary,
                cached.simplified,
                cached.findings,
                cached.severity,
                cached.pageType,
                cached.pricingFindings || [],
                cached.privacyFindings || []
            );
            return;
        }

        // No cache - need to analyze
        updateButtonState(BUTTON_STATES.ANALYZING);

        try {
            // Step 1: Verify page type
            const pageDetection = detectPageType();

            if (pageDetection.type === 'other') {
                console.log('[Mind-Link Terms Analyzer] Page is not T&C or payment page');
                updateButtonState(BUTTON_STATES.ERROR);

                // Show notification
                showNotification('❌ This doesn\'t appear to be a Terms & Conditions or pricing page', 'error');

                // Reset button after 5 seconds
                setTimeout(() => {
                    updateButtonState(BUTTON_STATES.ANALYZE);
                }, 5000);

                return;
            }

            console.log('[Mind-Link Terms Analyzer] Confirmed as', pageDetection.type, 'page. Starting analysis...');

            // Step 2: Extract page content
            const mainContent = document.querySelector('main, article, [role="main"], .content, #content') || document.body;
            const termsText = mainContent.textContent;

            // Step 3: Run three-stage analysis
            await analyzeTerms(termsText, window.location.href, pageDetection.type);

            // Step 4: Update button to show results are ready
            updateButtonState(BUTTON_STATES.READY);

        } catch (error) {
            console.error('[Mind-Link Terms Analyzer] Analysis failed:', error);
            updateButtonState(BUTTON_STATES.ANALYZE);
            showNotification('⚠️ Analysis failed: ' + error.message, 'error');
        }
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 350px;
            padding: 16px 20px;
            background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            z-index: 2147483647;
            animation: slideInNotification 0.3s ease-out;
        `;

        notification.innerHTML = `
            <style>
                @keyframes slideInNotification {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            ${message}
        `;

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInNotification 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Show analysis results - unified function for both cached and new analysis
    function showAnalysisResults(summary, simplified, findings, severity, pageType, pricingFindings = [], privacyFindings = []) {
        console.log('[Mind-Link Terms Analyzer] Showing analysis results');

        // Create and show warning banner (for high severity only)
        if (severity >= 3 && findings && findings.length > 0) {
            const banner = createWarningBanner(findings, severity, pageType);

            // Add details button handler
            const detailsBtn = document.getElementById('mind-link-terms-details');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => {
                    showDetailedAnalysis(summary, simplified, findings, severity, pageType, pricingFindings, privacyFindings);
                });
            }
        } else {
            // Low severity - directly show detailed modal
            showDetailedAnalysis(summary, simplified, findings, severity, pageType, pricingFindings, privacyFindings);
        }
    }

    // ========================================================================
    // UI Components (Updated to support pageType parameter)
    // ========================================================================
    function createWarningBanner(findings, severity, pageType = 'terms') {
        const bannerId = 'mind-link-terms-warning';

        // Remove existing banner if any
        const existing = document.getElementById(bannerId);
        if (existing) {
            existing.remove();
        }

        const banner = document.createElement('div');
        banner.id = bannerId;
        banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      background: ${severity >= 4 ? '#dc2626' : severity >= 3 ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease-out;
    `;

        const icon = severity >= 4 ? '🛑' : severity >= 3 ? '⚠️' : 'ℹ️';

        // Count pricing vs privacy findings
        const pricingCount = findings.filter(f => f.startsWith('💰')).length;
        const privacyCount = findings.filter(f => f.startsWith('🔒')).length;

        let title = '';
        if (pricingCount > 0 && privacyCount > 0) {
            // Both concerns detected
            title = severity >= 4 ? 'DANGER: Hidden Fees & Privacy Violations!' :
                severity >= 3 ? 'WARNING: Pricing & Privacy Concerns' :
                    'Notice: Terms & Privacy Analyzed';
        } else if (pricingCount > 0) {
            // Only pricing concerns
            if (pageType === 'payment') {
                title = severity >= 4 ? 'DANGER: Hidden Costs in Pricing!' :
                    severity >= 3 ? 'WARNING: Check Subscription Terms' :
                        'Notice: Pricing Analyzed';
            } else {
                title = severity >= 4 ? 'DANGER: Hidden Fees Detected!' :
                    severity >= 3 ? 'WARNING: Potential Hidden Costs' :
                        'Notice: Terms Analyzed';
            }
        } else if (privacyCount > 0) {
            // Only privacy concerns
            title = severity >= 4 ? 'DANGER: Privacy Violations Detected!' :
                severity >= 3 ? 'WARNING: Privacy Concerns Found' :
                    'Notice: Privacy Policy Analyzed';
        } else {
            // No specific concerns
            title = 'Notice: Terms Analyzed';
        }

        banner.innerHTML = `
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 24px; flex-shrink: 0;">${icon}</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${title}</div>
          <div style="font-size: 13px; line-height: 1.6;">
            ${findings.slice(0, 3).map(f => `• ${f}`).join('<br>')}
            ${findings.length > 3 ? '<br>• <i>+' + (findings.length - 3) + ' more findings...</i>' : ''}
          </div>
          <button id="mind-link-terms-details" style="
            margin-top: 12px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">View Full Analysis</button>
          <button id="mind-link-terms-close" style="
            margin-top: 12px;
            margin-left: 8px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          ">Dismiss</button>
        </div>
      </div>
    `;

        document.body.appendChild(banner);

        // Close button
        document.getElementById('mind-link-terms-close').addEventListener('click', () => {
            banner.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => banner.remove(), 300);
        });

        // Auto-dismiss after 15 seconds for low severity
        if (severity < 3) {
            setTimeout(() => {
                if (document.getElementById(bannerId)) {
                    banner.style.animation = 'slideIn 0.3s ease-out reverse';
                    setTimeout(() => banner.remove(), 300);
                }
            }, 15000);
        }

        return banner;
    }

    function showDetailedAnalysis(summary, simplified, findings, severity, pageType = 'terms', pricingFindings = [], privacyFindings = []) {
        const modalId = 'mind-link-terms-modal';

        // Remove existing modal if any
        const existing = document.getElementById(modalId);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

        const content = document.createElement('div');
        content.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 650px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    `;

        const icon = severity >= 4 ? '🛑' : severity >= 3 ? '⚠️' : 'ℹ️';
        const titleColor = severity >= 4 ? '#dc2626' : severity >= 3 ? '#f59e0b' : '#3b82f6';

        const modalTitle = pageType === 'payment' ? 'Pricing Analysis' : 'Terms Analysis';

        // Separate and shorten pricing and privacy findings
        const hasPricing = pricingFindings && pricingFindings.length > 0;
        const hasPrivacy = privacyFindings && privacyFindings.length > 0;

        const shortPricingFindings = (pricingFindings || []).map(f => {
            f = f.replace(/Auto-renewal clause:/gi, '').trim();
            f = f.replace(/Hidden fee after trial period:/gi, '').trim();
            f = f.replace(/Non-refundable charges:/gi, '').trim();
            f = f.replace(/^💰\s*/g, '').trim(); // Remove icon prefix
            f = f.split('.')[0].split(',')[0];
            if (f.length > 60) f = f.substring(0, 57) + '...';
            return f;
        }).slice(0, 4);

        const shortPrivacyFindings = (privacyFindings || []).map(f => {
            f = f.replace(/^🔒\s*/g, '').trim(); // Remove icon prefix
            f = f.split('.')[0].split(',')[0];
            if (f.length > 60) f = f.substring(0, 57) + '...';
            return f;
        }).slice(0, 4);

        // Fallback to combined findings if dual findings not available (backward compatibility)
        const shortFindings = findings.map(f => {
            f = f.replace(/Auto-renewal clause:/gi, '').trim();
            f = f.replace(/Hidden fee after trial period:/gi, '').trim();
            f = f.replace(/Non-refundable charges:/gi, '').trim();
            f = f.replace(/^[💰🔒]\s*/g, '').trim(); // Remove icon prefixes
            f = f.split('.')[0].split(',')[0];
            if (f.length > 60) f = f.substring(0, 57) + '...';
            return f;
        }).slice(0, 4);

        content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <span style="font-size: 32px;">${icon}</span>
        <h2 style="margin: 0; color: ${titleColor}; font-size: 22px;">${modalTitle}</h2>
      </div>

      <div style="border-bottom: 2px solid #e5e7eb; margin-bottom: 16px;">
        <button class="tab-btn active" data-tab="risks" style="
          background: none; border: none; padding: 10px 16px; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #6b7280;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
        ">⚠️ Key Risks</button>
        <button class="tab-btn" data-tab="simple" style="
          background: none; border: none; padding: 10px 16px; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #6b7280;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
        ">📝 In Plain English</button>
        <button class="tab-btn" data-tab="summary" style="
          background: none; border: none; padding: 10px 16px; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #6b7280;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
        ">🔍 How It Works</button>
      </div>

      <div class="tab-content" data-tab="risks" style="display: block;">
        ${hasPricing ? `
        <div style="background: ${severity >= 4 ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${titleColor}; padding: 16px 18px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: ${severity >= 4 ? '#991b1b' : '#92400e'}; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>💰</span> ${pageType === 'payment' ? 'Pricing Concerns:' : 'Hidden Fees & Traps:'}
          </h3>
          <div style="color: ${severity >= 4 ? '#7f1d1d' : '#78350f'}; line-height: 1.8; font-size: 14px; max-height: 200px; overflow-y: auto;">
            ${shortPricingFindings.map(f => `• ${f}`).join('<br>')}
          </div>
        </div>
        ` : ''}
        
        ${hasPrivacy ? `
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 18px; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>🔒</span> Privacy & Data Concerns:
          </h3>
          <div style="color: #7f1d1d; line-height: 1.8; font-size: 14px; max-height: 200px; overflow-y: auto;">
            ${shortPrivacyFindings.map(f => `• ${f}`).join('<br>')}
          </div>
        </div>
        ` : ''}
        
        ${!hasPricing && !hasPrivacy ? `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 18px; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #15803d; font-size: 15px; font-weight: 600;">No Major Concerns:</h3>
          <div style="color: #166534; line-height: 1.8; font-size: 14px;">
            ${shortFindings.length > 0 ? shortFindings.map(f => `• ${f}`).join('<br>') : '• Terms appear reasonable'}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="tab-content" data-tab="simple" style="display: none;">
        <div style="background: #ecfdf5; padding: 16px 18px; border-radius: 8px; border: 1px solid #a7f3d0; max-height: 300px; overflow-y: auto;">
          <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">Simplified:</h3>
          <div style="color: #065f46; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">
            ${simplified.replace(/##/g, '').replace(/\*\*/g, '').trim()}
          </div>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #a7f3d0; font-size: 12px; color: #047857;">
            ✨ Rewriter API - Simplified for easy understanding
          </div>
        </div>
      </div>

      <div class="tab-content" data-tab="summary" style="display: none;">
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
          <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-align: center;">
            🤖 3-Stage AI Pipeline
          </h3>
          <div style="background: white; padding: 14px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #fbbf24;">
            <strong>📝 Stage 1: Summarizer API</strong><br>
            <span style="font-size: 13px; color: #4b5563;">Condensed ${pageType === 'payment' ? 'pricing page' : 'T&C'} to ~200 words</span>
          </div>
          <div style="background: white; padding: 14px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #34d399;">
            <strong>✍️ Stage 2: Rewriter API</strong><br>
            <span style="font-size: 13px; color: #4b5563;">Simplified legal jargon to plain language</span>
          </div>
          <div style="background: white; padding: 14px; border-radius: 6px; border-left: 3px solid #f87171;">
            <strong>🔍 Stage 3: Prompt API</strong><br>
            <span style="font-size: 13px; color: #4b5563;">Detected hidden fees, auto-renewals, and privacy violations</span>
          </div>
        </div>
      </div>

      <button id="mind-link-terms-modal-close" style="
        width: 100%; background: ${titleColor}; color: white;
        border: none; padding: 12px; border-radius: 8px;
        cursor: pointer; font-size: 15px; font-weight: 600; margin-top: 20px;
      ">Got It</button>
    `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Tab switching
        const tabBtns = content.querySelectorAll('.tab-btn');
        const tabContents = content.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                tabBtns.forEach(b => {
                    b.style.color = '#6b7280';
                    b.style.borderBottom = '2px solid transparent';
                });
                btn.style.color = titleColor;
                btn.style.borderBottom = `2px solid ${titleColor}`;
                tabContents.forEach(c => c.style.display = 'none');
                content.querySelector(`[data-tab="${targetTab}"].tab-content`).style.display = 'block';
            });
        });

        // Set active styling
        content.querySelector('.tab-btn.active').style.color = titleColor;
        content.querySelector('.tab-btn.active').style.borderBottom = `2px solid ${titleColor}`;

        // Close handlers
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };

        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s';
        setTimeout(() => modal.style.opacity = '1', 10);

        document.getElementById('mind-link-terms-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    // ========================================================================
    // FEATURE 4: Three-Stage Analysis (Updated to accept pageType)
    // ========================================================================
    function cleanTermsText(rawText) {
        let cleaned = rawText.replace(/\s+/g, ' ').trim();

        const noisyPatterns = [
            /Cookie (Preferences|Settings|Policy)/gi,
            /Accept (All )?Cookies/gi,
            /Sign In|Log In|Sign Up|Register/gi,
            /Copyright © \d{4}/gi
        ];

        noisyPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });

        if (cleaned.length > 50000) {
            const sentences = cleaned.split(/[.!?]+/);
            const relevantSentences = sentences.filter(sentence => {
                const lower = sentence.toLowerCase();
                return lower.includes('price') || lower.includes('payment') ||
                    lower.includes('subscription') || lower.includes('fee') ||
                    lower.includes('renew') || lower.includes('cancel') ||
                    lower.includes('refund') || lower.includes('charge');
            });

            cleaned = relevantSentences.length > 0
                ? relevantSentences.join('. ') + '.'
                : cleaned.substring(0, 50000);
        }

        return cleaned;
    }

    async function analyzeTerms(termsText, sourceUrl, pageType = 'terms') {
        console.log('[Mind-Link Terms Analyzer] Starting analysis for', pageType, 'page...');

        try {
            const cleanedText = cleanTermsText(termsText);

            // Check cache first
            const cacheKey = sourceUrl || window.location.href;
            if (termsCache[cacheKey]) {
                console.log('[Mind-Link Terms Analyzer] Using cached analysis');
                const cached = termsCache[cacheKey];
                showAnalysisResults(
                    cached.summary,
                    cached.simplified,
                    cached.findings,
                    cached.severity,
                    cached.pageType,
                    cached.pricingFindings || [],
                    cached.privacyFindings || []
                );
                return;
            }

            // Stage 1: Summarize
            console.log('[Mind-Link Terms Analyzer] Stage 1: Summarizing...');
            let summary;
            try {
                summary = await window.__notesio_api.summarizeText(cleanedText, {
                    type: 'tldr',
                    format: 'plain-text',
                    length: 'short'
                });
                console.log('[Mind-Link Terms Analyzer] Stage 1 complete');
            } catch (summaryError) {
                console.error('[Mind-Link Terms Analyzer] Stage 1 failed:', summaryError);
                throw new Error(`Failed to summarize text: ${summaryError.message}. The document may be too large or complex.`);
            }

            // Stage 2: Simplify
            console.log('[Mind-Link Terms Analyzer] Stage 2: Simplifying...');
            let simplified;
            try {
                simplified = await window.__notesio_api.rewriteText(summary, {
                    tone: 'more-casual',
                    format: 'plain-text',
                    length: 'as-is',
                    sharedContext: pageType === 'payment' ? 'Pricing and subscription page' : 'Terms and conditions',
                    context: 'Rewrite in simple language for elderly users. Focus on costs and commitments.'
                });
                console.log('[Mind-Link Terms Analyzer] Stage 2 complete');
            } catch (rewriteError) {
                console.warn('[Mind-Link Terms Analyzer] Stage 2 failed, using summary as-is:', rewriteError);
                // Fallback: use the summary directly if rewriter fails
                simplified = summary;
            }

            // Stage 3: Analyze with Prompt API (DUAL ANALYSIS: Pricing + Privacy)
            console.log('[Mind-Link Terms Analyzer] Stage 3: Analyzing for pricing AND privacy concerns...');
            const prompt = `You are analyzing ${pageType === 'payment' ? 'pricing information' : 'terms of service'} to protect elderly users from hidden fees AND privacy violations.

TEXT TO ANALYZE:
"${simplified}"

TASK:
Extract SPECIFIC, ACTIONABLE findings in TWO CATEGORIES:
1. PRICING/FINANCIAL concerns (hidden fees, auto-renewals, cancellation issues)
2. PRIVACY/DATA concerns (data collection, sharing, tracking, security)

REQUIRED FORMAT (return ONLY valid JSON):
{
  "pricingFindings": ["pricing issue 1", "pricing issue 2", ...],
  "privacyFindings": ["privacy issue 1", "privacy issue 2", ...],
  "pricingSeverity": 1-5,
  "privacySeverity": 1-5,
  "overallSeverity": 1-5
}

SEVERITY LEVELS:
1 = No issues found
2 = Minor concerns (standard practices)
3 = Moderate concerns (some red flags)
4 = Significant concerns (multiple red flags)
5 = Critical concerns (predatory/dangerous practices)

PRICING FINDINGS - Focus on:
- Auto-renewals with specific amounts (e.g., "$99.99/month after trial")
- Hidden fees, early termination fees
- Non-refundable charges
- Difficult cancellation requirements
- Price increase clauses
Max 60 chars per finding. Include dollar amounts when mentioned.

PRIVACY FINDINGS - Focus on:
- Data collection (what personal info they collect)
- Third-party sharing (who gets your data)
- Data selling/monetization
- Location/browsing tracking
- No option to delete data
- Excessive permissions
- Weak security measures
- International data transfers
Max 60 chars per finding. Be specific about what data.

EXAMPLES:
✅ PRICING: "$1 trial auto-renews at $99.99/month"
✅ PRIVACY: "Shares data with 50+ advertising partners"
✅ PRIVACY: "Sells browsing history to third parties"
✅ PRIVACY: "Tracks location even when app closed"
❌ BAD: "Has terms and conditions" (too generic)

IMPORTANT:
- If no pricing issues found, return empty array for pricingFindings
- If no privacy issues found, return empty array for privacyFindings
- Be SPECIFIC - mention exact data types, number of partners, etc.
- Overall severity = highest of the two categories

Analyze now:`;

            const analysisResult = await window.__notesio_api.callChromeAI(prompt);

            // Parse JSON
            let analysis;
            try {
                let cleanResult = analysisResult.trim();
                if (cleanResult.startsWith('```')) {
                    cleanResult = cleanResult.replace(/```json\s*|\s*```/g, '').trim();
                }
                analysis = JSON.parse(cleanResult);

                // Ensure all required fields exist
                analysis.pricingFindings = analysis.pricingFindings || [];
                analysis.privacyFindings = analysis.privacyFindings || [];
                analysis.pricingSeverity = analysis.pricingSeverity || 1;
                analysis.privacySeverity = analysis.privacySeverity || 1;
                analysis.overallSeverity = analysis.overallSeverity || Math.max(analysis.pricingSeverity, analysis.privacySeverity);

            } catch (parseError) {
                console.error('[Mind-Link Terms Analyzer] JSON parse error:', parseError);
                analysis = {
                    pricingFindings: ['Unable to fully parse analysis'],
                    privacyFindings: ['Review terms carefully for privacy details'],
                    pricingSeverity: 3,
                    privacySeverity: 3,
                    overallSeverity: 3
                };
            }

            // Post-process findings
            const processFindings = (findings) => {
                if (!findings || findings.length === 0) return [];
                return findings.map(f => {
                    f = f.replace(/^(Auto-?renewal clause|Hidden fee|Non-refundable|Data collection|Privacy concern):\s*/i, '');
                    if (f.length > 60) f = f.substring(0, 57) + '...';
                    return f;
                }).filter(f => f.length > 0);
            };

            analysis.pricingFindings = processFindings(analysis.pricingFindings);
            analysis.privacyFindings = processFindings(analysis.privacyFindings);

            // Combine for backward compatibility with UI
            const allFindings = [
                ...analysis.pricingFindings.map(f => `💰 ${f}`),
                ...analysis.privacyFindings.map(f => `🔒 ${f}`)
            ];

            console.log('[Mind-Link Terms Analyzer] Analysis complete:', {
                pricing: analysis.pricingFindings.length,
                privacy: analysis.privacyFindings.length,
                overallSeverity: analysis.overallSeverity
            });

            // Cache results (NOW INCLUDING DUAL ANALYSIS)
            termsCache[cacheKey] = {
                timestamp: Date.now(),
                summary,
                simplified,
                findings: allFindings,
                pricingFindings: analysis.pricingFindings,
                privacyFindings: analysis.privacyFindings,
                severity: analysis.overallSeverity,
                pricingSeverity: analysis.pricingSeverity,
                privacySeverity: analysis.privacySeverity,
                pageType: pageType  // ⭐ Store page type in cache
            };
            saveCache();

            // Show results
            showAnalysisResults(
                summary,
                simplified,
                allFindings,
                analysis.overallSeverity,
                pageType,
                analysis.pricingFindings,
                analysis.privacyFindings
            );

        } catch (error) {
            console.error('[Mind-Link Terms Analyzer] Analysis error:', error);
            showNotification('⚠️ Analysis failed: ' + error.message, 'error');
        }
    }

    // ========================================================================
    // FEATURE 5: Initialization with Automatic Background Detection
    // ========================================================================
    function initialize() {
        console.log('[Mind-Link Terms Analyzer] Initializing...');

        // Always create the button
        createAnalysisButton();

        // Detect page type
        const pageDetection = detectPageType();
        currentPageType = pageDetection.type;

        console.log('[Mind-Link Terms Analyzer] Current page type:', currentPageType);

        // Check if already cached
        const cacheKey = window.location.href;
        if (termsCache[cacheKey]) {
            console.log('[Mind-Link Terms Analyzer] Found cached analysis');
            updateButtonState(BUTTON_STATES.READY);
            return;
        }

        // Run automatic analysis if T&C or payment page detected
        if (currentPageType !== 'other' && pageDetection.confidence >= 3) {
            console.log('[Mind-Link Terms Analyzer] Auto-analyzing', currentPageType, 'page...');

            // Run analysis in background
            const mainContent = document.querySelector('main, article, [role="main"], .content, #content') || document.body;
            const termsText = mainContent.textContent;

            // Mark as analyzing
            analyzedTerms.add(window.location.href);

            // Run analysis (will cache results)
            analyzeTerms(termsText, window.location.href, currentPageType).then(() => {
                // Update button to show results are ready
                updateButtonState(BUTTON_STATES.READY);
            }).catch(error => {
                console.error('[Mind-Link Terms Analyzer] Auto-analysis failed:', error);
                updateButtonState(BUTTON_STATES.ANALYZE);
            });
        } else {
            // Not a T&C/payment page, keep button in default state
            updateButtonState(BUTTON_STATES.ANALYZE);
        }
    }

    // Start initialization when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    console.log('[Mind-Link Terms Analyzer] Initialization complete');
})();
