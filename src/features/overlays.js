// Botão de pânico (cobre a tela com uma capa neutra) e bloqueio por inatividade com PIN.
// Observação: é uma proteção contra olhares, não segurança forte. Quem tem acesso ao
// computador pode desativar a extensão.
(() => {
  // ======================= Pânico =======================
  const PANIC_CSS = `
    :host { all: initial; }
    .cover {
      position: fixed; inset: 0; z-index: 2147483646; display: none;
      font: 13px/1.4 Arial, Helvetica, sans-serif; color: #202124; background: #fff;
      cursor: default; user-select: none;
    }
    .cover.show { display: block; }
    .blank { background: #fff; }
    .sheet .bar { height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 16px;
      border-bottom: 1px solid #e0e0e0; }
    .sheet .logo { width: 28px; height: 36px; border-radius: 3px; background: #0f9d58; }
    .sheet .title { font-size: 18px; }
    .sheet .menu { display: flex; gap: 14px; color: #5f6368; font-size: 13px; margin-top: 2px; }
    .sheet .toolbar { height: 38px; margin: 8px 16px; border-radius: 20px; background: #edf2fa; }
    .sheet .formula { height: 26px; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; }
    .sheet .grid {
      position: absolute; top: 158px; left: 0; right: 0; bottom: 0;
      background-color: #fff;
      background-image:
        linear-gradient(#e2e2e2 1px, transparent 1px),
        linear-gradient(90deg, #e2e2e2 1px, transparent 1px);
      background-size: 100px 21px;
      background-position: 46px 0;
      border-left: 46px solid #f8f9fa;
    }
    .blank > * { display: none; }
  `;

  const panic = WPP.createHost("wpp-panic", PANIC_CSS);
  panic.box.insertAdjacentHTML("beforeend", `
    <div class="cover sheet">
      <div class="bar">
        <div class="logo"></div>
        <div><div class="title">Planilha sem título</div>
          <div class="menu"><span>Arquivo</span><span>Editar</span><span>Ver</span><span>Inserir</span><span>Formatar</span><span>Dados</span><span>Ferramentas</span></div>
        </div>
      </div>
      <div class="toolbar"></div>
      <div class="formula"></div>
      <div class="grid"></div>
    </div>
  `);
  const cover = panic.shadow.querySelector(".cover");

  // Título da aba também fica neutro (o WhatsApp mostra contagem de não lidas).
  const PANIC_TITLES = { sheet: "Planilha sem título", blank: "Nova guia" };
  let savedTitle = null;
  let titleObserver = null;

  function maskTitle(style) {
    const wanted = PANIC_TITLES[style] || PANIC_TITLES.sheet;
    if (savedTitle === null) savedTitle = document.title;
    if (document.title !== wanted) document.title = wanted;
    if (!titleObserver && document.head) {
      titleObserver = new MutationObserver(() => {
        if (document.title !== wanted) document.title = wanted;
      });
      titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    }
  }
  function restoreTitle() {
    titleObserver?.disconnect();
    titleObserver = null;
    if (savedTitle !== null) document.title = savedTitle;
    savedTitle = null;
  }

  function renderPanic() {
    const on = !!WPP.local().panic;
    const style = WPP.sync().panicStyle === "blank" ? "blank" : "sheet";
    cover.classList.toggle("show", on);
    cover.classList.toggle("sheet", style === "sheet");
    cover.classList.toggle("blank", style === "blank");
    if (on) {
      WPP.blockers.add(panic.host);
      maskTitle(style);
      document.activeElement?.blur?.();
    } else {
      WPP.blockers.delete(panic.host);
      restoreTitle();
    }
  }
  WPP.onSettings(renderPanic);

  // ======================= Bloqueio =======================
  const LOCK_CSS = `
    :host { all: initial; }
    .lock {
      position: fixed; inset: 0; z-index: 2147483645; display: none;
      place-items: center;
      background: rgba(17, 27, 33, .55);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #fff;
    }
    .lock.show { display: grid; }
    .box { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .icon { font-size: 40px; }
    h2 { margin: 0; font-size: 20px; font-weight: 600; }
    p { margin: 0; opacity: .8; font-size: 13px; }
    form { display: flex; gap: 8px; }
    input {
      width: 140px; padding: 9px 12px; border: 0; border-radius: 8px; outline: none;
      font: inherit; font-size: 18px; letter-spacing: .3em; text-align: center;
    }
    button {
      padding: 9px 16px; border: 0; border-radius: 8px; cursor: pointer;
      background: #00a884; color: #fff; font: inherit; font-weight: 600;
    }
    .error { min-height: 18px; color: #ffb4ab; font-size: 13px; }
    .shake { animation: shake .3s; }
    @keyframes shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
  `;

  const lock = WPP.createHost("wpp-lock", LOCK_CSS, { isolate: true });
  lock.box.insertAdjacentHTML("beforeend", `
    <div class="lock">
      <div class="box">
        <div class="icon">🔒</div>
        <h2>Bloqueado</h2>
        <p class="hint"></p>
        <form>
          <input type="password" inputmode="numeric" autocomplete="off" placeholder="PIN">
          <button type="submit">Desbloquear</button>
        </form>
        <div class="error"></div>
      </div>
    </div>
  `);
  const lockEl = lock.shadow.querySelector(".lock");
  const form = lock.shadow.querySelector("form");
  const input = lock.shadow.querySelector("input");
  const hint = lock.shadow.querySelector(".hint");
  const error = lock.shadow.querySelector(".error");

  function renderLock() {
    const { locked, pinHash } = WPP.local();
    const wasShown = lockEl.classList.contains("show");
    lockEl.classList.toggle("show", !!locked);
    input.style.display = pinHash ? "" : "none";
    hint.textContent = pinHash
      ? "Digite seu PIN para continuar."
      : "Sem PIN definido. Defina um nas opções da extensão para proteger o desbloqueio.";
    if (locked) {
      WPP.blockers.add(lock.host);
      if (!wasShown) {
        input.value = "";
        error.textContent = "";
        document.activeElement?.blur?.();
        setTimeout(() => (pinHash ? input : form.querySelector("button")).focus(), 0);
      }
    } else {
      WPP.blockers.delete(lock.host);
    }
  }
  WPP.onSettings(renderLock);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { pinHash } = WPP.local();
    if (pinHash && (await WPP_hashPin(input.value)) !== pinHash) {
      error.textContent = "PIN incorreto.";
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      input.select();
      return;
    }
    lastActivity = Date.now();
    WPP.setLocal({ locked: false });
  });

  // Inatividade: conta o tempo sem mouse/teclado nesta aba.
  let lastActivity = Date.now();
  const touch = () => { lastActivity = Date.now(); };
  for (const t of ["mousemove", "mousedown", "keydown", "wheel", "touchstart"]) {
    window.addEventListener(t, touch, { capture: true, passive: true });
  }
  setInterval(() => {
    const minutes = Number(WPP.sync().idleMinutes) || 0;
    const { locked, panic: panicOn } = WPP.local();
    if (minutes <= 0 || locked || panicOn) return;
    if (Date.now() - lastActivity >= minutes * 60_000) WPP.setLocal({ locked: true });
  }, 10_000);
})();
