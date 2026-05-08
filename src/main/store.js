const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

let defaultMascotCache = null;

const schema = {
  settings: {
    type: 'object',
    default: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      soundEnabled: true,
      volume: 0.8,
      alwaysOnTop: false,
      minimizeToTray: true,
      autoStartBreaks: false
    }
  },
  mascotImage: {
    type: 'string',
    default: ''
  },
  history: {
    type: 'array',
    default: []
  }
};

const store = new Store({ schema });

function getAllData() {
  return {
    settings: store.get('settings'),
    mascotImage: store.get('mascotImage'),
    history: store.get('history')
  };
}

function getSettings() {
  return store.get('settings');
}

function saveSettings(newSettings) {
  store.set('settings', { ...store.get('settings'), ...newSettings });
  return store.get('settings');
}

function getMascotImage() {
  const val = store.get('mascotImage');
  return val || null;
}

function setMascotImage(base64) {
  store.set('mascotImage', base64 || '');
}

function addSession(session) {
  const today = new Date().toISOString().split('T')[0];
  const history = store.get('history');
  let dayEntry = history.find(h => h.date === today);

  if (dayEntry) {
    dayEntry.sessions.push(session);
  } else {
    history.push({ date: today, sessions: [session] });
  }

  store.set('history', history);
  return session;
}

function getHistoryRange(fromDate, toDate) {
  const history = store.get('history');
  return history.filter(h => h.date >= fromDate && h.date <= toDate);
}

function getAllHistory() {
  return store.get('history');
}

function getDefaultMascot() {
  if (defaultMascotCache) return defaultMascotCache;

  try {
    // Try icon.png first (user's replacement), then fallback
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
    if (fs.existsSync(iconPath)) {
      const data = fs.readFileSync(iconPath);
      defaultMascotCache = `data:image/png;base64,${data.toString('base64')}`;
      return defaultMascotCache;
    }
  } catch (e) {
    console.warn('Failed to load default mascot:', e.message);
  }
  return null;
}

function getEffectiveMascot() {
  const custom = store.get('mascotImage');
  return custom || getDefaultMascot();
}

module.exports = {
  getAllData,
  getSettings,
  saveSettings,
  getMascotImage,
  setMascotImage,
  addSession,
  getHistoryRange,
  getAllHistory,
  getDefaultMascot,
  getEffectiveMascot
};
