// Configurações padrão, compartilhadas entre content script, background e popup.
globalThis.WPP_DEFAULTS = Object.freeze({
  enabled: true,        // chave geral
  blurMessages: true,   // mensagens da conversa aberta (texto, fotos, vídeos, áudios)
  blurPreviews: true,   // prévia da última mensagem na lista de conversas
  blurNames: false,     // nomes dos contatos/grupos
  blurAvatars: false,   // fotos de perfil
  blurInput: false,     // caixa de digitação
  blurOnLeave: true,    // borra a tela inteira quando a janela perde o foco
  intensity: 8          // intensidade do blur, em px
});

// Flags booleanas que viram classes no <html> (ex.: "wpp-blurMessages").
globalThis.WPP_FLAGS = Object.freeze([
  "blurMessages",
  "blurPreviews",
  "blurNames",
  "blurAvatars",
  "blurInput",
  "blurOnLeave"
]);
