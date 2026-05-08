const HistoryPage = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  _initialized: false,

  async init() {
    this.currentYear = new Date().getFullYear();
    await AppState.refreshHistory();
    this.renderCalendar();
    if (!this._initialized) {
      this.attachEvents();
      this._initialized = true;
    }
    document.getElementById('day-detail').innerHTML = '<p class="detail-empty">点击日期查看详情</p>';
  },

  renderCalendar() {
    const year = this.currentYear;
    document.getElementById('year-display').textContent = year;
    document.getElementById('btn-next-year').disabled = year >= new Date().getFullYear();

    const container = document.getElementById('calendar-grid');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    // Build lookup: date -> completed focus count
    const countMap = {};
    for (const dayEntry of AppState.history) {
      const focusCount = dayEntry.sessions.filter(s => s.type === 'focus' && s.completed).length;
      countMap[dayEntry.date] = focusCount;
    }

    let html = '';
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      html += '<div class="calendar-month">';
      html += `<span class="month-label">${monthNames[m]}</span>`;
      html += '<div class="month-days">';

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = countMap[dateStr] || 0;
        const isFuture = dateStr > today;
        let cssClass = 'count-0';
        if (!isFuture) {
          if (count === 0) cssClass = 'count-0';
          else if (count === 1) cssClass = 'count-1';
          else if (count === 2) cssClass = 'count-2';
          else if (count === 3) cssClass = 'count-3';
          else if (count === 4) cssClass = 'count-4';
          else if (count === 5) cssClass = 'count-5';
          else cssClass = 'count-6plus';
        } else {
          cssClass = 'future';
        }

        html += `<div class="cal-cell ${cssClass}" data-date="${dateStr}" title="${dateStr}: ${count} 番茄"></div>`;
      }

      html += '</div></div>';
    }

    container.innerHTML = html;

    // Bind cell clicks
    container.querySelectorAll('.cal-cell:not(.future)').forEach(cell => {
      cell.addEventListener('click', () => {
        this.showDayDetail(cell.dataset.date);
      });
    });
  },

  showDayDetail(dateStr) {
    const dayEntry = AppState.history.find(h => h.date === dateStr);
    const detailEl = document.getElementById('day-detail');
    if (!detailEl) return;

    if (!dayEntry || dayEntry.sessions.length === 0) {
      detailEl.innerHTML = `<h3>${dateStr}</h3><p class="detail-empty">这天没有番茄记录</p>`;
      return;
    }

    const focusSessions = dayEntry.sessions.filter(s => s.type === 'focus' && s.completed);
    const totalMin = focusSessions.reduce((sum, s) => sum + s.duration, 0);

    let html = `<h3>${dateStr}</h3>`;

    for (const s of dayEntry.sessions) {
      const typeLabel = { focus: '专注', shortBreak: '短休', longBreak: '长休' }[s.type] || s.type;
      const typeClass = s.type === 'focus' ? 'focus' : 'shortBreak';
      const timeStr = s.completed ? `${s.startTime} - ${s.endTime}` : `${s.startTime} (中断于 ${s.interruptedAt}分)`;
      const taskStr = s.taskName || '---';

      html += `
        <div class="session-entry">
          <span class="session-type-tag ${typeClass}">${typeLabel}</span>
          <span class="session-time">${timeStr}</span>
          <span class="session-task">${taskStr}</span>
          <span class="session-duration">${s.duration}分钟</span>
        </div>`;
    }

    html += `<div class="day-summary">总计专注: ${totalMin} 分钟 · ${focusSessions.length} 个番茄</div>`;
    detailEl.innerHTML = html;
  },

  prevYear() {
    if (this.currentYear > 2020) {
      this.currentYear--;
      this.renderCalendar();
      document.getElementById('day-detail').innerHTML = '<p class="detail-empty">点击日期查看详情</p>';
    }
  },

  nextYear() {
    const thisYear = new Date().getFullYear();
    if (this.currentYear < thisYear) {
      this.currentYear++;
      this.renderCalendar();
      document.getElementById('day-detail').innerHTML = '<p class="detail-empty">点击日期查看详情</p>';
    }
  },

  attachEvents() {
    document.getElementById('btn-prev-year')?.addEventListener('click', () => this.prevYear());
    document.getElementById('btn-next-year')?.addEventListener('click', () => this.nextYear());
  }
};
