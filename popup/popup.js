document.getElementById('summarizeBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'SUMMARIZE_PAGE' });
    window.close();
  } catch (e) {
    console.error('Popup error:', e);
  }
});
