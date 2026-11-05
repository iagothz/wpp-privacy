importScripts("defaults.js");

// Atalhos de teclado (podem ser trocados em chrome://extensions/shortcuts).
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-privacy") {
    const { enabled } = await chrome.storage.sync.get({ enabled: WPP_DEFAULTS.enabled });
    await chrome.storage.sync.set({ enabled: !enabled });
  } else if (command === "panic") {
    const { panic } = await chrome.storage.local.get({ panic: false });
    await chrome.storage.local.set({ panic: !panic });
  } else if (command === "presentation") {
    const { presentation } = await chrome.storage.local.get({ presentation: false });
    await chrome.storage.local.set({ presentation: !presentation });
  } else if (command === "lock") {
    await chrome.storage.local.set({ locked: true });
  }
});

// Badge no ícone: "APR" no modo apresentação, "OFF" com o blur desligado.
async function updateBadge() {
  const { enabled } = await chrome.storage.sync.get({ enabled: WPP_DEFAULTS.enabled });
  const { presentation } = await chrome.storage.local.get({ presentation: false });
  const text = presentation ? "APR" : enabled ? "" : "OFF";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: presentation ? "#d93025" : "#8a8a8a" });
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener((changes) => {
  if ("enabled" in changes || "presentation" in changes) updateBadge();
});
