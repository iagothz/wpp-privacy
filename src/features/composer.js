// Ajudas na caixa de digitação: respostas rápidas, atalhos de formatação e contador.
// Nada é enviado automaticamente: só o texto da caixa é alterado; quem envia é você.
(() => {
  // ---------- Atalhos de formatação ----------
  // Ctrl+B *negrito*, Ctrl+I _itálico_, Ctrl+Shift+X ~tachado~, Ctrl+Shift+K ```mono```
  const FORMATS = [
    { key: "b", shift: false, mark: "*" },
    { key: "i", shift: false, mark: "_" },
    { key: "x", shift: true, mark: "~" },
    { key: "k", shift: true, mark: "```" }
  ];

  function wrapSelection(mark) {
    const sel = window.getSelection();
    const text = sel.toString();
    if (text) {
      // O WhatsApp só formata se não houver espaço colado no marcador.
      const [, before, core, after] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
      WPP.insertText(core ? `${before}${mark}${core}${mark}${after}` : text);
    } else {
      WPP.insertText(mark + mark);
      for (let i = 0; i < mark.length; i++) sel.modify("move", "backward", "character");
    }
  }

  function handleFormat(e) {
    if (!WPP.sync().formatShortcuts) return false;
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
    const fmt = FORMATS.find((f) => f.key === e.key.toLowerCase() && f.shift === e.shiftKey);
    if (!fmt) return false;
    e.preventDefault();
    e.stopImmediatePropagation();
    wrapSelection(fmt.mark);
    return true;
  }

  // ---------- Respostas rápidas ----------
  // Digite o atalho (ex.: /oi) e aperte Espaço ou Tab para expandir.
  function textBeforeCaret() {
    const sel = window.getSelection();
    if (!sel.isCollapsed || !sel.anchorNode) return "";
    const node = sel.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.slice(0, sel.anchorOffset);
    return "";
  }

  function handleQuickReply(e) {
    if (e.key !== " " && e.key !== "Tab") return false;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
    const replies = (WPP.sync().quickReplies || [])
      .filter((r) => r.shortcut && r.text)
      .sort((a, b) => b.shortcut.length - a.shortcut.length);
    if (replies.length === 0) return false;

    const before = textBeforeCaret();
    const match = replies.find((r) => {
      if (!before.endsWith(r.shortcut)) return false;
      const prev = before.charAt(before.length - r.shortcut.length - 1);
      return prev === "" || /\s/.test(prev);
    });
    if (!match) return false;

    e.preventDefault();
    e.stopImmediatePropagation();
    const sel = window.getSelection();
    for (let i = 0; i < match.shortcut.length; i++) sel.modify("extend", "backward", "character");
    WPP.insertText(match.text + (e.key === " " ? " " : ""));
    return true;
  }

  window.addEventListener("keydown", (e) => {
    if (!WPP.isEditor(e.target)) return;
    if (handleFormat(e)) return;
    handleQuickReply(e);
  }, true);

  // ---------- Contador de caracteres ----------
  const { shadow, box } = WPP.createHost("wpp-counter", `
    :host { all: initial; }
    .count {
      position: fixed; z-index: 2147483000; display: none;
      padding: 1px 7px; border-radius: 999px;
      background: rgba(0,0,0,.55); color: #fff;
      font: 11px/16px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      pointer-events: none;
    }
    .count.show { display: block; }
  `);
  box.insertAdjacentHTML("beforeend", `<div class="count"></div>`);
  const counter = shadow.querySelector(".count");

  function renderCounter() {
    const editor = WPP.editor();
    const l = WPP.local();
    const show = WPP.sync().charCounter && editor && !l.panic && !l.locked;
    const text = show ? editor.innerText.replace(/\n+$/, "") : "";
    counter.classList.toggle("show", !!text.length);
    if (!text.length) return;
    counter.textContent = text.length.toLocaleString("pt-BR");
    const rect = editor.getBoundingClientRect();
    counter.style.top = `${rect.top - 20}px`;
    counter.style.left = `${rect.right - counter.offsetWidth}px`;
  }

  window.addEventListener("input", (e) => { if (WPP.isEditor(e.target)) renderCounter(); }, true);
  WPP.onDom(renderCounter);
})();
