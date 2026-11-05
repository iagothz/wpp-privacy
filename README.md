# WPP Privacy

Extensão para Chrome/Edge com funções de **privacidade e utilidade para o WhatsApp Web**. Tudo roda só no seu navegador: a extensão muda a aparência da página e guarda suas preferências localmente. Nada é enviado para servidor nenhum e nenhuma ação é automatizada na sua conta.

![ícone](icons/icon128.png)

## Funções

### 🔒 Privacidade
- **Blur** em mensagens, prévias da lista, nomes, fotos de perfil e caixa de digitação, com intensidade ajustável.
- **Revelar com:** passar o mouse, clique (o 1º clique só revela, não abre foto ou link) ou só segurando Ctrl.
- **Segurar Ctrl** revela tudo enquanto a tecla estiver pressionada.
- **Conversas protegidas:** clique no 🔒 abaixo do cabeçalho da conversa e escolha "Só as protegidas" para borrar apenas essas conversas.
- **Esconder presença:** oculta "online", "visto por último", "digitando..." e "gravando áudio...".
- **Tela toda ao sair da janela:** borra tudo quando o WhatsApp perde o foco.
- **Modo apresentação** (`Alt+Shift+P`): tudo borrado, sem revelar, botões escondidos. Ideal para compartilhar a tela. O ícone mostra "APR".

### 🚨 Pânico e bloqueio
- **Botão de pânico** (`Alt+Shift+Z`): cobre a tela com uma planilha em branco (ou página vazia) e troca o título da aba. Aperte de novo para voltar.
- **Bloqueio** (`Alt+Shift+L` ou após X minutos sem uso): a tela fica borrada e pede o **PIN** (se definido nas opções). O PIN é guardado só como hash.

### ✍️ Escrita
- **Respostas rápidas:** digite `/oi` + Espaço (ou Tab) e o atalho vira o texto completo. Você configura os atalhos. Nada é enviado sozinho.
- **Atalhos de formatação:** `Ctrl+B` *negrito*, `Ctrl+I` _itálico_, `Ctrl+Shift+X` ~tachado~, `Ctrl+Shift+K` ```mono```.
- **Contador de caracteres** acima da caixa de digitação.

### 📝 Notas por conversa
Clique no 📝 abaixo do cabeçalho para abrir um bloco de anotações daquela conversa. Ele salva automaticamente, só neste computador. Um ponto verde indica que a conversa tem nota.

### 🎨 Visual
- **Largura total** em monitores largos.
- **Modo compacto** (menos espaço entre mensagens).
- **Tamanho da fonte** de 80% a 150%.
- **Temas:** Oceano, Lavanda, Rosé, Grafite ou cores personalizadas (claro e escuro).
- **Palavras-chave em destaque:** realce amarelo nas palavras escolhidas e uma marca lateral na mensagem, visível mesmo com blur.

## Atalhos

| Atalho | Ação |
|---|---|
| `Alt+Shift+X` | Liga/desliga o blur |
| `Alt+Shift+Z` | Botão de pânico |
| `Alt+Shift+P` | Modo apresentação |
| `Alt+Shift+L` | Bloquear agora |

Dá para trocar em `chrome://extensions/shortcuts`.

## Instalação (modo desenvolvedor)

1. Baixe ou clone este repositório:
   ```bash
   git clone https://github.com/iagothz/wpp-privacy.git
   ```
2. Abra `chrome://extensions` (ou `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e escolha a pasta `wpp-privacy`.
5. Abra ou recarregue o [WhatsApp Web](https://web.whatsapp.com).

O popup tem os controles rápidos. Em **Todas as opções** ficam respostas rápidas, PIN, notas, temas e palavras-chave.

## Privacidade e segurança

- Única permissão: `storage`. A extensão não tem acesso à rede.
- Textos da página (nomes, mensagens) só são lidos **localmente**, para comparar com suas conversas protegidas e palavras-chave. Nunca saem do navegador.
- O bloqueio e o pânico protegem contra olhares, não são segurança forte: quem usa o computador pode desativar a extensão.
- Nenhuma ação é automatizada (envio, leitura, marcação), então não há risco de banimento.

## Estrutura

```
manifest.json              Manifest V3
src/defaults.js            configurações padrão, temas, hash do PIN
src/core.js                configurações, observador do DOM, helpers, Shadow DOM
src/content.css            regras de blur e visual
src/features/tagging.js    marca mensagens, nomes, prévias e presença (data-wpp-*)
src/features/blur.js       classes de blur, revelar por mouse/clique/Ctrl, saída da janela
src/features/overlays.js   pânico e bloqueio com PIN
src/features/composer.js   respostas rápidas, formatação, contador
src/features/chat-tools.js botões 🔒/📝 e painel de notas
src/features/visual.js     largura, compacto, fonte, temas, palavras-chave
src/background.js          atalhos de teclado e badge
popup/                     controles rápidos
options/                   página de opções completa
```

## Quando o WhatsApp atualizar e algo parar de funcionar

O WhatsApp muda o HTML com frequência. Quase todos os seletores ficam em `src/features/tagging.js` e `src/content.css`. Inspecione o elemento (F12), ajuste o seletor e recarregue a extensão em `chrome://extensions`.

## Aviso

Projeto independente, sem qualquer relação com o WhatsApp ou a Meta.

## Licença

[MIT](LICENSE)
