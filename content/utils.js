// Shared utilities for content scripts
(function(){
  function getSelectedText() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return "";
    return sel.toString().trim().replace(/\s+/g, ' ');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMarkdown(md) {
    if (!md) return "";
    let s = escapeHtml(md);
    // code blocks ```
    s = s.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre><code>${p1}</code></pre>`);
    // inline code `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // headings #### to #
    s = s.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
         .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
         .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
         .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
         .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
         .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
    // bold and italic
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // unordered lists
    s = s.replace(/^(?:[-*])\s+.*(?:\n(?:[-*])\s+.*)*/gm, (block) => {
      const items = block
        .split(/\n/)
        .map(line => line.replace(/^(?:[-*])\s+/, '').trim())
        .filter(Boolean);
      return `<ul>${items.map(it => `<li>${it}</li>`).join('')}</ul>`;
    });
    // ordered lists
    s = s.replace(/^(?:\d+)\.\s+.*(?:\n(?:\d+)\.\s+.*)*/gm, (block) => {
      const items = block.split(/\n/).map(line => line.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
      return `<ol>${items.map(it => `<li>${it}</li>`).join('')}</ol>`;
    });
    // paragraphs
    s = s.split(/\n{2,}/).map(chunk => {
      if (/^\s*<(h\d|ul|ol|pre|blockquote)/i.test(chunk)) return chunk; 
      return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    return s;
  }

  // expose to other files in this isolated world
  window.__notesio_utils = { getSelectedText, escapeHtml, renderMarkdown };
})();
