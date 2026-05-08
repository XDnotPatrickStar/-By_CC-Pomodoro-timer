const AppState = {
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: true,
    volume: 0.8,
    alwaysOnTop: false,
    minimizeToTray: true,
    autoStartBreaks: false
  },
  mascotImage: null,
  history: [],
  todaySessions: [],
  completedToday: 0,

  async load() {
    try {
      const data = await window.electronAPI.getAllData();
      this.settings = data.settings;
      this.mascotImage = data.mascotImage;
      this.history = data.history || [];
      this._updateToday();
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  },

  async saveSettings(newSettings) {
    try {
      const updated = await window.electronAPI.saveSettings(newSettings);
      this.settings = updated;
      return updated;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return this.settings;
    }
  },

  async addSession(session) {
    try {
      await window.electronAPI.addSession(session);
      this._updateToday();
      this.history = await window.electronAPI.getAllHistory();
    } catch (e) {
      console.error('Failed to add session:', e);
    }
  },

  _updateToday() {
    const today = new Date().toISOString().split('T')[0];
    const dayEntry = this.history.find(h => h.date === today);
    this.todaySessions = dayEntry ? dayEntry.sessions : [];
    this.completedToday = this.todaySessions.filter(s => s.type === 'focus' && s.completed).length;
  },

  async refreshHistory() {
    try {
      this.history = await window.electronAPI.getAllHistory();
      this._updateToday();
    } catch (e) {
      console.error('Failed to refresh history:', e);
    }
  }
};
