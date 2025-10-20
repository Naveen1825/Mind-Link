// Dictionary feature: selection UI and API call
(function () {
  let selectionButton = null;

  function setButtonLoading() {
    if (!selectionButton) return;
    selectionButton.disabled = true;
    selectionButton.style.pointerEvents = 'none';
    selectionButton.style.opacity = '0.9';
    selectionButton.style.whiteSpace = 'nowrap';
    selectionButton.style.maxWidth = '';
    selectionButton.style.textAlign = 'center';
    selectionButton.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="16" height="16" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" stroke="#1f6feb" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="31.4 188.4">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </svg>
        Loading...
      </span>`;
  }

  function setButtonAsDefinition(text) {
    if (!selectionButton) return;
    selectionButton.innerText = text;
    selectionButton.style.whiteSpace = 'normal';
    selectionButton.style.textAlign = 'left';
    selectionButton.style.maxWidth = '360px';
    selectionButton.style.lineHeight = '1.35';
    selectionButton.disabled = true;
    selectionButton.style.pointerEvents = 'auto';
  }

  async function fetchDefinition(word) {
    try {
      setButtonLoading();

      // Check if extension context is valid (skip on file:// URLs)
      if (window.location.protocol === 'file:') {
        setButtonAsDefinition('⚠️ Dictionary not available on local files. Please test on a real website.');
        return;
      }

      // Check if Chrome AI is available
      if (!window.__notesio_apiAvailable) {
        setButtonAsDefinition('⚠️ Chrome AI not available. Please check console (F12) for details.');
        return;
      }

      console.log('[Dictionary] Calling Chrome AI for word:', word);

      const prompt = `Define "${word}" in 1-2 simple sentences.`;

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );

      const text = await Promise.race([
        window.__notesio_api.callChromeAI(prompt),
        timeoutPromise
      ]);

      console.log('[Dictionary] Received response:', text);
      setButtonAsDefinition(text || 'No definition found.');
    } catch (err) {
      console.error('[Dictionary] Chrome AI error:', err);
      console.error('[Dictionary] Error details:', err.message, err.stack);

      let errorMsg = 'Error: ' + err.message;

      if (err.message.includes('Extension context invalidated')) {
        errorMsg = '⚠️ Extension reloaded. Please refresh this page.';
      } else if (err.message.includes('not available') || err.message.includes('not supported')) {
        errorMsg = '⚠️ Chrome AI unavailable. Check console (F12) for details.';
      } else if (err.message.includes('downloading') || err.message.includes('after-download')) {
        errorMsg = '⏳ AI model downloading... Try again later.';
      } else if (err.message.includes('timeout')) {
        errorMsg = '⏱️ Request timed out. Model may be loading. Try again.';
      } else if (err.message.includes('LanguageModel is not defined')) {
        errorMsg = '⚠️ LanguageModel API not available. Enable chrome://flags';
      }

      setButtonAsDefinition(errorMsg);
    }
  }

  function removeSelectionButton() {
    if (selectionButton && selectionButton.parentNode) {
      selectionButton.removeEventListener('click', onSelectionButtonClick);
      selectionButton.parentNode.removeChild(selectionButton);
    }
    selectionButton = null;
  }

  function onSelectionButtonClick() {
    const selected = window.__notesio_utils.getSelectedText();
    if (selected) fetchDefinition(selected);
  }

  function showSelectionButton(rect) {
    removeSelectionButton();
    const btn = document.createElement('button');
    btn.textContent = 'Define';
    btn.type = 'button';
    Object.assign(btn.style, {
      position: 'absolute',
      left: `${Math.round(rect.left + window.scrollX)}px`,
      top: `${Math.round(rect.bottom + window.scrollY + 6)}px`,
      zIndex: '2147483647',
      padding: '6px 10px',
      fontSize: '16px',
      lineHeight: '1',
      color: '#111',
      background: '#ffffff',
      border: '1px solid #d0d7de',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      cursor: 'pointer',
      userSelect: 'none'
    });
    btn.addEventListener('click', onSelectionButtonClick);
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    document.documentElement.appendChild(btn);
    selectionButton = btn;
  }

  function onDocumentClick(e) {
    if (!selectionButton) return;
    if (e.target === selectionButton || selectionButton.contains(e.target)) return;
    removeSelectionButton();
  }

  function onDoubleClick() {
    try {
      setTimeout(() => {
        const selected = window.__notesio_utils.getSelectedText();
        if (selected && selected.length > 0) {
          const sel = window.getSelection();
          const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
          if (range) {
            const rect = range.getBoundingClientRect();
            showSelectionButton(rect);
          } else {
            removeSelectionButton();
          }
        } else {
          removeSelectionButton();
        }
      }, 0);
    } catch (err) {
      console.error('Double-click handler error:', err);
      removeSelectionButton();
    }
  }

  document.addEventListener('dblclick', onDoubleClick, true);
  document.addEventListener('click', onDocumentClick, true);
})();
