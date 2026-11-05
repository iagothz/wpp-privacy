# WPP Privacy

Extensão para Chrome/Edge que protege suas conversas no **WhatsApp Web** de olhares curiosos. Mensagens, prévias, nomes e fotos ficam borrados e aparecem quando você passa o mouse.

![ícone](icons/icon128.png)

## Funções

| Opção | Padrão | O que faz |
|---|---|---|
| Mensagens da conversa | ✅ | Borra cada mensagem (texto, foto, vídeo, áudio); o hover revela uma por vez |
| Prévia na lista de conversas | ✅ | Borra a última mensagem mostrada na lista |
| Nomes de contatos e grupos | ✅ | Borra nomes na lista de conversas e no topo da conversa; o hover na conversa revela |
| Fotos de perfil | ✅ | Borra fotos na lista de conversas e no topo da conversa; o hover na conversa revela |
| Caixa de digitação | ⬜ | Borra o que você está escrevendo (revela no hover/foco) |
| Tela toda ao sair da janela | ✅ | Borra tudo quando a janela perde o foco |
| Intensidade | 8px | Ajustável de 2 a 20px |

**Atalho:** `Alt+Shift+X` liga/desliga tudo (dá para mudar em `chrome://extensions/shortcuts`).

## Instalação (modo desenvolvedor)

1. Baixe ou clone este repositório:
   ```bash
   git clone https://github.com/iagothz/wpp-privacy.git
   ```
2. Abra `chrome://extensions` (ou `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e escolha a pasta `wpp-privacy`.
5. Abra ou recarregue o [WhatsApp Web](https://web.whatsapp.com).

## Privacidade e segurança

- A extensão **só altera a aparência** da página com CSS. Ela não lê, guarda nem envia o conteúdo das suas mensagens.
- Única permissão: `storage`, para lembrar suas preferências.
- Não automatiza nenhuma ação na sua conta, então não há risco de banimento por uso de automação.

## Estrutura

```
manifest.json        Manifest V3
src/defaults.js      configurações padrão (compartilhadas)
src/content.js       aplica as opções como classes no <html> e marca nomes/prévias
src/content.css      regras de blur
src/background.js    atalho de teclado e badge "OFF"
popup/               tela de opções
icons/               ícones
```

## Quando o WhatsApp atualizar e algo parar de borrar

O WhatsApp muda o HTML com frequência. Os seletores ficam concentrados em `src/content.css` e no início de `src/content.js`. Inspecione o elemento (F12), ajuste o seletor e recarregue a extensão em `chrome://extensions`.

## Aviso

Projeto independente, sem qualquer relação com o WhatsApp ou a Meta.

## Licença

[MIT](LICENSE)
