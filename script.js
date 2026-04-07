// =====================
// THEME TOGGLE
// =====================
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  const isLight = html.getAttribute('data-theme') === 'light';

  if (isLight) {
    html.removeAttribute('data-theme');
    btn.innerHTML = '<span class="icon icon-theme">🌙</span> Dark';
    localStorage.setItem('theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    btn.innerHTML = '<span class="icon icon-theme">☀️</span> Light';
    localStorage.setItem('theme', 'light');
  }
}

// Restore theme on load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.querySelector('.theme-toggle').innerHTML = '<span class="icon icon-theme">☀️</span> Light';
  }

  renderCustomResources();
  updateStats();
  updateSavedCount();
  addSaveButtons();
  updateSavedButtons();
  normalizeCardIcons();
  loadCardLogos();
  renderSavedPanel();
  resetResourceForm();
});

// =====================
// CATEGORY FILTER (TABS)
// =====================
let activeCategory = 'all';

function filterCategory(category, btn) {
  activeCategory = category;

  // Update active tab style
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  applyFilters();
}

// =====================
// SEARCH FILTER
// =====================
function filterCards() {
  applyFilters();
}

// =====================
// COMBINED FILTER
// =====================
function applyFilters() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const cards = document.querySelectorAll('.card');
  const saved = getSavedLinks();
  let visible  = 0;

  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    const desc = card.querySelector('p').textContent.toLowerCase();
    const category = card.getAttribute('data-category');
    const href = getCardHref(card);

    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = activeCategory === 'all'
      || (activeCategory === 'saved' && saved.includes(href))
      || category === activeCategory;

    if (matchesSearch && matchesCategory) {
      card.style.display = 'flex';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });

  // Show/hide no results message
  const noResults = document.getElementById('noResults');
  if (visible === 0) {
    if (activeCategory === 'saved') {
      noResults.textContent = query
        ? `😕 No saved results for "${query}"`
        : '😕 No saved resources yet.';
    } else {
      noResults.textContent = query
        ? `😕 No results found for "${query}"`
        : '😕 No resources in this category yet.';
    }
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
  }
}

// =====================
// LOCAL STORAGE HELPERS
// =====================
function getSavedLinks() {
  try {
    return JSON.parse(localStorage.getItem('savedLinks') || '[]');
  } catch (error) {
    console.warn('Invalid savedLinks value in localStorage, resetting to []');
    return [];
  }
}

// =====================
// SAVED COUNT (bonus)
// =====================
function updateSavedCount() {
  const saved = getSavedLinks();
  document.getElementById('total-saved').textContent = saved.length;
}

// =====================
// DYNAMIC STATS
// =====================
function updateStats() {
  const cards = document.querySelectorAll('.card');
  const categories = new Set();

  cards.forEach(card => {
    categories.add(card.getAttribute('data-category'));
  });

  document.getElementById('total-categories').textContent = categories.size;
  document.getElementById('total-links').textContent = cards.length;
}

function getCustomLinks() {
  try {
    return JSON.parse(localStorage.getItem('customLinks') || '[]');
  } catch (error) {
    console.warn('Invalid customLinks value in localStorage, resetting to []');
    return [];
  }
}

function setCustomLinks(links) {
  localStorage.setItem('customLinks', JSON.stringify(links));
}

function renderCustomResources() {
  const grid = document.getElementById('cardGrid');
  const existing = grid.querySelectorAll('.card.custom-card');
  existing.forEach(node => node.remove());

  const customLinks = getCustomLinks();
  if (!customLinks.length) return;

  customLinks.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card custom-card';
    card.dataset.category = item.category;
    card.dataset.id = item.id;

    card.innerHTML = `
      <a class="card-link" href="${item.url}" target="_blank" rel="noreferrer">
        <div class="card-icon">🔗</div>
        <div class="card-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <span class="tag">${item.category}</span>
        </div>
      </a>
      <div class="custom-card-actions">
        <button type="button" class="save-btn">${getSavedLinks().includes(item.url) ? '⭐ Saved' : '☆ Save'}</button>
        <button type="button" class="edit-btn" onclick="editResource('${item.id}')">Edit</button>
        <button type="button" class="delete-btn" onclick="deleteResource('${item.id}')">Delete</button>
      </div>
    `;

    grid.appendChild(card);
    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => toggleSave(item.url, saveBtn));
  });
}

function handleResourceForm(event) {
  event.preventDefault();

  const id = document.getElementById('resourceId').value;
  const title = document.getElementById('resourceTitle').value.trim();
  const url = document.getElementById('resourceUrl').value.trim();
  const description = document.getElementById('resourceDescription').value.trim();
  const category = document.getElementById('resourceCategory').value;

  if (!title || !url || !description) return;
  if (!/^https?:\/\//i.test(url)) {
    alert('Please enter a URL starting with http:// or https://');
    return;
  }

  const customLinks = getCustomLinks();
  if (id) {
    const index = customLinks.findIndex(item => item.id === id);
    if (index > -1) {
      const existingLink = customLinks[index];
      const oldUrl = existingLink.url;
      customLinks[index] = { ...existingLink, title, url, description, category };

      if (oldUrl !== url) {
        const saved = getSavedLinks();
        const savedIndex = saved.indexOf(oldUrl);
        if (savedIndex > -1) {
          saved[savedIndex] = url;
          localStorage.setItem('savedLinks', JSON.stringify(saved));
        }
      }
    }
  } else {
    const newItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}`,
      title,
      url,
      description,
      category,
    };
    customLinks.push(newItem);
  }

  setCustomLinks(customLinks);
  renderCustomResources();
  updateStats();
  updateSavedButtons();
  normalizeCardIcons();
  loadCardLogos();
  renderSavedPanel();
  applyFilters();
  resetResourceForm();
}

function editResource(id) {
  const customLinks = getCustomLinks();
  const item = customLinks.find(link => link.id === id);
  if (!item) return;

  document.getElementById('resourceId').value = item.id;
  document.getElementById('resourceTitle').value = item.title;
  document.getElementById('resourceUrl').value = item.url;
  document.getElementById('resourceDescription').value = item.description;
  document.getElementById('resourceCategory').value = item.category;
  document.getElementById('resourceFormTitle').textContent = 'Edit resource';
  document.getElementById('resourceSubmitButton').textContent = 'Update resource';
}

function deleteResource(id) {
  const existingLink = getCustomLinks().find(link => link.id === id);
  const customLinks = getCustomLinks().filter(link => link.id !== id);
  setCustomLinks(customLinks);

  if (existingLink) {
    const saved = getSavedLinks().filter(href => href !== existingLink.url);
    localStorage.setItem('savedLinks', JSON.stringify(saved));
  }

  renderCustomResources();
  updateStats();
  updateSavedButtons();
  renderSavedPanel();
  applyFilters();
}

function resetResourceForm() {
  document.getElementById('resourceForm').reset();
  document.getElementById('resourceId').value = '';
  document.getElementById('resourceFormTitle').textContent = 'Add your own resource';
  document.getElementById('resourceSubmitButton').textContent = 'Save resource';
  const panel = document.getElementById('resourceFormPanel');
  const toggleBtn = document.getElementById('toggleResourceFormBtn');
  if (panel) panel.classList.add('hidden');
  if (toggleBtn) toggleBtn.textContent = 'Add resource';
}

function toggleResourceForm() {
  const panel = document.getElementById('resourceFormPanel');
  const toggleBtn = document.getElementById('toggleResourceFormBtn');
  if (!panel || !toggleBtn) return;

  const isHidden = panel.classList.toggle('hidden');
  toggleBtn.textContent = isHidden ? 'Add resource' : 'Hide form';
}

// =====================
// CARD LOGOS
// =====================
const logoHostMap = {
  'figma.com': 'figma',
  'coolors.co': 'coolors',
  'fonts.google.com': 'googlefonts',
  'undraw.co': 'undraw',
  'developer.mozilla.org': 'mozilla',
  'codepen.io': 'codepen',
  'caniuse.com': 'caniuse',
  'stackoverflow.com': 'stackoverflow',
  'vercel.com': 'vercel',
  'netlify.com': 'netlify',
  'pages.github.com': 'github',
  'railway.app': 'railway',
  'claude.ai': 'openai',
  'github.com': 'github',
  'v0.dev': 'vercel',
  'chat.openai.com': 'openai',
  'freecodecamp.org': 'freecodecamp',
  'theodinproject.com': 'theodinproject',
  'cs50.harvard.edu': 'harvard',
  'javascript.info': 'javascript',
  'game.hackclub.com': 'hackclub',
};

function getCardHref(card) {
  return card.getAttribute('href') || card.querySelector('.card-link')?.href || '';
}

function loadCardLogos() {
  document.querySelectorAll('.card').forEach(card => {
    const href = getCardHref(card);
    if (!href) return;

    const hostname = new URL(href).hostname.replace(/^www\./, '');
    const slug = logoHostMap[hostname] || hostname.split('.')[0];
    const iconWrapper = card.querySelector('.card-icon');

    iconWrapper.textContent = '';
    iconWrapper.classList.remove('logo-missing');

    const logo = document.createElement('img');
    logo.src = `https://cdn.simpleicons.org/${slug}/ffffff`;
    logo.alt = `${card.querySelector('h3').textContent} logo`;
    logo.className = 'card-icon-img';
    logo.onerror = () => {
      iconWrapper.classList.add('logo-missing');
      iconWrapper.textContent = card.querySelector('h3').textContent.charAt(0);
    };

    iconWrapper.appendChild(logo);
  });
}

function normalizeCardIcons() {
  document.querySelectorAll('.card').forEach(card => {
    const iconWrapper = card.querySelector('.card-icon');
    const title = card.querySelector('h3').textContent.trim();
    if (!iconWrapper) return;

    const raw = iconWrapper.textContent.trim();
    if (!raw || raw.includes('?')) {
      iconWrapper.textContent = title.charAt(0).toUpperCase();
    }
  });
}

// =====================
// SAVE FUNCTIONALITY
// =====================
function addSaveButtons() {
  const cards = document.querySelectorAll('.card');
  const saved = getSavedLinks();

  cards.forEach(card => {
    if (card.classList.contains('custom-card')) return;
    if (card.querySelector('.save-btn')) return;

    const href = getCardHref(card);
    const isSaved = saved.includes(href);

    const saveBtn = document.createElement('span');
    saveBtn.className = 'save-btn';
    saveBtn.setAttribute('role', 'button');
    saveBtn.setAttribute('tabindex', '0');
    saveBtn.textContent = isSaved ? '⭐ Saved' : '☆ Save';

    const onSave = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      toggleSave(href, saveBtn);
    };

    saveBtn.addEventListener('click', onSave);
    saveBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onSave(e);
      }
    });

    card.querySelector('.card-info').appendChild(saveBtn);
  });
}

function toggleSave(href, btn) {
  let saved = getSavedLinks();
  const index = saved.indexOf(href);

  if (index > -1) {
    saved.splice(index, 1);
    btn.textContent = '☆ Save';
  } else {
    saved.push(href);
    btn.textContent = '⭐ Saved';
  }

  localStorage.setItem('savedLinks', JSON.stringify(saved));
  updateSavedCount();
  updateSavedButtons();
  renderSavedPanel();
  applyFilters();
}

function updateSavedButtons() {
  const saved = getSavedLinks();
  document.querySelectorAll('.card').forEach(card => {
    const href = getCardHref(card);
    const btn = card.querySelector('.save-btn');
    if (!btn) return;
    btn.textContent = saved.includes(href) ? '⭐ Saved' : '☆ Save';
  });
}

function renderSavedPanel() {
  const saved = getSavedLinks();
  const panel = document.getElementById('savedPanel');
  const list = document.getElementById('savedList');
  if (!panel || !list) return;

  if (saved.length === 0) {
    panel.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  panel.classList.remove('hidden');
  list.innerHTML = '';

  const cards = Array.from(document.querySelectorAll('.card'));
  const validSaved = saved.filter(href => cards.some(card => getCardHref(card) === href));
  if (validSaved.length !== saved.length) {
    localStorage.setItem('savedLinks', JSON.stringify(validSaved));
  }

  validSaved.forEach(href => {
    const card = cards.find(card => getCardHref(card) === href);
    if (!card) return;
    const title = card.querySelector('h3').textContent;

    const item = document.createElement('li');
    item.className = 'saved-item';
    item.innerHTML = `
      <a href="${href}" target="_blank">${title}</a>
      <button class="remove-saved" onclick="removeSaved('${href}')">Remove</button>
    `;
    list.appendChild(item);
  });
}

function removeSaved(href) {
  let saved = getSavedLinks();
  const index = saved.indexOf(href);
  if (index === -1) return;

  saved.splice(index, 1);
  localStorage.setItem('savedLinks', JSON.stringify(saved));
  updateSavedCount();
updateSavedButtons();
  renderSavedPanel();
  applyFilters();
}

function clearSaved() {
  localStorage.setItem('savedLinks', JSON.stringify([]));
  updateSavedCount();
  updateSavedButtons();
  renderSavedPanel();
  applyFilters();
}