const SettingsPage = {
  _initialized: false,

  init() {
    this.loadForm();
    if (!this._initialized) {
      this.attachEvents();
      this._initialized = true;
    }
  },

  loadForm() {
    const s = AppState.settings;
    this.setVal('setting-focus', s.focusDuration);
    this.setVal('setting-short-break', s.shortBreakDuration);
    this.setVal('setting-long-break', s.longBreakDuration);
    this.setVal('setting-interval', s.longBreakInterval);
    this.setCheck('setting-sound', s.soundEnabled);
    this.setVal('setting-volume', Math.round(s.volume * 100));
    document.getElementById('volume-value').textContent = Math.round(s.volume * 100) + '%';
    this.setCheck('setting-auto-break', s.autoStartBreaks);
    this.setCheck('setting-tray', s.minimizeToTray);
    this.setCheck('setting-ontop', s.alwaysOnTop);

    // Mascot preview - show custom or default
    this.showMascotPreview();
  },

  setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  },

  setCheck(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = value;
  },

  async save() {
    const newSettings = {
      focusDuration: parseInt(document.getElementById('setting-focus').value) || 25,
      shortBreakDuration: parseInt(document.getElementById('setting-short-break').value) || 5,
      longBreakDuration: parseInt(document.getElementById('setting-long-break').value) || 15,
      longBreakInterval: parseInt(document.getElementById('setting-interval').value) || 4,
      soundEnabled: document.getElementById('setting-sound').checked,
      volume: parseInt(document.getElementById('setting-volume').value) / 100,
      autoStartBreaks: document.getElementById('setting-auto-break').checked,
      minimizeToTray: document.getElementById('setting-tray').checked,
      alwaysOnTop: document.getElementById('setting-ontop').checked
    };

    // Clamp values
    newSettings.focusDuration = Math.max(1, Math.min(120, newSettings.focusDuration));
    newSettings.shortBreakDuration = Math.max(1, Math.min(60, newSettings.shortBreakDuration));
    newSettings.longBreakDuration = Math.max(1, Math.min(60, newSettings.longBreakDuration));
    newSettings.longBreakInterval = Math.max(1, Math.min(10, newSettings.longBreakInterval));
    newSettings.volume = Math.max(0, Math.min(1, newSettings.volume));

    await AppState.saveSettings(newSettings);

    // Apply always-on-top
    if (window.electronAPI.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(newSettings.alwaysOnTop);
    }

    // Reset timer with new settings
    Timer.setSessionType(Timer.sessionType);
    Timer.render();
    Timer.updateDisplay();

    Router.navigate('timer');
  },

  cancel() {
    Router.navigate('timer');
  },

  async importMascot() {
    try {
      const base64 = await window.electronAPI.importMascot();
      if (base64) {
        AppState.mascotImage = base64;
        document.getElementById('mascot-preview').src = base64;
        document.getElementById('mascot-preview').style.display = 'block';
        document.getElementById('mascot-preview-placeholder').style.display = 'none';
        // Also update timer view mascot
        if (typeof updateMascot === 'function') {
          updateMascot(base64);
        }
      }
    } catch (e) {
      console.error('Failed to import mascot:', e);
    }
  },

  async showMascotPreview() {
    const mascot = AppState.mascotImage || await window.electronAPI.getDefaultMascot();
    const img = document.getElementById('mascot-preview');
    const placeholder = document.getElementById('mascot-preview-placeholder');
    if (mascot && img) {
      img.src = mascot;
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
  },

  async resetMascot() {
    try {
      await window.electronAPI.resetMascot();
      AppState.mascotImage = null;
      await this.showMascotPreview();
      // Also update timer view mascot
      const defaultMascot = await window.electronAPI.getDefaultMascot();
      if (typeof updateMascot === 'function') {
        updateMascot(defaultMascot);
      }
    } catch (e) {
      console.error('Failed to reset mascot:', e);
    }
  },

  attachEvents() {
    document.getElementById('btn-save-settings')?.addEventListener('click', () => this.save());
    document.getElementById('btn-cancel-settings')?.addEventListener('click', () => this.cancel());
    document.getElementById('btn-import-mascot')?.addEventListener('click', () => this.importMascot());
    document.getElementById('btn-reset-mascot')?.addEventListener('click', () => this.resetMascot());

    // Volume slider live update
    document.getElementById('setting-volume')?.addEventListener('input', (e) => {
      document.getElementById('volume-value').textContent = e.target.value + '%';
    });
  }
};
