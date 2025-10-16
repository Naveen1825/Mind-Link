// Dictionary feature: selection UI and API call
(function(){
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
      const prompt = `Provide a concise dictionary-style definition for the word: "${word}". Keep it to two or three short sentences, plain text.`;
      const text = await window.__notesio_api.callGemini(prompt);
      setButtonAsDefinition(text || 'No definition found.');
    } catch (err) {
      console.error('Gemini API error:', err);
      setButtonAsDefinition('Error fetching definition. See console for details.');
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
