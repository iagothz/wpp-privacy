// Núcleo compartilhado pelos módulos em src/features/.
// Nada aqui envia dados para fora: tudo fica na página e no chrome.storage.
(() => {
  const WPP = (globalThis.WPP = {});
  const root = document.documentElement;
  WPP.root = root;

  // ---------- Configurações ----------
  let sync = { ...WPP_DEFAULTS };
  let local = { ...WPP_LOCAL_DEFAULTS };
  const settingsListeners = [];

  WPP.sync = () => sync;
  WPP.local = () => local;
  WPP.setSync = (obj) => chrome.storage.sync.set(obj);
  WPP.setLocal = (obj) => chrome.storage.local.set(obj);

  // Configurações efetivas: o modo apresentação força o máximo de privacidade.
  WPP.effective = () => {
    const s = { ...sync };
    if (local.presentation) {
      Object.assign(s, {
        enabled: true,
        blurMessages: true,
        blurPreviews: true,
        blurNames: true,
        blurAvatars: true,
        blurInput: true,
        scope: "all",
        revealMode: "none",
        ctrlReveal: false
      });
    }
    return s;
  };

  // Se as configurações já carregaram, quem se registra depois recebe o estado na hora.
  let loaded = false;
  WPP.onSettings = (fn) => {
    settingsListeners.push(fn);
    if (loaded) safe(fn);
  };
  function emitSettings() {
    for (const fn of settingsListeners) safe(fn);
  }

  WPP.ready = Promise.all([
    chrome.storage.sync.get(WPP_DEFAULTS),
    chrome.storage.local.get(WPP_LOCAL_DEFAULTS)
  ]).then(([s, l]) => {
    sync = s;
    local = l;
    loaded = true;
    emitSettings();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    const target = area === "sync" ? sync : area === "local" ? local : null;
    if (!target) return;
    const defaults = area === "sync" ? WPP_DEFAULTS : WPP_LOCAL_DEFAULTS;
    for (const [key, { newValue }] of Object.entries(changes)) {
      target[key] = newValue === undefined ? defaults[key] : newValue;
    }
    emitSettings();
  });

  // ---------- Observação do DOM ----------
  // Os módulos registram funções que rodam (com debounce) quando a página muda.
  // setTimeout em vez de requestAnimationFrame: rAF pausa em abas em segundo plano.
  const domListeners = [];
  let scheduled = false;
  WPP.onDom = (fn) => domListeners.push(fn);
  WPP.refresh = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      for (const fn of domListeners) safe(fn);
    }, 50);
  };
  new MutationObserver(WPP.refresh).observe(root, {
    childList: true,
    subtree: true,
    characterData: true
  });
  WPP.onSettings(WPP.refresh);
  window.addEventListener("resize", WPP.refresh);

  // ---------- Helpers do WhatsApp ----------
  WPP.header = () => document.querySelector("#main header");
  WPP.editor = () => document.querySelector('#main footer [contenteditable="true"]');
  WPP.isEditor = (el) => !!el?.closest?.('#main footer [contenteditable="true"]');

  // Nome da conversa aberta (marcado pelo módulo tagging).
  WPP.openChatName = () => {
    const el = document.querySelector('#main header [data-wpp="name"]');
    return el ? (el.getAttribute("title") || el.textContent || "").trim() : "";
  };

  // Insere texto no editor do WhatsApp do jeito que ele espera (como se fosse digitado).
  WPP.insertText = (text) => {
    const lines = String(text).split("\n");
    lines.forEach((line, i) => {
      if (i > 0) document.execCommand("insertLineBreak");
      if (line) document.execCommand("insertText", false, line);
    });
  };

  // ---------- Interface própria (Shadow DOM, fora da árvore do React) ----------
  const KEY_EVENTS = ["keydown", "keyup", "keypress", "beforeinput", "input", "paste", "copy", "cut"];

  WPP.createHost = (id, css, { isolate = false } = {}) => {
    const host = document.createElement("div");
    host.id = id;
    host.style.all = "initial";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = css;
    shadow.append(style);
    // Impede que o que você digita nos nossos campos chegue aos atalhos do WhatsApp.
    if (isolate) for (const t of KEY_EVENTS) shadow.addEventListener(t, (e) => e.stopPropagation());
    // ShadowRoot não tem insertAdjacentHTML; os módulos montam a interface dentro deste "box".
    const box = document.createElement("div");
    shadow.append(box);
    root.append(host);
    return { host, shadow, box };
  };

  // Enquanto houver um "bloqueador" ativo (pânico, bloqueio), teclas não chegam ao WhatsApp,
  // exceto as digitadas dentro do próprio bloqueador.
  WPP.blockers = new Set();
  const blockKeys = (e) => {
    if (WPP.blockers.size === 0) return;
    const path = e.composedPath();
    for (const host of WPP.blockers) if (path.includes(host)) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  };
  for (const t of ["keydown", "keypress", "keyup", "paste", "drop"]) {
    window.addEventListener(t, blockKeys, true);
  }

  WPP.escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function safe(fn) {
    try {
      fn();
    } catch (err) {
      console.error("[WPP Privacy]", err);
    }
  }
})();
