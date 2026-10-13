/* neo theme: one accent colour (and Dark mode) shared by every app.
   Loaded synchronously in <head> so the page never flashes the wrong theme.
   Keys stay eatshimo_theme / stashimo_theme so exports from the original apps keep working. */
(function () {
  const THEMES = {
    slate:    { label: 'Slate',    border: '#171717', borderLite: '#2e2e2e', accentDim: 'rgba(23,23,23,0.06)' },
    ocean:    { label: 'Ocean',    border: '#1a5276', borderLite: '#2471a3', accentDim: 'rgba(26,82,118,0.07)' },
    forest:   { label: 'Forest',   border: '#1e6b45', borderLite: '#28895a', accentDim: 'rgba(30,107,69,0.07)' },
    crimson:  { label: 'Crimson',  border: '#8b1a1a', borderLite: '#b02323', accentDim: 'rgba(139,26,26,0.07)' },
    violet:   { label: 'Violet',   border: '#5b2c8b', borderLite: '#7634b5', accentDim: 'rgba(91,44,139,0.07)' },
    teal:     { label: 'Teal',     border: '#0f6b6b', borderLite: '#1a8c8c', accentDim: 'rgba(15,107,107,0.07)' },
    cocoa:    { label: 'Cocoa',    border: '#6b3a1f', borderLite: '#8c4e28', accentDim: 'rgba(107,58,31,0.07)' },
    dark:     { label: 'Dark',     border: '#4a5370', borderLite: '#606885', accentDim: 'rgba(74,83,112,0.15)', dark: true },
  };

  const KEYS = ['eatshimo_theme', 'stashimo_theme'];

  function current() {
    try { return localStorage.getItem('eatshimo_theme') || localStorage.getItem('stashimo_theme') || 'slate'; }
    catch (e) { return 'slate'; }
  }
  function apply(id) {
    const t = THEMES[id] || THEMES.slate;
    const r = document.documentElement;
    r.style.setProperty('--accent', t.border);
    r.style.setProperty('--accent-hi', t.borderLite);
    r.style.setProperty('--accent-dim', t.accentDim);
    r.classList.toggle('neo-dark', !!t.dark);
  }
  function set(id) {
    try { KEYS.forEach(function (k) { localStorage.setItem(k, id); }); } catch (e) {}
    apply(id);
  }

  window.neoTheme = { THEMES: THEMES, current: current, apply: apply, set: set };
  apply(current());
})();
