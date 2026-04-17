/* ══════════════════════════════════════════
   DEVLINKS — Core Script
   Features: filter, search, save, CRUD,
   favicons, theme, keyboard, toast, view
══════════════════════════════════════════ */

/* ── STATE ── */
// Global state variables - maybe move these to a class later?
let activeCategory = 'all';  // Currently selected category
let currentView = 'grid';    // Grid or list view
let editingId = null;        // ID of resource being edited
let currentSort = 'default'; // Sort order (not fully implemented yet)

/* ── INIT ── */
// Initialize the app when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Restore theme from storage
  restoreTheme();
  
  // Apply stored accent color
  applyStoredAccentColor();
  
  // Restore font size from storage
  restoreFontSize();
  restoreView();
  renderCustomCards();
  updateAllCounts();
  restoreSavedButtons();
  loadFavicons();
  applyFilters();
  initKeyboard();

  // Event delegation for custom card actions
  document.addEventListener('click', e => {
    const actions = e.target.closest('.custom-actions');
    if (actions) {
      e.preventDefault();
      const id = actions.dataset.id;
      if (e.target.dataset.action === 'edit') openEditForm(id);
      else if (e.target.dataset.action === 'delete') deleteResource(id);
    }
  });
});

/* ══════════════════════════════
   THEME
══════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.removeAttribute('data-theme');
    safeSetItem('devlinks-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    safeSetItem('devlinks-theme', 'light');
  }
  updateThemePanelState();
}

function restoreTheme() {
  const saved = safeGetItem('devlinks-theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}

function setThemeMode(mode) {
  document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
  const btn = document.getElementById(`theme-${mode}`);
  if (btn) btn.classList.add('active');

  const html = document.documentElement;
  if (mode === 'dark') { html.removeAttribute('data-theme'); safeSetItem('devlinks-theme','dark'); }
  else if (mode === 'light') { html.setAttribute('data-theme','light'); safeSetItem('devlinks-theme','light'); }
  else if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    prefersDark ? html.removeAttribute('data-theme') : html.setAttribute('data-theme','light');
    safeSetItem('devlinks-theme','auto');
  }
}

function openThemePanel() { document.getElementById('themePanel').classList.remove('hidden'); updateThemePanelState(); }
function closeThemePanel() { document.getElementById('themePanel').classList.add('hidden'); }

function updateThemePanelState() {
  const theme = safeGetItem('devlinks-theme') || 'dark';
  document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
  const btn = document.getElementById(`theme-${theme}`);
  if (btn) btn.classList.add('active');
  const accent = safeGetItem('devlinks-accent') || '#ef4160';
  const picker = document.getElementById('accentColorPicker');
  if (picker) picker.value = accent;
  const fontSize = safeGetItem('devlinks-font-size') || '16';
  const display = document.getElementById('fontSizeValue');
  if (display) display.textContent = `${fontSize}px`;
}

function saveTheme() { showToast('Theme saved!', 't-success'); closeThemePanel(); }

function resetTheme() {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.fontSize = '';
  updateAccentColor('#ef4160');
  safeSetItem('devlinks-theme','dark');
  safeSetItem('devlinks-font-size','16');
  updateThemePanelState();
  showToast('Theme reset', 't-info');
}

/* ── ACCENT COLOR ── */
function updateAccentColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--accent', color);
  const rgb = hexToRgb(color);
  if (rgb) {
    root.style.setProperty('--accent-dim', `rgba(${rgb.r},${rgb.g},${rgb.b},0.14)`);
    root.style.setProperty('--accent-glow', `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)`);
  }
  const picker = document.getElementById('accentColorPicker');
  if (picker) picker.value = color;
  safeSetItem('devlinks-accent', color);
}

function applyStoredAccentColor() {
  const c = safeGetItem('devlinks-accent');
  if (c) updateAccentColor(c);
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16) } : null;
}

/* ── FONT SIZE ── */
function adjustFontSize(delta) {
  const root = document.documentElement;
  const current = parseInt(safeGetItem('devlinks-font-size') || '16');
  const next = Math.max(12, Math.min(20, current + delta));
  root.style.fontSize = `${next}px`;
  safeSetItem('devlinks-font-size', next.toString());
  const display = document.getElementById('fontSizeValue');
  if (display) display.textContent = `${next}px`;
  showToast(`Font size: ${next}px`, 't-info');
}

function restoreFontSize() {
  const size = safeGetItem('devlinks-font-size');
  if (size && size !== '16') document.documentElement.style.fontSize = `${size}px`;
}

/* ══════════════════════════════
   VIEW TOGGLE
══════════════════════════════ */
function setView(view) {
  currentView = view;
  const grid = document.getElementById('cardGrid');
  grid.classList.toggle('list-view', view === 'list');
  document.getElementById('view-grid').classList.toggle('active', view === 'grid');
  document.getElementById('view-list').classList.toggle('active', view === 'list');
  safeSetItem('devlinks-view', view);
}

function restoreView() {
  const saved = safeGetItem('devlinks-view');
  if (saved) setView(saved);
}

/* ══════════════════════════════
   CATEGORY FILTER
══════════════════════════════ */
function filterCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

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
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
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

    const matchSearch = !query || name.includes(query) || desc.includes(query) || tags.includes(query) || domain.includes(query);
    const matchCat = activeCategory === 'all'
      || (activeCategory === 'saved' && saved.includes(href))
      || category === activeCategory;

    if (matchSearch && matchCat) {
      card.style.display = '';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });

  const noRes = document.getElementById('noResults');
  const noTxt = document.getElementById('noResultsText');
  if (visible === 0) {
    noRes.classList.remove('hidden');
    noTxt.textContent = activeCategory === 'saved'
      ? (query ? `No saved results for "${query}"` : 'No saved resources yet — star some!')
      : (query ? `No results for "${query}"` : 'No resources in this category yet');
  } else {
    noRes.classList.add('hidden');
  }

  const footerCount = document.getElementById('footer-count');
  if (footerCount) footerCount.textContent = `${visible} resource${visible !== 1 ? 's' : ''}`;
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

  if (idx > -1) {
    saved.splice(idx, 1);
    btn.classList.remove('saved');
    showToast('Removed from saved', 't-info');
  } else {
    saved.push(href);
    btn.classList.add('saved');
    btn.style.transform = 'scale(1.4)';
    setTimeout(() => btn.style.transform = '', 250);
    showToast('Saved! ⭐', 't-success');
    logActivity(`Saved resource: ${card.querySelector('h3')?.textContent || href}`);
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
  try { return new URL(url).hostname.replace(/^www\./,''); }
  catch { return url; }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
  const item = getCustomLinks().find(i => i.id === id);
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
  if (!title) { setFieldError('err-title','Title is required'); valid = false; }
  if (!url || !/^https?:\/\//i.test(url)) { setFieldError('err-url','Enter a valid URL (https://…)'); valid = false; }
  if (!desc) { setFieldError('err-desc','Description is required'); valid = false; }
  if (!cat) { setFieldError('err-cat','Please select a category'); valid = false; }
  if (!valid) return;

  const items = getCustomLinks();

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx > -1) {
      const oldUrl = items[idx].url;
      items[idx] = { ...items[idx], title, url, description:desc, category:cat };
      if (oldUrl !== url) {
        const savedLinks = getSavedLinks();
        const si = savedLinks.indexOf(oldUrl);
        if (si > -1) { savedLinks[si] = url; setSavedLinks(savedLinks); }
      }
    }
    showToast('Resource updated ✓', 't-success');
    logActivity(`Updated resource: ${title}`);
  } else {
    items.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      title, url, description:desc, category:cat, tags:''
    });
    showToast('Resource added ✓', 't-success');
    logActivity(`Added resource: ${title}`);
  }

  setCustomLinks(items);
  closeModal();
  renderCustomCards();
  updateAllCounts();
  applyFilters();
}

function renderCustomCards() {
  // Remove old custom cards first
  document.querySelectorAll('.custom-card').forEach(c => c.remove());

  const items = getCustomLinks();
  const grid = document.getElementById('cardGrid');
  const saved = getSavedLinks();

  items.forEach(item => {
    const isSaved = saved.includes(item.url);
    const card = document.createElement('a');
    card.className = `card custom-card`;
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noreferrer';
    card.dataset.category = item.category;
    card.dataset.tags = item.tags || '';
    card.innerHTML = `
      <div class="card-icon-wrap cat-${item.category}">
        <div class="card-icon" id="favicon-custom-${item.id}"></div>
      </div>
      <div class="card-body">
        <div class="card-header-row">
          <h3>${escHtml(item.title)}</h3>
          <span class="card-badge cat-${item.category}">${getCatLabel(item.category)}</span>
        </div>
        <p>${escHtml(item.description)}</p>
      </div>
      <div class="card-footer">
        <span class="card-domain">${domainOf(item.url)}</span>
        <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="event.preventDefault();toggleSaveCard(this)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="custom-actions" data-id="${item.id}">
        <button data-action="edit">Edit</button>
        <button class="del-btn" data-action="delete">Delete</button>
      </div>`;
    grid.appendChild(card);

    // Load favicon for custom card
    const iconEl = document.getElementById(`favicon-custom-${item.id}`);
    if (iconEl) loadFaviconFor(iconEl, item.url, item.title);
  });
}

function getCatLabel(cat) {
  const map = { design:'Design', coding:'Coding', hosting:'Hosting', ai:'AI Tools', learning:'Learning' };
  return map[cat] || cat;
}

function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  const deleted = getCustomLinks().find(i => i.id === id);
  setCustomLinks(getCustomLinks().filter(i => i.id !== id));
  if (deleted) setSavedLinks(getSavedLinks().filter(h => h !== deleted.url));
  renderCustomCards();
  updateAllCounts();
  applyFilters();
  showToast('Resource deleted', 't-info');
  logActivity(`Deleted resource: ${deleted?.title || id}`);
}

/* ══════════════════════════════
   FAVICONS
══════════════════════════════ */
const LOGO_MAP = {
  // kept in case we want to extend, but simplified loading below
};

function loadFavicons() {
  document.querySelectorAll('.card:not(.custom-card)').forEach(card => {
    const href = getHref(card);
    const iconEl = card.querySelector('.card-icon');
    const title = card.querySelector('h3')?.textContent || '?';
    if (href && iconEl) loadFaviconFor(iconEl, href, title);
  });
}

function loadFaviconFor(iconEl, href, title) {
  try {
    const host = new URL(href).hostname.replace(/^www\./,'');
    iconEl.innerHTML = '';
    const img = document.createElement('img');
    img.alt = `${title} logo`;
    img.style.cssText = 'width:24px;height:24px;object-fit:contain;display:block;';

    const sources = [
      `https://icons.duckduckgo.com/ip3/${host}.ico`,
      `https://www.google.com/s2/favicons?sz=64&domain=${host}`
    ];
    let idx = 0;

    function tryNext() {
      if (idx >= sources.length) {
        iconEl.innerHTML = '';
        iconEl.textContent = title.charAt(0).toUpperCase();
        iconEl.classList.add('logo-missing');
        return;
      }
      img.src = sources[idx++];
    }

    img.onerror = tryNext;
    tryNext();
    iconEl.appendChild(img);
  } catch {
    if (iconEl && title) {
      iconEl.innerHTML = '';
      iconEl.textContent = title.charAt(0).toUpperCase();
      iconEl.classList.add('logo-missing');
    }
  }
}

/* ══════════════════════════════
   COUNTS
══════════════════════════════ */
function updateAllCounts() {
  const allCards = document.querySelectorAll('.card');
  const cats = { design:0, coding:0, hosting:0, ai:0, learning:0 };
  allCards.forEach(c => { const cat = c.dataset.category; if (cats[cat] !== undefined) cats[cat]++; });

  const saved = getSavedLinks();
  const custom = getCustomLinks();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('total-links', allCards.length);
  set('total-categories', 5);
  set('total-saved', saved.length);
  set('total-custom', custom.length);
  set('nc-all', allCards.length);
  set('nc-saved', saved.length);
  Object.entries(cats).forEach(([cat, count]) => set(`nc-${cat}`, count));
}

/* ══════════════════════════════
   MODAL HELPERS
══════════════════════════════ */
function openModal() {
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('resourceTitle')?.focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function setFieldError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearFieldErrors() { ['err-title','err-url','err-desc','err-cat'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; }); }

/* ══════════════════════════════
   MOBILE SIDEBAR
══════════════════════════════ */
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
let toastTimeout;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 2600);
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

    if (isCmdPaletteOpen()) { handleCmdKeydown(e); return; }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmdPalette(); return; }
    if (e.key === '/' && !inInput) { e.preventDefault(); document.getElementById('searchInput')?.focus(); }
    if (e.key === 'Escape') { closeModal(); closeCmdPalette(); document.getElementById('searchInput')?.blur(); }
    if (e.key === 'a' && !inInput && !e.ctrlKey && !e.metaKey) openAddForm();
    if (e.key === 't' && !inInput && !e.ctrlKey && !e.metaKey) toggleTheme();
  });

  const cmdInput = document.getElementById('cmd-input');
  if (cmdInput) cmdInput.addEventListener('input', updateCmdResults);
}

function isCmdPaletteOpen() {
  return !document.getElementById('cmd-overlay')?.classList.contains('hidden');
}

function openCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (!overlay || !input) return;
  overlay.classList.remove('hidden');
  input.value = '';
  updateCmdResults();
  setTimeout(() => input.focus(), 50);
}

function closeCmdPalette() {
  document.getElementById('cmd-overlay')?.classList.add('hidden');
}

function handleCmdOverlayClick(e) {
  if (e.target === document.getElementById('cmd-overlay')) closeCmdPalette();
}

function handleCmdKeydown(e) {
  if (e.key === 'Escape') { closeCmdPalette(); e.preventDefault(); return; }
  const items = document.querySelectorAll('.cmd-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIndex = (cmdSelectedIndex + 1) % items.length; renderCmdSelection(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelectedIndex = (cmdSelectedIndex - 1 + items.length) % items.length; renderCmdSelection(); }
  else if (e.key === 'Enter') { e.preventDefault(); const sel = cmdItems[cmdSelectedIndex]; if (sel) executeCmdAction(sel); }
}

function renderCmdSelection() {
  document.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.classList.toggle('selected', i === cmdSelectedIndex);
    if (i === cmdSelectedIndex) el.scrollIntoView({ block:'nearest' });
  });
}

function executeCmdAction(item) {
  closeCmdPalette();
  if (item.type === 'action') {
    if (item.actionId === 'theme') toggleTheme();
    else if (item.actionId === 'add') openAddForm();
    else if (item.actionId === 'view-grid') setView('grid');
    else if (item.actionId === 'view-list') setView('list');
    else if (item.actionId === 'dashboard') openDashboard();
  } else if (item.type === 'category') {
    const btn = document.querySelector(`.nav-btn[data-cat="${item.categoryId}"]`);
    if (btn) filterCategory(item.categoryId, btn);
  } else if (item.type === 'resource') {
    window.open(item.url, '_blank', 'noreferrer');
  }
}

function updateCmdResults() {
  const query = document.getElementById('cmd-input')?.value.toLowerCase().trim() || '';
  const container = document.getElementById('cmd-results');
  if (!container) return;
  container.innerHTML = '';
  cmdItems = [];
  cmdSelectedIndex = 0;

  const actions = [
    { type:'action', actionId:'theme', title:'Toggle Theme', icon:'🌙' },
    { type:'action', actionId:'add', title:'Add Resource', icon:'＋' },
    { type:'action', actionId:'view-grid', title:'Grid View', icon:'⊞' },
    { type:'action', actionId:'view-list', title:'List View', icon:'☰' },
    { type:'action', actionId:'dashboard', title:'Open Dashboard', icon:'📊' },
  ].filter(a => !query || a.title.toLowerCase().includes(query));
  if (actions.length) appendCmdGroup('Actions', actions, container);

  const categories = [
    { type:'category', categoryId:'all', title:'All Resources', icon:'⊞' },
    { type:'category', categoryId:'saved', title:'Saved Links', icon:'★' },
    { type:'category', categoryId:'design', title:'Design', icon:'🎨' },
    { type:'category', categoryId:'coding', title:'Coding', icon:'{ }' },
    { type:'category', categoryId:'hosting', title:'Hosting', icon:'▲' },
    { type:'category', categoryId:'ai', title:'AI Tools', icon:'🤖' },
    { type:'category', categoryId:'learning', title:'Learning', icon:'📚' },
  ].filter(c => !query || c.title.toLowerCase().includes(query));
  if (categories.length) appendCmdGroup('Categories', categories, container);

  const resources = [];
  document.querySelectorAll('.card').forEach(c => {
    const title = c.querySelector('h3')?.textContent || '';
    const url = getHref(c) || '';
    const desc = c.querySelector('p')?.textContent || '';
    if (!query || title.toLowerCase().includes(query) || url.toLowerCase().includes(query) || desc.toLowerCase().includes(query)) {
      resources.push({ type:'resource', title, url, desc, icon:'🔗' });
    }
  });
  if (resources.length) appendCmdGroup('Resources', resources.slice(0, 8), container);

  renderCmdSelection();
}

function appendCmdGroup(label, items, container) {
  const groupEl = document.createElement('div');
  groupEl.className = 'cmd-group-label';
  groupEl.textContent = label;
  container.appendChild(groupEl);

  items.forEach(item => {
    const idx = cmdItems.length;
    cmdItems.push(item);
    const el = document.createElement('div');
    el.className = 'cmd-item';
    el.innerHTML = `
      <div class="cmd-item-icon">${item.icon}</div>
      <div class="cmd-item-content">
        <div class="cmd-item-title">${escHtml(item.title)}</div>
        ${item.url ? `<div class="cmd-item-sub">${domainOf(item.url)}</div>` : ''}
      </div>
      <div class="cmd-item-action">↵</div>`;
    el.addEventListener('click', () => executeCmdAction(item));
    el.addEventListener('mouseenter', () => { cmdSelectedIndex = idx; renderCmdSelection(); });
    container.appendChild(el);
  });
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function safeGetItem(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSetItem(key, val) { try { localStorage.setItem(key, val); } catch (e) { console.warn('Storage error:', e); } }
function getHref(card) { return card.getAttribute('href') || ''; }
function getSavedLinks() { try { return JSON.parse(safeGetItem('dl-saved') || '[]'); } catch { return []; } }
function setSavedLinks(arr) { safeSetItem('dl-saved', JSON.stringify(arr)); }
function getCustomLinks() { try { return JSON.parse(safeGetItem('dl-custom') || '[]'); } catch { return []; } }
function setCustomLinks(arr) { safeSetItem('dl-custom', JSON.stringify(arr)); }

/* ── Activity log (used by dashboard.js) ── */
function logActivity(description) {
  try {
    const activities = JSON.parse(safeGetItem('devlinks-activity') || '[]');
    activities.push({ description, timestamp: new Date().toISOString() });
    if (activities.length > 50) activities.splice(0, activities.length - 50);
    safeSetItem('devlinks-activity', JSON.stringify(activities));
  } catch { /* ignore */ }
}

/* ── Panel open/close helpers used by other scripts ── */
function openDashboard() {
  document.getElementById('dashboardPanel')?.classList.remove('hidden');
  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof updateCategoryChart === 'function') updateCategoryChart();
  if (typeof updateActivityList === 'function') updateActivityList();
}
function closeDashboard() { document.getElementById('dashboardPanel')?.classList.add('hidden'); }
function openSharePanel() { document.getElementById('sharePanel')?.classList.remove('hidden'); }
function closeSharePanel() { document.getElementById('sharePanel')?.classList.add('hidden'); }
function openCollectionsPanel() {
  document.getElementById('collectionsPanel')?.classList.remove('hidden');
  if (typeof renderCollections === 'function') renderCollections();
}
function closeCollectionsPanel() { document.getElementById('collectionsPanel')?.classList.add('hidden'); }
function showAllResources() {
  closeCollectionsPanel();
  filterCategory('all', document.querySelector('.nav-btn[data-cat="all"]'));
}
function promptCreateCollection() {
  const name = prompt('Collection name:');
  if (name?.trim() && typeof createCollection === 'function') createCollection(name.trim());
}