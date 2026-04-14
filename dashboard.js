/* ── DASHBOARD ── */

function updateDashboardStats() {
  const allCards = document.querySelectorAll('.card');
  const saved = JSON.parse(localStorage.getItem('dl-saved') || '[]');
  const custom = JSON.parse(localStorage.getItem('dl-custom') || '[]');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('dashboard-total-resources', allCards.length);
  set('dashboard-saved-resources', saved.length);
  set('dashboard-custom-resources', custom.length);
}

function updateCategoryChart() {
  const allCards = document.querySelectorAll('.card');
  const cats = { design:0, coding:0, hosting:0, ai:0, learning:0 };
  allCards.forEach(card => { const c = card.dataset.category; if (cats[c] !== undefined) cats[c]++; });
  const total = Object.values(cats).reduce((a,b) => a+b, 0);

  Object.entries(cats).forEach(([cat, count]) => {
    const bar = document.querySelector(`.chart-bar[data-category="${cat}"]`);
    if (!bar) return;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    bar.style.setProperty('--bar-width', `${pct}%`);
    // Add count to bar
    let countEl = bar.querySelector('.chart-count');
    if (!countEl) {
      countEl = document.createElement('span');
      countEl.className = 'chart-count';
      countEl.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-2);position:relative;z-index:1;';
      bar.appendChild(countEl);
    }
    countEl.textContent = count;
  });
}

function updateActivityList() {
  const list = document.getElementById('activityList');
  if (!list) return;
  const activities = JSON.parse(localStorage.getItem('devlinks-activity') || '[]');
  if (!activities.length) { list.innerHTML = '<div class="activity-item">No recent activity yet</div>'; return; }
  list.innerHTML = activities.slice(-6).reverse().map(a => {
    const time = new Date(a.timestamp).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    return `<div class="activity-item"><div>${a.description}</div><div class="activity-time">${time}</div></div>`;
  }).join('');
}

function exportData() {
  const data = {
    saved: JSON.parse(localStorage.getItem('dl-saved') || '[]'),
    custom: JSON.parse(localStorage.getItem('dl-custom') || '[]'),
    collections: JSON.parse(localStorage.getItem('devlinks-collections') || '[]'),
    theme: {
      mode: localStorage.getItem('devlinks-theme'),
      accent: localStorage.getItem('devlinks-accent'),
      fontSize: localStorage.getItem('devlinks-font-size'),
    },
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devlinks-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Data exported!', 't-success');
  if (typeof logActivity === 'function') logActivity('Exported data');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.saved) localStorage.setItem('dl-saved', JSON.stringify(data.saved));
        if (data.custom) {
          localStorage.setItem('dl-custom', JSON.stringify(data.custom));
          if (typeof renderCustomCards === 'function') renderCustomCards();
        }
        if (data.collections) localStorage.setItem('devlinks-collections', JSON.stringify(data.collections));
        if (data.theme?.mode) { localStorage.setItem('devlinks-theme', data.theme.mode); if (typeof restoreTheme === 'function') restoreTheme(); }
        if (data.theme?.accent) { localStorage.setItem('devlinks-accent', data.theme.accent); if (typeof applyStoredAccentColor === 'function') applyStoredAccentColor(); }
        if (typeof updateAllCounts === 'function') updateAllCounts();
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof restoreSavedButtons === 'function') restoreSavedButtons();
        if (typeof showToast === 'function') showToast('Data imported!', 't-success');
        if (typeof logActivity === 'function') logActivity('Imported data');
      } catch {
        if (typeof showToast === 'function') showToast('Invalid data file', 't-error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
