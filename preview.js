document.addEventListener("DOMContentLoaded", () => {
    const previewImage = document.getElementById("previewImage");
    const downloadBtn = document.getElementById("downloadBtn");
    const copyBtn = document.getElementById("copyBtn");
    let currentDataUrl = "";

    chrome.storage.local.get(["capturedImage"], (result) => {
        if (result.capturedImage) {
            currentDataUrl = result.capturedImage;
            previewImage.src = currentDataUrl;
            // Clean up storage since we don't need it forever
            chrome.storage.local.remove(["capturedImage"]);
        } else {
            previewImage.alt = "No image found in storage.";
        }
    });

    downloadBtn.addEventListener("click", () => {
        if (!currentDataUrl) return;
        const a = document.createElement("a");
        a.href = currentDataUrl;
        a.download = "screenshot_" + new Date().getTime() + ".jpg";
        a.click();
    });

    copyBtn.addEventListener("click", async () => {
        if (!currentDataUrl) return;
        try {
            // Data URLs need to be converted to Blobs for clipboard api
            const response = await fetch(currentDataUrl);
            const blob = await response.blob();

            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);

            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        } catch (e) {
            console.error("Copy failed", e);
            alert("Failed to copy image to clipboard.");
        }
    });
});
