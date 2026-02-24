# Scroll & Crop Screenshot Extension

A powerful, user-friendly Chrome extension that allows you to capture high-quality, scrolling screenshots of any webpage. It intelligently stitches together scrolling areas, handles fixed elements, and provides an interactive UI for precise cropping.

## Features

- **Interactive Selection**: Click and drag your mouse to draw an initial selection box.
- **Precision Resizing**: Use the 8 resize handles on the edges and corners to fine-tune your crop area. Keep the keyboard shortcuts (Arrow keys + Shift) if you prefer.
- **Scroll & Stitch**: The extension automatically scrolls down and across the page to capture and stitch together areas larger than your screen.
- **Clean Captures**: 
  - Automatically hides `position: fixed` and `position: sticky` elements during capture to prevent them from overlapping and ruining the stitched final image.
  - Temporarily disables native scrollbars and smooth-scrolling behavior for seamless, blur-free stitches.
- **Intelligent Scaling**: Prevents canvas memory crashes on massive pages (+ retina displays) by scaling down the rendering ratio dynamically when approaching browser limits.
- **Preview UI**: Inspect your stitched image in a dedicated preview tab where you can easily **Download** it or **Copy to Clipboard**.
- **Privacy First**: Uses only the non-intrusive `activeTab` permission. It does not demand access to all your websites upon installation.

## Installation

1. Download or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click on the **Load unpacked** button.
5. Select the folder containing the extension files.
6. The extension is now installed! You can pin it to your toolbar for easy access.

## Usage

1. Navigate to any standard HTTP/HTTPS webpage you wish to capture.
2. Click the extension icon in your browser toolbar.
3. A dark overlay will appear. Click and drag your mouse to delineate the area you want to capture. 
4. Adjust the selection box using the white resize handles, or use your keyboard arrow keys.
5. Click **Done / OK** on the selection controls.
6. Wait as the extension automatically scrolls and captures the area.
7. A new Preview tab will open displaying your screenshot. Choose to download it as a JPEG or copy it directly to your clipboard.

## Keyboard Shortcuts
- `Esc` - Cancel screenshot and close overlay
- `Arrow Keys` - Move the bottom/right edges of the selection box
- `Shift + Arrow Keys` - Shrink the bottom/right edges of the selection box
