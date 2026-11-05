// Configurações e utilidades compartilhadas entre content scripts, background, popup e opções.

// Preferências (chrome.storage.sync: acompanham sua conta do navegador).
globalThis.WPP_DEFAULTS = Object.freeze({
  // Blur
  enabled: true,          // chave geral do blur
  blurMessages: true,     // mensagens da conversa aberta
  blurPreviews: true,     // prévia da última mensagem na lista
  blurNames: true,        // nomes (lista e topo da conversa)
  blurAvatars: true,      // fotos de perfil
  blurInput: false,       // caixa de digitação
  blurOnLeave: true,      // borra a tela inteira quando a janela perde o foco
  intensity: 8,           // px
  scope: "all",           // "all" = todas as conversas | "selected" = só as protegidas
  revealMode: "hover",    // "hover" | "click" | "none"
  ctrlReveal: true,       // segurar Ctrl revela tudo
  hidePresence: false,    // esconde "online", "digitando...", "visto por último"

  // Pânico e bloqueio
  panicStyle: "sheet",    // "sheet" (planilha falsa) | "blank" (página em branco)
  idleMinutes: 0,         // 0 = desligado

  // Escrita
  quickReplies: [
    { shortcut: "/oi", text: "Olá! Tudo bem?" },
    { shortcut: "/obg", text: "Muito obrigado!" }
  ],
  formatShortcuts: true,  // Ctrl+B, Ctrl+I, Ctrl+Shift+X, Ctrl+Shift+K
  charCounter: false,
  notesEnabled: true,

  // Visual
  fullWidth: false,
  compact: false,
  fontScale: 100,         // %
  theme: "default",       // "default" | chave de WPP_THEMES | "custom"
  customOutgoing: "#d9fdd3",
  customIncoming: "#ffffff",
  customBackground: "#efeae2",
  keywords: []            // palavras destacadas nas mensagens
});

// Estado local (chrome.storage.local: fica só neste computador).
globalThis.WPP_LOCAL_DEFAULTS = Object.freeze({
  protectedChats: [],     // nomes das conversas protegidas
  notes: {},              // { "Nome da conversa": "texto" }
  pinHash: "",            // SHA-256 do PIN de bloqueio
  panic: false,
  locked: false,
  presentation: false
});

// Opções booleanas de blur que viram classes no <html> (ex.: "wpp-blurMessages").
globalThis.WPP_BLUR_FLAGS = Object.freeze([
  "blurMessages",
  "blurPreviews",
  "blurNames",
  "blurAvatars",
  "blurInput",
  "blurOnLeave"
]);

// Temas: cores dos balões e do fundo da conversa, para modo claro e escuro.
globalThis.WPP_THEMES = Object.freeze({
  ocean: {
    label: "Oceano",
    light: { out: "#cfe9ff", in: "#ffffff", bg: "#e6eef5" },
    dark: { out: "#0b4a6f", in: "#1f2c34", bg: "#0b141a" }
  },
  lavender: {
    label: "Lavanda",
    light: { out: "#e7dcff", in: "#ffffff", bg: "#f1ecf7" },
    dark: { out: "#4a3a7a", in: "#1f2c34", bg: "#120f1a" }
  },
  rose: {
    label: "Rosé",
    light: { out: "#ffdce6", in: "#ffffff", bg: "#f7eef0" },
    dark: { out: "#6b2c45", in: "#1f2c34", bg: "#160d11" }
  },
  graphite: {
    label: "Grafite",
    light: { out: "#e3e3e3", in: "#ffffff", bg: "#f2f2f2" },
    dark: { out: "#3a3f44", in: "#24282c", bg: "#111315" }
  }
});

// Hash do PIN (o PIN em si nunca é guardado).
globalThis.WPP_hashPin = async (pin) => {
  const data = new TextEncoder().encode(`wpp-privacy:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
