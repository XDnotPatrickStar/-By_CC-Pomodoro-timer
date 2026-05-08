const Timer = {
  // Current state
  sessionType: 'focus',        // 'focus' | 'shortBreak' | 'longBreak'
  phase: 'idle',               // 'idle' | 'running' | 'paused' | 'finished'
  remainingMs: 0,
  totalMs: 0,
  targetEnd: null,
  tickInterval: null,
  sessionCount: 0,             // completed focus sessions in current cycle
  currentTaskName: '',

  init() {
    this.sessionCount = AppState.completedToday % AppState.settings.longBreakInterval;
    this.setSessionType('focus');
    this.render();
    this.attachEvents();
    this.updateDisplay();
  },

  setSessionType(type) {
    this.sessionType = type;
    this.phase = 'idle';
    this.clearTick();

    const s = AppState.settings;
    switch (type) {
      case 'focus':
        this.totalMs = s.focusDuration * 60 * 1000;
        break;
      case 'shortBreak':
        this.totalMs = s.shortBreakDuration * 60 * 1000;
        break;
      case 'longBreak':
        this.totalMs = s.longBreakDuration * 60 * 1000;
        break;
    }
    this.remainingMs = this.totalMs;
    this.targetEnd = null;
  },

  start() {
    if (this.phase === 'running') return;

    if (this.phase === 'paused') {
      // Resume from pause
      this.targetEnd = Date.now() + this.remainingMs;
    } else {
      // Fresh start
      this.targetEnd = Date.now() + this.totalMs;
    }

    this.phase = 'running';
    this.tickInterval = setInterval(() => this.tick(), 250);
    this.render();
  },

  pause() {
    if (this.phase !== 'running') return;
    this.clearTick();
    this.remainingMs = Math.max(0, this.targetEnd - Date.now());
    this.targetEnd = null;
    this.phase = 'paused';
    this.render();
  },

  reset() {
    this.clearTick();
    this.setSessionType(this.sessionType);
    this.render();
    this.updateDisplay();
  },

  skip() {
    this.clearTick();
    // Record as interrupted
    if (this.phase === 'running' || this.phase === 'paused') {
      this._recordSession(false);
    }
    this._transitionToNext();
  },

  tick() {
    const now = Date.now();
    const remaining = Math.max(0, this.targetEnd - now);
    this.remainingMs = remaining;

    this.updateDisplay();

    if (remaining <= 0) {
      this._onComplete();
    }
  },

  _onComplete() {
    this.clearTick();
    this.remainingMs = 0;
    this.phase = 'finished';
    this.render();
    this.updateDisplay();

    // Record completed session
    this._recordSession(true);

    // Notify
    SoundPlayer.play();
    this._showNotification();

    // Auto-transition
    if (AppState.settings.autoStartBreaks || this.sessionType !== 'focus') {
      setTimeout(() => this._transitionToNext(), 1500);
    }
  },

  _transitionToNext() {
    if (this.sessionType === 'focus') {
      this.sessionCount++;
      // Persist session count to AppState for display
      if (this.sessionCount >= AppState.settings.longBreakInterval) {
        this.sessionCount = 0;
        this.setSessionType('longBreak');
      } else {
        this.setSessionType('shortBreak');
      }
    } else {
      // Break finished, back to focus
      this.setSessionType('focus');
    }
    this.render();
    this.updateDisplay();
  },

  async _recordSession(completed) {
    const now = new Date();
    const endTime = now.toTimeString().split(' ')[0];
    const elapsedMs = completed ? this.totalMs : (this.totalMs - this.remainingMs);
    const startDate = new Date(now.getTime() - elapsedMs);
    const startTime = startDate.toTimeString().split(' ')[0];

    const session = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      startTime,
      endTime,
      duration: Math.round(elapsedMs / 60000),
      plannedDuration: Math.round(this.totalMs / 60000),
      type: this.sessionType,
      taskName: this.sessionType === 'focus' ? this.currentTaskName : '',
      completed,
      interruptedAt: completed ? null : Math.round(elapsedMs / 60000)
    };

    await AppState.addSession(session);
    this.updateTodayDisplay();
  },

  _showNotification() {
    if (!window.electronAPI.showNotification) {
      // Fallback: use Notification API in renderer
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(this._getNotificationTitle(), { body: this._getNotificationBody() });
      }
      return;
    }
    // We'll wire this up via main process later
    const title = this._getNotificationTitle();
    const body = this._getNotificationBody();
    try {
      window.electronAPI.showNotification(title, body);
    } catch (e) {
      // Not yet wired
    }
  },

  _getNotificationTitle() {
    if (this.sessionType === 'focus') return '专注时间结束！';
    return '休息时间结束！';
  },

  _getNotificationBody() {
    if (this.sessionType === 'focus') return '做得不错，休息一下吧~';
    return '准备好开始下一个番茄了吗？';
  },

  clearTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  },

  updateDisplay() {
    const mins = Math.floor(this.remainingMs / 60000);
    const secs = Math.floor((this.remainingMs % 60000) / 1000);
    const displayEl = document.getElementById('timer-display');
    if (displayEl) {
      displayEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Update progress ring
    const progress = 1 - (this.remainingMs / this.totalMs);
    const ring = document.getElementById('progress-ring');
    if (ring) {
      const circumference = 2 * Math.PI * 100;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = circumference * (1 - progress);
    }

    // Update session type label
    const labelEl = document.getElementById('session-label');
    if (labelEl) {
      const labels = { focus: 'FOCUS', shortBreak: 'SHORT BREAK', longBreak: 'LONG BREAK' };
      labelEl.textContent = labels[this.sessionType] || 'FOCUS';
      labelEl.className = 'session-label ' + this.sessionType;
    }
  },

  render() {
    const startBtn = document.getElementById('btn-start');
    const pauseBtn = document.getElementById('btn-pause');
    const resetBtn = document.getElementById('btn-reset');
    const skipBtn = document.getElementById('btn-skip');

    // Show/hide start/pause based on state
    if (startBtn) startBtn.style.display = this.phase === 'running' ? 'none' : 'inline-block';
    if (pauseBtn) pauseBtn.style.display = this.phase === 'running' ? 'inline-block' : 'none';
    if (resetBtn) resetBtn.disabled = this.phase === 'idle';
    if (skipBtn) skipBtn.disabled = this.phase === 'idle';

    this.updateTodayDisplay();
  },

  updateTodayDisplay() {
    const todayEl = document.getElementById('today-count');
    if (todayEl) {
      todayEl.textContent = AppState.completedToday;
    }
    const cycleEl = document.getElementById('cycle-progress');
    if (cycleEl) {
      cycleEl.textContent = `${this.sessionCount} / ${AppState.settings.longBreakInterval}`;
    }
  },

  attachEvents() {
    document.getElementById('btn-start')?.addEventListener('click', () => this.start());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.pause());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.reset());
    document.getElementById('btn-skip')?.addEventListener('click', () => this.skip());

    const taskInput = document.getElementById('task-input');
    if (taskInput) {
      taskInput.addEventListener('input', () => {
        this.currentTaskName = taskInput.value;
      });
    }
  }
};
