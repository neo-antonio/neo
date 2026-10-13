/* neo core: Home, shared helpers (dialogs, downloads), app loader + router, offline support.
   Apps live in apps/<name>/ and the shared theme lives in theme.js. */

/* ---------- Home (summary cards, local data, name, sidebar drawer) ---------- */
(function(){
const $=id=>document.getElementById(id), KEY='neo:data:v1', root=document.documentElement;
const DEF={name:'',hide:false,counts:{onhand:0,ship:0,videos:0,posts:0,events:0},money:{spend:0,port:0,res:0}};
let mem=null;
const load=()=>{try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);return{...DEF,...o,counts:{...DEF.counts,...o.counts},money:{...DEF.money,...o.money}};}}catch(_){}return mem||JSON.parse(JSON.stringify(DEF));};
let S=load();
const save=()=>{mem=S;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(_){}};
const php=n=>'PHP '+Number(n||0).toLocaleString('en-PH',{maximumFractionDigits:0});
const set=(id,v)=>{$(id).textContent=v;};
const toast=msg=>{const t=$('homeToast');t.textContent=msg;t.hidden=false;clearTimeout(t.timer);t.timer=setTimeout(()=>t.hidden=true,2600);};

$('sumDate').textContent='Today is '+new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

function render(){
  const nm=S.name.trim(), cap=nm?nm.charAt(0).toUpperCase()+nm.slice(1):'';
  set('sumHello',cap?'Hello, '+cap:'Hello'); $('sbUser').querySelector('span').textContent=cap||'Set your name';
  const c=S.counts,m=S.money;
  set('sumOnhand',c.onhand);set('sumShipToday',c.ship);set('sumVideos',c.videos);set('sumPosts',c.posts);set('sumEvents',c.events);
  set('sumEventsLbl',c.events===1?'Event today':'Events today');
  set('sumSpend',php(m.spend));set('sumPort',php(m.port));set('sumRes',php(m.res));set('sumTotal',php(m.spend+m.port+m.res));
  $('homeSum').classList.toggle('hs-hide',S.hide);
  const e=$('homeEye');e.setAttribute('aria-pressed',S.hide?'true':'false');e.setAttribute('aria-label',S.hide?'Show amounts':'Hide amounts');
}
$('homeEye').onclick=()=>{S.hide=!S.hide;save();render();};

// sidebar drawer (mobile)
const closeSb=()=>root.classList.remove('sb-open');
$('sbMenu').onclick=()=>root.classList.toggle('sb-open');
$('sbScrim').onclick=closeSb;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSb();$('nameSheet').hidden=true;$('editSheet').hidden=true;}});
$('sbSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.sb-nav [data-nav]').forEach(a=>a.hidden=!!q&&!a.textContent.toLowerCase().includes(q));};

// tiles / cards that point at pages neo doesn't have yet
document.addEventListener('click',e=>{
  const a=e.target.closest('a.tile:not([data-live]),a.hs-card');if(!a)return;
  e.preventDefault();
  const t=a.querySelector('.tile-t b,.hs-l');
  toast((t?t.textContent.replace(/\s+/g,' ').trim():'That page')+' is coming to neo soon');
});

// name sheet (replaces the login popup)
const openName=()=>{$('nameIn').value=S.name;$('nameSheet').hidden=false;setTimeout(()=>$('nameIn').focus(),30);closeSb();};
$('sbUser').onclick=openName;
$('nameSave').onclick=()=>{S.name=$('nameIn').value.trim();S.asked=true;save();render();$('nameSheet').hidden=true;};
$('nameSkip').onclick=()=>{S.asked=true;save();$('nameSheet').hidden=true;};
$('nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('nameSave').click();});

// edit sheet
const FIELDS=[['counts','onhand','Cards on hand'],['counts','ship','Shipping today'],['counts','videos','Videos to edit'],['counts','posts','Posts to edit'],['counts','events','Events today'],['money','spend','Spendable money'],['money','port','Portfolio value'],['money','res','Cash reserves']];
$('editFields').innerHTML=FIELDS.map(([g,k,l])=>{
  const inp='<input type="number" inputmode="decimal" min="0" step="'+(g==='money'?'0.01':'1')+'" data-g="'+g+'" data-k="'+k+'" placeholder="0">';
  return '<div class="field"><label>'+l+'</label>'+(g==='money'?'<div class="money"><em>PHP</em>'+inp+'</div>':inp)+'</div>';
}).join('');
$('homeEdit').onclick=()=>{
  document.querySelectorAll('#editFields input').forEach(i=>{i.value=S[i.dataset.g][i.dataset.k]||'';});
  $('editSheet').hidden=false;
};
$('editCancel').onclick=()=>{$('editSheet').hidden=true;};
$('editSave').onclick=()=>{
  document.querySelectorAll('#editFields input').forEach(i=>{const v=Number(i.value);S[i.dataset.g][i.dataset.k]=isFinite(v)&&v>0?(i.dataset.g==='counts'?Math.round(v):v):0;});
  save();render();$('editSheet').hidden=true;toast('Saved on this device');
};

render();
if(!S.asked&&!S.name&&!/^#\/(?!home\b)\w/.test(location.hash))openName();
})();

/* ---------- shared helpers: neo dialogs, toasts and file saving ---------- */
(function(){
  const $=id=>document.getElementById(id);
  window.uiAlert=msg=>{const t=$('homeToast');t.textContent=msg;t.hidden=false;clearTimeout(t.timer);t.timer=setTimeout(()=>t.hidden=true,2800);};
  function dlg(o){return new Promise(res=>{
    const m=document.createElement('div');m.className='modal';m.style.zIndex=500;
    m.innerHTML='<div class="sheet small"><h3></h3><p class="es-dlg-msg"></p>'+(o.input?'<div class="es-dlg-in"><input type="text" autocomplete="off"></div>':'')+'<div class="acts"><button type="button" class="go ok"></button><button type="button" class="ghost no">Cancel</button></div></div>';
    m.querySelector('h3').textContent=o.title;m.querySelector('p').textContent=o.msg;m.querySelector('.ok').textContent=o.ok;
    const inp=m.querySelector('input');if(inp)inp.value=o.val||'';
    const done=v=>{document.removeEventListener('keydown',key,true);m.remove();res(v);};
    const key=e=>{if(e.key==='Escape'){e.stopPropagation();done(o.input?null:false);}else if(e.key==='Enter'&&inp){done(inp.value);}};
    m.querySelector('.ok').onclick=()=>done(o.input?inp.value:true);
    m.querySelector('.no').onclick=()=>done(o.input?null:false);
    m.addEventListener('click',e=>{if(e.target===m)done(o.input?null:false);});
    document.addEventListener('keydown',key,true);document.body.appendChild(m);setTimeout(()=>(inp||m.querySelector('.ok')).focus(),30);
  });}
  window.uiConfirm=msg=>dlg({title:'Are you sure?',msg:String(msg),ok:'Confirm'});
  window.uiPrompt=(msg,val)=>dlg({title:'Edit',msg:String(msg),input:true,val:val,ok:'Save'});
  window.neoSave=async function(name,text,mime){
    try{if(window.claude&&claude.use){const d=await claude.use('downloads');if(d){await d.save({filename:name,data:text});return;}}}catch(e){if(e&&e.code==='declined')return;}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  };
})();

/* ---------- apps: registry + lazy loader + router ---------- */
(function () {
  const $ = id => document.getElementById(id), root = document.documentElement;

  // Each app = a folder in apps/ (html fragment + js). Loaded the first time one of its pages is opened.
  const APPS = {
    es: { host: 'host-es', html: 'apps/eatshimo/eatshimo.html', name: 'Eatshimo',
          scripts: [{ src: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', optional: true }, { src: 'apps/eatshimo/eatshimo.js' }],
          top: 'esTop', view: 'view-es', help: 'esHelp', title: 'esTitle', tabs: 'esTabs',
          seen: 'eatshimo_tutorial_seen', mark: false, show: r => showPage(r), tut: () => openTutorial() },
    st: { host: 'host-st', html: 'apps/stashimo/stashimo.html', name: 'Stashimo',
          scripts: [{ src: 'apps/stashimo/stashimo.js' }],
          top: 'stTop', view: 'view-st', help: 'stHelp', title: 'stTitle', tabs: 'stTabs',
          seen: 'stashimo_tutorial_seen', mark: true, show: r => ST.showPage(r), tut: () => ST.openTutorial() },
    wm: { host: 'host-wm', html: 'apps/wermny/wermny.html', name: 'WerMny',
          scripts: [{ src: 'apps/wermny/wermny.js' }],
          top: 'wmTop', view: 'view-wm', help: null, title: 'wmTitle', tabs: 'wmTabs',
          seen: null, mark: false, show: r => WM.switchTab(r), tut: null }
  };

  // Pages. Change a page's group here (and in the sidebar markup in index.html).
  const R = {
    home:         { t: 'Home' },
    library:      { t: 'Food Library',  c: 'Food',      a: 'es' },
    daily:        { t: 'Daily Log',     c: 'Food',      a: 'es' },
    planner:      { t: 'Meal Planner',  c: 'Food',      a: 'st' },
    profile:      { t: 'Profile',       c: 'Health',    a: 'es' },
    pantry:       { t: 'Supplies',      c: 'Household', a: 'st' },
    transactions: { t: 'Transactions',  c: 'Money',     a: 'wm' },
    accounts:     { t: 'Accounts',      c: 'Money',     a: 'wm' },
    distributor:  { t: 'Distributor',   c: 'Money',     a: 'st' },
    more:         { t: 'More',          c: 'Money',     a: 'wm' }
  };

  function loadScript(s) {
    return new Promise(function (resolve, reject) {
      const el = document.createElement('script');
      el.src = s.src;
      el.onload = resolve;
      el.onerror = function () { s.optional ? resolve() : reject(new Error('Could not load ' + s.src)); };
      document.head.appendChild(el);
    });
  }
  function loadApp(key) {
    const a = APPS[key];
    if (!a.loading) {
      a.loading = (async function () {
        const res = await fetch(a.html);
        if (!res.ok) throw new Error(a.html + ' (' + res.status + ')');
        $(a.host).innerHTML = await res.text();
        for (const s of a.scripts) await loadScript(s);
        a.ready = true;
      })().catch(function (e) { a.loading = null; throw e; });
    }
    return a.loading;
  }

  let token = 0;
  async function route() {
    const my = ++token;
    let r = (location.hash.match(/^#\/(\w+)/) || [])[1]; if (!R[r]) r = 'home';
    const home = r === 'home', key = R[r].a;

    if (key) {
      try { await loadApp(key); }
      catch (e) {
        console.error(e);
        if (my === token) { uiAlert('Could not load ' + APPS[key].name + '. neo needs to run from a web server (file:// is not supported).'); location.hash = '#/home'; }
        return;
      }
      if (my !== token) return;
    }

    $('view-home').hidden = !home;
    Object.keys(APPS).forEach(function (k) {
      const a = APPS[k]; if (!a.ready) return;
      const on = key === k;
      $(a.top).hidden = !on; $(a.view).hidden = !on;
      if (a.help) $(a.help).hidden = !on;
    });
    const fab = $('fabBtn'); if (fab) fab.hidden = key !== 'wm';
    document.querySelectorAll('.sb-nav [data-route]').forEach(a => a.classList.toggle('on', a.dataset.route === r));
    root.classList.remove('sb-open');

    if (!home) {
      const a = APPS[key];
      $(a.title).innerHTML = R[r].t + '<small>' + R[r].c + '</small>';
      document.querySelectorAll('#' + a.tabs + ' .tab').forEach(b => b.classList.toggle('active', b.dataset.r === r));
      a.show(r);
      if (a.seen) {
        let seen = true; try { seen = !!localStorage.getItem(a.seen); } catch (_) {}
        if (!seen && $('nameSheet').hidden) { if (a.mark) try { localStorage.setItem(a.seen, '1'); } catch (_) {} setTimeout(a.tut, 350); }
      }
    }
    document.title = home ? 'neo' : R[r].t + ' \u00b7 neo';
    window.scrollTo(0, 0);
  }

  // the tab bars live inside each app's fragment, so listen on the document
  document.addEventListener('click', function (e) {
    const b = e.target.closest('.tabs .tab[data-r]');
    if (b) location.hash = '#/' + b.dataset.r;
  });
  window.addEventListener('hashchange', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else route();
})();

/* ---------- offline support (service worker) ---------- */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}
