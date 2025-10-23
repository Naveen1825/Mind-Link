// Jargon Simplifier: Translates complex text to simple language
// Uses Chrome's Rewriter API or Prompt API fallback
(function(){
  
  let simplifyButton = null;

  function createSimplifyButton(selectedText, rect) {
    removeSimplifyButton();

    const btn = document.createElement('button');
    btn.textContent = 'Simplify';
    btn.type = 'button';
    
    Object.assign(btn.style, {
      position: 'absolute',
      left: `${Math.round(rect.left + window.scrollX)}px`,
      top: `${Math.round(rect.bottom + window.scrollY + 6)}px`,
      zIndex: '2147483647',
      padding: '6px 12px',
      fontSize: '14px',
      lineHeight: '1',
      color: '#fff',
      background: '#10b981',
      border: 'none',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
      cursor: 'pointer',
      userSelect: 'none',
      fontFamily: 'system-ui, sans-serif'
    });

    btn.addEventListener('click', async () => {
      await simplifySelectedText(selectedText);
    });

    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    document.documentElement.appendChild(btn);
    simplifyButton = btn;
  }

  function removeSimplifyButton() {
    if (simplifyButton && simplifyButton.parentNode) {
      simplifyButton.parentNode.removeChild(simplifyButton);
    }
    simplifyButton = null;
  }

  function setButtonLoading() {
    if (!simplifyButton) return;
    simplifyButton.disabled = true;
    simplifyButton.style.cursor = 'wait';
    simplifyButton.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="31.4 188.4">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </svg>
        Simplifying...
      </span>`;
  }

  function showSimplifiedText(originalText, simplifiedText) {
    if (!simplifyButton) return;

    // Create result panel
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'absolute',
      left: simplifyButton.style.left,
      top: `${parseInt(simplifyButton.style.top) + 40}px`,
      zIndex: '2147483647',
      maxWidth: '400px',
      background: '#ffffff',
      border: '1px solid #d0d7de',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '12px',
      fontSize: '14px',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.5'
    });

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #10b981;">✨ Simplified Version:</strong>
        <button id="mindlink-close-simplify" style="border: none; background: transparent; font-size: 18px; cursor: pointer; padding: 0 4px;">×</button>
      </div>
      <div style="color: #374151; margin-bottom: 8px;">
        ${simplifiedText}
      </div>
      <div style="font-size: 12px; color: #9ca3af; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <strong>Original:</strong> ${originalText.slice(0, 150)}${originalText.length > 150 ? '...' : ''}
      </div>
    `;

    document.documentElement.appendChild(panel);

    // Close button handler
    panel.querySelector('#mindlink-close-simplify').addEventListener('click', () => {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      removeSimplifyButton();
    });

    // Remove simplify button
    if (simplifyButton && simplifyButton.parentNode) {
      simplifyButton.parentNode.removeChild(simplifyButton);
      simplifyButton = null;
    }
  }

  async function simplifySelectedText(text) {
    if (!text || text.length < 10) {
      alert('Please select more text to simplify');
      return;
    }

    // Check if Chrome AI is available
    if (!window.__notesio_apiAvailable) {
      alert('Chrome AI not available. Please enable Built-in AI at chrome://flags');
      return;
    }

    setButtonLoading();

    try {
      // Try to use simplifyJargon from API (uses Rewriter or Prompt API)
      const simplified = await window.__notesio_api.simplifyJargon(text);
      showSimplifiedText(text, simplified);
    } catch (error) {
      console.error('[Mind-Link] Simplification error:', error);
      
      // Show error in button
      if (simplifyButton) {
        simplifyButton.textContent = 'Error - try again';
        simplifyButton.disabled = false;
        simplifyButton.style.cursor = 'pointer';
        simplifyButton.style.background = '#ef4444';
        
        setTimeout(() => {
          removeSimplifyButton();
        }, 2000);
      }
    }
  }

  // Listen for text selection with Ctrl+Shift (or Cmd+Shift on Mac)
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+S or Cmd+Shift+S to simplify selected text
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        createSimplifyButton(selectedText, rect);
      }
    }
  });

  // Clean up on click elsewhere
  document.addEventListener('click', (e) => {
    if (simplifyButton && e.target !== simplifyButton && !simplifyButton.contains(e.target)) {
      removeSimplifyButton();
    }
  });

  window.__notesio_simplify = { simplifySelectedText };
})();
