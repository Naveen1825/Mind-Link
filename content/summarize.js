// Summarization feature: message handling and API call
(function () {
  let summarizing = false;

  function collectPageText() {
    try {
      const text = document.body ? document.body.innerText || "" : "";
      return text.trim().slice(0, 20000);
    } catch (e) { return ""; }
  }

  async function summarizePage() {
    const pageText = collectPageText();
    if (!pageText) {
      window.__notesio_summaryPanel.setSummaryText("No readable content found on this page.");
      return;
    }

    // Check if extension context is valid
    if (window.location.protocol === 'file:') {
      window.__notesio_summaryPanel.setSummaryText("⚠️ Summarization not available on local files. Please test on a real website (e.g., Wikipedia).");
      return;
    }

    summarizing = true;
    window.__notesio_summaryPanel.setSummaryLoading();
    try {
      // Simplified prompt for faster response
      const prompt = `Summarize this webpage in 3-5 bullet points using Markdown. Be concise and focus on main ideas only:\n\n${pageText.slice(0, 8000)}`;
      let text = await window.__notesio_api.callChromeAI(prompt);
      const lines = text.split('\n');
      if (lines.length > 30) text = lines.slice(0, 30).join('\n');
      if (text.length > 1200) text = text.slice(0, 1200) + 'ΓÇª';
      window.__notesio_summaryPanel.setSummaryText(text || "No summary available.");
    } catch (e) {
      console.error("Summarize error:", e);
      let errorMsg = "Error summarizing page.";
      if (e.message && e.message.includes('timeout')) {
        errorMsg = "⏱️ Summarization timed out. Page might be too long. Try a shorter article.";
      } else if (e.message && e.message.includes('Extension context invalidated')) {
        errorMsg = "⚠️ Extension was reloaded. Please refresh this page and try again.";
      }
      window.__notesio_summaryPanel.setSummaryText(errorMsg);
    } finally { summarizing = false; }
  }

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "SUMMARIZE_PAGE") summarizePage();
    });
  }

  window.__notesio_summarize = { summarizePage };
})();
