/* ── RESOURCE COLLECTIONS AND FOLDERS ── */
let collections = [];
let currentCollection = 'all';

function initCollections() {
  const saved = localStorage.getItem('devlinks-collections');
  if (saved) {
    collections = JSON.parse(saved);
  }
  renderCollections();
}

function saveCollections() {
  localStorage.setItem('devlinks-collections', JSON.stringify(collections));
}

function createCollection(name, description = '') {
  const collection = {
    id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
    name,
    description,
    resources: [],
    created: new Date().toISOString(),
    color: generateCollectionColor()
  };
  
  collections.push(collection);
  saveCollections();
  renderCollections();
  showToast(`Collection "${name}" created!`, 't-success');
  logActivity(`Created collection "${name}"`);
}

function deleteCollection(id) {
  if (!confirm('Delete this collection? This cannot be undone.')) return;
  
  collections = collections.filter(c => c.id !== id);
  saveCollections();
  renderCollections();
  showToast('Collection deleted', 't-info');
  logActivity('Deleted collection');
}

function addResourceToCollection(resourceId, collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  if (!collection.resources.includes(resourceId)) {
    collection.resources.push(resourceId);
    saveCollections();
    showToast('Added to collection', 't-success');
    logActivity(`Added resource to collection`);
  }
}

function removeResourceFromCollection(resourceId, collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  collection.resources = collection.resources.filter(id => id !== resourceId);
  saveCollections();
  showToast('Removed from collection', 't-info');
  logActivity('Removed resource from collection');
}

function generateCollectionColor() {
  const colors = ['#ef4160', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function renderCollections() {
  const container = document.getElementById('collectionsList');
  if (!container) return;
  
  if (collections.length === 0) {
    container.innerHTML = '<div class="no-collections">No collections yet. Create your first collection to organize your resources!</div>';
    return;
  }
  
  container.innerHTML = collections.map(collection => `
    <div class="collection-card" data-id="${collection.id}">
      <div class="collection-header">
        <div class="collection-info">
          <h4 class="collection-name">${escHtml(collection.name)}</h4>
          <p class="collection-desc">${escHtml(collection.description)}</p>
        </div>
        <div class="collection-actions">
          <button class="collection-action-btn" onclick="editCollection('${collection.id}')" title="Edit collection">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2"/>
              <path d="m18.5 2.5 2.5 2.5L21 6l-2.5 2.5L16 11l2.5-2.5z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="collection-action-btn delete" onclick="deleteCollection('${collection.id}')" title="Delete collection">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6v12M12 6v12M3 12h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="collection-resources">
        <div class="resource-count">${collection.resources.length} resources</div>
        <button class="view-collection-btn" onclick="viewCollection('${collection.id}')">
          View Collection →
        </button>
      </div>
    </div>
  `).join('');
}

function editCollection(id) {
  const collection = collections.find(c => c.id === id);
  if (!collection) return;
  
  const newName = prompt('Collection name:', collection.name);
  if (newName && newName !== collection.name) {
    collection.name = newName;
    saveCollections();
    renderCollections();
    showToast('Collection renamed', 't-success');
  }
}

function viewCollection(id) {
  currentCollection = id;
  const collection = collections.find(c => c.id === id);
  if (!collection) return;
  
  // Filter cards to show only resources in this collection
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
    const href = getHref(card);
    const isInCollection = collection.resources.includes(href);
    card.style.display = isInCollection ? '' : 'none';
  });
  
  // Update UI to show collection view
  document.getElementById('section-title').textContent = collection.name;
  document.getElementById('section-sub').textContent = collection.description || 'Custom collection';
  
  showToast(`Viewing collection: ${collection.name}`, 't-info');
}

function showAllCollections() {
  currentCollection = 'all';
  applyFilters(); // Reset to show all cards
  
  document.getElementById('section-title').textContent = 'All Resources';
  document.getElementById('section-sub').textContent = 'Curated tools and references for developers';
}

function openCollectionsPanel() {
  const panel = document.getElementById('collectionsPanel');
  panel.classList.remove('hidden');
  renderCollections();
}

function closeCollectionsPanel() {
  const panel = document.getElementById('collectionsPanel');
  panel.classList.add('hidden');
}

// Helper function to escape HTML
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Initialize collections when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollections);
} else {
  initCollections();
}
