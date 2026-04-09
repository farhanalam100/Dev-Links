/* ══════════════════════════════════════════
   DEVLINKS — Enhanced Script
   Features: category filter, search with tag support,
   save/unsave, custom CRUD, grid/list view,
   favicon logos, keyboard shortcut, toast notifications,
   per-category counters, theme persistence,
   advanced search filters and sorting
══════════════════════════════════════════ */

/* ── STATE ── */
let activeCategory = 'all';
let currentView = 'grid';
let editingId = null;
let currentSort = 'name';
let activeFilters = {
  categories: ['design', 'coding', 'hosting', 'ai', 'learning'],
  types: ['builtin', 'custom'],
  saved: false
};

/* ── CACHED DOM ELEMENTS ── */
const domCache = {
  searchInput: null,
  cardGrid: null,
  modalOverlay: null,
  cmdOverlay: null,
  cmdInput: null,
  cmdResults: null,
  sidebar: null,
  themeBtn: null,
  sectionTitle: null,
  sectionSub: null,
  noResults: null,
  noResultsText: null,
  footerCount: null,
  totalLinks: null,
  totalCategories: null,
  totalSaved: null,
  totalCustom: null
};

function initDomCache() {
  domCache.searchInput = document.getElementById('searchInput');
  domCache.cardGrid = document.getElementById('cardGrid');
  domCache.modal = document.getElementById('modal');
  domCache.cmdModal = document.getElementById('cmd-modal');
  domCache.cmdInput = document.getElementById('cmd-input');
  domCache.cmdResults = document.getElementById('cmd-results');
  domCache.sidebar = document.getElementById('sidebar');
  domCache.themeBtn = document.getElementById('theme-btn');
  domCache.sectionTitle = document.getElementById('section-title');
  domCache.sectionSub = document.getElementById('section-sub');
  domCache.noResults = document.getElementById('noResults');
  domCache.noResultsText = document.getElementById('noResultsText');
  domCache.footerCount = document.getElementById('footer-count');
  domCache.totalLinks = document.getElementById('total-links');
  domCache.totalCategories = document.getElementById('total-categories');
  domCache.totalSaved = document.getElementById('total-saved');
  domCache.totalCustom = document.getElementById('total-custom');
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initDomCache();
  restoreTheme();
  applyStoredAccentColor();
  updateThemePanelState();
  renderCustomCards();
  updateAllCounts();
  restoreSavedButtons();
  loadFavicons();
  applyFilters();
  initKeyboard();
  
  // Initialize advanced keyboard shortcuts
  if (typeof initAdvancedKeyboard === 'function') {
    initAdvancedKeyboard();
  }
  
  // Add direct Ctrl+K listener as backup
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Ctrl+K pressed - opening command palette');
      openCmdPalette();
    }
  });
  
  // Event delegation for custom card actions
  document.addEventListener('click', (e) => {
    const customActions = e.target.closest('.custom-actions');
    if (customActions) {
      e.preventDefault();
      const id = customActions.dataset.id;
      const action = e.target.dataset.action;
      
      if (action === 'edit') {
        openEditForm(id);
      } else if (action === 'delete') {
        deleteResource(id);
      }
    }
    
    // Handle save button clicks on custom cards
    const saveBtn = e.target.closest('.save-btn');
    if (saveBtn && e.target.closest('.custom-card')) {
      e.preventDefault();
      toggleSaveCard(saveBtn);
    }
  });
});

/* ══════════════════════════════
   THEME
══════════════════════════════ */
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const btn = document.getElementById('theme-btn');
  const html = document.documentElement;
  if (isLight) {
    html.removeAttribute('data-theme');
    if (btn) btn.innerHTML = '<span>🌙</span> Dark mode';
    safeSetItem('devlinks-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    if (btn) btn.innerHTML = '<span>☀️</span> Light mode';
    safeSetItem('devlinks-theme', 'light');
  }
}

function restoreTheme() {
  const saved = safeGetItem('devlinks-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = '<span>☀️</span> Light mode';
  }
}

/* ══════════════════════════════
   VIEW TOGGLE (grid / list)
══════════════════════════════ */
function setView(view) {
  currentView = view;
  const grid = document.getElementById('cardGrid');
  const btnGrid = document.getElementById('view-grid');
  const btnList = document.getElementById('view-list');

  grid.classList.toggle('list-view', view === 'list');
  btnGrid.classList.toggle('active', view === 'grid');
  btnList.classList.toggle('active', view === 'list');
  safeSetItem('devlinks-view', view);
}

/* ══════════════════════════════
   CATEGORY FILTER
══════════════════════════════ */
function filterCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Update section header
  const titles = {
    all: ['All Resources', 'Curated tools and references for developers'],
    saved: ['Saved Resources', 'Your personally bookmarked links'],
    design: ['Design', 'UI/UX, colours, fonts, and illustrations'],
    coding: ['Coding', 'Docs, playgrounds, and references'],
    hosting: ['Hosting', 'Deploy and ship your projects'],
    ai: ['AI Tools', 'Assistants, generators, and co-pilots'],
    learning: ['Learning', 'Courses, tutorials, and curriculum'],
  };

  const [title, sub] = titles[cat] || ['Resources', ''];
  document.getElementById('section-title').textContent = title;
  document.getElementById('section-sub').textContent = sub;

  applyFilters();
}

/* ══════════════════════════════
   SEARCH
══════════════════════════════ */
function filterCards() { applyFilters(); }

/* ══════════════════════════════
   COMBINED FILTER
══════════════════════════════ */
function applyFilters() {
  const query = (domCache.searchInput?.value || '').toLowerCase().trim();
  const saved = getSavedLinks();
  const cards = document.querySelectorAll('.card');
  let visible = 0;

  // Convert NodeList to array for sorting
  const cardsArray = Array.from(cards);

  // Apply filters and sorting
  const filteredCards = cardsArray.filter(card => {
    const name = (card.querySelector('h3')?.textContent || '').toLowerCase();
    const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const domain = (card.querySelector('.card-domain')?.textContent || '').toLowerCase();
    const category = card.dataset.category || '';
    const href = getHref(card);
    const isCustom = card.classList.contains('custom-card');

    // Search filter
    const matchSearch = !query
      || name.includes(query)
      || desc.includes(query)
      || tags.includes(query)
      || domain.includes(query);

    // Category filter
    const matchCat = activeCategory === 'all'
      || (activeCategory === 'saved' && saved.includes(href))
      || category === activeCategory;

    // Advanced filters
    const matchCategoryFilter = activeFilters.categories.length === 0 || activeFilters.categories.includes(category);
    const matchTypeFilter = activeFilters.types.length === 0 || 
      (activeFilters.types.includes('builtin') && !isCustom) ||
      (activeFilters.types.includes('custom') && isCustom) ||
      (activeFilters.types.includes('saved') && saved.includes(href));

    return matchSearch && matchCat && matchCategoryFilter && matchTypeFilter;
  });

  // Sort the filtered cards
  const sortedCards = sortCards(filteredCards, currentSort);

  // Hide all cards first
  cardsArray.forEach(card => {
    card.style.display = 'none';
    card.style.order = '';
  });

  // Show and order sorted cards
  sortedCards.forEach((card, index) => {
    card.style.display = '';
    card.style.order = index;
    card.classList.add('premium-animate');
    visible++;
  });

  // Update no results message
  const noRes = domCache.noResults;
  const noTxt = domCache.noResultsText;

  if (visible === 0) {
    noRes.classList.remove('hidden');
    noTxt.textContent = activeCategory === 'saved'
      ? (query ? `No saved results for "${query}"` : 'No saved resources yet')
      : (query ? `No results for "${query}"` : 'No resources here yet');
  } else {
    noRes.classList.add('hidden');
  }

  if (domCache.footerCount) {
    domCache.footerCount.textContent = `${visible} resource${visible !== 1 ? 's' : ''}`;
  }
}

function sortCards(cards, sortBy) {
  const saved = getSavedLinks();
  
  return cards.sort((a, b) => {
    const aHref = getHref(a);
    const bHref = getHref(b);
    const aTitle = (a.querySelector('h3')?.textContent || '').toLowerCase();
    const bTitle = (b.querySelector('h3')?.textContent || '').toLowerCase();
    const aCategory = a.dataset.category || '';
    const bCategory = b.dataset.category || '';
    const aIsCustom = a.classList.contains('custom-card');
    const bIsCustom = b.classList.contains('custom-card');
    const aIsSaved = saved.includes(aHref);
    const bIsSaved = saved.includes(bHref);

    switch (sortBy) {
      case 'name':
        return aTitle.localeCompare(bTitle);
      case 'category':
        return aCategory.localeCompare(bCategory);
      case 'date':
        // Put custom cards (newer) first, then sort by saved status
        if (aIsCustom !== bIsCustom) return bIsCustom ? -1 : 1;
        return aIsSaved !== bIsSaved ? bIsSaved ? -1 : 1 : aTitle.localeCompare(bTitle);
      case 'saved':
        // Saved items first, then by name
        if (aIsSaved !== bIsSaved) return bIsSaved ? -1 : 1;
        return aTitle.localeCompare(bTitle);
      default:
        return 0;
    }
  });
}

function toggleSearchFilters() {
  const panel = document.getElementById('searchFiltersPanel');
  panel.classList.toggle('hidden');
}

function applySorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    currentSort = sortSelect.value;
    applyFilters();
  }
}

function updateActiveFilters() {
  const checkboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
  activeFilters.categories = [];
  activeFilters.types = [];
  activeFilters.saved = false;

  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const value = checkbox.value;
      if (['design', 'coding', 'hosting', 'ai', 'learning'].includes(value)) {
        activeFilters.categories.push(value);
      } else if (['builtin', 'custom', 'saved'].includes(value)) {
        if (value === 'saved') {
          activeFilters.saved = true;
        } else {
          activeFilters.types.push(value);
        }
      }
    }
  });

  applyFilters();
}

function clearFilters() {
  const checkboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  activeFilters = {
    categories: [],
    types: [],
    saved: false
  };
  applyFilters();
}

function toggleViewMode() {
  const newView = currentView === 'grid' ? 'list' : 'grid';
  setView(newView);
}

/* ── THEME CUSTOMIZATION ── */
function openThemePanel() {
  const panel = document.getElementById('themePanel');
  panel.classList.remove('hidden');
  updateThemePanelState();
}

function closeThemePanel() {
  const panel = document.getElementById('themePanel');
  panel.classList.add('hidden');
}

function closeCollectionsPanel() {
  const panel = document.getElementById('collectionsPanel');
  panel.classList.add('hidden');
}

function closeDashboard() {
  const panel = document.getElementById('dashboardPanel');
  panel.classList.add('hidden');
}

function setThemeMode(mode) {
  const html = document.documentElement;
  const btn = document.getElementById('theme-btn');
  
  // Remove active class from all theme options
  document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
  
  // Add active class to selected option
  document.getElementById(`theme-${mode}`).classList.add('active');
  
  if (mode === 'dark') {
    html.removeAttribute('data-theme');
    if (btn) btn.innerHTML = '<span>🌙</span> Dark mode';
    safeSetItem('devlinks-theme', 'dark');
  } else if (mode === 'light') {
    html.setAttribute('data-theme', 'light');
    if (btn) btn.innerHTML = '<span>☀️</span> Light mode';
    safeSetItem('devlinks-theme', 'light');
  } else if (mode === 'auto') {
    // Auto mode - could detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      html.removeAttribute('data-theme');
      if (btn) btn.innerHTML = '<span>🌙</span> Dark mode';
    } else {
      html.setAttribute('data-theme', 'light');
      if (btn) btn.innerHTML = '<span>☀️</span> Light mode';
    }
    safeSetItem('devlinks-theme', 'auto');
  }
  
  // Apply accent color
  applyStoredAccentColor();
}

function updateAccentColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--accent', color);
  
  // Generate complementary colors
  const rgb = hexToRgb(color);
  const dimColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
  const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
  
  root.style.setProperty('--accent-dim', dimColor);
  root.style.setProperty('--accent-glow', glowColor);
  
  // Update color picker
  const picker = document.getElementById('accentColorPicker');
  if (picker) picker.value = color;
  
  // Save to localStorage
  safeSetItem('devlinks-accent', color);
  
  showToast('Theme color updated!', 't-success');
}

function applyStoredAccentColor() {
  const storedColor = safeGetItem('devlinks-accent');
  if (storedColor) {
    updateAccentColor(storedColor);
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function adjustFontSize(delta) {
  const root = document.documentElement;
  const currentSize = parseInt(getComputedStyle(root).fontSize) || 16;
  const newSize = Math.max(12, Math.min(20, currentSize + delta));
  
  root.style.fontSize = `${newSize}px`;
  
  // Update display
  const display = document.getElementById('fontSizeValue');
  if (display) display.textContent = `${newSize}px`;
  
  // Save to localStorage
  safeSetItem('devlinks-font-size', newSize.toString());
  
  showToast(`Font size: ${newSize}px`, 't-info');
}

function resetTheme() {
  // Reset to default theme
  const html = document.documentElement;
  html.removeAttribute('data-theme');
  html.style.fontSize = '';
  
  // Reset accent color
  updateAccentColor('#ef4160');
  
  // Reset theme mode selection
  document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
  document.getElementById('theme-dark').classList.add('active');
  
  // Update button
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = '<span>🌙</span> Dark mode';
  
  // Clear localStorage
  safeSetItem('devlinks-theme', 'dark');
  safeSetItem('devlinks-accent', '#ef4160');
  safeSetItem('devlinks-font-size', '16');
  
  // Update display
  const display = document.getElementById('fontSizeValue');
  if (display) display.textContent = '16px';
  
  showToast('Theme reset to default', 't-info');
}

function saveTheme() {
  showToast('Theme preferences saved!', 't-success');
  closeThemePanel();
}

function updateThemePanelState() {
  // Update current theme mode
  const currentTheme = safeGetItem('devlinks-theme') || 'dark';
  document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
  document.getElementById(`theme-${currentTheme}`).classList.add('active');
  
  // Update current accent color
  const currentAccent = safeGetItem('devlinks-accent') || '#ef4160';
  const picker = document.getElementById('accentColorPicker');
  if (picker) picker.value = currentAccent;
  
  // Update current font size
  const currentFontSize = safeGetItem('devlinks-font-size') || '16';
  const display = document.getElementById('fontSizeValue');
  if (display) display.textContent = `${currentFontSize}px`;
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function safeGetItem(key) {
  try { return localStorage.getItem(key); }
  catch (error) { console.warn('Storage error: ', error); return null; }
}

function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); }
  catch (error) {
    console.warn('Storage error: ', error);
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert('Hard disk / storage quota exceeded! Unable to save changes. Please try clearing your saved links.');
    }
  }
}

function getHref(card) {
  return card.getAttribute('href') || card.querySelector('a')?.href || '';
}

function getSavedLinks() {
  try { return JSON.parse(safeGetItem('dl-saved') || '[]'); }
  catch { return []; }
}

function setSavedLinks(arr) {
  safeSetItem('dl-saved', JSON.stringify(arr));
}

function getCustomLinks() {
  try { return JSON.parse(safeGetItem('devlinks-custom') || '[]'); }
  catch { return []; }
}

function setCustomLinks(items) {
  safeSetItem('devlinks-custom', JSON.stringify(items));
}

function renderCustomCards() {
  const container = document.getElementById('cardGrid');
  if (!container) return;
  
  const customCards = getCustomLinks();
  
  // Remove existing custom cards
  container.querySelectorAll('.custom-card').forEach(card => card.remove());
  
  // Add custom cards
  customCards.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card custom-card';
    cardEl.dataset.category = card.category;
    cardEl.dataset.tags = card.tags || card.category;
    cardEl.href = card.url;
    cardEl.target = '_blank';
    cardEl.rel = 'noreferrer';
    
    cardEl.innerHTML = `
      <div class="card-icon-wrap cat-${card.category}">
        <div class="card-icon"></div>
      </div>
      <div class="card-body">
        <div class="card-header-row">
          <h3>${escHtml(card.title)}</h3>
          <span class="card-badge cat-${card.category}">${card.category}</span>
        </div>
        <p>${escHtml(card.description)}</p>
      </div>
      <div class="card-footer">
        <span class="card-domain">${new URL(card.url).hostname}</span>
        <div class="custom-actions" data-id="${card.id}">
          <button class="save-btn" onclick="event.preventDefault();toggleSaveCard(this)">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="custom-action-btn" data-action="edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="custom-action-btn" data-action="delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(cardEl);
  });
  
  // Load favicons for new cards
  setTimeout(() => loadFavicons(), 100);
}

function escHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ══════════════════════════════
   SAVE / UNSAVE
══════════════════════════════ */
function toggleSaveCard(btn) {
  const card = btn.closest('.card');
  const href = getHref(card);
  if (!href) return;

  let saved = getSavedLinks();
  const idx = saved.indexOf(href);
  const isSaved = idx > -1;

  if (isSaved) {
    saved.splice(idx, 1);
    btn.classList.remove('saved');
    showToast('Removed from saved', 't-info');
  } else {
    saved.push(href);
    btn.classList.add('saved');
    btn.style.transform = 'scale(1.3)';
    setTimeout(() => btn.style.transform = '', 250);
    showToast('Saved! ★', 't-success');
  }

  setSavedLinks(saved);
  updateAllCounts();

  if (activeCategory === 'saved') applyFilters();
}

function restoreSavedButtons() {
  const saved = getSavedLinks();
  document.querySelectorAll('.card').forEach(card => {
    const href = getHref(card);
    const btn = card.querySelector('.save-btn');
    if (btn && saved.includes(href)) btn.classList.add('saved');
  });
}

/* ══════════════════════════════
   CUSTOM RESOURCES — CRUD
══════════════════════════════ */

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── ADD FORM ── */
function openAddForm() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Resource';
  document.getElementById('resourceSubmitBtn').textContent = 'Add Resource';
  document.getElementById('resourceForm').reset();
  document.getElementById('resourceId').value = '';
  clearFieldErrors();
  openModal();
}

function openEditForm(id) {
  const items = getCustomLinks();
  const item = items.find(i => i.id === id);
  if (!item) return;

  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Resource';
  document.getElementById('resourceSubmitBtn').textContent = 'Save Changes';
  document.getElementById('resourceId').value = id;
  document.getElementById('resourceTitle').value = item.title;
  document.getElementById('resourceUrl').value = item.url;
  document.getElementById('resourceDescription').value = item.description;
  document.getElementById('resourceCategory').value = item.category;
  clearFieldErrors();
  openModal();
}

function handleResourceForm(e) {
  e.preventDefault();
  clearFieldErrors();

  const title = document.getElementById('resourceTitle').value.trim();
  const url = document.getElementById('resourceUrl').value.trim();
  const desc = document.getElementById('resourceDescription').value.trim();
  const cat = document.getElementById('resourceCategory').value;

  let valid = true;
  if (!title) { setFieldError('err-title', 'Title is required'); valid = false; }
  if (!url || !/^https?:\/\//i.test(url)) { setFieldError('err-url', 'Enter a valid URL (https://…)'); valid = false; }
  if (!desc) { setFieldError('err-desc', 'Description is required'); valid = false; }
  if (!cat) { setFieldError('err-cat', 'Please select a category'); valid = false; }
  if (!valid) return;

  const items = getCustomLinks();

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx > -1) {
      const oldUrl = items[idx].url;
      items[idx] = { ...items[idx], title, url, description: desc, category: cat };
      // update saved link if URL changed
      if (oldUrl !== url) {
        const saved = getSavedLinks();
        const si = saved.indexOf(oldUrl);
        if (si > -1) { saved[si] = url; setSavedLinks(saved); }
      }
    }
    showToast('Resource updated ✓', 't-success');
  } else {
    items.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      title, url, description: desc, category: cat, tags: ''
    });
    showToast('Resource added ✓', 't-success');
  }

  setCustomLinks(items);
  closeModal();
  renderCustomCards();
  updateAllCounts();
  applyFilters();
}

function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  const items = getCustomLinks().filter(i => i.id !== id);
  const deleted = getCustomLinks().find(i => i.id === id);
  setCustomLinks(items);

  if (deleted) {
    const saved = getSavedLinks().filter(h => h !== deleted.url);
    setSavedLinks(saved);
  }

  renderCustomCards();
  updateAllCounts();
  applyFilters();
  showToast('Resource deleted', 't-info');
}

/* ══════════════════════════════
   FAVICONS / LOGOS
══════════════════════════════ */
const LOGO_MAP = {
  // Design Tools
  'figma.com': 'figma',
  'coolors.co': 'coolors',
  'fonts.google.com': 'googlefonts',
  'undraw.co': 'undraw',
  'canva.com': 'canva',
  'sketch.com': 'sketch',
  'adobe.com': 'adobe',
  'dribbble.com': 'dribbble',
  'behance.net': 'behance',
  'material.io': 'materialdesignicons',
  'fontawesome.com': 'fontawesome',
  
  // Development & Code
  'developer.mozilla.org': 'mdnwebdocs',
  'codepen.io': 'codepen',
  'codesandbox.io': 'codesandbox',
  'replit.com': 'replit',
  'glitch.com': 'glitch',
  'jsfiddle.net': 'jsfiddle',
  'stackblitz.com': 'stackblitz',
  'codecademy.com': 'codecademy',
  'freecodecamp.org': 'freecodecamp',
  'theodinproject.com': 'theodinproject',
  'cs50.harvard.edu': 'harvard',
  'javascript.info': 'javascript',
  'typescriptlang.org': 'typescript',
  'reactjs.org': 'react',
  'vuejs.org': 'vue',
  'angular.io': 'angular',
  'svelte.dev': 'svelte',
  'nextjs.org': 'nextdotjs',
  'nodejs.org': 'nodedotjs',
  'expressjs.com': 'express',
  'tailwindcss.com': 'tailwindcss',
  'bootstrap.com': 'bootstrap',
  'getbootstrap.com': 'bootstrap',
  'css-tricks.com': 'csstricks',
  'w3schools.com': 'w3schools',
  
  // Hosting & Deployment
  'vercel.com': 'vercel',
  'netlify.com': 'netlify',
  'railway.app': 'railway',
  'heroku.com': 'heroku',
  'digitalocean.com': 'digitalocean',
  'aws.amazon.com': 'amazonaws',
  'cloudflare.com': 'cloudflare',
  'pages.github.com': 'github',
  'github.com': 'github',
  'gitlab.com': 'gitlab',
  'bitbucket.org': 'bitbucket',
  'surge.sh': 'surge',
  'firebase.google.com': 'firebase',
  'supabase.com': 'supabase',
  'mongodb.com': 'mongodb',
  'mysql.com': 'mysql',
  'postgresql.org': 'postgresql',
  
  // AI & Machine Learning
  'chat.openai.com': 'openai',
  'openai.com': 'openai',
  'claude.ai': 'anthropic',
  'anthropic.com': 'anthropic',
  'huggingface.co': 'huggingface',
  'replicate.com': 'replicate',
  'runwayml.com': 'runway',
  'midjourney.com': 'midjourney',
  'stability.ai': 'stabilityai',
  'perplexity.ai': 'perplexity',
  'character.ai': 'characterai',
  'poe.com': 'poe',
  'cursor.sh': 'cursor',
  'tabnine.com': 'tabnine',
  'copilot.microsoft.com': 'microsoft',
  'github.com/copilot': 'microsoft',
  'v0.dev': 'vercel',
  'bard.google.com': 'google',
  'gemini.google.com': 'google',
  'cohere.com': 'cohere',
  'pinecone.io': 'pinecone',
  'langchain.com': 'langchain',
  'gradio.app': 'gradio',
  'streamlit.io': 'streamlit',
  'huggingface.co': 'huggingface',
  
  // Learning & Documentation
  'stackoverflow.com': 'stackoverflow',
  'caniuse.com': 'caniuse',
  'mdn.mozilla.org': 'mdnwebdocs',
  'w3.org': 'w3c',
  'devdocs.io': 'devdocs',
  'readme.io': 'readme',
  'gitbook.com': 'gitbook',
  'notion.so': 'notion',
  'obsidian.md': 'obsidian',
  'roamresearch.com': 'roamresearch',
  'logseq.com': 'logseq',
  'dynalist.io': 'dynalist',
  'workflowy.com': 'workflowy',
  'checkvist.com': 'checkvist',
  'todoist.com': 'todoist',
  'trello.com': 'trello',
  'asana.com': 'asana',
  'linear.app': 'linear',
  'jira.atlassian.com': 'jira',
  'clickup.com': 'clickup',
  'monday.com': 'mondaydotcom',
  'slack.com': 'slack',
  'discord.com': 'discord',
  'zoom.us': 'zoom',
  'meet.google.com': 'google',
  
  // APIs & Services
  'api.github.com': 'github',
  'rapidapi.com': 'rapidapi',
  'postman.com': 'postman',
  'insomnia.rest': 'insomnia',
  'thunderclient.io': 'thunderclient',
  'hoppscotch.io': 'hoppscotch',
  'webhook.site': 'webhook',
  'ngrok.com': 'ngrok',
  'localtunnel.me': 'localtunnel',
  'tunnelto.dev': 'tunnelto',
  'serveo.net': 'serveo',
  'jsonplaceholder.typicode.com': 'jsonplaceholder',
  'reqres.in': 'reqres',
  'mockapi.io': 'mockapiio',
  'fakerjs.dev': 'fakerjs',
  'mswjs.io': 'mswjs',
  
  // Databases & Storage
  'mongodb.com': 'mongodb',
  'redis.io': 'redis',
  'elasticsearch.co': 'elasticsearch',
  'algolia.com': 'algolia',
  'meilisearch.com': 'meilisearch',
  'typesense.org': 'typesense',
  'supabase.com': 'supabase',
  'planetscale.com': 'planetscale',
  'neon.tech': 'neon',
  'xata.io': 'xata',
  'appwrite.io': 'appwrite',
  'convex.dev': 'convex',
  
  // Monitoring & Analytics
  'sentry.io': 'sentry',
  'datadoghq.com': 'datadog',
  'newrelic.com': 'newrelic',
  'grafana.com': 'grafana',
  'mixpanel.com': 'mixpanel',
  'amplitude.com': 'amplitude',
  'fullstory.com': 'fullstory',
  'hotjar.com': 'hotjar',
  'clarity.microsoft.com': 'microsoft',
  'analytics.google.com': 'google',
  'plausible.io': 'plausible',
  'umami.is': 'umami',
  'fathom.com': 'fathom',
  
  // Communication & Collaboration
  'discord.com': 'discord',
  'slack.com': 'slack',
  'teams.microsoft.com': 'microsoft',
  'zoom.us': 'zoom',
  'meet.google.com': 'google',
  'calendly.com': 'calendly',
  'notion.so': 'notion',
  'obsidian.md': 'obsidian',
  'roamresearch.com': 'roamresearch',
  'logseq.com': 'logseq',
  'craft.do': 'craft',
  'anytype.io': 'anytype',
  'siyuan.com': 'siyuan',
  'typora.io': 'typora',
  'bear.app': 'bear',
  'standardnotes.com': 'standardnotes',
  'simplenote.com': 'simplenote',
  
  // Testing & Quality
  'jestjs.io': 'jest',
  'vitest.dev': 'vitest',
  'cypress.io': 'cypress',
  'playwright.dev': 'playwright',
  'testinglibrary.com': 'testinglibrary',
  'storybook.js.org': 'storybook',
  'chromatic.com': 'chromatic',
  'lighthouse.dev': 'google',
  'pagespeed.web.dev': 'google',
  'gtmetrix.com': 'gtmetrix',
  'web.dev': 'google',
  
  // Security & Authentication
  'auth0.com': 'auth0',
  'okta.com': 'okta',
  'clerk.dev': 'clerk',
  'supabase.com': 'supabase',
  'firebase.google.com': 'firebase',
  'passportjs.org': 'passport',
  'nextauth.js.org': 'nextauth',
  'lucia-auth.com': 'lucia',
  'better-auth.com': 'betterauth',
  'lucia-auth.com': 'lucia',
  
  // Performance & Optimization
  'bundlephobia.com': 'bundlephobia',
  'webpack.js.org': 'webpack',
  'vitejs.dev': 'vite',
  'parceljs.org': 'parcel',
  'rollupjs.org': 'rollup',
  'esbuild.github.io': 'esbuild',
  'swc.rs': 'swc',
  'turbo.build': 'turbo',
  'deno.land': 'deno',
  'bun.sh': 'bun',
  
  // Content & CMS
  'contentful.com': 'contentful',
  'strapi.io': 'strapi',
  'sanity.io': 'sanity',
  'storyblok.com': 'storyblok',
  'cosmicjs.com': 'cosmicjs',
  'keystonejs.com': 'keystone',
  'directus.io': 'directus',
  'payloadcms.com': 'payloadcms',
  'hygraph.com': 'hygraph',
  'graphcms.com': 'graphcms',
  
  // E-commerce & Payments
  'stripe.com': 'stripe',
  'paypal.com': 'paypal',
  'shopify.com': 'shopify',
  'bigcommerce.com': 'bigcommerce',
  'woocommerce.com': 'woocommerce',
  'magento.com': 'magento',
  'opencart.com': 'opencart',
  'squareup.com': 'square',
  'braintreepayments.com': 'braintree',
  'adyen.com': 'adyen',
  
  // Social & Community
  'twitter.com': 'twitter',
  'x.com': 'x',
  'linkedin.com': 'linkedin',
  'github.com': 'github',
  'gitlab.com': 'gitlab',
  'reddit.com': 'reddit',
  'hackernews.ycombinator.com': 'ycombinator',
  'producthunt.com': 'producthunt',
  'indiehackers.com': 'indiehackers',
  'dev.to': 'devdotto',
  'hashnode.com': 'hashnode',
  'medium.com': 'medium',
  'substack.com': 'substack',
  
  // Developer Tools
  'docker.com': 'docker',
  'kubernetes.io': 'kubernetes',
  'terraform.io': 'terraform',
  'ansible.com': 'ansible',
  'puppet.com': 'puppet',
  'chef.io': 'chef',
  'vagrantup.com': 'vagrant',
  'virtualbox.org': 'virtualbox',
  'vmware.com': 'vmware',
  'parallels.com': 'parallels',
  
  // Package Managers
  'npmjs.com': 'npm',
  'yarnpkg.com': 'yarn',
  'pnpm.io': 'pnpm',
  'bun.sh': 'bun',
  'deno.land': 'deno',
  'cargo.crates.io': 'cargo',
  'pip.pypa.io': 'pypi',
  'composer.org': 'composer',
  'rubygems.org': 'rubygems',
  'go.dev': 'go',
  'crates.io': 'crates',
  
  // Cloud Platforms
  'aws.amazon.com': 'amazonaws',
  'azure.microsoft.com': 'microsoft',
  'cloud.google.com': 'google',
  'digitalocean.com': 'digitalocean',
  'linode.com': 'linode',
  'vultr.com': 'vultr',
  'hetzner.com': 'hetzner',
  'scaleway.com': 'scaleway',
  'ovhcloud.com': 'ovh',
  'ibm.com': 'ibm',
  'oracle.com': 'oracle',
  'salesforce.com': 'salesforce',
  
  // Developer Communities
  'stackoverflow.com': 'stackoverflow',
  'reddit.com': 'reddit',
  'discord.com': 'discord',
  'slack.com': 'slack',
  'github.com': 'github',
  'gitlab.com': 'gitlab',
  'bitbucket.org': 'bitbucket',
  'dev.to': 'devdotto',
  'hashnode.com': 'hashnode',
  'medium.com': 'medium',
  'producthunt.com': 'producthunt',
  'hackernews.ycombinator.com': 'ycombinator',
  'lobste.rs': 'lobste',
  'indiehackers.com': 'indiehackers',
  
  // Additional Popular Services
  'youtube.com': 'youtube',
  'twitch.tv': 'twitch',
  'spotify.com': 'spotify',
  'netflix.com': 'netflix',
  'amazon.com': 'amazon',
  'ebay.com': 'ebay',
  'etsy.com': 'etsy',
  'airbnb.com': 'airbnb',
  'uber.com': 'uber',
  'lyft.com': 'lyft',
  'dropbox.com': 'dropbox',
  'googledrive.com': 'googledrive',
  'onedrive.live.com': 'microsoft',
  'icloud.com': 'apple'
};

function loadFavicons() {
  try {
    document.querySelectorAll('.card').forEach(card => {
      const href = getHref(card);
      const iconWrap = card.querySelector('.card-icon-wrap');
      const iconEl = iconWrap ? iconWrap.querySelector('.card-icon') : null;
      if (!href || !iconEl) return;
      loadFaviconFor(iconEl, href, card.querySelector('h3')?.textContent || '?');
    });
  } catch (error) {
    console.warn('Error loading favicons:', error);
  }
}

// Also trigger logo loading for dynamically added cards
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('card')) {
          const href = getHref(node);
          const iconWrap = node.querySelector('.card-icon-wrap');
          const iconEl = iconWrap ? iconWrap.querySelector('.card-icon') : null;
          if (href && iconEl) {
            setTimeout(() => loadFaviconFor(iconEl, href, node.querySelector('h3')?.textContent || '?'), 100);
          }
        }
      });
    }
  });
});

// Start observing the card grid for dynamic content
const cardGrid = document.querySelector('.card-grid');
if (cardGrid) {
  observer.observe(cardGrid, { childList: true, subtree: true });
}

function loadFaviconFor(iconEl, href, title) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    const slug = LOGO_MAP[host] || host.split('.')[0];

    console.log('Loading logo for:', host, '→', slug); // Debug log

    iconEl.innerHTML = '';
    const img = document.createElement('img');
    img.alt = title + ' logo';
    img.style.cssText = 'width:24px;height:24px;object-fit:contain;display:block;';
    
    // Try multiple CDN sources for better reliability
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const iconColor = isLightTheme ? '000000' : 'ffffff';
    const cdnSources = [
      `https://cdn.simpleicons.org/${slug}/${iconColor}`,
      `https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/${slug}.svg`,
      `https://unpkg.com/simple-icons@v5/icons/${slug}.svg`
    ];
    
    let currentSource = 0;
    
    function tryNextSource() {
      if (currentSource >= cdnSources.length) {
        // All CDNs failed, try favicon
        console.log('All CDNs failed for:', host, 'trying favicon fallback');
        img.src = `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
        img.onerror = () => {
          console.log('Favicon failed for:', host, 'using letter fallback');
          iconEl.textContent = title.charAt(0).toUpperCase();
          iconEl.classList.add('logo-missing');
        };
        return;
      }
      
      img.src = cdnSources[currentSource];
      console.log('Trying CDN source', currentSource + 1, 'for:', host);
    }
    
    img.onload = () => {
      console.log('Successfully loaded logo for:', host, 'from CDN:', currentSource + 1);
    };
    
    img.onerror = () => {
      console.log('CDN source', currentSource + 1, 'failed for:', host);
      currentSource++;
      tryNextSource();
    };
    
    tryNextSource();
    iconEl.appendChild(img);
  } catch (error) {
    console.warn('Error loading favicon for', href, ':', error);
    // Fallback to first letter
    if (iconEl && title) {
      iconEl.textContent = title.charAt(0).toUpperCase();
      iconEl.classList.add('logo-missing');
    }
  }
}

// Force load logos immediately for testing
setTimeout(() => {
  console.log('Force loading logos...');
  loadFavicons();
}, 100);

/* ══════════════════════════════
   COUNTS
══════════════════════════════ */
function updateAllCounts() {
  try {
    const allCards = document.querySelectorAll('.card');
    const cats = { design: 0, coding: 0, hosting: 0, ai: 0, learning: 0 };

    allCards.forEach(c => {
      const cat = c.dataset.category;
      if (cats[cat] !== undefined) cats[cat]++;
    });

    const saved = getSavedLinks();
    const custom = getCustomLinks();

    document.getElementById('total-links').textContent = allCards.length;
    document.getElementById('total-categories').textContent = Object.keys(cats).length;
    document.getElementById('total-saved').textContent = saved.length;
    document.getElementById('total-custom').textContent = custom.length;

    const nc = { all: allCards.length, saved: saved.length, ...cats };
    Object.entries(nc).forEach(([cat, count]) => {
      const el = document.getElementById(`nc-${cat}`);
      if (el) el.textContent = count;
    });
  } catch (error) {
    console.warn('Error updating counts:', error);
  }
}

/* ══════════════════════════════
   MODAL HELPERS
══════════════════════════════ */
function openModal() {
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('resourceTitle').focus(), 100);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingId = null;
}

function handleResourceSubmit(event) {
  event.preventDefault();
  
  const title = document.getElementById('resourceTitle').value.trim();
  const url = document.getElementById('resourceUrl').value.trim();
  const description = document.getElementById('resourceDescription').value.trim();
  const category = document.getElementById('resourceCategory').value;
  
  // Clear previous errors
  clearFieldErrors();
  
  // Validate
  let hasError = false;
  if (!title) {
    setFieldError('err-title', 'Title is required');
    hasError = true;
  }
  if (!url) {
    setFieldError('err-url', 'URL is required');
    hasError = true;
  }
  if (!description) {
    setFieldError('err-desc', 'Description is required');
    hasError = true;
  }
  if (!category) {
    setFieldError('err-cat', 'Category is required');
    hasError = true;
  }
  
  if (hasError) return;
  
  // Create or update resource
  if (editingId) {
    // Update existing
    const customCards = JSON.parse(safeGetItem('devlinks-custom') || '[]');
    const index = customCards.findIndex(c => c.id === editingId);
    if (index !== -1) {
      customCards[index] = { ...customCards[index], title, url, description, category };
      safeSetItem('devlinks-custom', JSON.stringify(customCards));
      showToast('Resource updated!', 't-success');
    }
  } else {
    // Create new
    const customCards = JSON.parse(safeGetItem('devlinks-custom') || '[]');
    const newCard = {
      id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      title,
      url,
      description,
      category,
      tags: category,
      created: new Date().toISOString()
    };
    customCards.push(newCard);
    safeSetItem('devlinks-custom', JSON.stringify(customCards));
    showToast('Resource added!', 't-success');
  }
  
  // Reset and close
  document.getElementById('resourceForm').reset();
  closeModal();
  renderCustomCards();
  updateAllCounts();
  applyFilters();
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function setFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearFieldErrors() {
  ['err-title', 'err-url', 'err-desc', 'err-cat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

/* ══════════════════════════════
   MOBILE SIDEBAR TOGGLE
══════════════════════════════ */
function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
let toastTimeout;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  
  // Clear existing timeout to prevent memory leaks
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    toastTimeout = null; // Clear reference
  }, 2600);
}

/* ══════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════ */
let cmdSelectedIndex = 0;
let cmdItems = [];

function initKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (isCmdPaletteOpen()) {
      handleCmdKeydown(e);
      return;
    }

    // "/" focuses search
    if (e.key === '/' && !inInput) {
      e.preventDefault();
      document.getElementById('searchInput').focus();
      document.getElementById('searchInput').select();
    }

    // Esc closes modal or blurs search
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('searchInput').blur();
    }

    // "a" opens add form (not in input)
    if (e.key === 'a' && !inInput && !e.ctrlKey && !e.metaKey) {
      openAddForm();
    }

    // "t" toggles theme (not in input)
    if (e.key === 't' && !inInput && !e.ctrlKey && !e.metaKey) {
      toggleTheme();
    }
  });

  const cmdInput = document.getElementById('cmd-input');
  if (cmdInput) {
    cmdInput.addEventListener('input', updateCmdResults);
  }
}

function isCmdPaletteOpen() {
  const overlay = document.getElementById('cmd-overlay');
  return overlay && !overlay.classList.contains('hidden');
}

function openCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (overlay && input) {
    overlay.classList.remove('hidden');
    input.value = '';
    updateCmdResults();
    setTimeout(() => input.focus(), 50);
  }
}

function closeCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    document.getElementById('cmd-input').blur();
  }
}

function handleCmdOverlayClick(e) {
  if (e.target === document.getElementById('cmd-overlay')) {
    closeCmdPalette();
  }
}

function handleCmdKeydown(e) {
  if (e.key === 'Escape') {
    closeCmdPalette();
    e.preventDefault();
    return;
  }

  const resultCards = document.querySelectorAll('.cmd-item');
  if (resultCards.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cmdSelectedIndex = (cmdSelectedIndex + 1) % resultCards.length;
    renderCmdSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cmdSelectedIndex = (cmdSelectedIndex - 1 + resultCards.length) % resultCards.length;
    renderCmdSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = cmdItems[cmdSelectedIndex];
    if (selected) executeCmdAction(selected);
  }
}

function renderCmdSelection() {
  const items = document.querySelectorAll('.cmd-item');
  items.forEach((el, idx) => {
    if (idx === cmdSelectedIndex) {
      el.classList.add('selected');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('selected');
    }
  });
}

function executeCmdAction(item) {
  closeCmdPalette();
  if (item.type === 'action') {
    if (item.actionId === 'theme') toggleTheme();
    else if (item.actionId === 'add') openAddForm();
    else if (item.actionId === 'view-grid') setView('grid');
    else if (item.actionId === 'view-list') setView('list');
  } else if (item.type === 'category') {
    const btn = document.querySelector(`.nav-btn[data-cat="${item.categoryId}"]`);
    if (btn) filterCategory(item.categoryId, btn);
  } else if (item.type === 'resource') {
    window.open(item.url, '_blank', 'noreferrer');
  }
}

function updateCmdResults() {
  const query = document.getElementById('cmd-input').value.toLowerCase().trim();
  const resultsContainer = document.getElementById('cmd-results');
  resultsContainer.innerHTML = '';
  cmdItems = [];
  cmdSelectedIndex = 0;

  // Actions
  const actions = [
    { type: 'action', actionId: 'theme', title: 'Toggle Dark Mode', icon: '🌙' },
    { type: 'action', actionId: 'add', title: 'Add Resource', icon: '＋' },
    { type: 'action', actionId: 'view-grid', title: 'Grid View', icon: '⊞' },
    { type: 'action', actionId: 'view-list', title: 'List View', icon: '☰' },
  ].filter(a => !query || a.title.toLowerCase().includes(query));

  if (actions.length) appendCmdGroup('Actions', actions, resultsContainer);

  // Categories
  const categories = [
    { type: 'category', categoryId: 'all', title: 'All Resources', icon: '⊞' },
    { type: 'category', categoryId: 'saved', title: 'Saved Links', icon: '★' },
    { type: 'category', categoryId: 'design', title: 'Design', icon: '✦' },
    { type: 'category', categoryId: 'coding', title: 'Coding', icon: '</>' },
    { type: 'category', categoryId: 'hosting', title: 'Hosting', icon: '▲' },
    { type: 'category', categoryId: 'ai', title: 'AI Tools', icon: '◈' },
    { type: 'category', categoryId: 'learning', title: 'Learning', icon: '◉' },
  ].filter(c => !query || c.title.toLowerCase().includes(query));

  if (categories.length) appendCmdGroup('Categories', categories, resultsContainer);

  // Resources
  const allCards = document.querySelectorAll('.card');
  const resources = [];
  allCards.forEach(c => {
    const title = c.querySelector('h3')?.textContent || '';
    const url = getHref(c) || '';
    const desc = c.querySelector('p')?.textContent || '';
    if (!query || title.toLowerCase().includes(query) || url.toLowerCase().includes(query) || desc.toLowerCase().includes(query)) {
      resources.push({ type: 'resource', title, url, desc, icon: '🔗' });
    }
  });

  if (resources.length) appendCmdGroup('Resources', resources, resultsContainer);

  renderCmdSelection();
}

function appendCmdGroup(label, items, container) {
  const groupLabel = document.createElement('div');
  groupLabel.className = 'cmd-group-label';
  groupLabel.textContent = label;
  container.appendChild(groupLabel);

  items.forEach(item => {
    const idx = cmdItems.length;
    cmdItems.push(item);

    const el = document.createElement('div');
    el.className = 'cmd-item';
    
    let subtext = '';
    let actionText = 'Jump to';
    if (item.type === 'action') actionText = 'Execute';
    else if (item.type === 'resource') { subtext = item.url; actionText = 'Open link'; }
    
    // We already have escHtml from the script context
    el.innerHTML = `
      <div class="cmd-item-icon">${item.icon}</div>
      <div class="cmd-item-content">
        <div class="cmd-item-title">${escHtml(item.title)}</div>
        ${subtext ? `<div class="cmd-item-sub">${domainOf(subtext)}</div>` : ''}
      </div>
      <div class="cmd-item-action">${actionText} ↵</div>
    `;

    el.addEventListener('click', () => executeCmdAction(item));
    el.addEventListener('mouseenter', () => {
      cmdSelectedIndex = idx;
      renderCmdSelection();
    });

    container.appendChild(el);
  });
}


