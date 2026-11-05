// Aplica as opções de blur como classes no <html> e cuida dos modos de revelar.
(() => {
  const { root } = WPP;

  function apply() {
    const s = WPP.effective();
    root.classList.toggle("wpp-on", !!s.enabled);
    for (const flag of WPP_BLUR_FLAGS) root.classList.toggle(`wpp-${flag}`, !!s[flag]);
    root.classList.toggle("wpp-reveal-hover", s.revealMode === "hover");
    root.classList.toggle("wpp-reveal-click", s.revealMode === "click");
    root.classList.toggle("wpp-hidePresence", !!s.hidePresence);
    root.classList.toggle("wpp-presenting", !!WPP.local().presentation);
    const px = Math.max(1, Math.min(30, Number(s.intensity) || WPP_DEFAULTS.intensity));
    root.style.setProperty("--wpp-blur", `${px}px`);
    if (!s.ctrlReveal) root.classList.remove("wpp-ctrl-reveal");
  }
  WPP.onSettings(apply);

  // ---------- Segurar Ctrl revela tudo ----------
  const setCtrl = (on) => {
    const s = WPP.effective();
    root.classList.toggle("wpp-ctrl-reveal", on && s.enabled && s.ctrlReveal);
  };
  window.addEventListener("keydown", (e) => { if (e.key === "Control") setCtrl(true); }, true);
  window.addEventListener("keyup", (e) => { if (e.key === "Control") setCtrl(false); }, true);
  window.addEventListener("blur", () => setCtrl(false));

  // ---------- Clique para revelar ----------
  // O primeiro clique numa mensagem borrada só revela (não abre foto, link etc.).
  // Ela volta a borrar quando o mouse sai.
  window.addEventListener("click", (e) => {
    const s = WPP.effective();
    if (!s.enabled || !s.blurMessages || s.revealMode !== "click") return;
    if (!root.classList.contains("wpp-target-open")) return;
    const msg = e.target.closest?.('[data-wpp="msg"]');
    if (!msg || msg.hasAttribute("data-wpp-revealed")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    msg.setAttribute("data-wpp-revealed", "");
    msg.addEventListener("mouseleave", () => msg.removeAttribute("data-wpp-revealed"), { once: true });
  }, true);

  // ---------- Saiu da janela: borra tudo ----------
  const setAway = (away) => root.classList.toggle("wpp-away", away);
  window.addEventListener("blur", () => setAway(true));
  window.addEventListener("focus", () => setAway(false));
  document.addEventListener("visibilitychange", () => setAway(document.hidden));
})();
