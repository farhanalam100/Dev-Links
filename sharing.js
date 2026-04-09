/* ── SHARING ── */

function shareAsLink() {
  const data = {
    saved: JSON.parse(localStorage.getItem('dl-saved') || '[]'),
    custom: JSON.parse(localStorage.getItem('dl-custom') || '[]'),
    version: '2.0',
    timestamp: new Date().toISOString(),
  };
  try {
    const encoded = btoa(JSON.stringify(data));
    const url = `${location.origin}${location.pathname}?shared=${encoded}`;
    copyToClipboard(url);
    if (typeof showToast === 'function') showToast('Share link copied!', 't-success');
  } catch {
    if (typeof showToast === 'function') showToast('Could not generate link', 't-error');
  }
}

function exportAsJSON() {
  const cards = document.querySelectorAll('.card');
  const resources = [];
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const url = card.getAttribute('href') || '';
    const desc = card.querySelector('p')?.textContent || '';
    const category = card.dataset.category || '';
    if (url) resources.push({ title, url, description:desc, category });
  });
  const blob = new Blob([JSON.stringify(resources, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'devlinks-resources.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (typeof showToast === 'function') showToast('JSON exported!', 't-success');
  if (typeof logActivity === 'function') logActivity('Exported resources as JSON');
}

function exportAsCSV() {
  const cards = document.querySelectorAll('.card');
  const rows = [['Title','URL','Description','Category']];
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const url = card.getAttribute('href') || '';
    const desc = card.querySelector('p')?.textContent || '';
    const category = card.dataset.category || '';
    if (url) rows.push([`"${title}"`, `"${url}"`, `"${desc}"`, `"${category}"`]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'devlinks-resources.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (typeof showToast === 'function') showToast('CSV exported!', 't-success');
  if (typeof logActivity === 'function') logActivity('Exported resources as CSV');
}

function copyAllToClipboard() {
  const cards = document.querySelectorAll('.card');
  const lines = [];
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const url = card.getAttribute('href') || '';
    if (url) lines.push(`${title}: ${url}`);
  });
  copyToClipboard(lines.join('\n'));
  if (typeof showToast === 'function') showToast('All links copied!', 't-success');
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(el);
  el.focus(); el.select();
  try { document.execCommand('copy'); }
  catch { console.warn('Copy failed'); }
  document.body.removeChild(el);
}

// Check for shared data on load
(function checkSharedData() {
  const params = new URLSearchParams(location.search);
  const shared = params.get('shared');
  if (!shared) return;
  try {
    const data = JSON.parse(atob(shared));
    if (data.saved) {
      const current = JSON.parse(localStorage.getItem('dl-saved') || '[]');
      const merged = [...new Set([...current, ...data.saved])];
      localStorage.setItem('dl-saved', JSON.stringify(merged));
    }
    if (data.custom) {
      const current = JSON.parse(localStorage.getItem('dl-custom') || '[]');
      const merged = [...current, ...data.custom.filter(n => !current.some(c => c.url === n.url))];
      localStorage.setItem('dl-custom', JSON.stringify(merged));
    }
    // Clean URL
    const url = new URL(location);
    url.searchParams.delete('shared');
    history.replaceState({}, '', url.toString());
    if (typeof showToast === 'function') showToast('Shared resources imported!', 't-success');
  } catch { /* ignore invalid data */ }
})();