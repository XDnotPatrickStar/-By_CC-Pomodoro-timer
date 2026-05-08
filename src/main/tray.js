const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let win = null;

function createTray(mainWindow) {
  win = mainWindow;

  // Create a simple 16x16 tray icon programmatically
  const icon = nativeImage.createEmpty();
  // Use a 32x32 canvas to draw a simple colored circle
  const size = 32;
  const buffer = Buffer.alloc(size * size * 4);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;

      if (dist <= radius) {
        buffer[idx] = 233;     // R (e94560 pink)
        buffer[idx + 1] = 69;
        buffer[idx + 2] = 96;
        buffer[idx + 3] = 255; // A
      } else {
        buffer[idx + 3] = 0;
      }
    }
  }

  const trayIcon = nativeImage.createFromBuffer(buffer, { width: size, height: size });
  tray = new Tray(trayIcon);

  updateMenu();
  tray.setToolTip('Pomodoro Timer');

  tray.on('double-click', () => {
    if (win) {
      if (win.isVisible()) {
        win.focus();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  // Handle close-to-tray
  win.on('close', (event) => {
    // We'll check store settings later via IPC
    // For now, always minimize to tray instead of quitting
    if (!win.isDestroyed()) {
      event.preventDefault();
      win.hide();
    }
  });
}

function updateMenu() {
  if (!tray) return;

  const isVisible = win && win.isVisible();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isVisible ? '隐藏窗口' : '显示窗口',
      click: () => {
        if (win) {
          if (win.isVisible()) {
            win.hide();
          } else {
            win.show();
            win.focus();
          }
        }
        // Rebuild menu to update label
        setTimeout(() => updateMenu(), 100);
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        if (win) {
          win.removeAllListeners('close');
          win.close();
        }
        if (tray) {
          tray.destroy();
          tray = null;
        }
        const { app } = require('electron');
        app.exit(0);
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, updateMenu, destroyTray };
