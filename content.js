(function() {
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
  let selRect = { left: 100, top: 100, width: 400, height: 300 };

  // Initialize selection in the center of viewport
  selRect.left = (window.innerWidth - 400) / 2;
  selRect.top = window.scrollY + (window.innerHeight - 300) / 2;

  function renderSelection() {
    if (!selection) {
      selection = document.createElement('div');
      selection.className = 'selection';
      
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.innerText = 'Use Arrow keys to expand. Shift + Arrow to shrink.';
      selection.appendChild(hint);

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
      backdrop.style.display = 'none'; // Hide backdrop once selection exists
    }

    // Convert document coordinates to viewport coordinates for the fixed overlay
    const viewportTop = selRect.top - window.scrollY;
    const viewportLeft = selRect.left - window.scrollX;
    
    selection.style.left = viewportLeft + 'px';
    selection.style.top = viewportTop + 'px';
    selection.style.width = selRect.width + 'px';
    selection.style.height = selRect.height + 'px';
  }

  renderSelection();

  // Handle keyboard events
  function handleKeyDown(e) {
    const step = 50;
    if (e.key === 'Escape') {
      closeOverlay();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.shiftKey) {
        selRect.height = Math.max(step, selRect.height - step);
      } else {
        selRect.height += step;
        const viewportBottom = window.scrollY + window.innerHeight;
        if (selRect.top + selRect.height > viewportBottom - 100) {
          window.scrollBy(0, step);
        }
      }
      renderSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.shiftKey) {
        selRect.height = Math.max(step, selRect.height - step);
      } else {
        const oldTop = selRect.top;
        selRect.top = Math.max(0, selRect.top - step);
        selRect.height += (oldTop - selRect.top);
        if (selRect.top < window.scrollY + 100) {
          window.scrollBy(0, -step);
        }
      }
      renderSelection();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) {
        selRect.width = Math.max(step, selRect.width - step);
      } else {
        selRect.width += step;
        const viewportRight = window.scrollX + window.innerWidth;
        if (selRect.left + selRect.width > viewportRight - 100) {
          window.scrollBy(step, 0);
        }
      }
      renderSelection();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) {
        selRect.width = Math.max(step, selRect.width - step);
      } else {
        const oldLeft = selRect.left;
        selRect.left = Math.max(0, selRect.left - step);
        selRect.width += (oldLeft - selRect.left);
        if (selRect.left < window.scrollX + 100) {
          window.scrollBy(-step, 0);
        }
      }
      renderSelection();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('scroll', renderSelection);

  function closeOverlay() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('scroll', renderSelection);
    overlay.remove();
  }

  async function captureAndSave() {
    // Hide UI
    overlay.style.display = 'none';

    try {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = selRect.width * dpr;
      canvas.height = selRect.height * dpr;
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
          await new Promise(r => setTimeout(r, 300));

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
              sourceX * dpr, sourceY * dpr, intersectWidth * dpr, intersectHeight * dpr,
              destX * dpr, destY * dpr, intersectWidth * dpr, intersectHeight * dpr
            );
          }

          currentX += viewportWidth;
        }
        currentY += viewportHeight;
      }

      // Save
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const a = document.createElement('a');
      a.href = finalDataUrl;
      a.download = 'screenshot.jpg';
      a.click();

    } catch (err) {
      console.error(err);
      alert('Failed to capture screenshot');
    } finally {
      closeOverlay();
    }
  }
})();