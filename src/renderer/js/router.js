const Router = {
  currentView: 'timer',
  loadedViews: { timer: true },

  init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.view);
      });
    });

    const hash = window.location.hash.replace('#', '') || 'timer';
    this.navigate(hash);
  },

  async navigate(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Load view HTML if not loaded yet
    if (!this.loadedViews[viewName]) {
      await this.loadViewContent(viewName);
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }

    // Call page init
    this.onViewShown(viewName);
  },

  async loadViewContent(viewName) {
    const fileMap = {
      settings: 'views/settings-view.html',
      history: 'views/history-view.html'
    };
    const filePath = fileMap[viewName];
    if (!filePath) return;

    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const html = await response.text();
        const container = document.getElementById(`view-${viewName}`);
        if (container) {
          container.innerHTML = html;
        }
        this.loadedViews[viewName] = true;
      }
    } catch (e) {
      console.warn(`Failed to load view ${viewName}:`, e);
    }
  },

  onViewShown(viewName) {
    switch (viewName) {
      case 'timer':
        Timer.render();
        Timer.updateDisplay();
        break;
      case 'settings':
        if (typeof SettingsPage !== 'undefined') {
          SettingsPage.init();
        }
        break;
      case 'history':
        if (typeof HistoryPage !== 'undefined') {
          HistoryPage.init();
        }
        break;
    }
  }
};
