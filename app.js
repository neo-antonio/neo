/* Neo.form(cfg,row,done) = add/edit sheet.  Neo.collection(cfg) = searchable list page with add/edit/delete. cfg: {tab,title,noun,fields,row,sort,group,head,toggle,also,single} */
(function () {
  var N = window.Neo, esc = N.esc;
  var dflt = function (f) { return f.def === 'today' ? N.today() : (f.def || ''); };
  async function opts(f) {
    if (f.from) { var p = f.from.split(':'), r = await N.list(p[0]).catch(function () { return []; }); r = r.filter(function (x) { return !p[1] || x.kind === p[1] || x.kind === 'both'; }).map(function (x) { return x.name; }); if (r.length) return r; }
    return f.opt || [];
  }
  function input(f, v, o) {
    var id = 'f_' + f.k;
    if (f.t === 'textarea') return '<textarea id="' + id + '" rows="6">' + esc(v) + '</textarea>';
    if (f.t === 'select') { var L = o.slice(); if (v && L.indexOf(v) < 0) L.unshift(v); return '<select id="' + id + '">' + (f.blank ? '<option value=""></option>' : '') + L.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; }
    if (f.t === 'check') return '<label class="field" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="' + id + '"' + (v ? ' checked' : '') + ' style="width:20px;height:20px"> ' + esc(f.l) + '</label>';
    return '<input id="' + id + '" type="' + (f.t || 'text') + '" value="' + esc(v) + '"' + (f.t === 'number' ? ' step="any" inputmode="decimal"' : '') + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '>';
  }
  N.form = async function (cfg, row, done) {
    var isNew = !row || !row.id; row = row || {};
    var O = {}; for (var f of cfg.fields) if (f.t === 'select') O[f.k] = await opts(f);
    var m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog');
    m.innerHTML = '<div class="sheet"><h3>' + (isNew ? 'Add ' : 'Edit ') + esc(cfg.noun || 'item') + '</h3>' + cfg.fields.map(function (f) {
      var v = row[f.k] != null && row[f.k] !== '' ? row[f.k] : (isNew ? dflt(f) : '');
      return f.t === 'check' ? input(f, v, []) : '<div class="field"><label for="f_' + f.k + '">' + esc(f.l) + '</label>' + input(f, v, O[f.k]) + '</div>';
    }).join('') + '<p class="err" hidden></p><div class="acts"><button class="go" data-s>Save</button>' + (isNew ? '' : '<button class="ghost del" data-d>Delete</button>') + '<button class="ghost" data-c>Cancel</button></div></div>';
    document.body.appendChild(m);
    var err = m.querySelector('.err'), close = function () { m.remove(); };
    var first = m.querySelector('input:not([type=checkbox]),textarea,select'); if (first && isNew) first.focus();
    m.querySelector('[data-c]').onclick = close;
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    m.querySelector('[data-s]').onclick = async function (e) {
      var out = Object.assign({}, row), bad = '';
      cfg.fields.forEach(function (f) { var el = m.querySelector('#f_' + f.k), v = f.t === 'check' ? (el.checked ? '1' : '') : el.value.trim(); if (f.req && !v) bad = f.l + ' is required.'; out[f.k] = v; });
      if (bad) { err.textContent = bad; err.hidden = false; return; }
      e.target.disabled = true; e.target.textContent = 'Saving…';
      try { await N.save(cfg.tab, out); close(); N.toast('Saved'); done && done(); } catch (x) { err.textContent = x.message; err.hidden = false; e.target.disabled = false; e.target.textContent = 'Save'; }
    };
    var d = m.querySelector('[data-d]');
    if (d) d.onclick = async function () { if (!confirm('Delete this ' + (cfg.noun || 'item') + '?')) return; try { await N.del(cfg.tab, row.id); close(); N.toast('Deleted'); done && done(); } catch (x) { err.textContent = x.message; err.hidden = false; } };
  };
  N.collection = function (cfg) {
    var root = document.getElementById('app'), rows = [], X = {}, F = cfg.fields;
    root.innerHTML = '<div class="bar"><h1>' + esc(cfg.title) + '</h1><button class="go sm" id="add">' + (cfg.single ? 'Edit' : '+ Add') + '</button></div>' + (cfg.single ? '' : '<input type="search" id="q" placeholder="Search" aria-label="Search">') + '<div id="head"></div><div id="list" class="list"><p class="mut">Loading…</p></div>';
    var list = root.querySelector('#list'), head = root.querySelector('#head'), q = root.querySelector('#q');
    var reload = function () { return N.list(cfg.tab).then(function (r) { rows = r; return Promise.all((cfg.also || []).map(function (t) { return N.list(t).then(function (x) { X[t] = x; }); })); }).then(render).catch(function (e) { list.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }); };
    function render() {
      if (cfg.single) { var r0 = rows[0] || {}; list.innerHTML = F.map(function (f) { return '<div class="kv"><span>' + esc(f.l) + '</span><span>' + esc(r0[f.k] || '—') + '</span></div>'; }).join(''); return; }
      var s = q.value.trim().toLowerCase(), r = rows.filter(function (x) { return !s || Object.values(x).join(' ').toLowerCase().indexOf(s) >= 0; });
      if (cfg.sort) r.sort(cfg.sort);
      head.innerHTML = cfg.head ? cfg.head(rows, X) : '';
      if (!r.length) { list.innerHTML = '<p class="mut">' + (rows.length ? 'Nothing matches.' : 'Nothing here yet. Tap + Add.') + '</p>'; return; }
      var last = null; list.innerHTML = r.map(function (x) {
        var v = cfg.row ? cfg.row(x, X) : [x[F[0].k], F[1] ? x[F[1].k] : ''], g = cfg.group ? cfg.group(x) : null, h = '';
        if (g !== last && g != null) { h = '<p class="gh">' + esc(g) + '</p>'; last = g; }
        var on = cfg.toggle && x[cfg.toggle.k] === cfg.toggle.on;
        return h + '<div class="it' + (on ? ' done' : '') + '" data-id="' + esc(x.id) + '">' + (cfg.toggle ? '<button class="tg' + (on ? ' on' : '') + '" aria-label="Toggle" data-t></button>' : '')
          + '<div class="it-b"><b>' + esc(v[0]) + '</b>' + (v[1] ? '<small>' + esc(v[1]) + '</small>' : '') + (v[3] != null ? '<div class="prog' + (v[3] > 100 ? ' over' : '') + '"><i style="width:' + Math.min(100, v[3]) + '%"></i></div>' : '') + '</div>' + (v[2] ? '<span class="it-r">' + esc(v[2]) + '</span>' : '') + '</div>';
      }).join('');
    }
    list.addEventListener('click', async function (e) {
      if (cfg.single) return;
      var it = e.target.closest('.it'); if (!it) return; var r = rows.find(function (x) { return x.id === it.dataset.id; }); if (!r) return;
      if (e.target.closest('[data-t]')) { r[cfg.toggle.k] = r[cfg.toggle.k] === cfg.toggle.on ? cfg.toggle.off : cfg.toggle.on; render(); try { await N.save(cfg.tab, r); } catch (x) { N.toast(x.message); reload(); } return; }
      N.form(cfg, r, reload);
    });
    root.querySelector('#add').onclick = function () { N.form(cfg, cfg.single ? rows[0] : null, reload); };
    if (q) q.addEventListener('input', render);
    var c = N.cached(cfg.tab); if (c) { rows = c; render(); }
    reload();
  };
})();
