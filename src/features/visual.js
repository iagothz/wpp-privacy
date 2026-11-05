// Ajustes visuais: largura total, modo compacto, fonte, temas e palavras-chave.
(() => {
  const { root } = WPP;

  // Estilo gerado dinamicamente (tema).
  const themeStyle = document.createElement("style");
  themeStyle.id = "wpp-theme";
  root.append(themeStyle);

  function themeCss(s) {
    let light, dark;
    if (s.theme === "custom") {
      light = dark = { out: s.customOutgoing, in: s.customIncoming, bg: s.customBackground };
    } else if (WPP_THEMES[s.theme]) {
      ({ light, dark } = WPP_THEMES[s.theme]);
    } else {
      return "";
    }
    // Variáveis de cor usadas pelo WhatsApp Web para balões e fundo da conversa.
    const vars = (c) => `
      --outgoing-background: ${c.out} !important;
      --outgoing-background-deeper: ${c.out} !important;
      --incoming-background: ${c.in} !important;
      --incoming-background-deeper: ${c.in} !important;
      --conversation-panel-background: ${c.bg} !important;`;
    return `html body { ${vars(light)} }\nhtml body.dark { ${vars(dark)} }`;
  }

  function apply() {
    const s = WPP.sync();
    root.classList.toggle("wpp-fullWidth", !!s.fullWidth);
    root.classList.toggle("wpp-compact", !!s.compact);
    const scale = Number(s.fontScale) || 100;
    root.classList.toggle("wpp-fontScale", scale !== 100);
    root.style.setProperty("--wpp-font-scale", String(scale / 100));
    themeStyle.textContent = themeCss(s);
  }
  WPP.onSettings(apply);

  // ---------- Largura total ----------
  // Marca os contêineres entre #app e a lista de conversas que limitam a largura.
  function tagWide() {
    if (!WPP.sync().fullWidth) return;
    const start = document.getElementById("pane-side");
    const app = document.getElementById("app");
    if (!start || !app) return;
    for (let el = start.parentElement; el && el !== app; el = el.parentElement) {
      if (el.hasAttribute("data-wpp-wide")) continue;
      const max = getComputedStyle(el).maxWidth;
      if (max !== "none" && parseFloat(max) < window.innerWidth) el.setAttribute("data-wpp-wide", "");
    }
  }

  // ---------- Palavras-chave ----------
  const hasHighlights = typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";
  let lastKeywords = "";

  function keywordRegex() {
    const words = (WPP.sync().keywords || []).map((w) => String(w).trim()).filter(Boolean);
    if (words.length === 0) return null;
    const alt = words.map(WPP.escapeRegExp).join("|");
    return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alt})(?![\\p{L}\\p{N}])`, "giu");
  }

  function highlightKeywords() {
    const re = keywordRegex();
    const key = re ? re.source : "";
    const targets = document.querySelectorAll('[data-wpp="msg"], #pane-side [data-wpp="preview"]');

    if (!re) {
      if (lastKeywords) {
        document.querySelectorAll("[data-wpp-kw]").forEach((el) => el.removeAttribute("data-wpp-kw"));
        if (hasHighlights) CSS.highlights.delete("wpp-kw");
      }
      lastKeywords = "";
      return;
    }
    lastKeywords = key;

    const ranges = [];
    for (const el of targets) {
      let found = false;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        re.lastIndex = 0;
        for (let m = re.exec(node.data); m; m = re.exec(node.data)) {
          found = true;
          if (!hasHighlights) break;
          const range = new Range();
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          ranges.push(range);
        }
      }
      // Marca lateral na mensagem: aparece mesmo com a mensagem borrada.
      const marker = el.dataset.wpp === "msg" ? el : el.closest("[data-wpp-target], [role='listitem'], [role='row']") || el;
      if (found) marker.setAttribute("data-wpp-kw", "");
      else marker.removeAttribute("data-wpp-kw");
    }
    if (hasHighlights) CSS.highlights.set("wpp-kw", new Highlight(...ranges));
  }

  WPP.onDom(() => {
    tagWide();
    highlightKeywords();
  });
})();
