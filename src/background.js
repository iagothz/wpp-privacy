importScripts("defaults.js");

// Atalho de teclado (Alt+Shift+X por padrão) liga/desliga a extensão.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-privacy") return;
  const { enabled } = await chrome.storage.sync.get({ enabled: WPP_DEFAULTS.enabled });
  await chrome.storage.sync.set({ enabled: !enabled });
});

// Mostra "OFF" no ícone quando desligada.
async function updateBadge() {
  const { enabled } = await chrome.storage.sync.get({ enabled: WPP_DEFAULTS.enabled });
  await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
  await chrome.action.setBadgeBackgroundColor({ color: "#8a8a8a" });
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && "enabled" in changes) updateBadge();
});
