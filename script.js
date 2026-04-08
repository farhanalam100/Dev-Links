/* ══════════════════════════════════════════
   DEVLINKS — Enhanced Script
   Features: category filter, search with tag support,
   save/unsave, custom CRUD, grid/list view,
   favicon logos, keyboard shortcut, toast notifications,
   per-category counters, theme persistence
══════════════════════════════════════════ */

/* ── STATE ── */
let activeCategory = 'all';
let currentView = 'grid';
let editingId = null;

/* ══════════════════════════════
   INIT
══════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  restoreTheme();
  renderCustomCards();
  updateAllCounts();
  restoreSavedButtons();
  loadFavicons();
  applyFilters();
  initKeyboard();
  
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
  const query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const saved = getSavedLinks();
  const cards = document.querySelectorAll('.card');
  let visible = 0;

  cards.forEach(card => {
    const name = (card.querySelector('h3')?.textContent || '').toLowerCase();
    const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const domain = (card.querySelector('.card-domain')?.textContent || '').toLowerCase();
    const category = card.dataset.category || '';
    const href = getHref(card);

    const matchSearch = !query
      || name.includes(query)
      || desc.includes(query)
      || tags.includes(query)
      || domain.includes(query);

    const matchCat = activeCategory === 'all'
      || (activeCategory === 'saved' && saved.includes(href))
      || category === activeCategory;

    const show = matchSearch && matchCat;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const noRes = document.getElementById('noResults');
  const noTxt = document.getElementById('noResultsText');

  if (visible === 0) {
    noRes.classList.remove('hidden');
    noTxt.textContent = activeCategory === 'saved'
      ? (query ? `No saved results for "${query}"` : 'No saved resources yet')
      : (query ? `No results for "${query}"` : 'No resources here yet');
  } else {
    noRes.classList.add('hidden');
  }

  document.getElementById('footer-count').textContent = `${visible} resource${visible !== 1 ? 's' : ''}`;
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
  try { return JSON.parse(safeGetItem('dl-custom') || '[]'); }
  catch { return []; }
}

function setCustomLinks(arr) {
  safeSetItem('dl-custom', JSON.stringify(arr));
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
function renderCustomCards() {
  // Remove existing
  document.querySelectorAll('.card.custom-card').forEach(c => c.remove());

  const items = getCustomLinks();
  const grid = document.getElementById('cardGrid');
  const saved = getSavedLinks();

  items.forEach(item => {
    const card = document.createElement('a');
    card.className = 'card custom-card';
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noreferrer';
    card.dataset.category = item.category;
    card.dataset.tags = item.tags || '';

    const catClass = `cat-${item.category}`;
    const isSaved = saved.includes(item.url);

    card.innerHTML = `
      <div class="card-icon-wrap ${catClass}">
        <div class="card-icon" id="ci-${item.id}">
          <span>${item.title.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-header-row">
          <h3>${escHtml(item.title)}</h3>
          <span class="card-badge ${catClass}">${catLabel(item.category)}</span>
        </div>
        <p>${escHtml(item.description)}</p>
      </div>
      <div class="card-footer">
        <span class="card-domain">${domainOf(item.url)}</span>
        <button class="save-btn ${isSaved ? 'saved' : ''}">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="custom-actions" data-id="${item.id}">
        <button class="edit-btn" data-action="edit">✏ Edit</button>
        <button class="del-btn" data-action="delete">✕ Delete</button>
      </div>
    `;

    grid.appendChild(card);
    loadFaviconFor(card.querySelector('.card-icon'), item.url, item.title);
  });
}

function catLabel(cat) {
  return { design: 'Design', coding: 'Coding', hosting: 'Hosting', ai: 'AI Tools', learning: 'Learning' }[cat] || cat;
}

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
  'figma.com': 'figma',
  'coolors.co': 'coolors',
  'fonts.google.com': 'googlefonts',
  'undraw.co': 'undraw',
  'developer.mozilla.org': 'mdnwebdocs',
  'codepen.io': 'codepen',
  'caniuse.com': 'caniuse',
  'stackoverflow.com': 'stackoverflow',
  'vercel.com': 'vercel',
  'netlify.com': 'netlify',
  'pages.github.com': 'github',
  'github.com': 'github',
  'railway.app': 'railway',
  'claude.ai': 'anthropic',
  'v0.dev': 'vercel',
  'chat.openai.com': 'openai',
  'freecodecamp.org': 'freecodecamp',
  'theodinproject.com': 'theodinproject',
  'cs50.harvard.edu': 'harvard',
  'javascript.info': 'javascript',
};

function loadFavicons() {
  document.querySelectorAll('.card').forEach(card => {
    const href = getHref(card);
    const iconEl = card.querySelector('.card-icon');
    if (!href || !iconEl) return;
    loadFaviconFor(iconEl, href, card.querySelector('h3')?.textContent || '?');
  });
}

function loadFaviconFor(iconEl, href, title) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    const slug = LOGO_MAP[host] || host.split('.')[0];

    iconEl.innerHTML = '';
    const img = document.createElement('img');
    img.alt = title + ' logo';
    img.style.cssText = 'width:24px;height:24px;object-fit:contain;';
    img.src = `https://cdn.simpleicons.org/${slug}/ffffff`;
    img.onerror = () => {
      // fallback to favicon
      img.src = `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
      img.onerror = () => {
        iconEl.textContent = title.charAt(0).toUpperCase();
        iconEl.classList.add('logo-missing');
      };
    };
    iconEl.appendChild(img);
  } catch { }
}

/* ══════════════════════════════
   COUNTS
══════════════════════════════ */
function updateAllCounts() {
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
}

/* ══════════════════════════════
   MODAL HELPERS
══════════════════════════════ */
function openModal() {
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('resourceTitle').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
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

    // Ctrl+K / Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCmdPalette();
      return;
    }

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