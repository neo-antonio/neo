/* Sidebar on desktop, top bar + drawer on mobile. Add <script src="shell.js"></script> in every page's <head>. */
(function () {
  document.documentElement.classList.add('has-shell');
  var P = {
    home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1z"/>',
    user: '<circle cx="12" cy="7.8" r="4"/><path d="M4.2 20.5c0-4.3 3.5-6.8 7.8-6.8s7.8 2.5 7.8 6.8"/>',
    log: '<path d="M6 2.8h12v18.4H6z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    food: '<path d="M7 3v8a2 2 0 004 0V3M9 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
    meal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
    stats: '<rect x="3.5" y="12" width="4.5" height="8.5" rx=".8"/><rect x="9.75" y="7" width="4.5" height="13.5" rx=".8"/><rect x="16" y="3.5" width="4.5" height="17" rx=".8"/>',
    todo: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.2l3 3 5-6"/>',
    habit: '<path d="M20 12a8 8 0 11-3-6.2M20 4v5h-5"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.8v3.4M16 2.8v3.4"/>',
    note: '<path d="M5 3.5h10l4 4V20.5H5z"/><path d="M14.5 3.5v4.5H19M8.5 13h7M8.5 16.5h5"/>',
    money: '<path d="M3 6.5h14.5a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3z"/><path d="M3 6.5V5a2 2 0 012-2h9.5"/><circle cx="16.3" cy="13.7" r="1.3" fill="currentColor" stroke="none"/>',
    goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 011-1h7.7l8.3 8.3a1.5 1.5 0 010 2.1l-6.1 6.1a1.5 1.5 0 01-2.1 0z"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    db: '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M11 7h6M11 17h6"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>'; };
  // [group, [[icon, label, page]]]
  var G = window.NEO_GROUPS = [
    ['Workspace', [['home', 'Home', 'index.html'], ['user', 'Profile', 'profile.html']]],
    ['Food & Health', [['log', 'Daily Log', 'dailylog.html'], ['food', 'Food Library', 'foods.html'], ['meal', 'Meal Planning', 'meals.html'], ['stats', 'Statistics', 'statistics.html']]],
    ['Planning', [['todo', 'To-do List', 'todo.html'], ['habit', 'Habit Planner', 'habits.html'], ['cal', 'Calendar', 'calendar.html'], ['note', 'Notes', 'notes.html']]],
    ['Money', [['money', 'Finance', 'finance.html'], ['goal', 'Budget & Goals', 'budget.html'], ['tag', 'Categories', 'categories.html']]]
  ];
  window.NEO_SVG = svg;
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var link = function (i) { var on = i[2] === page; return '<a class="sb-link' + (on ? ' on' : '') + '" href="' + i[2] + '"' + (on ? ' aria-current="page"' : '') + '>' + svg(i[0]) + '<span>' + esc(i[1]) + '</span></a>'; };
  var brand = '<a class="sb-brand" href="index.html"><span class="sb-logo" aria-hidden="true">n</span>neo</a>';

  function build() {
    var bar = document.createElement('div'); bar.className = 'appbar';
    bar.innerHTML = brand + '<button type="button" class="sb-menu" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>';
    var aside = document.createElement('aside'); aside.className = 'sb'; aside.setAttribute('aria-label', 'Main menu');
    var sheet = typeof CONFIG !== 'undefined' && CONFIG.sheetUrl;
    aside.innerHTML = brand + '<nav class="sb-nav">' + G.map(function (g) { return '<p class="sb-lbl">' + esc(g[0]) + '</p>' + g[1].map(link).join(''); }).join('') + '</nav>'
      + '<div class="sb-foot">' + (sheet ? '<a class="sb-link" href="' + esc(sheet) + '" target="_blank" rel="noopener">' + svg('db') + '<span>Backend</span></a>' : '') + link(['set', 'Settings', 'settings.html']) + '</div>';
    var scrim = document.createElement('div'); scrim.className = 'sb-scrim';
    document.body.insertBefore(bar, document.body.firstChild); document.body.appendChild(aside); document.body.appendChild(scrim);
    var root = document.documentElement, btn = bar.querySelector('.sb-menu');
    var set = function (o) { root.classList.toggle('sb-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    btn.addEventListener('click', function () { set(!root.classList.contains('sb-open')); });
    scrim.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
