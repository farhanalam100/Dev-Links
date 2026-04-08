/* ── PREMIUM UI COMPONENTS ── */

// Animated background particles
function createParticleBackground() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '-1';
  canvas.style.opacity = '0.1';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const particleCount = 50;
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2
    });
  }
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent');
    
    particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = accentColor + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animate();
}

// Floating action buttons
function createFloatingActions() {
  const existing = document.getElementById('floatingActions');
  if (existing) return;
  
  const container = document.createElement('div');
  container.id = 'floatingActions';
  container.className = 'floating-actions';
  container.innerHTML = `
    <button class="floating-btn" onclick="scrollToTop()" title="Scroll to top">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 14l5-5 5-5M12 8l0 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="floating-btn" onclick="toggleFullscreen()" title="Toggle fullscreen">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m2 4h3a2 2 0 0 0 2-2V7M8 3v6l8-8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="floating-btn" onclick="printPage()" title="Print page">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 0-2-2v-2a2 2 0 0 0-2 2h16a2 2 0 0 0 2 2v2a2 2 0 0 0 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
  
  document.body.appendChild(container);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function printPage() {
  window.print();
}

// Loading screens with skeleton
function showLoadingState() {
  const main = document.querySelector('.main');
  if (!main) return;
  
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading amazing content...</div>
  `;
  
  main.appendChild(loadingOverlay);
}

function hideLoadingState() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

// Progress bar for page loading
function createProgressBar() {
  const progress = document.createElement('div');
  progress.className = 'page-progress';
  progress.innerHTML = '<div class="progress-bar"></div>';
  document.body.appendChild(progress);
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progress.querySelector('.progress-bar').style.width = scrollPercent + '%';
  });
}

// Notification system
function showPremiumNotification(message, type = 'info', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = `premium-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Initialize premium components
function initPremiumComponents() {
  // Only initialize if enabled in settings
  const enableParticles = localStorage.getItem('devlinks-particles') === 'true';
  const enableFloatingActions = localStorage.getItem('devlinks-floating-actions') !== 'false';
  const enableProgressBar = localStorage.getItem('devlinks-progress-bar') === 'true';
  
  if (enableParticles) {
    createParticleBackground();
  }
  
  if (enableFloatingActions) {
    createFloatingActions();
  }
  
  if (enableProgressBar) {
    createProgressBar();
  }
}

// Add settings to enable/disable premium features
function addPremiumSettings() {
  const settingsHTML = `
    <div class="premium-settings">
      <h3>🎨 Premium Features</h3>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="particlesToggle" ${localStorage.getItem('devlinks-particles') === 'true' ? 'checked' : ''}>
          Animated Background Particles
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="floatingActionsToggle" ${localStorage.getItem('devlinks-floating-actions') !== 'false' ? 'checked' : ''}>
          Floating Action Buttons
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="progressBarToggle" ${localStorage.getItem('devlinks-progress-bar') === 'true' ? 'checked' : ''}>
          Page Progress Bar
        </label>
      </div>
    </div>
  `;
  
  // Add to theme panel
  const themeContent = document.querySelector('.theme-content');
  if (themeContent) {
    themeContent.insertAdjacentHTML('beforeend', settingsHTML);
    
    // Add event listeners
    document.getElementById('particlesToggle').addEventListener('change', (e) => {
      localStorage.setItem('devlinks-particles', e.target.checked);
      location.reload();
    });
    
    document.getElementById('floatingActionsToggle').addEventListener('change', (e) => {
      localStorage.setItem('devlinks-floating-actions', e.target.checked);
      location.reload();
    });
    
    document.getElementById('progressBarToggle').addEventListener('change', (e) => {
      localStorage.setItem('devlinks-progress-bar', e.target.checked);
      location.reload();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPremiumComponents();
    addPremiumSettings();
  });
} else {
  initPremiumComponents();
  addPremiumSettings();
}
