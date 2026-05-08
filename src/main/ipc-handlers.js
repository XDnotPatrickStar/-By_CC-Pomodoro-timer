const { ipcMain, dialog, BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./store');
const { showNotification } = require('./notifications');

function registerHandlers() {
  ipcMain.handle('get-all-data', () => {
    return store.getAllData();
  });

  ipcMain.handle('get-settings', () => {
    return store.getSettings();
  });

  ipcMain.handle('save-settings', (_event, newSettings) => {
    return store.saveSettings(newSettings);
  });

  ipcMain.handle('add-session', (_event, session) => {
    return store.addSession(session);
  });

  ipcMain.handle('get-history-range', (_event, fromDate, toDate) => {
    return store.getHistoryRange(fromDate, toDate);
  });

  ipcMain.handle('get-all-history', () => {
    return store.getAllHistory();
  });

  ipcMain.handle('get-mascot-image', () => {
    return store.getEffectiveMascot();
  });

  ipcMain.handle('get-default-mascot', () => {
    return store.getDefaultMascot();
  });

  ipcMain.handle('import-mascot', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      title: '选择萌娘图片',
      filters: [
        { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };
    const mime = mimeMap[ext] || 'image/png';

    const data = fs.readFileSync(filePath);
    const base64 = `data:${mime};base64,${data.toString('base64')}`;
    store.setMascotImage(base64);
    return base64;
  });

  ipcMain.handle('reset-mascot', () => {
    store.setMascotImage('');
    return null;
  });

  ipcMain.handle('set-always-on-top', (_event, flag) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.setAlwaysOnTop(flag, 'floating');
    }
    const settings = store.getSettings();
    store.saveSettings({ ...settings, alwaysOnTop: flag });
  });

  ipcMain.handle('show-notification', (_event, title, body) => {
    showNotification(title, body);
  });

  ipcMain.handle('trigger-close', () => {
    app.quit();
  });
}

module.exports = { registerHandlers };
