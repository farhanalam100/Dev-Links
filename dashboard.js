/* ── DASHBOARD FUNCTIONALITY ── */
function openDashboard() {
  const panel = document.getElementById('dashboardPanel');
  panel.classList.remove('hidden');
  updateDashboardStats();
  updateCategoryChart();
  updateActivityList();
}

function closeDashboard() {
  const panel = document.getElementById('dashboardPanel');
  panel.classList.add('hidden');
}

function updateDashboardStats() {
  const allCards = document.querySelectorAll('.card');
  const saved = JSON.parse(localStorage.getItem('dl-saved') || '[]');
  const custom = JSON.parse(localStorage.getItem('dl-custom') || '[]');
  
  // Update total resources
  const totalElement = document.getElementById('dashboard-total-resources');
  if (totalElement) totalElement.textContent = allCards.length;
  
  // Update saved resources
  const savedElement = document.getElementById('dashboard-saved-resources');
  if (savedElement) savedElement.textContent = saved.length;
  
  // Update custom resources
  const customElement = document.getElementById('dashboard-custom-resources');
  if (customElement) customElement.textContent = custom.length;
}

function updateCategoryChart() {
  const allCards = document.querySelectorAll('.card');
  const categories = { design: 0, coding: 0, hosting: 0, ai: 0, learning: 0 };
  
  allCards.forEach(card => {
    const category = card.dataset.category;
    if (categories[category] !== undefined) {
      categories[category]++;
    }
  });
  
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  
  // Update chart bars
  Object.entries(categories).forEach(([category, count]) => {
    const bar = document.querySelector(`.chart-bar[data-category="${category}"]`);
    if (bar) {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      bar.style.width = `${percentage}%`;
    }
  });
}

function updateActivityList() {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;
  
  // Get recent activity from localStorage
  const activities = JSON.parse(localStorage.getItem('devlinks-activity') || '[]');
  
  if (activities.length === 0) {
    activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
    return;
  }
  
  // Display last 5 activities
  const recentActivities = activities.slice(-5).reverse();
  activityList.innerHTML = recentActivities.map(activity => {
    const time = new Date(activity.timestamp).toLocaleString();
    return `
      <div class="activity-item">
        <div class="activity-content">${activity.description}</div>
        <div class="activity-time">${time}</div>
      </div>
    `;
  }).join('');
}

function logActivity(description) {
  const activities = JSON.parse(localStorage.getItem('devlinks-activity') || '[]');
  activities.push({
    description,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 activities
  if (activities.length > 50) {
    activities.splice(0, activities.length - 50);
  }
  
  localStorage.setItem('devlinks-activity', JSON.stringify(activities));
}

function exportData() {
  const data = {
    saved: JSON.parse(localStorage.getItem('dl-saved') || '[]'),
    custom: JSON.parse(localStorage.getItem('dl-custom') || '[]'),
    theme: {
      mode: localStorage.getItem('devlinks-theme'),
      accent: localStorage.getItem('devlinks-accent'),
      fontSize: localStorage.getItem('devlinks-font-size')
    },
    settings: {
      view: localStorage.getItem('devlinks-view'),
      filters: window.activeFilters || {}
    },
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devlinks-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Data exported successfully!', 't-success');
  logActivity('Exported data');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Import saved links
        if (data.saved && Array.isArray(data.saved)) {
          localStorage.setItem('dl-saved', JSON.stringify(data.saved));
        }
        
        // Import custom resources
        if (data.custom && Array.isArray(data.custom)) {
          localStorage.setItem('dl-custom', JSON.stringify(data.custom));
          if (typeof renderCustomCards === 'function') {
            renderCustomCards();
          }
        }
        
        // Import theme settings
        if (data.theme) {
          if (data.theme.mode) {
            localStorage.setItem('devlinks-theme', data.theme.mode);
            if (typeof restoreTheme === 'function') {
              restoreTheme();
            }
          }
          if (data.theme.accent) {
            localStorage.setItem('devlinks-accent', data.theme.accent);
            if (typeof applyStoredAccentColor === 'function') {
              applyStoredAccentColor();
            }
          }
          if (data.theme.fontSize) {
            localStorage.setItem('devlinks-font-size', data.theme.fontSize);
            const root = document.documentElement;
            root.style.fontSize = `${data.theme.fontSize}px`;
          }
        }
        
        // Import view settings
        if (data.settings && data.settings.view) {
          if (typeof setView === 'function') {
            setView(data.settings.view);
          }
        }
        
        if (typeof updateAllCounts === 'function') {
          updateAllCounts();
        }
        if (typeof applyFilters === 'function') {
          applyFilters();
        }
        if (typeof restoreSavedButtons === 'function') {
          restoreSavedButtons();
        }
        
        showToast('Data imported successfully!', 't-success');
        logActivity('Imported data');
      } catch (error) {
        showToast('Invalid data file', 't-error');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}




