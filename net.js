/* Neo data layer: talks to the Apps Script web app. Reads/deletes = JSONP (GET), saves = POST. Last-loaded data is cached for offline viewing. */
(function () {
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
  var ep = function () { return ls('neo_ep') || (window.CONFIG && CONFIG.endpoint) || ''; };
  var sec = function () { return ls('neo_sec') || (window.CONFIG && CONFIG.secret) || ''; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  function jsonp(action, p) {
    return new Promise(function (res, rej) {
      if (!ep()) return rej(new Error('Add your Apps Script URL in Settings first.'));
      var cb = 'neo' + Date.now() + Math.floor(Math.random() * 1e6), s = document.createElement('script'), t;
      var end = function (f, v) { clearTimeout(t); delete window[cb]; s.remove(); f(v); };
      t = setTimeout(function () { end(rej, new Error('The server took too long. Try again.')); }, 25000);
      window[cb] = function (d) { end(res, d); };
      s.onerror = function () { end(rej, new Error('Could not reach the server.')); };
      s.src = ep() + '?action=' + action + Object.keys(p || {}).map(function (k) { return '&' + k + '=' + encodeURIComponent(p[k]); }).join('') + '&secret=' + encodeURIComponent(sec()) + '&callback=' + cb;
      document.head.appendChild(s);
    });
  }
  var chk = function (d) { if (d && d.ok) return d; throw new Error(d && d.error === 'unauthorized' ? 'The secret does not match the server.' : (d && d.error) || 'Something went wrong.'); };
  var Neo = window.Neo = {
    ls: ls, ep: ep, ymd: ymd, today: function () { return ymd(new Date()); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    num: function (v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; },
    money: function (n) { return ((window.CONFIG && CONFIG.currency) || '₱') + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    toast: function (m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); },
    api: function (a, p) { return jsonp(a, p).then(chk); },
    cached: function (tab) { try { return JSON.parse(ls('neo_c_' + tab)); } catch (e) { return null; } },
    list: function (tab) {
      return Neo.api('list', { tab: tab }).then(function (d) { ls('neo_c_' + tab, JSON.stringify(d.rows)); return d.rows; })
        .catch(function (e) { var c = Neo.cached(tab); if (c) { Neo.toast('Offline — showing saved data'); return c; } throw e; });
    },
    many: function (tabs) { return Promise.all(tabs.map(Neo.list)).then(function (r) { var o = {}; tabs.forEach(function (t, i) { o[t] = r[i]; }); return o; }); },
    save: function (tab, row) {
      if (!ep()) return Promise.reject(new Error('Add your Apps Script URL in Settings first.'));
      return fetch(ep(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', tab: tab, row: row, secret: sec() }) })
        .then(function (r) { return r.json(); }).then(chk).then(function (d) { return d.row; });
    },
    del: function (tab, id) { return Neo.api('delete', { tab: tab, id: id }); }
  };
})();
