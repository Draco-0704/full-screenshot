(function () {
  if (document.getElementById('screenshot-overlay')) {
    return; // Already injected
  }

  const overlay = document.createElement('div');
  overlay.id = 'screenshot-overlay';
  document.body.appendChild(overlay);

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  overlay.appendChild(backdrop);

  let selection = null;
  let selRect = { left: 0, top: 0, width: 0, height: 0 };
  let isDrawing = false;
  let isDragging = false;
  let isResizing = false;
  let resizeHandle = null;
  let startX, startY;
  let handlesCreated = false;

  // Initial prompt hint
  const initialHint = document.createElement('div');
  initialHint.className = 'hint';
  initialHint.innerText = 'Click and drag to select an area.';
  initialHint.style.position = 'absolute';
  initialHint.style.top = '10px';
  initialHint.style.left = '10px';
  initialHint.style.zIndex = '2147483647';
  backdrop.appendChild(initialHint);

  function createHandles() {
    if (handlesCreated) return;
    const positions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle handle-${pos}`;
      handle.dataset.pos = pos;
      selection.appendChild(handle);
    });
    handlesCreated = true;
  }

  function renderSelection() {
    if (!selection) {
      selection = document.createElement('div');
      selection.className = 'selection';

      const controls = document.createElement('div');
      controls.className = 'controls';

      const btnDone = document.createElement('button');
      btnDone.innerText = 'Done / OK';
      btnDone.onclick = captureAndSave;

      const btnCancel = document.createElement('button');
      btnCancel.className = 'cancel';
      btnCancel.innerText = 'Cancel';
      btnCancel.onclick = closeOverlay;

      controls.appendChild(btnCancel);
      controls.appendChild(btnDone);
      selection.appendChild(controls);

      overlay.appendChild(selection);
      initialHint.remove(); // Remove initial dragging hint
    }

    createHandles();

    // Convert document coordinates to viewport coordinates for the fixed overlay
    const viewportTop = selRect.top - window.scrollY;
    const viewportLeft = selRect.left - window.scrollX;

    selection.style.left = viewportLeft + 'px';
    selection.style.top = viewportTop + 'px';
    selection.style.width = selRect.width + 'px';
    selection.style.height = selRect.height + 'px';

    // Hide part of the backdrop where selection is by using a polygon clip-path
    // This makes the selected area "cut out" of the dimming overlay
    const t = viewportTop, r = viewportLeft + selRect.width, b = viewportTop + selRect.height, l = viewportLeft;
    backdrop.style.clipPath = `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
  }

  // Mouse event handlers
  function handleMouseDown(e) {
    if (e.target.classList.contains('resize-handle')) {
      isResizing = true;
      resizeHandle = e.target.dataset.pos;
      startX = e.clientX;
      startY = e.clientY;
      e.stopPropagation();
      return;
    }

    if (e.target.closest('.controls')) return; // Ignore clicks on buttons

    if (selection && selection.contains(e.target) && e.target !== selection) {
      // If clicking inside selection but not on controls/handles
      // We handle selection drag
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      return;
    }

    if (e.target === selection || e.target.closest('.selection')) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      return;
    }

    // New selection drawing
    isDrawing = true;
    startX = e.clientX + window.scrollX;
    startY = e.clientY + window.scrollY;
    selRect = { left: startX, top: startY, width: 0, height: 0 };
    if (selection) {
      selection.style.display = 'none'; // Hide current while drawing new
    }
    document.body.style.userSelect = 'none'; // prevent text selection
  }

  function handleMouseMove(e) {
    if (isDrawing) {
      const currentX = e.clientX + window.scrollX;
      const currentY = e.clientY + window.scrollY;

      selRect.left = Math.min(startX, currentX);
      selRect.top = Math.min(startY, currentY);
      selRect.width = Math.abs(currentX - startX);
      selRect.height = Math.abs(currentY - startY);

      if (selection) selection.style.display = 'block';
      renderSelection();
    } else if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      selRect.left += dx;
      selRect.top += dy;

      startX = e.clientX;
      startY = e.clientY;
      renderSelection();
    } else if (isResizing) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (resizeHandle.includes('e')) {
        selRect.width += dx;
      }
      if (resizeHandle.includes('s')) {
        selRect.height += dy;
      }
      if (resizeHandle.includes('w')) {
        selRect.left += dx;
        selRect.width -= dx;
      }
      if (resizeHandle.includes('n')) {
        selRect.top += dy;
        selRect.height -= dy;
      }

      // Prevent negative size
      if (selRect.width < 0) { selRect.left += selRect.width; selRect.width = Math.abs(selRect.width); resizeHandle = resizeHandle.replace('w', 'e'); }
      if (selRect.height < 0) { selRect.top += selRect.height; selRect.height = Math.abs(selRect.height); resizeHandle = resizeHandle.replace('n', 's'); }

      startX = e.clientX;
      startY = e.clientY;
      renderSelection();
    }
  }

  function handleMouseUp(e) {
    isDrawing = false;
    isDragging = false;
    isResizing = false;
    document.body.style.userSelect = '';

    // Ensure min size after drawing
    if (selRect.width < 20 || selRect.height < 20) {
      if (!selection) {
        // Default if just clicked without dragging
        selRect = {
          left: window.scrollX + (window.innerWidth - 400) / 2,
          top: window.scrollY + (window.innerHeight - 300) / 2,
          width: 400, height: 300
        };
      }
    }
    renderSelection();
  }

  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('scroll', () => { if (selection) renderSelection(); });

  // Handle keyboard events (keep basic support)
  function handleKeyDown(e) {
    if (e.key === 'Escape') closeOverlay();
  }

  window.addEventListener('keydown', handleKeyDown);

  function closeOverlay() {
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handleKeyDown);
    backdrop.style.clipPath = 'none'; // reset
    overlay.remove();
  }

  async function captureAndSave() {
    // Hide UI
    overlay.style.display = 'none';

    // Preparation: Hide scrollbars and disable smooth scrolling
    const originalOverflow = document.documentElement.style.overflow;
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.scrollBehavior = 'auto';

    // Find and hide fixed/sticky elements
    const hiddenElements = [];
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          hiddenElements.push({ el, originalVisibility: el.style.visibility });
          el.style.visibility = 'hidden';
        }
      }
    });

    try {
      let dpr = window.devicePixelRatio || 1;

      // Calculate max width/height
      let canvasWidth = selRect.width * dpr;
      let canvasHeight = selRect.height * dpr;

      // Canvas memory limit safety check (16384 is a common browser limit for canvas size)
      const MAX_DIMENSION = 16000;
      if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / canvasWidth, MAX_DIMENSION / canvasHeight);
        dpr = dpr * scale;
        canvasWidth = selRect.width * dpr;
        canvasHeight = selRect.height * dpr;
        console.warn('Selection too large, scaling down devicePixelRatio to fit canvas memory limits.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      let currentY = selRect.top;
      const endY = selRect.top + selRect.height;
      const viewportHeight = window.innerHeight;

      const endX = selRect.left + selRect.width;
      const viewportWidth = window.innerWidth;

      // We need to iterate over Y and X
      while (currentY < endY) {
        let currentX = selRect.left;
        while (currentX < endX) {
          window.scrollTo(currentX, currentY);
          // Wait a tiny bit for render
          await new Promise(r => setTimeout(r, 150));

          const actualScrollX = window.scrollX;
          const actualScrollY = window.scrollY;

          // Capture visible tab
          const dataUrl = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, resolve);
          });

          const img = new Image();
          img.src = dataUrl;
          await new Promise(r => img.onload = r);

          const intersectTop = Math.max(actualScrollY, selRect.top);
          const intersectBottom = Math.min(actualScrollY + viewportHeight, endY);
          const intersectHeight = intersectBottom - intersectTop;

          const intersectLeft = Math.max(actualScrollX, selRect.left);
          const intersectRight = Math.min(actualScrollX + viewportWidth, endX);
          const intersectWidth = intersectRight - intersectLeft;

          if (intersectHeight > 0 && intersectWidth > 0) {
            const sourceX = intersectLeft - actualScrollX;
            const sourceY = intersectTop - actualScrollY;
            const destX = intersectLeft - selRect.left;
            const destY = intersectTop - selRect.top;

            ctx.drawImage(
              img,
              sourceX * (window.devicePixelRatio || 1), sourceY * (window.devicePixelRatio || 1), intersectWidth * (window.devicePixelRatio || 1), intersectHeight * (window.devicePixelRatio || 1),
              destX * dpr, destY * dpr, intersectWidth * dpr, intersectHeight * dpr
            );
          }

          currentX += viewportWidth;
        }
        currentY += viewportHeight;
      }

      // Save via Preview Tab
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      chrome.runtime.sendMessage({ action: 'openPreview', dataUrl: finalDataUrl }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          // Fallback if background message fails
          const a = document.createElement('a');
          a.href = finalDataUrl;
          a.download = 'screenshot_fallback.jpg';
          a.click();
        }
      });

    } catch (err) {
      console.error(err);
      alert('Failed to capture screenshot');
    } finally {
      // Restore elements
      hiddenElements.forEach(item => item.el.style.visibility = item.originalVisibility);
      document.documentElement.style.overflow = originalOverflow;
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      closeOverlay();
    }
  }
})();