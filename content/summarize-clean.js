// Summarization feature: message handling and API call
(function(){
  let summarizing = false;

  function collectPageText() {
    try {
      const text = document.body ? document.body.innerText || "" : "";
      return text.trim().slice(0, 20000);
    } catch (e) { return ""; }
  }

  async function summarizePage(){
    const pageText = collectPageText();
    if (!pageText) {
      window.__notesio_summaryPanel.setSummaryText("No readable content found on this page.");
      return;
    }
    summarizing = true;
    window.__notesio_summaryPanel.setSummaryLoading();
    try {
      const prompt = `Read the following webpage content and write a concise, well-organized Markdown summary.\n\nFollow this structure:\n\n**1. Introduction:** Begin with one sentence that states the author (if available), title, and the main purpose or argument of the text.\n\n**2. Main Points:** Present the key ideas and arguments in logical order, reflecting the structure of the original (introduction, body, conclusion if applicable).\n\n**3. Supporting Evidence:** Briefly mention the strongest evidence, examples, or data that support each main point ΓÇö skip minor details or repetition.\n\n**4. Concise Language:** Use your own clear, neutral wording. Avoid copying text directly unless essential and quoted accurately.\n\n**5. Objectivity:** Do not add personal opinions, interpretations, or new information.\n\n**6. Conclusion:** End with one short sentence that restates or encapsulates the textΓÇÖs central message.\n\nFormat the output **only in Markdown** (with clear headings and bullet points) and keep it **under ~1200 characters**.\n\nContent:\n${pageText}`;
      let text = await window.__notesio_api.callGemini(prompt);
      const lines = text.split('\n');
      if (lines.length > 30) text = lines.slice(0, 30).join('\n');
      if (text.length > 1200) text = text.slice(0, 1200) + 'ΓÇª';
      window.__notesio_summaryPanel.setSummaryText(text || "No summary available.");
    } catch (e) {
      console.error("Summarize error:", e);
      window.__notesio_summaryPanel.setSummaryText("Error summarizing page.");
    } finally { summarizing = false; }
  }

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "SUMMARIZE_PAGE") summarizePage();
    });
  }

  window.__notesio_summarize = { summarizePage };
})();
