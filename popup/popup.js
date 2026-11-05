const inputs = document.querySelectorAll("[data-key]");
const options = document.getElementById("options");
const intensityValue = document.getElementById("intensityValue");
const panicBtn = document.getElementById("panic");
const presentationBtn = document.getElementById("presentation");

function renderSync(s) {
  for (const input of inputs) {
    const value = s[input.dataset.key];
    if (input.type === "checkbox") input.checked = !!value;
    else input.value = value;
  }
  intensityValue.textContent = `(${s.intensity}px)`;
  options.classList.toggle("disabled", !s.enabled);
}

function renderLocal(l) {
  panicBtn.classList.toggle("active", !!l.panic);
  presentationBtn.classList.toggle("active", !!l.presentation);
}

const loadSync = () => chrome.storage.sync.get(WPP_DEFAULTS, renderSync);
const loadLocal = () => chrome.storage.local.get(WPP_LOCAL_DEFAULTS, renderLocal);
loadSync();
loadLocal();

// Mantém o popup em sincronia se um atalho mudar algo enquanto ele está aberto.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") loadSync();
  if (area === "local") loadLocal();
});

for (const input of inputs) {
  const event = input.type === "range" ? "input" : "change";
  input.addEventListener(event, () => {
    const key = input.dataset.key;
    let value = input.value;
    if (input.type === "checkbox") value = input.checked;
    else if (input.type === "range") value = Number(value);
    chrome.storage.sync.set({ [key]: value });
  });
}

async function toggleLocal(key) {
  const current = await chrome.storage.local.get({ [key]: false });
  await chrome.storage.local.set({ [key]: !current[key] });
}
panicBtn.addEventListener("click", () => toggleLocal("panic"));
presentationBtn.addEventListener("click", () => toggleLocal("presentation"));
document.getElementById("lock").addEventListener("click", () => {
  chrome.storage.local.set({ locked: true });
  window.close();
});

chrome.commands.getAll((commands) => {
  const cmd = commands.find((c) => c.name === "toggle-privacy");
  document.getElementById("shortcut").textContent = cmd?.shortcut || "—";
});

document.getElementById("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
