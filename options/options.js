const $ = (sel) => document.querySelector(sel);
const boundInputs = document.querySelectorAll("[data-key]");
let sync = { ...WPP_DEFAULTS };
let local = { ...WPP_LOCAL_DEFAULTS };

// ---------- "Salvo ✓" ----------
let savedTimer;
function flashSaved() {
  $("#saved").classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => $("#saved").classList.remove("show"), 1200);
}
const saveSync = (obj) => chrome.storage.sync.set(obj).then(flashSaved);
const saveLocal = (obj) => chrome.storage.local.set(obj).then(flashSaved);

// ---------- Temas no <select> ----------
const themeSelect = $("#themeSelect");
themeSelect.append(new Option("Padrão do WhatsApp", "default"));
for (const [key, theme] of Object.entries(WPP_THEMES)) themeSelect.append(new Option(theme.label, key));
themeSelect.append(new Option("Personalizado", "custom"));

// ---------- Campos simples (data-key) ----------
function renderBound() {
  for (const input of boundInputs) {
    const value = sync[input.dataset.key];
    if (input.type === "checkbox") input.checked = !!value;
    else input.value = value;
  }
  $("#intensityValue").textContent = `(${sync.intensity}px)`;
  $("#fontScaleValue").textContent = `(${sync.fontScale}%)`;
  $("#customColors").classList.toggle("show", sync.theme === "custom");
}

for (const input of boundInputs) {
  const event = input.type === "range" || input.type === "color" ? "input" : "change";
  input.addEventListener(event, () => {
    const key = input.dataset.key;
    let value = input.value;
    if (input.type === "checkbox") value = input.checked;
    else if (input.type === "range" || input.dataset.type === "number") value = Number(value);
    saveSync({ [key]: value });
  });
}

// ---------- Palavras-chave ----------
const keywordsInput = $("#keywords");
function renderKeywords() {
  if (document.activeElement !== keywordsInput) keywordsInput.value = (sync.keywords || []).join(", ");
}
keywordsInput.addEventListener("change", () => {
  const keywords = [...new Set(keywordsInput.value.split(",").map((w) => w.trim()).filter(Boolean))];
  saveSync({ keywords });
});

// ---------- Respostas rápidas ----------
const repliesBox = $("#replies");
function renderReplies() {
  // Não redesenha enquanto você digita num campo (perderia o foco).
  const active = document.activeElement;
  if (repliesBox.contains(active) && active.matches("input, textarea")) return;
  repliesBox.textContent = "";
  (sync.quickReplies || []).forEach((reply, index) => {
    const row = document.createElement("div");
    row.className = "reply";
    const shortcut = Object.assign(document.createElement("input"), {
      type: "text", value: reply.shortcut, placeholder: "/atalho"
    });
    const text = Object.assign(document.createElement("textarea"), {
      value: reply.text, placeholder: "Texto completo da resposta"
    });
    const remove = Object.assign(document.createElement("button"), {
      type: "button", className: "danger", textContent: "Remover"
    });
    const update = () => {
      const list = [...sync.quickReplies];
      list[index] = { shortcut: shortcut.value.trim(), text: text.value };
      saveSync({ quickReplies: list });
    };
    shortcut.addEventListener("change", update);
    text.addEventListener("change", update);
    remove.addEventListener("click", () => {
      saveSync({ quickReplies: sync.quickReplies.filter((_, i) => i !== index) });
    });
    row.append(shortcut, text, remove);
    repliesBox.append(row);
  });
}
$("#addReply").addEventListener("click", () => {
  saveSync({ quickReplies: [...(sync.quickReplies || []), { shortcut: "/", text: "" }] });
});

// ---------- Listas (conversas protegidas, notas) ----------
function listItem(title, subtitle, buttonLabel, onClick) {
  const li = document.createElement("li");
  const text = document.createElement("span");
  text.className = "text";
  const b = document.createElement("b");
  b.textContent = title;
  text.append(b);
  if (subtitle) {
    const small = document.createElement("small");
    small.textContent = subtitle;
    text.append(small);
  }
  const btn = Object.assign(document.createElement("button"), {
    type: "button", className: "danger", textContent: buttonLabel
  });
  btn.addEventListener("click", onClick);
  li.append(text, btn);
  return li;
}
function emptyItem(text) {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  return li;
}

function renderProtected() {
  const ul = $("#protectedList");
  ul.textContent = "";
  const list = local.protectedChats || [];
  if (list.length === 0) ul.append(emptyItem("Nenhuma conversa protegida ainda."));
  for (const name of list) {
    ul.append(listItem(name, "", "Remover", () => {
      saveLocal({ protectedChats: local.protectedChats.filter((n) => n !== name) });
    }));
  }
}

function renderNotes() {
  const ul = $("#notesList");
  ul.textContent = "";
  const entries = Object.entries(local.notes || {});
  if (entries.length === 0) ul.append(emptyItem("Nenhuma nota salva."));
  for (const [name, note] of entries) {
    ul.append(listItem(name, note.replace(/\s+/g, " ").slice(0, 120), "Apagar", () => {
      if (!confirm(`Apagar a nota de "${name}"?`)) return;
      const notes = { ...local.notes };
      delete notes[name];
      saveLocal({ notes });
    }));
  }
}

// ---------- PIN ----------
function renderPin() {
  $("#pinStatus").textContent = local.pinHash
    ? "PIN definido. O desbloqueio pede o PIN."
    : "Sem PIN: o bloqueio abre com um clique.";
  $("#pinRemove").style.display = local.pinHash ? "" : "none";
}
function pinMessage(text, isError = false) {
  const el = $("#pinMsg");
  el.textContent = text;
  el.classList.toggle("error", isError);
}
$("#pinForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const p1 = $("#pin1").value;
  const p2 = $("#pin2").value;
  if (p1.length < 4) return pinMessage("O PIN precisa ter pelo menos 4 caracteres.", true);
  if (p1 !== p2) return pinMessage("Os PINs não são iguais.", true);
  await saveLocal({ pinHash: await WPP_hashPin(p1) });
  $("#pin1").value = $("#pin2").value = "";
  pinMessage("PIN salvo.");
});
$("#pinRemove").addEventListener("click", async () => {
  if (!confirm("Remover o PIN? O bloqueio passará a abrir com um clique.")) return;
  await saveLocal({ pinHash: "" });
  pinMessage("PIN removido.");
});

// ---------- Atalhos ----------
chrome.commands.getAll((commands) => {
  const ul = $("#commands");
  for (const cmd of commands) {
    if (!cmd.description) continue;
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = cmd.description;
    const key = document.createElement("kbd");
    key.textContent = cmd.shortcut || "não definido";
    li.append(label, key);
    ul.append(li);
  }
});
$("#editShortcuts").addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));

// ---------- Carregar e manter em sincronia ----------
function renderAll() {
  renderBound();
  renderKeywords();
  renderReplies();
  renderProtected();
  renderNotes();
  renderPin();
}

Promise.all([chrome.storage.sync.get(WPP_DEFAULTS), chrome.storage.local.get(WPP_LOCAL_DEFAULTS)])
  .then(([s, l]) => {
    sync = s;
    local = l;
    renderAll();
  });

chrome.storage.onChanged.addListener((changes, area) => {
  const target = area === "sync" ? sync : area === "local" ? local : null;
  if (!target) return;
  const defaults = area === "sync" ? WPP_DEFAULTS : WPP_LOCAL_DEFAULTS;
  for (const [key, { newValue }] of Object.entries(changes)) {
    target[key] = newValue === undefined ? defaults[key] : newValue;
  }
  renderAll();
});
