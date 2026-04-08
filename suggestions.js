/* ── REAL-TIME SEARCH SUGGESTIONS ── */
let searchSuggestions = [];
let searchTimeout = null;

function initSearchSuggestions() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  // Create suggestions container
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'search-suggestions hidden';
  suggestionsContainer.id = 'searchSuggestions';
  
  // Position it below search input
  const searchWrapper = searchInput.closest('.topbar-search');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(suggestionsContainer);
  }
  
  // Add event listeners
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      showSuggestions();
    }
  });
  searchInput.addEventListener('blur', () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(hideSuggestions, 200);
  });
  
  // Keyboard navigation
  searchInput.addEventListener('keydown', handleSearchKeydown);
  
  // Click outside to hide
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-suggestions-container')) {
      hideSuggestions();
    }
  });
}

function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  
  // Debounce search suggestions
  searchTimeout = setTimeout(() => {
    generateSuggestions(query);
  }, 300);
}

function generateSuggestions(query) {
  const allCards = document.querySelectorAll('.card');
  const saved = JSON.parse(localStorage.getItem('dl-saved') || '[]');
  const custom = JSON.parse(localStorage.getItem('dl-custom') || '[]');
  
  suggestions = [];
  
  // Search in titles
  allCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const desc = card.querySelector('p')?.textContent || '';
    const domain = card.querySelector('.card-domain')?.textContent || '';
    const href = getHref(card);
    const category = card.dataset.category || '';
    
    // Calculate relevance score
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Exact title match gets highest score
    if (title.toLowerCase() === lowerQuery) score += 100;
    // Title starts with query
    else if (title.toLowerCase().startsWith(lowerQuery)) score += 50;
    // Title contains query
    else if (title.toLowerCase().includes(lowerQuery)) score += 25;
    // Domain match
    if (domain.toLowerCase().includes(lowerQuery)) score += 15;
    // Description match
    if (desc.toLowerCase().includes(lowerQuery)) score += 10;
    // Category match
    if (category.toLowerCase().includes(lowerQuery)) score += 5;
    // Saved bonus
    if (saved.includes(href)) score += 20;
    
    if (score > 0) {
      suggestions.push({
        title,
        desc,
        href,
        category,
        score,
        type: 'builtin'
      });
    }
  });
  
  // Search in custom resources
  custom.forEach(item => {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    if (item.title.toLowerCase() === lowerQuery) score += 100;
    else if (item.title.toLowerCase().startsWith(lowerQuery)) score += 50;
    else if (item.title.toLowerCase().includes(lowerQuery)) score += 25;
    else if (item.description.toLowerCase().includes(lowerQuery)) score += 10;
    else if (item.category.toLowerCase().includes(lowerQuery)) score += 5;
    
    if (score > 0) {
      suggestions.push({
        title: item.title,
        desc: item.description,
        href: item.url,
        category: item.category,
        score,
        type: 'custom'
      });
    }
  });
  
  // Sort by score (highest first)
  suggestions.sort((a, b) => b.score - a.score);
  
  // Limit to top 8 suggestions
  suggestions = suggestions.slice(0, 8);
  
  showSuggestions();
}

function showSuggestions() {
  const container = document.getElementById('searchSuggestions');
  if (!container || suggestions.length === 0) return;
  
  container.innerHTML = suggestions.map((suggestion, index) => `
    <div class="search-suggestion ${index === 0 ? 'selected' : ''}" data-index="${index}">
      <div class="suggestion-icon">
        ${suggestion.type === 'custom' ? '🎨' : '📚'}
      </div>
      <div class="suggestion-content">
        <div class="suggestion-title">${escHtml(suggestion.title)}</div>
        <div class="suggestion-desc">${escHtml(suggestion.desc)}</div>
        <div class="suggestion-meta">
          <span class="suggestion-category">${suggestion.category}</span>
          ${suggestion.type === 'custom' ? '<span class="suggestion-type">Custom</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  container.classList.remove('hidden');
  
  // Add click handlers
  container.querySelectorAll('.search-suggestion').forEach((item, index) => {
    item.addEventListener('click', () => {
      selectSuggestion(index);
    });
    
    item.addEventListener('mouseenter', () => {
      highlightSuggestion(index);
    });
  });
}

function hideSuggestions() {
  const container = document.getElementById('searchSuggestions');
  if (container) {
    container.classList.add('hidden');
  }
}

function selectSuggestion(index) {
  const suggestion = suggestions[index];
  if (!suggestion) return;
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = suggestion.title;
  }
  
  // Navigate to the resource
  window.open(suggestion.href, '_blank', 'noreferrer');
  
  hideSuggestions();
  
  // Log the selection
  if (typeof logActivity === 'function') {
    logActivity(`Searched for "${suggestion.title}"`);
  }
}

function highlightSuggestion(index) {
  const items = document.querySelectorAll('.search-suggestion');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

function handleSearchKeydown(e) {
  const container = document.getElementById('searchSuggestions');
  if (!container || container.classList.contains('hidden')) return;
  
  const items = container.querySelectorAll('.search-suggestion');
  if (items.length === 0) return;
  
  let selectedIndex = -1;
  items.forEach((item, index) => {
    if (item.classList.contains('selected')) {
      selectedIndex = index;
    }
  });
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      highlightSuggestion(selectedIndex);
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      highlightSuggestion(selectedIndex);
      break;
    case 'Enter':
      e.preventDefault();
      if (selectedIndex >= 0) {
        selectSuggestion(selectedIndex);
      }
      break;
    case 'Escape':
      hideSuggestions();
      break;
  }
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchSuggestions);
} else {
  initSearchSuggestions();
}
