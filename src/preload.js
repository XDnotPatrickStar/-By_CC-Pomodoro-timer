const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAllData: () => ipcRenderer.invoke('get-all-data'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  addSession: (session) => ipcRenderer.invoke('add-session', session),
  getHistoryRange: (from, to) => ipcRenderer.invoke('get-history-range', from, to),
  getAllHistory: () => ipcRenderer.invoke('get-all-history'),
  getMascotImage: () => ipcRenderer.invoke('get-mascot-image'),
  getDefaultMascot: () => ipcRenderer.invoke('get-default-mascot'),
  importMascot: () => ipcRenderer.invoke('import-mascot'),
  resetMascot: () => ipcRenderer.invoke('reset-mascot'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body)
});
