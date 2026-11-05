const DEFAULTS = globalThis.WPP_DEFAULTS;
const inputs = document.querySelectorAll("[data-key]");
const options = document.getElementById("options");
const intensityValue = document.getElementById("intensityValue");

function render(settings) {
  for (const input of inputs) {
    const value = settings[input.dataset.key];
    if (input.type === "checkbox") input.checked = !!value;
    else input.value = value;
  }
  intensityValue.textContent = `(${settings.intensity}px)`;
  options.classList.toggle("disabled", !settings.enabled);
}

chrome.storage.sync.get(DEFAULTS, render);

// Mantém o popup em sincronia se o atalho de teclado mudar algo enquanto está aberto.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") chrome.storage.sync.get(DEFAULTS, render);
});

for (const input of inputs) {
  const event = input.type === "range" ? "input" : "change";
  input.addEventListener(event, () => {
    const key = input.dataset.key;
    const value = input.type === "checkbox" ? input.checked : Number(input.value);
    chrome.storage.sync.set({ [key]: value });
  });
}

// Mostra o atalho configurado de verdade (o usuário pode ter mudado).
chrome.commands.getAll((commands) => {
  const cmd = commands.find((c) => c.name === "toggle-privacy");
  document.getElementById("shortcut").textContent = cmd?.shortcut || "não definido";
});

document.getElementById("shortcuts").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
