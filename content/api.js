// API helper for Gemini calls
(function(){
  const GEMINI_API_KEY = "AIzaSyANDE9ewTxVk-82r-K4SACtuIZ_8DCq9uw"; // <-- REPLACE ME
  const MODEL_URL = (key) => `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

  async function callGemini(promptText){
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_ACTUAL_GEMINI_API_KEY_HERE") {
      throw new Error("API key missing or placeholder");
    }
    const body = { contents: [ { parts: [ { text: String(promptText) } ] } ] };
    const res = await fetch(MODEL_URL(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      let msg = `Request failed: ${res.status}`;
      if (res.status === 404) msg += ". Check the URL, model name, and API key.";
      else if (res.status === 403) msg += ". Invalid API key or API not enabled.";
      else if (res.status === 400) msg += ". Bad Request. Prompt may be invalid.";
      throw new Error(msg + ` | Details: ${t}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return text;
  }

  window.__notesio_api = { callGemini };
})();
