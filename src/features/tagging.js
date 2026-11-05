// Marca elementos do WhatsApp com atributos data-wpp-*, para o CSS poder agir.
// O WhatsApp troca classes com frequência, então usamos sinais mais estáveis.
// Os textos são lidos só para comparação local (ex.: nome da conversa protegida).
(() => {
  const { root } = WPP;

  const CHAT_ITEMS = '#pane-side [role="listitem"], #pane-side [role="row"]';

  // Mensagens: data-id "true_..."/"false_..." (chave interna), classes antigas
  // e o atributo do texto copiável. Marcamos só o elemento mais externo.
  const MESSAGE_CANDIDATES = [
    '[data-id^="true_"]',
    '[data-id^="false_"]',
    ".message-in",
    ".message-out",
    "[data-pre-plain-text]"
  ].join(", ");

  // "digitando...", "gravando áudio..." (pt e en).
  const TYPING = /^(digitando|gravando( [áa]udio)?|typing|recording( audio)?)\s*(\.{3}|…)?$/i;

  let protectedSet = new Set();
  let scopeAll = true;

  function setAttr(el, name, on) {
    if (on) {
      if (!el.hasAttribute(name)) el.setAttribute(name, "");
    } else if (el.hasAttribute(name)) {
      el.removeAttribute(name);
    }
  }

  function textOf(el) {
    return (el.getAttribute("title") || el.textContent || "").trim();
  }

  function tagTyping(container) {
    for (const span of container.querySelectorAll("span")) {
      if (span.childElementCount > 0) continue;
      setAttr(span, "data-wpp-typing", TYPING.test(span.textContent.trim()));
    }
  }

  function tagChatItem(item) {
    const spans = [...item.querySelectorAll("span[title]")]
      .filter((s) => !s.parentElement.closest("span[title]"));
    if (spans.length === 0) return;
    spans[0].dataset.wpp = "name";
    for (const s of spans.slice(1)) s.dataset.wpp = "preview";

    const isProtected = protectedSet.has(textOf(spans[0]));
    setAttr(item, "data-wpp-protected", isProtected);
    setAttr(item, "data-wpp-target", scopeAll || isProtected);
    tagTyping(item);
  }

  function tagHeader() {
    const header = WPP.header();
    if (!header) {
      root.classList.remove("wpp-target-open", "wpp-open-protected");
      return;
    }
    const name = header.querySelector('span[dir="auto"]');
    if (name) name.dataset.wpp = "name";

    // Subtítulo: "online", "visto por último", participantes do grupo...
    for (const s of header.querySelectorAll("span[title]")) {
      if (!name || s === name || s.contains(name) || name.contains(s)) continue;
      s.dataset.wpp = "presence";
    }
    tagTyping(header);

    const isProtected = protectedSet.has(WPP.openChatName());
    root.classList.toggle("wpp-open-protected", isProtected);
    root.classList.toggle("wpp-target-open", scopeAll || isProtected);
  }

  function tagMessages() {
    for (const el of document.querySelectorAll(MESSAGE_CANDIDATES)) {
      if (el.closest("#pane-side")) continue;
      const outer = el.parentElement?.closest(MESSAGE_CANDIDATES);
      if (outer) {
        if (el.dataset.wpp === "msg") delete el.dataset.wpp;
        continue;
      }
      if (el.dataset.wpp !== "msg") el.dataset.wpp = "msg";
    }
  }

  WPP.onSettings(() => {
    scopeAll = WPP.effective().scope !== "selected";
    protectedSet = new Set(WPP.local().protectedChats || []);
  });

  WPP.onDom(() => {
    document.querySelectorAll(CHAT_ITEMS).forEach(tagChatItem);
    tagHeader();
    tagMessages();
  });
})();
