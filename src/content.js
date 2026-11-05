// Aplica as configurações como classes no <html>; o CSS faz o resto.
// Nada aqui lê ou envia conteúdo de mensagens: só altera a aparência da página.
(() => {
  const DEFAULTS = globalThis.WPP_DEFAULTS;
  const FLAGS = globalThis.WPP_FLAGS;
  const root = document.documentElement;

  function apply(settings) {
    root.classList.toggle("wpp-on", !!settings.enabled);
    for (const flag of FLAGS) {
      root.classList.toggle(`wpp-${flag}`, !!settings[flag]);
    }
    const px = Math.max(1, Math.min(30, Number(settings.intensity) || DEFAULTS.intensity));
    root.style.setProperty("--wpp-blur", `${px}px`);
  }

  function load() {
    chrome.storage.sync.get(DEFAULTS, apply);
  }

  load();
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "sync") load();
  });

  // Nome e prévia na lista de conversas não têm seletor estável em CSS puro,
  // então marcamos os elementos com data-wpp="name" / "preview".
  // Só olhamos a estrutura (spans com title); o texto não é lido nem guardado.
  const CHAT_ITEMS = '#pane-side [role="listitem"], #pane-side [role="row"]';

  function tagChatItem(item) {
    const spans = [...item.querySelectorAll("span[title]")]
      .filter((s) => !s.parentElement.closest("span[title]"));
    if (spans.length === 0) return;
    spans[0].dataset.wpp = "name";
    for (const s of spans.slice(1)) s.dataset.wpp = "preview";
  }

  function tagHeader() {
    const name = document.querySelector('#main header span[dir="auto"]');
    if (name) name.dataset.wpp = "name";
  }

  let scheduled = false;
  function tagAll() {
    scheduled = false;
    document.querySelectorAll(CHAT_ITEMS).forEach(tagChatItem);
    tagHeader();
  }
  function scheduleTag() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(tagAll);
  }

  new MutationObserver(scheduleTag).observe(root, { childList: true, subtree: true });

  // Modo "saí da janela": borra tudo quando a aba/janela perde o foco.
  const setAway = (away) => root.classList.toggle("wpp-away", away);
  window.addEventListener("blur", () => setAway(true));
  window.addEventListener("focus", () => setAway(false));
  document.addEventListener("visibilitychange", () => setAway(document.hidden));
})();
