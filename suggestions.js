/* ── SEARCH SUGGESTIONS ── */

let suggestions = [];
let suggestionTimeout = null;
let selectedSuggestionIndex = -1;

function initSearchSuggestions() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  const container = document.createElement('div');
  container.className = 'search-suggestions hidden';
  container.id = 'searchSuggestions';

  const searchWrapper = input.closest('.topbar-search');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(container);
  }

  input.addEventListener('input', onSearchInput);
  input.addEventListener('keydown', onSearchKeydown);
  input.addEventListener('blur', () => setTimeout(hideSuggestions, 180));

  document.addEventListener('click', e => {
    if (!e.target.closest('.topbar-search')) hideSuggestions();
  });
}

function onSearchInput(e) {
  const query = e.target.value.trim();
  clearTimeout(suggestionTimeout);
  if (query.length < 2) { hideSuggestions(); return; }
  suggestionTimeout = setTimeout(() => generateSuggestions(query), 200);
}

function generateSuggestions(query) {
  const lq = query.toLowerCase();
  const saved = JSON.parse(localStorage.getItem('dl-saved') || '[]');
  const results = [];

  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const desc = card.querySelector('p')?.textContent || '';
    const domain = card.querySelector('.card-domain')?.textContent || '';
    const tags = card.dataset.tags || '';
    const href = card.getAttribute('href') || '';
    const category = card.dataset.category || '';

    let score = 0;
    const lt = title.toLowerCase();
    if (lt === lq) score += 100;
    else if (lt.startsWith(lq)) score += 60;
    else if (lt.includes(lq)) score += 30;
    if (domain.toLowerCase().includes(lq)) score += 20;
    if (desc.toLowerCase().includes(lq)) score += 10;
    if (tags.toLowerCase().includes(lq)) score += 8;
    if (saved.includes(href)) score += 15;

    if (score > 0) results.push({ title, desc, href, category, score });
  });

  suggestions = results.sort((a,b) => b.score - a.score).slice(0, 7);
  selectedSuggestionIndex = suggestions.length ? 0 : -1;
  renderSuggestions();
}

function renderSuggestions() {
  const container = document.getElementById('searchSuggestions');
  if (!container || !suggestions.length) { hideSuggestions(); return; }

  container.innerHTML = suggestions.map((s, i) => `
    <div class="search-suggestion ${i === selectedSuggestionIndex ? 'selected' : ''}" data-index="${i}">
      <span class="suggestion-icon">🔗</span>
      <div>
        <div class="suggestion-title">${escHtmlSuggestion(s.title)}</div>
        <div class="suggestion-desc">${escHtmlSuggestion(s.desc)}</div>
      </div>
      <span class="suggestion-category">${s.category}</span>
    </div>`).join('');

  container.classList.remove('hidden');

  container.querySelectorAll('.search-suggestion').forEach((el, i) => {
    el.addEventListener('click', () => selectSuggestion(i));
    el.addEventListener('mouseenter', () => {
      selectedSuggestionIndex = i;
      container.querySelectorAll('.search-suggestion').forEach((e, j) => e.classList.toggle('selected', j === i));
    });
  });
}

function hideSuggestions() {
  document.getElementById('searchSuggestions')?.classList.add('hidden');
}

function selectSuggestion(index) {
  const s = suggestions[index];
  if (!s) return;
  const input = document.getElementById('searchInput');
  if (input) { input.value = s.title; }
  hideSuggestions();
  window.open(s.href, '_blank', 'noreferrer');
  if (typeof logActivity === 'function') logActivity(`Searched: ${s.title}`);
}

function onSearchKeydown(e) {
  const container = document.getElementById('searchSuggestions');
  if (!container || container.classList.contains('hidden')) return;
  if (!suggestions.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestions.length;
    updateSuggestionSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + suggestions.length) % suggestions.length;
    updateSuggestionSelection();
  } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
    e.preventDefault();
    selectSuggestion(selectedSuggestionIndex);
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
}

function updateSuggestionSelection() {
  document.querySelectorAll('.search-suggestion').forEach((el, i) => {
    el.classList.toggle('selected', i === selectedSuggestionIndex);
    if (i === selectedSuggestionIndex) el.scrollIntoView({ block:'nearest' });
  });
}

function escHtmlSuggestion(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearchSuggestions);
else initSearchSuggestions();