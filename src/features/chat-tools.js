// Botões flutuantes da conversa aberta: proteger conversa (🔒) e notas (📝).
// Ficam numa "pílula" logo abaixo do cabeçalho, sem mexer nos controles do WhatsApp.
(() => {
  const CSS = `
    :host { all: initial; }
    .pill, .panel {
      --bg: #ffffff; --fg: #111b21; --muted: #667781; --line: #e9edef; --accent: #00a884;
      font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: var(--fg);
    }
    .dark { --bg: #202c33; --fg: #e9edef; --muted: #8696a0; --line: #2a3942; }
    .pill {
      position: fixed; z-index: 2147483000; display: none; gap: 2px; padding: 3px;
      background: var(--bg); border: 1px solid var(--line); border-radius: 999px;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .pill.show { display: flex; }
    button {
      all: unset; position: relative; display: grid; place-items: center;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 15px;
      opacity: .55; transition: opacity .15s, background .15s;
    }
    button:hover { opacity: 1; background: var(--line); }
    button.on { opacity: 1; }
    button.has-note::after {
      content: ""; position: absolute; top: 5px; right: 5px;
      width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
    }
    .panel {
      position: fixed; z-index: 2147483000; display: none; flex-direction: column; gap: 6px;
      width: 260px; padding: 10px 12px 12px;
      background: var(--bg); border: 1px solid var(--line); border-radius: 12px;
      box-shadow: 0 6px 24px rgba(0,0,0,.18);
    }
    .panel.show { display: flex; }
    .panel header { display: flex; justify-content: space-between; align-items: center; }
    .panel strong { font-size: 13px; }
    .panel small { color: var(--muted); font-size: 11px; }
    textarea {
      box-sizing: border-box; width: 100%; min-height: 140px; resize: vertical;
      padding: 8px; border: 1px solid var(--line); border-radius: 8px;
      background: transparent; color: var(--fg); font: inherit; outline: none;
    }
    textarea:focus { border-color: var(--accent); }
    .close { width: 24px; height: 24px; font-size: 13px; }
  `;

  const { shadow, box } = WPP.createHost("wpp-chat-tools", CSS, { isolate: true });
  box.insertAdjacentHTML("beforeend", `
    <div class="pill">
      <button class="protect" title="">🔒</button>
      <button class="notes" title="Notas desta conversa">📝</button>
    </div>
    <div class="panel">
      <header><strong>Notas</strong><button class="close" title="Fechar">✕</button></header>
      <small class="who"></small>
      <textarea placeholder="Anotações sobre esta conversa. Ficam salvas só neste computador."></textarea>
    </div>
  `);

  const pill = shadow.querySelector(".pill");
  const protectBtn = shadow.querySelector(".protect");
  const notesBtn = shadow.querySelector(".notes");
  const panel = shadow.querySelector(".panel");
  const who = shadow.querySelector(".who");
  const textarea = shadow.querySelector("textarea");

  let panelOpen = false;
  let currentChat = "";
  let saveTimer = null;

  function blocked() {
    const l = WPP.local();
    return l.panic || l.locked || l.presentation;
  }

  function render() {
    const header = WPP.header();
    const name = WPP.openChatName();
    const visible = !!(header && name) && !blocked();
    pill.classList.toggle("show", visible);
    panel.classList.toggle("show", visible && panelOpen && WPP.sync().notesEnabled);
    if (!visible) return;

    const dark = document.body?.classList.contains("dark");
    pill.classList.toggle("dark", !!dark);
    panel.classList.toggle("dark", !!dark);

    // Posição: canto direito, logo abaixo do cabeçalho da conversa.
    const rect = header.getBoundingClientRect();
    pill.style.top = `${rect.bottom + 8}px`;
    pill.style.left = `${rect.right - 16 - pill.offsetWidth}px`;
    panel.style.top = `${rect.bottom + 52}px`;
    panel.style.left = `${rect.right - 16 - 260}px`;

    const isProtected = (WPP.local().protectedChats || []).includes(name);
    protectBtn.classList.toggle("on", isProtected);
    protectBtn.title = isProtected
      ? "Conversa protegida (clique para remover)"
      : "Proteger esta conversa (usada no modo \"Só conversas protegidas\")";

    notesBtn.style.display = WPP.sync().notesEnabled ? "" : "none";
    const note = WPP.local().notes?.[name] || "";
    notesBtn.classList.toggle("has-note", !!note.trim());

    if (name !== currentChat) {
      flushSave();
      currentChat = name;
      textarea.value = note;
      who.textContent = name;
    }
  }

  protectBtn.addEventListener("click", () => {
    const name = WPP.openChatName();
    if (!name) return;
    const list = new Set(WPP.local().protectedChats || []);
    list.has(name) ? list.delete(name) : list.add(name);
    WPP.setLocal({ protectedChats: [...list] });
  });

  notesBtn.addEventListener("click", () => {
    panelOpen = !panelOpen;
    render();
    if (panelOpen) textarea.focus();
  });
  shadow.querySelector(".close").addEventListener("click", () => {
    panelOpen = false;
    render();
  });

  function flushSave() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    save();
  }
  function save() {
    if (!currentChat) return;
    const notes = { ...(WPP.local().notes || {}) };
    const text = textarea.value;
    if (text.trim()) notes[currentChat] = text;
    else delete notes[currentChat];
    WPP.setLocal({ notes });
  }
  textarea.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; save(); }, 400);
  });

  WPP.onDom(render);
})();
