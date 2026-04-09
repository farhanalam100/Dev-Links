/* ── PREMIUM COMPONENTS ── */

/* ── SCROLL TO TOP BUTTON ── */
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  btn.title = 'Scroll to top';
  btn.style.cssText = `
    position:fixed;bottom:28px;right:28px;
    width:44px;height:44px;
    background:var(--accent);color:white;
    border:none;border-radius:50%;cursor:pointer;
    display:none;align-items:center;justify-content:center;
    box-shadow:0 4px 16px var(--accent-glow);
    z-index:500;
    transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
  `;
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-3px) scale(1.05)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }, { passive:true });
}

/* ── PAGE PROGRESS BAR ── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position:fixed;top:0;left:0;height:2px;
    background:var(--accent);z-index:9999;
    width:0%;transition:width 0.1s linear;
    box-shadow:0 0 8px var(--accent-glow);
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = docHeight > 0 ? `${(scrollTop / docHeight) * 100}%` : '0%';
  }, { passive:true });
}

/* ── CARD COUNT BADGE ── */
function updateCardCountBadge() {
  let badge = document.getElementById('cardCountBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'cardCountBadge';
    badge.style.cssText = `
      position:fixed;top:80px;right:20px;
      background:var(--surface);
      border:1px solid var(--border-md);
      border-radius:20px;padding:6px 14px;
      font-size:12px;font-weight:600;
      color:var(--text-2);z-index:50;
      transition:all 0.25s ease;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);
      pointer-events:none;
    `;
    document.body.appendChild(badge);
  }

  const visible = document.querySelectorAll('.card:not([style*="display: none"])').length;
  const total = document.querySelectorAll('.card').length;
  badge.textContent = visible === total ? `${total} resources` : `${visible} of ${total}`;
  badge.style.opacity = '1';
  clearTimeout(badge._timeout);
  badge._timeout = setTimeout(() => { badge.style.opacity = '0'; }, 3000);
}

/* ── CARD HOVER SOUND EFFECT (visual pulse instead) ── */
function initCardPulse() {
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('.card');
    if (card && !card._pulsed) {
      card._pulsed = true;
      setTimeout(() => { card._pulsed = false; }, 500);
    }
  });
}

/* ── WELCOME TOAST ── */
function showWelcomeMessage() {
  const lastVisit = localStorage.getItem('devlinks-last-visit');
  const now = Date.now();
  const oneDay = 86400000;

  if (!lastVisit || now - parseInt(lastVisit) > oneDay) {
    setTimeout(() => {
      if (typeof showToast === 'function') showToast('Welcome to DevLinks! Press ? for shortcuts 🚀', 't-info');
    }, 1200);
  }
  localStorage.setItem('devlinks-last-visit', now.toString());
}

/* ── INIT ALL PREMIUM COMPONENTS ── */
function initPremiumComponents() {
  initScrollToTop();
  initProgressBar();
  initCardPulse();
  showWelcomeMessage();

  // Re-run count badge on filter changes
  const observer = new MutationObserver(() => updateCardCountBadge());
  const grid = document.getElementById('cardGrid');
  if (grid) observer.observe(grid, { attributes:true, subtree:true, attributeFilter:['style'] });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPremiumComponents);
else initPremiumComponents();