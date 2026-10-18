chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkSafetyWithAssistant",
    title: "Check Safety with Payment Assistant",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "checkSafetyWithAssistant" && info.selectionText) {
    // Save selected text to local storage so popup can pre-fill it immediately
    await chrome.storage.local.set({ pendingAnalysisText: info.selectionText });
  }
});
