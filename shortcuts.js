/* ── ADVANCED KEYBOARD SHORTCUTS ── */
const shortcuts = {
  // Navigation
  'ctrl+k': () => openCmdPalette(),
  'ctrl+shift+f': () => {
    document.getElementById('searchInput')?.focus();
    toggleSearchFilters();
  },
  'ctrl+shift+d': () => openDashboard(),
  'ctrl+shift+t': () => openThemePanel(),
  'ctrl+shift+a': () => openAddForm(),
  'ctrl+shift+e': () => exportData(),
  'ctrl+shift+i': () => importData(),
  
  // View controls
  'ctrl+1': () => filterCategory('all', document.querySelector('[data-cat="all"]')),
  'ctrl+2': () => filterCategory('saved', document.querySelector('[data-cat="saved"]')),
  'ctrl+3': () => filterCategory('design', document.querySelector('[data-cat="design"]')),
  'ctrl+4': () => filterCategory('coding', document.querySelector('[data-cat="coding"]')),
  'ctrl+5': () => filterCategory('hosting', document.querySelector('[data-cat="hosting"]')),
  'ctrl+6': () => filterCategory('ai', document.querySelector('[data-cat="ai"]')),
  'ctrl+7': () => filterCategory('learning', document.querySelector('[data-cat="learning"]')),
  
  // Theme shortcuts
  'ctrl+shift+l': () => setThemeMode('light'),
  'ctrl+shift+d': () => setThemeMode('dark'),
  'ctrl+shift+[': () => setThemeMode('auto'),
  
  // View modes
  'ctrl+shift+g': () => setView('grid'),
  'ctrl+shift+list': () => setView('list'),
  
  // Utility
  'escape': () => {
    closeDashboard();
    closeThemePanel();
    closeSearchFilters();
    closeModal();
  },
  'ctrl+r': () => {
    renderCustomCards();
    updateAllCounts();
    applyFilters();
    showToast('Refreshed!', 't-info');
  },
  'ctrl+shift+c': () => {
    // Clear search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
      applyFilters();
    }
  },
  'ctrl+shift+s': () => {
    // Toggle saved filter
    const savedCheckbox = document.querySelector('input[value="saved"]');
    if (savedCheckbox) {
      savedCheckbox.checked = !savedCheckbox.checked;
      updateActiveFilters();
    }
  }
};

function initAdvancedKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Handle Ctrl+K specifically first
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCmdPalette();
      return;
    }
    
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Allow some shortcuts even in inputs
      if (e.key === 'Escape') {
        shortcuts.escape?.();
      }
      return;
    }
    
    const key = [];
    if (e.ctrlKey) key.push('ctrl');
    if (e.shiftKey) key.push('shift');
    if (e.altKey) key.push('alt');
    
    // Handle special keys
    if (e.key === 'Escape') {
      shortcuts.escape?.();
      e.preventDefault();
      return;
    }
    
    // Build key combination string
    if (e.key && !e.key.match(/[a-z0-9]$/i)) {
      key.push(e.key.toLowerCase());
    } else if (e.key === '[') {
      key.push('[');
    } else if (e.key === ']') {
      key.push(']');
    } else if (e.key === 'list') {
      key.push('list');
    }
    
    const combo = key.join('+');
    
    if (shortcuts[combo]) {
      e.preventDefault();
      shortcuts[combo]();
    }
  });
}

// Initialize shortcuts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvancedKeyboard);
} else {
  initAdvancedKeyboard();
}
