chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith("http")) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["content.css"]
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 100 }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true; // Keep the message channel open for the async response
  }
});