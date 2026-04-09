/* ── KEYBOARD SHORTCUTS HELP OVERLAY ── */

function showShortcutsHelp() {
  let overlay = document.getElementById('shortcutsOverlay');
  if (overlay) { overlay.classList.toggle('hidden'); return; }

  overlay = document.createElement('div');
  overlay.id = 'shortcutsOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.75);
    backdrop-filter:blur(8px);z-index:3000;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border-md);border-radius:20px;
      padding:32px;max-width:480px;width:100%;animation:slideUp 0.2s ease;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <h2 style="font-family:'Cabinet Grotesk',sans-serif;font-size:20px;font-weight:800;color:var(--text);">⌨️ Keyboard Shortcuts</h2>
        <button onclick="document.getElementById('shortcutsOverlay').classList.add('hidden')"
          style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;
          padding:6px 10px;color:var(--text-2);cursor:pointer;font-size:13px;">✕ Close</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[
          ['/', 'Focus search bar'],
          ['Ctrl + K', 'Open command palette'],
          ['A', 'Add new resource'],
          ['T', 'Toggle dark / light mode'],
          ['Escape', 'Close modal / palette'],
          ['↑↓', 'Navigate command palette'],
          ['Enter', 'Select command palette item'],
        ].map(([key, desc]) => `
          <div style="display:flex;align-items:center;justify-content:space-between;
            padding:10px 14px;background:var(--surface2);border-radius:10px;
            border:1px solid var(--border);">
            <span style="font-size:13px;color:var(--text-2);">${desc}</span>
            <kbd style="background:var(--surface3);border:1px solid var(--border-md);
              padding:4px 10px;border-radius:6px;font-size:12px;
              font-family:monospace;color:var(--text);white-space:nowrap;">${key}</kbd>
          </div>`).join('')}
      </div>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  document.body.appendChild(overlay);
}

// Add ? shortcut to show help
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if (e.key === '?' && !inInput) showShortcutsHelp();
});