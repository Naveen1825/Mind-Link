// Hidden Fee Detector with T&C Simplification
// Three-stage pipeline: Summarizer → Rewriter → Prompt API
(function () {
  console.log('[Mind-Link Terms Analyzer] Initializing...');

  // Skip on file:// URLs
  if (window.location.protocol === 'file:') {
    return;
  }

  // Cache analyzed terms to avoid re-analysis
  const analyzedTerms = new Set();
  const CACHE_KEY = 'mind-link-terms-cache';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

  // Create warning UI
  function createWarningBanner(findings, severity) {
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
    const title = severity >= 4 ? 'DANGER: Hidden Fees Detected!' : severity >= 3 ? 'WARNING: Potential Hidden Costs' : 'Notice: Terms Analyzed';

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
            ${findings.map(f => `• ${f}`).join('<br>')}
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

  // Create detailed analysis modal
  function showDetailedAnalysis(summary, simplified, findings, severity) {
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

    // Shorten findings to max 5 words each
    const shortFindings = findings.map(f => {
      // Simplify common patterns
      f = f.replace(/Auto-renewal clause:/gi, '').trim();
      f = f.replace(/Hidden fee after trial period:/gi, '').trim();
      f = f.replace(/Non-refundable charges:/gi, '').trim();
      f = f.replace(/Automatic credit card charges:/gi, '').trim();
      f = f.replace(/Difficult cancellation requirements:/gi, '').trim();
      f = f.replace(/Early termination fees:/gi, '').trim();
      f = f.replace(/Price increases without notice:/gi, '').trim();
      
      // Take first sentence only
      f = f.split('.')[0].split(',')[0];
      
      // Limit to ~60 characters
      if (f.length > 60) {
        f = f.substring(0, 57) + '...';
      }
      
      return f;
    }).slice(0, 4); // Max 4 findings

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <span style="font-size: 32px;">${icon}</span>
        <h2 style="margin: 0; color: ${titleColor}; font-size: 22px;">Terms Analysis</h2>
      </div>

      <!-- Tabs -->
      <div style="border-bottom: 2px solid #e5e7eb; margin-bottom: 16px;">
        <button class="tab-btn active" data-tab="risks" style="
          background: none;
          border: none;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
        ">⚠️ Key Risks</button>
        <button class="tab-btn" data-tab="simple" style="
          background: none;
          border: none;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
        ">📝 In Plain English</button>
        <button class="tab-btn" data-tab="summary" style="
          background: none;
          border: none;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
        ">� How It Works</button>
      </div>

      <!-- Tab 1: Key Risks (Findings Only) -->
      <div class="tab-content" data-tab="risks" style="display: block;">
        <div style="background: ${severity >= 4 ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${titleColor}; padding: 16px 18px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
          <h3 style="margin: 0 0 12px 0; color: ${severity >= 4 ? '#991b1b' : '#92400e'}; font-size: 15px; font-weight: 600;">
            ${shortFindings.length > 0 ? 'Hidden Fees & Traps Detected:' : 'Key Points:'}
          </h3>
          <div style="color: ${severity >= 4 ? '#7f1d1d' : '#78350f'}; line-height: 1.8; font-size: 14px;">
            ${shortFindings.length > 0 
              ? shortFindings.map(f => `• ${f}`).join('<br>') 
              : '• No specific hidden fees detected<br>• Review full terms for details<br>• Check "In Plain English" for explanation'}
          </div>
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid ${severity >= 4 ? '#fecaca' : '#fde68a'}; font-size: 13px; color: ${severity >= 4 ? '#991b1b' : '#92400e'}; font-style: italic;">
            💡 Tip: Click "In Plain English" to understand what this means
          </div>
        </div>
      </div>

      <!-- Tab 2: In Plain English (Rewriter Output) -->
      <div class="tab-content" data-tab="simple" style="display: none;">
        <div style="background: #ecfdf5; padding: 16px 18px; border-radius: 8px; border: 1px solid #a7f3d0; max-height: 300px; overflow-y: auto;">
          <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">Simplified Explanation:</h3>
          <div style="color: #065f46; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">
            ${simplified.replace(/##/g, '').replace(/\*\*/g, '').trim()}
          </div>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #a7f3d0; font-size: 12px; color: #047857;">
            ✨ Powered by Rewriter API - Simplified from legal jargon
          </div>
        </div>
      </div>

      <!-- Tab 3: How It Works (Educational) -->
      <div class="tab-content" data-tab="summary" style="display: none;">
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-align: center;">
            🤖 3-Stage AI Analysis Pipeline
          </h3>
          
          <div style="background: white; padding: 14px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #fbbf24; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 24px;">📝</span>
              <strong style="font-size: 15px; color: #1f2937;">Stage 1: Summarizer API</strong>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #4b5563;">
              Condensed the full Terms & Conditions from thousands of words down to ~200 words, extracting only the essential points.
            </div>
          </div>
          
          <div style="background: white; padding: 14px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #34d399; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 24px;">✍️</span>
              <strong style="font-size: 15px; color: #1f2937;">Stage 2: Rewriter API</strong>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #4b5563;">
              Simplified complex legal jargon into plain, easy-to-understand language that anyone can read without confusion.
            </div>
          </div>
          
          <div style="background: white; padding: 14px; border-radius: 6px; margin-bottom: 14px; border-left: 3px solid #f87171; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 24px;">🔍</span>
              <strong style="font-size: 15px; color: #1f2937;">Stage 3: Prompt API</strong>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #4b5563;">
              Analyzed the simplified text to detect hidden fees, auto-renewal traps, non-refundable charges, and other red flags.
            </div>
          </div>
          
          <div style="background: #eff6ff; padding: 12px 14px; border-radius: 6px; font-size: 12px; line-height: 1.6; border: 1px solid #bfdbfe;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 18px;">🔒</span>
              <strong style="font-size: 13px; color: #1e40af;">Privacy First</strong>
            </div>
            <div style="color: #1e40af;">
              All AI processing happens on your device using Chrome's Built-in AI (Gemini Nano). No data is sent to external servers or stored in the cloud.
            </div>
          </div>
        </div>
      </div>

      <button id="mind-link-terms-modal-close" style="
        width: 100%;
        background: ${titleColor};
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        margin-top: 20px;
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
        
        // Update buttons
        tabBtns.forEach(b => {
          b.style.color = '#6b7280';
          b.style.borderBottom = '2px solid transparent';
          b.classList.remove('active');
        });
        btn.style.color = titleColor;
        btn.style.borderBottom = `2px solid ${titleColor}`;
        btn.classList.add('active');
        
        // Update content
        tabContents.forEach(c => {
          c.style.display = 'none';
        });
        content.querySelector(`[data-tab="${targetTab}"].tab-content`).style.display = 'block';
      });
    });

    // Set active tab styling
    const activeBtn = content.querySelector('.tab-btn.active');
    if (activeBtn) {
      activeBtn.style.color = titleColor;
      activeBtn.style.borderBottom = `2px solid ${titleColor}`;
    }

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
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Helper: Clean and extract only T&C content
  function cleanTermsText(rawText) {
    console.log('[Mind-Link Terms Analyzer] Cleaning text. Original length:', rawText.length);
    
    // Remove excessive whitespace
    let cleaned = rawText.replace(/\s+/g, ' ').trim();
    
    // Remove common navigation/footer patterns
    const noisyPatterns = [
      /Cookie (Preferences|Settings|Policy)/gi,
      /Accept (All )?Cookies/gi,
      /Privacy (Settings|Preferences)/gi,
      /Sign In|Log In|Sign Up|Register/gi,
      /Follow Us On|Connect With Us/gi,
      /Copyright © \d{4}/gi,
      /All Rights Reserved/gi,
      /Back to Top/gi,
      /Skip to (Main )?Content/gi,
      /Toggle Navigation/gi,
      /Search for:/gi,
      /Language:/gi,
      /Select (Your )?Country/gi
    ];
    
    noisyPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // If text is extremely long (>50k chars), extract key sections
    if (cleaned.length > 50000) {
      console.log('[Mind-Link Terms Analyzer] Text very large, extracting key sections...');
      
      // Look for sections with pricing/payment/subscription keywords
      const sentences = cleaned.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('price') || lower.includes('payment') || 
               lower.includes('subscription') || lower.includes('fee') ||
               lower.includes('renew') || lower.includes('cancel') ||
               lower.includes('refund') || lower.includes('charge') ||
               lower.includes('trial') || lower.includes('billing') ||
               lower.includes('terminate') || lower.includes('agreement');
      });
      
      if (relevantSentences.length > 0) {
        cleaned = relevantSentences.join('. ') + '.';
        console.log('[Mind-Link Terms Analyzer] Extracted', relevantSentences.length, 'relevant sentences');
      } else {
        // Fallback: Take first 50k characters
        cleaned = cleaned.substring(0, 50000);
      }
    }
    
    console.log('[Mind-Link Terms Analyzer] Cleaned text length:', cleaned.length);
    return cleaned;
  }

  // Three-stage pipeline: Summarizer → Rewriter → Prompt
  async function analyzeTerms(termsText, sourceUrl) {
    console.log('[Mind-Link Terms Analyzer] Starting three-stage analysis...');
    
    try {
      // Clean the text first to remove noise
      const cleanedText = cleanTermsText(termsText);
      
      // Check cache first
      const cacheKey = sourceUrl || window.location.href;
      if (termsCache[cacheKey]) {
        console.log('[Mind-Link Terms Analyzer] Using cached analysis');
        const cached = termsCache[cacheKey];
        const banner = createWarningBanner(cached.findings, cached.severity);
        
        // Add details button handler
        document.getElementById('mind-link-terms-details').addEventListener('click', () => {
          showDetailedAnalysis(cached.summary, cached.simplified, cached.findings, cached.severity);
        });
        
        return;
      }

      // Stage 1: Condense with Summarizer API (5000 words → ~200 words)
      console.log('[Mind-Link Terms Analyzer] Stage 1: Condensing T&C with Summarizer API...');
      
      const summary = await window.__notesio_api.summarizeText(cleanedText, {
        type: 'tldr',
        format: 'plain-text',
        length: 'short'
      });
      
      console.log('[Mind-Link Terms Analyzer] Stage 1 complete. Summary length:', summary.length);

      // Stage 2: Simplify with Rewriter API
      console.log('[Mind-Link Terms Analyzer] Stage 2: Simplifying with Rewriter API...');
      
      const simplified = await window.__notesio_api.rewriteText(summary, {
        tone: 'more-casual',
        format: 'plain-text',
        length: 'as-is',
        sharedContext: 'Terms and conditions for a subscription service',
        context: 'Rewrite in simple language that elderly users can understand. Focus on costs and commitments.'
      });
      
      console.log('[Mind-Link Terms Analyzer] Stage 2 complete. Simplified length:', simplified.length);

      // Stage 3: Detect hidden fees with Prompt API
      console.log('[Mind-Link Terms Analyzer] Stage 3: Detecting hidden fees with Prompt API...');
      
      const prompt = `You are analyzing terms of service to protect users from hidden fees and subscription traps.

TEXT TO ANALYZE:
"${simplified}"

TASK:
Extract SPECIFIC, ACTIONABLE findings about costs, fees, and restrictions.

REQUIRED FORMAT:
Return ONLY valid JSON (no markdown, no explanations):
{
  "hasHiddenFees": true or false,
  "severity": 1-5,
  "findings": ["Finding 1", "Finding 2", ...]
}

SEVERITY LEVELS:
1 = No issues found
2 = Minor restrictions
3 = Moderate concerns (cancellation rules, product limitations)
4 = Significant concerns (hidden fees, auto-renewals)
5 = Critical (predatory pricing, trap subscriptions)

FINDING RULES:
1. Be ultra-specific: Include exact dollar amounts if mentioned (e.g., "$99.99/month")
2. Max 60 characters per finding
3. Focus on: pricing, auto-renewals, cancellation rules, non-refundable fees, early termination charges
4. Avoid generic statements like "subscription-based" or "rules may vary"
5. If no specific fees found, list key restrictions instead (e.g., "Must cancel 7 days before renewal")

EXAMPLES:
✅ GOOD: "$1 trial renews at $99.99/month"
✅ GOOD: "Non-refundable after activation"
✅ GOOD: "$600 early termination fee"
❌ BAD: "Subscription-based service"
❌ BAD: "Product-specific rules may vary"

Now analyze the text above and extract findings:`;

      const analysisResult = await window.__notesio_api.callChromeAI(prompt);
      
      console.log('[Mind-Link Terms Analyzer] Stage 3 complete. Raw result:', analysisResult);

      // Parse JSON response
      let analysis;
      try {
        // Remove markdown code blocks if present
        let cleanResult = analysisResult.trim();
        if (cleanResult.startsWith('```')) {
          cleanResult = cleanResult.replace(/```json\s*|\s*```/g, '').trim();
        }
        
        analysis = JSON.parse(cleanResult);
      } catch (parseError) {
        console.error('[Mind-Link Terms Analyzer] JSON parse error:', parseError);
        // Fallback: manual parsing
        analysis = {
          hasHiddenFees: analysisResult.toLowerCase().includes('true'),
          severity: 3,
          findings: ['Unable to fully parse analysis. Please review terms carefully.']
        };
      }

      // POST-PROCESSING: Clean up and improve findings quality
      console.log('[Mind-Link Terms Analyzer] Post-processing findings...');
      
      if (analysis.findings && analysis.findings.length > 0) {
        analysis.findings = analysis.findings.map(finding => {
          let cleaned = finding.trim();
          
          // Fix incomplete dollar amounts (e.g., "$99" → "$99.99/month")
          if (cleaned.includes('$') && !cleaned.includes('/month') && !cleaned.includes('/year')) {
            // Try to extract full amount from summary
            const monthlyMatch = simplified.match(/\$\d+\.?\d*\s*(?:per\s+month|\/month|monthly)/i);
            const yearlyMatch = simplified.match(/\$\d+\.?\d*\s*(?:per\s+year|\/year|yearly|annually)/i);
            
            if (monthlyMatch) {
              const amount = monthlyMatch[0].match(/\$[\d.]+/)[0];
              cleaned = cleaned.replace(/\$\d+/, amount + '/month');
            } else if (yearlyMatch) {
              const amount = yearlyMatch[0].match(/\$[\d.]+/)[0];
              cleaned = cleaned.replace(/\$\d+/, amount + '/year');
            }
          }
          
          // Remove redundant category prefixes
          cleaned = cleaned.replace(/^(Auto-?renewal clause|Hidden fee|Non-refundable charges?|Automatic credit card charges?|Early termination fees?|Difficult cancellation|Price increases?):\s*/i, '');
          
          // Shorten overly verbose findings
          if (cleaned.toLowerCase().includes('subscription automatically renews')) {
            // Extract key info: price and timing
            const priceMatch = cleaned.match(/\$[\d.]+(?:\/month|\/year)?/);
            const daysMatch = cleaned.match(/\d+\s+(?:days?|business days?)/i);
            
            if (priceMatch && daysMatch) {
              cleaned = `Auto-renews at ${priceMatch[0]} after trial`;
            } else if (priceMatch) {
              cleaned = `Auto-renews at ${priceMatch[0]}`;
            } else {
              cleaned = 'Auto-renewal after trial period';
            }
          }
          
          // Clean up common verbose patterns
          if (cleaned.toLowerCase().includes('explicitly states no refunds')) {
            cleaned = 'Non-refundable after activation';
          }
          
          if (cleaned.toLowerCase().includes('implied due to auto-renewal')) {
            cleaned = 'Charges continue until canceled';
          }
          
          // Enforce 60 character limit
          if (cleaned.length > 60) {
            cleaned = cleaned.substring(0, 57) + '...';
          }
          
          return cleaned;
        });
      }

      // Smart fallback for generic/unhelpful findings
      const hasGenericFindings = analysis.findings.some(f => 
        f.toLowerCase().includes('subscription-based') ||
        f.toLowerCase().includes('may vary') ||
        f.toLowerCase().includes('product-specific') ||
        f.toLowerCase().includes('ongoing recurring fees') ||
        f.toLowerCase().includes('rules may') ||
        f.toLowerCase().includes('company email accounts')
      );
      
      const hasNoSpecificInfo = analysis.findings.every(f => 
        f.length < 20 || // Too short to be useful
        !f.includes('$') && !f.toLowerCase().includes('cancel') && !f.toLowerCase().includes('refund') // No actionable info
      );

      if (hasGenericFindings || hasNoSpecificInfo || analysis.findings.length === 0) {
        console.log('[Mind-Link Terms Analyzer] Generic findings detected. Applying smart fallback.');
        analysis.findings = [
          'No specific dollar amounts found',
          'Review full terms for pricing details',
          'Check for auto-renewal policies',
          'Verify cancellation requirements'
        ];
        analysis.severity = Math.max(2, analysis.severity); // At least moderate caution
      }

      console.log('[Mind-Link Terms Analyzer] Final processed findings:', analysis.findings);

      // Cache results
      termsCache[cacheKey] = {
        timestamp: Date.now(),
        summary,
        simplified,
        findings: analysis.findings || [],
        severity: analysis.severity || 3,
        hasHiddenFees: analysis.hasHiddenFees
      };
      saveCache();

      // Show results
      if (analysis.hasHiddenFees && analysis.findings && analysis.findings.length > 0) {
        const banner = createWarningBanner(analysis.findings, analysis.severity);
        
        // Add details button handler
        document.getElementById('mind-link-terms-details').addEventListener('click', () => {
          showDetailedAnalysis(summary, simplified, analysis.findings, analysis.severity);
        });
      } else {
        console.log('[Mind-Link Terms Analyzer] No hidden fees detected');
      }

    } catch (error) {
      console.error('[Mind-Link Terms Analyzer] Pipeline error:', error);
      
      // Show error to user
      const banner = createWarningBanner([
        'Unable to analyze terms automatically',
        'Error: ' + error.message,
        'Please review terms carefully before agreeing'
      ], 3);
    }
  }

  // Detect and extract Terms & Conditions
  function detectTermsAndConditions() {
    console.log('[Mind-Link Terms Analyzer] Scanning for T&C...');

    // Look for links containing terms-related keywords
    const termsKeywords = [
      'terms',
      'conditions',
      'agreement',
      'legal',
      'privacy',
      'subscription',
      'billing'
    ];

    const links = Array.from(document.querySelectorAll('a'));
    const termsLinks = links.filter(link => {
      const text = link.textContent.toLowerCase();
      const href = link.href.toLowerCase();
      return termsKeywords.some(keyword => text.includes(keyword) || href.includes(keyword));
    });

    console.log('[Mind-Link Terms Analyzer] Found', termsLinks.length, 'potential T&C links');

    // Add click listeners to T&C links
    termsLinks.forEach(link => {
      if (analyzedTerms.has(link.href)) {
        return; // Already analyzed
      }

      link.addEventListener('click', async (e) => {
        console.log('[Mind-Link Terms Analyzer] T&C link clicked:', link.href);
        
        // Mark as analyzed
        analyzedTerms.add(link.href);

        // Wait for page load or modal/popup
        setTimeout(async () => {
          // Try to find T&C content
          let termsContent = '';

          // Check for modal/popup
          const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="terms"]');
          if (modals.length > 0) {
            const modal = modals[modals.length - 1];
            termsContent = modal.textContent;
          }

          // Check for iframe
          const iframes = document.querySelectorAll('iframe');
          for (const iframe of iframes) {
            try {
              if (iframe.contentDocument) {
                termsContent = iframe.contentDocument.body.textContent;
                break;
              }
            } catch (err) {
              // Cross-origin iframe, skip
            }
          }

          // Check for expanded content on same page
          if (!termsContent) {
            const contentAreas = document.querySelectorAll('[class*="terms"], [id*="terms"], [class*="agreement"], [id*="agreement"]');
            if (contentAreas.length > 0) {
              termsContent = Array.from(contentAreas).map(el => el.textContent).join('\n');
            }
          }

          // Only analyze if we have substantial content (> 500 words)
          if (termsContent && termsContent.split(/\s+/).length > 500) {
            console.log('[Mind-Link Terms Analyzer] Found T&C content, starting analysis...');
            await analyzeTerms(termsContent, link.href);
          }
        }, 1500); // Wait for content to load
      });
    });

    // Also check if current page IS a terms page
    const pageTitle = document.title.toLowerCase();
    const pageContent = document.body.textContent;
    
    if (termsKeywords.some(keyword => pageTitle.includes(keyword)) && 
        pageContent.split(/\s+/).length > 1000) {
      
      console.log('[Mind-Link Terms Analyzer] Current page appears to be T&C, analyzing...');
      
      // Extract main content
      const mainContent = document.querySelector('main, article, [role="main"], .content, #content') || document.body;
      const termsText = mainContent.textContent;
      
      if (!analyzedTerms.has(window.location.href)) {
        analyzedTerms.add(window.location.href);
        setTimeout(() => analyzeTerms(termsText, window.location.href), 1000);
      }
    }
  }

  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectTermsAndConditions);
  } else {
    detectTermsAndConditions();
  }

  // Re-scan when DOM changes (for SPAs)
  let scanTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(detectTermsAndConditions, 2000);
  });

  // Only observe if body exists
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    // Wait for body to be available
    window.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }

  console.log('[Mind-Link Terms Analyzer] Initialized successfully');
})();
