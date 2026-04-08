/* ── RESOURCE SHARING FEATURES ── */
function generateShareableLink() {
  const data = {
    saved: JSON.parse(localStorage.getItem('dl-saved') || '[]'),
    custom: JSON.parse(localStorage.getItem('dl-custom') || '[]'),
    collections: JSON.parse(localStorage.getItem('devlinks-collections') || '[]'),
    theme: {
      mode: localStorage.getItem('devlinks-theme'),
      accent: localStorage.getItem('devlinks-accent'),
      fontSize: localStorage.getItem('devlinks-font-size')
    },
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  // Create shareable URL with encoded data
  const encodedData = btoa(JSON.stringify(data));
  const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encodedData}`;
  
  return shareUrl;
}

function shareCollection(collectionId) {
  const collections = JSON.parse(localStorage.getItem('devlinks-collections') || '[]');
  const collection = collections.find(c => c.id === collectionId);
  
  if (!collection) {
    showToast('Collection not found', 't-error');
    return;
  }
  
  // Get all cards in collection
  const allCards = document.querySelectorAll('.card');
  const collectionCards = [];
  
  allCards.forEach(card => {
    const href = getHref(card);
    if (collection.resources.includes(href)) {
      const title = card.querySelector('h3')?.textContent || '';
      const desc = card.querySelector('p')?.textContent || '';
      const category = card.dataset.category || '';
      
      collectionCards.push({
        title,
        description: desc,
        url: href,
        category,
        tags: card.dataset.tags || ''
      });
    }
  });
  
  const shareData = {
    collection: {
      name: collection.name,
      description: collection.description,
      resources: collectionCards
    },
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  const encodedData = btoa(JSON.stringify(shareData));
  const shareUrl = `${window.location.origin}${window.location.pathname}?collection=${encodedData}`;
  
  copyToClipboard(shareUrl);
  showToast('Collection link copied to clipboard!', 't-success');
  logActivity(`Shared collection "${collection.name}"`);
}

function importSharedData() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedData = urlParams.get('shared');
  const collectionData = urlParams.get('collection');
  
  if (sharedData) {
    try {
      const data = JSON.parse(atob(sharedData));
      importSharedResources(data);
      showToast('Shared resources imported successfully!', 't-success');
      logActivity('Imported shared resources');
    } catch (error) {
      showToast('Invalid shared data', 't-error');
      console.error('Import error:', error);
    }
  } else if (collectionData) {
    try {
      const data = JSON.parse(atob(collectionData));
      importSharedCollection(data);
      showToast('Shared collection imported successfully!', 't-success');
      logActivity('Imported shared collection');
    } catch (error) {
      showToast('Invalid collection data', 't-error');
      console.error('Import error:', error);
    }
  }
}

function importSharedResources(data) {
  // Merge saved links
  if (data.saved && Array.isArray(data.saved)) {
    const currentSaved = JSON.parse(localStorage.getItem('dl-saved') || '[]');
    const mergedSaved = [...new Set([...currentSaved, ...data.saved])];
    localStorage.setItem('dl-saved', JSON.stringify(mergedSaved));
  }
  
  // Merge custom resources
  if (data.custom && Array.isArray(data.custom)) {
    const currentCustom = JSON.parse(localStorage.getItem('dl-custom') || '[]');
    const mergedCustom = [...currentCustom, ...data.custom];
    localStorage.setItem('dl-custom', JSON.stringify(mergedCustom));
  }
  
  // Merge collections
  if (data.collections && Array.isArray(data.collections)) {
    const currentCollections = JSON.parse(localStorage.getItem('devlinks-collections') || '[]');
    const mergedCollections = [...currentCollections, ...data.collections];
    localStorage.setItem('devlinks-collections', JSON.stringify(mergedCollections));
  }
  
  // Apply theme settings
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
  
  // Refresh UI
  if (typeof renderCustomCards === 'function') {
    renderCustomCards();
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
}

function importSharedCollection(data) {
  if (!data.collection) return;
  
  // Add as new collection
  const collections = JSON.parse(localStorage.getItem('devlinks-collections') || '[]');
  const newCollection = {
    id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
    name: `Imported: ${data.collection.name}`,
    description: `Imported collection: ${data.collection.description}`,
    resources: data.collection.resources.map(r => r.url),
    created: new Date().toISOString(),
    color: generateCollectionColor()
  };
  
  collections.push(newCollection);
  localStorage.setItem('devlinks-collections', JSON.stringify(collections));
  
  // Add resources to custom if they don't exist
  if (data.collection.resources && Array.isArray(data.collection.resources)) {
    const currentCustom = JSON.parse(localStorage.getItem('dl-custom') || '[]');
    const newResources = data.collection.resources.filter(r => 
      !currentCustom.some(c => c.url === r.url)
    );
    
    const updatedCustom = [...currentCustom, ...newResources.map(r => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      title: r.title,
      url: r.url,
      description: r.description,
      category: r.category,
      tags: r.tags || ''
    }))];
    
    localStorage.setItem('dl-custom', JSON.stringify(updatedCustom));
  }
  
  // Refresh UI
  if (typeof renderCustomCards === 'function') {
    renderCustomCards();
  }
  if (typeof updateAllCounts === 'function') {
    updateAllCounts();
  }
  if (typeof applyFilters === 'function') {
    applyFilters();
  }
}

function generateCollectionColor() {
  const colors = ['#ef4160', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 't-success');
    }).catch(err => {
      console.error('Failed to copy:', err);
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showToast('Copied to clipboard!', 't-success');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', 't-error');
  }
  
  document.body.removeChild(textArea);
}

function createShareModal() {
  const existing = document.getElementById('shareModal');
  if (existing) return;
  
  const modal = document.createElement('div');
  modal.id = 'shareModal';
  modal.className = 'share-modal';
  modal.innerHTML = `
    <div class="share-overlay" onclick="closeShareModal()"></div>
    <div class="share-content">
      <div class="share-header">
        <h3>Share Your Resources</h3>
        <button class="share-close" onclick="closeShareModal()">×</button>
      </div>
      <div class="share-body">
        <div class="share-option">
          <h4>🔗 Share All Resources</h4>
          <p>Share your entire resource collection with others</p>
          <button class="btn-primary" onclick="shareAllResources()">Generate Share Link</button>
        </div>
        <div class="share-option">
          <h4>📁 Share Collections</h4>
          <p>Share specific collections you've created</p>
          <div class="collection-select" id="shareCollectionSelect">
            <select id="shareCollectionDropdown">
              <option value="">Select a collection...</option>
            </select>
            <button class="btn-secondary" onclick="shareSelectedCollection()">Share Collection</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  populateShareableCollections();
}

function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.remove();
  }
}

function shareAllResources() {
  const shareUrl = generateShareableLink();
  copyToClipboard(shareUrl);
  closeShareModal();
}

function populateShareableCollections() {
  const collections = JSON.parse(localStorage.getItem('devlinks-collections') || '[]');
  const dropdown = document.getElementById('shareCollectionDropdown');
  
  if (!dropdown) return;
  
  dropdown.innerHTML = '<option value="">Select a collection...</option>' +
    collections.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
}

function shareSelectedCollection() {
  const dropdown = document.getElementById('shareCollectionDropdown');
  const selectedId = dropdown.value;
  
  if (!selectedId) {
    showToast('Please select a collection', 't-error');
    return;
  }
  
  shareCollection(selectedId);
  closeShareModal();
}

// Helper function to get href (copied from main script)
function getHref(card) {
  return card.getAttribute('href') || card.querySelector('a')?.href || '';
}

// Helper function to escape HTML
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Add share button to sidebar
function addShareButton() {
  const sidebar = document.querySelector('.sidebar-footer');
  if (!sidebar) return;
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'sidebar-action';
  shareBtn.setAttribute('aria-label', 'Share resources');
  shareBtn.innerHTML = '<span>🔗</span> Share';
  shareBtn.onclick = createShareModal;
  
  sidebar.appendChild(shareBtn);
}

// Check for shared data on page load
function checkForSharedData() {
  if (window.location.search) {
    importSharedData();
    // Clean URL after importing
    const url = new URL(window.location);
    url.searchParams.delete('shared');
    url.searchParams.delete('collection');
    window.history.replaceState({}, '', url.toString());
  }
}

// Initialize sharing features
function initSharing() {
  addShareButton();
  checkForSharedData();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSharing);
} else {
  initSharing();
}
