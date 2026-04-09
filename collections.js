/* ── COLLECTIONS ── */

let collections = [];

function initCollections() {
  try { collections = JSON.parse(localStorage.getItem('devlinks-collections') || '[]'); }
  catch { collections = []; }
  renderCollections();
}

function saveCollections() {
  localStorage.setItem('devlinks-collections', JSON.stringify(collections));
}

function createCollection(name, description = '') {
  const collection = {
    id: crypto.randomUUID ? crypto.randomUUID() : `col-${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
    resources: [],
    created: new Date().toISOString(),
    color: getCollectionColor(),
  };
  collections.push(collection);
  saveCollections();
  renderCollections();
  if (typeof showToast === 'function') showToast(`Collection "${name}" created!`, 't-success');
  if (typeof logActivity === 'function') logActivity(`Created collection: ${name}`);
}

function deleteCollection(id) {
  if (!confirm('Delete this collection? Resources inside will not be deleted.')) return;
  collections = collections.filter(c => c.id !== id);
  saveCollections();
  renderCollections();
  if (typeof showToast === 'function') showToast('Collection deleted', 't-info');
}

function editCollection(id) {
  const col = collections.find(c => c.id === id);
  if (!col) return;
  const newName = prompt('Collection name:', col.name);
  if (newName?.trim() && newName !== col.name) {
    col.name = newName.trim();
    saveCollections();
    renderCollections();
    if (typeof showToast === 'function') showToast('Collection renamed', 't-success');
  }
}

function addResourceToCollection(resourceUrl, collectionId) {
  const col = collections.find(c => c.id === collectionId);
  if (!col || col.resources.includes(resourceUrl)) return;
  col.resources.push(resourceUrl);
  saveCollections();
  if (typeof showToast === 'function') showToast('Added to collection', 't-success');
}

function removeResourceFromCollection(resourceUrl, collectionId) {
  const col = collections.find(c => c.id === collectionId);
  if (!col) return;
  col.resources = col.resources.filter(r => r !== resourceUrl);
  saveCollections();
  if (typeof showToast === 'function') showToast('Removed from collection', 't-info');
}

function viewCollection(id) {
  const col = collections.find(c => c.id === id);
  if (!col) return;

  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
    const href = card.getAttribute('href') || '';
    card.style.display = col.resources.includes(href) ? '' : 'none';
  });

  const titleEl = document.getElementById('section-title');
  const subEl = document.getElementById('section-sub');
  if (titleEl) titleEl.textContent = col.name;
  if (subEl) subEl.textContent = col.description || `${col.resources.length} resources`;

  if (typeof closeCollectionsPanel === 'function') closeCollectionsPanel();
  if (typeof showToast === 'function') showToast(`Viewing: ${col.name}`, 't-info');
}

function renderCollections() {
  const container = document.getElementById('collectionsList');
  if (!container) return;

  if (!collections.length) {
    container.innerHTML = `<div class="no-collections">No collections yet.<br>Create one to organize your resources!</div>`;
    return;
  }

  container.innerHTML = collections.map(col => `
    <div class="collection-card">
      <div class="collection-header">
        <div class="collection-info">
          <h4 class="collection-name">${escHtml(col.name)}</h4>
          ${col.description ? `<p class="collection-desc">${escHtml(col.description)}</p>` : ''}
        </div>
        <div class="collection-actions">
          <button class="collection-action-btn" onclick="editCollection('${col.id}')" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/></svg>
          </button>
          <button class="collection-action-btn delete" onclick="deleteCollection('${col.id}')" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </div>
      </div>
      <div class="collection-resources">
        <span class="resource-count">${col.resources.length} resources</span>
        <button class="view-collection-btn" onclick="viewCollection('${col.id}')">View →</button>
      </div>
    </div>`).join('');
}

function getCollectionColor() {
  const colors = ['#ef4160','#3b82f6','#10b981','#8b5cf6','#f59e0b','#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCollections);
else initCollections();