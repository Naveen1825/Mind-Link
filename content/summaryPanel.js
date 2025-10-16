// Summary panel UI and styling
(function(){
  let summaryBox = null;
  let summaryContent = null;

  function ensureSidebar() {
    if (summaryBox && document.documentElement.contains(summaryBox)) return;
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      width: "360px",
      maxHeight: "50vh",
      overflow: "hidden",
      zIndex: "2147483647",
      background: "#ffffff",
      border: "1px solid #d0d7de",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    });
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 10px",
      borderBottom: "1px solid #d0d7de",
      fontSize: "13px",
      fontWeight: "600",
      color: "#000"
    });
    header.textContent = "Summary";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      border: "none",
      background: "transparent",
      fontSize: "18px",
      lineHeight: "1",
      cursor: "pointer",
      padding: "0 4px",
      color: "#000"
    });
    closeBtn.addEventListener("click", () => {
      if (summaryBox && summaryBox.parentNode) summaryBox.parentNode.removeChild(summaryBox);
      summaryBox = null;
      summaryContent = null;
    });
    header.appendChild(closeBtn);
    const content = document.createElement("div");
    Object.assign(content.style, {
      padding: "10px 12px",
      fontSize: "14px",
      lineHeight: "1.4",
      color: "#111",
      whiteSpace: "pre-wrap",
      overflow: "auto",
      maxHeight: "calc(50vh - 40px)"
    });
    content.className = "notesio-summary-content";
    const style = document.createElement("style");
    style.textContent = `
      .notesio-summary-content { scrollbar-width: thin; scrollbar-color: #b3b3b3 transparent; }
      .notesio-summary-content h1,
      .notesio-summary-content h2,
      .notesio-summary-content h3,
      .notesio-summary-content h4,
      .notesio-summary-content h5,
      .notesio-summary-content h6 { color: #000 !important; }
      .notesio-summary-content::-webkit-scrollbar { width: 4px; height: 4px; }
      .notesio-summary-content::-webkit-scrollbar-track { background: transparent; }
      .notesio-summary-content::-webkit-scrollbar-thumb { background: #b3b3b3; border-radius: 4px; }
      .notesio-summary-content::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
    `;
    box.appendChild(style);
    box.appendChild(header);
    box.appendChild(content);
    document.documentElement.appendChild(box);
    summaryBox = box;
    summaryContent = content;
  }

  function setSummaryText(text){
    ensureSidebar();
    if (summaryContent) summaryContent.innerHTML = window.__notesio_utils.renderMarkdown(text);
  }
  function setSummaryLoading(){
    ensureSidebar();
    if (summaryContent) summaryContent.textContent = "Summarizing...";
  }

  window.__notesio_summaryPanel = { ensureSidebar, setSummaryText, setSummaryLoading };
})();
