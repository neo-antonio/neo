/* ---------- part 1 ---------- */
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
if(!S.asked&&!S.name&&!/^#\/(library|daily|profile|pantry|planner|distributor)/.test(location.hash))openName();
})();

/* ---------- part 2 ---------- */
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

/* ---------- part 3 ---------- */
let foods = JSON.parse(localStorage.getItem('eatshimo_foods') || '[]');

function saveFoodsToDisk() {
  localStorage.setItem('eatshimo_foods', JSON.stringify(foods));
}

function getTimezone() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  return p.timezone || 'Asia/Manila';
}

function dateStr(d) {
  
  const tz = getTimezone();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
  return parts; 
}

function nowInTZ() {
  
  const tz = getTimezone();
  const str = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
  const [y, m, day] = str.split('-').map(Number);
  return new Date(y, m - 1, day);
}
function getDayKey(ds) { return 'eatshimo_day_' + ds; }
function getDayData(ds) {
  const raw = localStorage.getItem(getDayKey(ds));
  if (!raw) return { meals: [], water: 0, steps: 0, weight: null, sleep: null, exercises: {}, checklist: {} };
  const d = JSON.parse(raw);
  if (!d.exercises) d.exercises = {};
  if (!d.checklist) d.checklist = {};
  return d;
}
function saveDayData(ds, data) { localStorage.setItem(getDayKey(ds), JSON.stringify(data)); }

function cleanupDay(key, data) {
  const isEmpty = data.meals.length === 0 && !data.water && !data.steps && !data.weight && !data.sleep;
  if (isEmpty) localStorage.removeItem(getDayKey(key));
  else saveDayData(key, data);
}

function getAllDayKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo_day_')) keys.push(k.replace('eatshimo_day_', ''));
  }
  return keys.sort();
}

const THEMES = {
  slate:    { label: 'Slate',    border: '#171717', borderLite: '#2e2e2e', headerBg: '#171717', accentDim: 'rgba(23,23,23,0.06)' },
  ocean:    { label: 'Ocean',    border: '#1a5276', borderLite: '#2471a3', headerBg: '#0e3460', accentDim: 'rgba(26,82,118,0.07)' },
  forest:   { label: 'Forest',   border: '#1e6b45', borderLite: '#28895a', headerBg: '#134a30', accentDim: 'rgba(30,107,69,0.07)' },
  crimson:  { label: 'Crimson',  border: '#8b1a1a', borderLite: '#b02323', headerBg: '#5e1010', accentDim: 'rgba(139,26,26,0.07)' },
  violet:   { label: 'Violet',   border: '#5b2c8b', borderLite: '#7634b5', headerBg: '#3d1d5e', accentDim: 'rgba(91,44,139,0.07)' },
  teal:     { label: 'Teal',     border: '#0f6b6b', borderLite: '#1a8c8c', headerBg: '#074a4a', accentDim: 'rgba(15,107,107,0.07)' },
  cocoa:    { label: 'Cocoa',    border: '#6b3a1f', borderLite: '#8c4e28', headerBg: '#4a2510', accentDim: 'rgba(107,58,31,0.07)' },
  dark:     { label: 'Dark',     border: '#4a5370', borderLite: '#606885', headerBg: '#0c0e16', accentDim: 'rgba(74,83,112,0.15)',
    dark: true, bg: '#12141e', surface: '#191c28', card: '#1e2130',
    text: '#e2e4ef', textDim: '#6e7480', textMid: '#9aa0b0',
    inputBorder: '#2a2e42', shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowSm: '0 2px 8px rgba(0,0,0,0.35)' },
};

const LIGHT_DEFAULTS = {
  bg: '#f4f5f7', surface: '#ffffff', card: '#ffffff',
  text: '#252830', textDim: '#8a9099', textMid: '#555c6b',
  inputBorder: '#dde0e8', shadow: '0 4px 24px rgba(0,0,0,0.10)', shadowSm: '0 2px 8px rgba(0,0,0,0.07)',
};

function applyTheme(id) {
  const t = THEMES[id] || THEMES.slate;
  const r = document.documentElement;
  r.style.setProperty('--accent', t.border);
  r.style.setProperty('--accent-hi', t.borderLite);
  r.style.setProperty('--accent-dim', t.accentDim);
  r.classList.toggle('neo-dark', !!t.dark);
}

function loadTheme() {
  applyTheme(localStorage.getItem('eatshimo_theme') || 'slate');
}

function selectTheme(id) {
  localStorage.setItem('eatshimo_theme', id); localStorage.setItem('stashimo_theme', id);
  applyTheme(id);
  renderThemePicker();
  try { renderCharts(); } catch (e) {}
}

function renderThemePicker() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const current = localStorage.getItem('eatshimo_theme') || 'slate';
  grid.innerHTML = Object.entries(THEMES).map(([id, t]) => `
    <button class="theme-swatch${id === current ? ' active' : ''}"
            style="background:${t.border};"
            onclick="selectTheme('${id}')"
            title="${t.label}">
      ${id === current ? '<span class="theme-check">✓</span>' : ''}
      <span class="theme-label">${t.label}</span>
    </button>`).join('');
}

let libraryExpanded = false;

function showPage(page) {
  document.querySelectorAll('.es .page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (page !== 'library') libraryExpanded = false;
  if (page === 'daily')   renderDailyLog();
  if (page === 'library') renderLibrary();
  if (page === 'profile') { loadProfile(); renderCharts(); initPeriodTabs(); loadChartSettingsUI(); renderThemePicker(); loadCardToggles(); }
}

let currentDate = nowInTZ();

function formatDateDisplay(d) {
  const today = nowInTZ();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const dStr = dateStr(d), tStr = dateStr(today), yStr = dateStr(yesterday);
  const label = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  if (dStr === tStr) return 'Today — ' + label;
  if (dStr === yStr) return 'Yesterday — ' + label;
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

function changeDate(dir) { currentDate.setDate(currentDate.getDate() + dir); renderDailyLog(); }
function goToToday() { currentDate = nowInTZ(); renderDailyLog(); }

function renderDailyLog() {
  const key  = dateStr(currentDate);
  const data = getDayData(key);
  document.getElementById('current-date').textContent = formatDateDisplay(currentDate);

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  data.meals.forEach(m => { totalCal += m.calories; totalP += m.protein; totalC += m.carbs; totalF += m.fat; });

  document.getElementById('sum-calories').textContent = Math.round(totalCal);
  const prof = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  document.getElementById('sum-protein').textContent = prof.proteinGoal ? `${Math.round(totalP)}/${prof.proteinGoal}g` : Math.round(totalP) + 'g';
  document.getElementById('sum-carbs').textContent   = prof.carbsGoal   ? `${Math.round(totalC)}/${prof.carbsGoal}g`   : Math.round(totalC) + 'g';
  document.getElementById('sum-fat').textContent     = prof.fatGoal     ? `${Math.round(totalF)}/${prof.fatGoal}g`     : Math.round(totalF) + 'g';

  const target = parseInt(localStorage.getItem('eatshimo_cal_target') || '0');
  const bar = document.getElementById('calorie-bar'), lbl = document.getElementById('calorie-label');
  if (target > 0) {
    const pct = Math.min((totalCal / target) * 100, 100);
    bar.style.width = pct + '%';
    bar.className = 'calorie-bar' + (totalCal > target ? ' over' : '');
    const rem = target - Math.round(totalCal);
    lbl.textContent = rem >= 0 ? `${Math.round(totalCal)} / ${target} kcal — ${rem} remaining` : `${Math.round(totalCal)} / ${target} kcal — ${Math.abs(rem)} over target`;
  } else {
    bar.style.width = '0%';
    lbl.innerHTML = `<a href="#" onclick="editCalorieGoal();return false;">Set your calorie target</a>`;
  }

  const mealList = document.getElementById('meal-list');
  if (data.meals.length === 0) {
    mealList.innerHTML = '<p class="empty-msg">No meals logged yet today.</p>';
  } else {
    mealList.innerHTML = data.meals.map((m, i) => `
      <div class="meal-item">
        <div class="meal-info">
          <div class="meal-name">${m.name}</div>
          <div class="meal-grams-row">
            <span style="font-size:13px;color:var(--text-dim);font-weight:500;">${m.grams}g</span>
          </div>
          <div class="meal-macros">
            <div class="macro-chip cal">Cal <span>${Math.round(m.calories)}</span></div>
            <div class="macro-chip">P <span>${Math.round(m.protein)}g</span></div>
            <div class="macro-chip">C <span>${Math.round(m.carbs)}g</span></div>
            <div class="macro-chip">F <span>${Math.round(m.fat)}g</span></div>
            ${m.fiber > 0 ? `<div class="macro-chip fiber">Fiber <span>${Math.round(m.fiber)}g</span></div>` : ''}
          </div>
        </div>
        <div class="meal-item-actions">
          <button class="btn-edit-meal" onclick="openEditMealModal(${i})">Edit</button>
          <button class="btn-remove-meal" onclick="removeMeal(${i})">Remove</button>
        </div>
      </div>`).join('');
  }

  document.getElementById('water-val').textContent  = data.water  || 0;
  document.getElementById('steps-val').textContent  = data.steps  || 0;
  document.getElementById('weight-val').textContent = data.weight ? data.weight + ' kg' : '—';
  document.getElementById('sleep-val').textContent  = data.sleep  ? data.sleep + ' hrs' : '—';

  const stepsEl = document.getElementById('steps-burned');
  if (data.steps && data.steps > 0) {
    stepsEl.textContent = `≈ ${calcStepCalories(data.steps)} kcal`;
  } else {
    stepsEl.textContent = '';
  }

  const extrasEnabled   = getCardEnabled('extras');
  const exerciseEnabled = getCardEnabled('exercise');
  document.getElementById('card-extras').style.display    = extrasEnabled   ? '' : 'none';
  document.getElementById('card-exercise').style.display  = exerciseEnabled ? '' : 'none';
  if (extrasEnabled)   initCardCollapse('extras');
  if (exerciseEnabled) { initCardCollapse('exercise');  renderExerciseCard(); }
  
  const fastingEnabled = getCardEnabled('fasting');
  const foodmodEnabled = getCardEnabled('foodmod');
  const fastEl = document.getElementById('card-fasting');
  const foodEl = document.getElementById('card-foodmod');
  if (fastEl) fastEl.style.display = fastingEnabled ? '' : 'none';
  if (foodEl) foodEl.style.display = foodmodEnabled ? '' : 'none';
  if (fastingEnabled) { initCardCollapse('fasting'); renderFastingCard(); }
  if (foodmodEnabled) { initCardCollapse('foodmod'); renderFoodModCard(); }
}

let mealEditMode = 'grams';
let mealBaseRates = {};

function openEditMealModal(index) {
  const key  = dateStr(currentDate);
  const data = getDayData(key);
  const m    = data.meals[index];
  mealEditMode = 'grams';

  const libFood = foods.find(f => f.name === m.name);
  const baseG = libFood ? (libFood.grams || 100) : m.grams;
  const src   = libFood || m;
  mealBaseRates = {
    calories: src.calories / baseG,
    protein:  src.protein  / baseG,
    carbs:    src.carbs    / baseG,
    fat:      src.fat      / baseG,
    fiber:    (src.fiber || 0) / baseG,
  };

  document.getElementById('edit-meal-index').value    = index;
  document.getElementById('edit-meal-name').value     = m.name;
  document.getElementById('edit-meal-grams').value    = m.grams;
  document.getElementById('edit-meal-calories').value = Math.round(m.calories);
  document.getElementById('edit-meal-protein').value  = parseFloat(m.protein.toFixed(1));
  document.getElementById('edit-meal-carbs').value    = parseFloat(m.carbs.toFixed(1));
  document.getElementById('edit-meal-fat').value      = parseFloat(m.fat.toFixed(1));
  document.getElementById('edit-meal-fiber').value    = parseFloat((m.fiber||0).toFixed(1));
  setMealEditMode('grams');
  document.getElementById('edit-meal-overlay').classList.remove('hidden');
}

function setMealEditMode(mode) {
  mealEditMode = mode;
  document.getElementById('meal-mode-grams').classList.toggle('active',  mode === 'grams');
  document.getElementById('meal-mode-manual').classList.toggle('active', mode === 'manual');
  const macroFields = ['calories','protein','carbs','fat','fiber'];
  macroFields.forEach(id => {
    const field = document.getElementById('meal-field-' + id);
    const input = document.getElementById('edit-meal-' + id);
    if (mode === 'grams') {
      field.classList.add('edit-field-readonly');
      input.readOnly = true;
    } else {
      field.classList.remove('edit-field-readonly');
      input.readOnly = false;
    }
  });
  if (mode === 'grams') onMealGramsInput();
}

function onMealGramsInput() {
  if (mealEditMode !== 'grams') return;
  const g = parseFloat(document.getElementById('edit-meal-grams').value) || 0;
  if (g <= 0) return;
  document.getElementById('edit-meal-calories').value = (mealBaseRates.calories * g).toFixed(1);
  document.getElementById('edit-meal-protein').value  = (mealBaseRates.protein  * g).toFixed(1);
  document.getElementById('edit-meal-carbs').value    = (mealBaseRates.carbs    * g).toFixed(1);
  document.getElementById('edit-meal-fat').value      = (mealBaseRates.fat      * g).toFixed(1);
  document.getElementById('edit-meal-fiber').value    = (mealBaseRates.fiber    * g).toFixed(1);
}

function saveEditedMeal() {
  const index = parseInt(document.getElementById('edit-meal-index').value);
  const key   = dateStr(currentDate);
  const data  = getDayData(key);
  data.meals[index] = {
    name:     data.meals[index].name,
    grams:    parseFloat(document.getElementById('edit-meal-grams').value)    || data.meals[index].grams,
    calories: parseFloat(document.getElementById('edit-meal-calories').value) || 0,
    protein:  parseFloat(document.getElementById('edit-meal-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('edit-meal-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('edit-meal-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('edit-meal-fiber').value)    || 0,
  };
  saveDayData(key, data);
  renderDailyLog();
  closeEditMealModalDirect();
}

function closeEditMealModal(e) { if (e.target===document.getElementById('edit-meal-overlay')) closeEditMealModalDirect(); }
function closeEditMealModalDirect() { document.getElementById('edit-meal-overlay').classList.add('hidden'); }

async function editCalorieGoal() {
  const current = localStorage.getItem('eatshimo_cal_target') || '';
  const val = await uiPrompt('Enter your daily calorie target (kcal):', current);
  if (val === null) return;
  if (!isNaN(val) && parseInt(val) > 0) {
    localStorage.setItem('eatshimo_cal_target', parseInt(val));
    
    const profGoalInput = document.getElementById('prof-calorie-goal');
    if (profGoalInput) profGoalInput.value = parseInt(val);
    updateProfileCalorieGoalDisplay();
    renderDailyLog();
  } else if (val === '' || parseInt(val) <= 0) {
    if (await uiConfirm('Remove calorie target?')) {
      localStorage.removeItem('eatshimo_cal_target');
      const profGoalInput = document.getElementById('prof-calorie-goal');
      if (profGoalInput) profGoalInput.value = '';
      updateProfileCalorieGoalDisplay();
      renderDailyLog();
    }
  }
}

function saveCalorieGoalFromProfile() {
  const val = parseInt(document.getElementById('prof-calorie-goal').value);
  if (!isNaN(val) && val > 0) {
    localStorage.setItem('eatshimo_cal_target', val);
  } else {
    localStorage.removeItem('eatshimo_cal_target');
  }
  updateProfileCalorieGoalDisplay();
  
  renderDailyLog();
  uiAlert('Calorie goal updated!');
}

function updateProfileCalorieGoalDisplay() {
  const el = document.getElementById('prof-calorie-goal-display');
  if (!el) return;
  const current = localStorage.getItem('eatshimo_cal_target');
  el.textContent = current ? `Current goal: ${current} kcal/day` : 'No calorie goal set.';
}

function removeMeal(index) {
  const key = dateStr(currentDate), data = getDayData(key);
  data.meals.splice(index, 1);
  cleanupDay(key, data);
  renderDailyLog();
}

function logWater() {
  const val = parseFloat(document.getElementById('water-input').value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.water = (data.water || 0) + val;
  saveDayData(key, data);
  document.getElementById('water-input').value = '';
  renderDailyLog();
}

function logSteps() {
  const val = parseInt(document.getElementById('steps-input').value);
  if (!val || val < 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.steps = val;
  saveDayData(key, data);
  document.getElementById('steps-input').value = '';
  renderDailyLog();
}

function logWeight() {
  const val = parseFloat(document.getElementById('weight-input').value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.weight = val;
  saveDayData(key, data);
  document.getElementById('weight-input').value = '';
  renderDailyLog();
}

async function clearWater()  { if (!(await uiConfirm('Clear water for this day?')))  return; const key=dateStr(currentDate),data=getDayData(key); data.water=0;     cleanupDay(key,data); renderDailyLog(); }
async function clearSteps()  { if (!(await uiConfirm('Clear steps for this day?')))  return; const key=dateStr(currentDate),data=getDayData(key); data.steps=0;     cleanupDay(key,data); renderDailyLog(); }
async function clearWeight() { if (!(await uiConfirm('Clear weight for this day?'))) return; const key=dateStr(currentDate),data=getDayData(key); data.weight=null; cleanupDay(key,data); renderDailyLog(); }
async function clearSleep()  { if (!(await uiConfirm('Clear sleep for this day?')))  return; const key=dateStr(currentDate),data=getDayData(key); data.sleep=null;  cleanupDay(key,data); renderDailyLog(); }

function logSleep() {
  const val = parseFloat(document.getElementById('sleep-input').value);
  if (!val || val <= 0 || val > 24) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.sleep = val;
  saveDayData(key, data);
  document.getElementById('sleep-input').value = '';
  renderDailyLog();
}

let selectedFoodIndex = null;

function openLogModal() {
  selectedFoodIndex = null;
  document.getElementById('log-grams').value = '';
  document.getElementById('macro-preview').innerHTML = 'Pick a food to see scaled macros';
  document.getElementById('log-search').value = '';
  renderLogFoodList('');
  document.getElementById('log-modal-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('log-search').focus(), 100);
}

function renderLogFoodList(query) {
  const list = document.getElementById('food-pick-list');
  const sorted = [...foods].sort((a,b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-msg" style="padding:16px 0;">No foods match your search.</p>';
    return;
  }
  
  list.innerHTML = filtered.map(f => {
    const origIdx = foods.findIndex(food => food.name === f.name);
    return `
      <div class="food-pick-item" id="pick-${origIdx}" onclick="selectFood(${origIdx})">
        <div class="pick-name">${f.name}</div>
        <div class="pick-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g</div>
      </div>`;
  }).join('');
}

function selectFood(index) {
  selectedFoodIndex = index;
  document.querySelectorAll('.food-pick-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('pick-' + index);
  if (el) el.classList.add('selected');
  document.getElementById('log-grams').value = foods[index].grams;
  updateMacroPreview();
}

function updateMacroPreview() {
  if (selectedFoodIndex === null) return;
  const f = foods[selectedFoodIndex];
  const grams = parseFloat(document.getElementById('log-grams').value) || 0;
  const r = grams / (f.grams || 100);
  const fiber = ((f.fiber || 0) * r).toFixed(1);
  document.getElementById('macro-preview').innerHTML =
    `Cal <span>${Math.round(f.calories*r)}</span> &nbsp; P <span>${(f.protein*r).toFixed(1)}g</span> &nbsp; C <span>${(f.carbs*r).toFixed(1)}g</span> &nbsp; F <span>${(f.fat*r).toFixed(1)}g</span>${parseFloat(fiber)>0?` &nbsp; Fiber <span>${fiber}g</span>`:''}`;
}

function confirmLogMeal() {
  if (selectedFoodIndex === null) { uiAlert('Please pick a food first.'); return; }
  const grams = parseFloat(document.getElementById('log-grams').value);
  if (!grams || grams <= 0) { uiAlert('Please enter how many grams you ate.'); return; }
  const f = foods[selectedFoodIndex], r = grams / (f.grams || 100);
  const entry = { name: f.name, grams, calories: f.calories*r, protein: f.protein*r, carbs: f.carbs*r, fat: f.fat*r, fiber: (f.fiber||0)*r };
  const key = dateStr(currentDate), data = getDayData(key);
  data.meals.push(entry);
  saveDayData(key, data);
  checkFoodModerator(f.name);
  renderDailyLog();
  closeLogModalDirect();
}

function closeLogModal(e)  { if (e.target===document.getElementById('log-modal-overlay')) closeLogModalDirect(); }
function closeLogModalDirect() { document.getElementById('log-modal-overlay').classList.add('hidden'); }

let calViewDate = new Date();

function openCalendar() {
  calViewDate = new Date(currentDate);
  document.getElementById('cal-overlay').classList.remove('hidden');
  renderCalendar();
}

function closeCalendar(e) { if (e.target===document.getElementById('cal-overlay')) closeCalendarDirect(); }
function closeCalendarDirect() { document.getElementById('cal-overlay').classList.add('hidden'); }
function calPrevMonth() { calViewDate.setMonth(calViewDate.getMonth()-1); renderCalendar(); }
function calNextMonth() { calViewDate.setMonth(calViewDate.getMonth()+1); renderCalendar(); }

function renderCalendar() {
  const year=calViewDate.getFullYear(), month=calViewDate.getMonth();
  document.getElementById('cal-month-label').textContent = new Date(year,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const firstDay=new Date(year,month,1).getDay(), days=new Date(year,month+1,0).getDate();
  const todayStr=dateStr(nowInTZ()), selectedStr=dateStr(currentDate);
  let html='';
  for(let i=0;i<firstDay;i++) html+='<span class="cal-empty"></span>';
  for(let d=1;d<=days;d++){
    const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasData=localStorage.getItem(getDayKey(ds))!==null, isFuture=ds>todayStr;
    let cls='cal-day';
    if(ds===selectedStr) cls+=' selected';
    else if(ds===todayStr) cls+=' today';
    if(isFuture) cls+=' future';
    if(hasData&&ds!==selectedStr) cls+=' has-data';
    html+=`<span class="${cls}" onclick="pickCalDay('${ds}')">${d}</span>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}

function pickCalDay(ds) {
  const p=ds.split('-');
  currentDate=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
  closeCalendarDirect();
  renderDailyLog();
}

function loadProfile() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  if (p.gender)       document.getElementById('prof-gender').value       = p.gender;
  if (p.age)          document.getElementById('prof-age').value          = p.age;
  if (p.height)       document.getElementById('prof-height').value       = p.height;
  if (p.weight)       document.getElementById('prof-weight').value       = p.weight;
  if (p.activity)     document.getElementById('prof-activity').value     = p.activity;
  if (p.timezone)     document.getElementById('prof-timezone').value     = p.timezone;
  else                document.getElementById('prof-timezone').value     = 'Asia/Manila';
  if (p.proteinGoal)  document.getElementById('prof-protein-goal').value = p.proteinGoal;
  if (p.carbsGoal)    document.getElementById('prof-carbs-goal').value   = p.carbsGoal;
  if (p.fatGoal)      document.getElementById('prof-fat-goal').value     = p.fatGoal;
  
  const calTarget = localStorage.getItem('eatshimo_cal_target');
  if (calTarget) document.getElementById('prof-calorie-goal').value = calTarget;
  updateProfileCalorieGoalDisplay();
  if (p.gender && p.age && p.height && p.weight) calcTDEE(p);
}

function saveProfile() {
  const p = {
    gender:      document.getElementById('prof-gender').value,
    age:         parseFloat(document.getElementById('prof-age').value)          || 0,
    height:      parseFloat(document.getElementById('prof-height').value)       || 0,
    weight:      parseFloat(document.getElementById('prof-weight').value)       || 0,
    activity:    parseFloat(document.getElementById('prof-activity').value)     || 1.2,
    timezone:    document.getElementById('prof-timezone').value || 'Asia/Manila',
    proteinGoal: parseFloat(document.getElementById('prof-protein-goal').value) || 0,
    carbsGoal:   parseFloat(document.getElementById('prof-carbs-goal').value)   || 0,
    fatGoal:     parseFloat(document.getElementById('prof-fat-goal').value)     || 0,
  };
  localStorage.setItem('eatshimo_profile', JSON.stringify(p));
  if (p.gender && p.age && p.height && p.weight) calcTDEE(p);
  uiAlert('Profile saved!');
}

function calcTDEE(p) {
  let bmr = p.gender === 'male' ? 10*p.weight + 6.25*p.height - 5*p.age + 5 : 10*p.weight + 6.25*p.height - 5*p.age - 161;
  const tdee = Math.round(bmr * p.activity);
  document.getElementById('tdee-loss').textContent     = tdee - 500;
  document.getElementById('tdee-maintain').textContent = tdee;
  document.getElementById('tdee-gain').textContent     = tdee + 500;
  document.getElementById('tdee-card').style.display   = 'block';
  initCardCollapse('tdee');
  const current = localStorage.getItem('eatshimo_cal_target');
  document.getElementById('tdee-current-goal').textContent = current ? `Your current goal: ${current} kcal/day` : 'No calorie goal set yet.';
}

function setTDEEGoal(type) {
  const vals = { loss: parseInt(document.getElementById('tdee-loss').textContent), maintain: parseInt(document.getElementById('tdee-maintain').textContent), gain: parseInt(document.getElementById('tdee-gain').textContent) };
  const val = vals[type];
  if (!val || isNaN(val)) return;
  localStorage.setItem('eatshimo_cal_target', val);
  document.getElementById('tdee-current-goal').textContent = `Your current goal: ${val} kcal/day`;
  const profGoalInput = document.getElementById('prof-calorie-goal');
  if (profGoalInput) profGoalInput.value = val;
  updateProfileCalorieGoalDisplay();
  uiAlert(`Calorie goal set to ${val} kcal/day!`);
}

let chartPeriod = 'daily';
let chartDateFrom = null;  
let chartDateTo   = null;
let macroView = 'stack';   
let charts = {};

const CHART_DEFAULTS = { macros:true, burnt:false, weight:true, water:false, steps:false, sleep:false };
const CHART_SETTINGS_VERSION = 2;
function getChartSettings() {
  const stored = JSON.parse(localStorage.getItem('eatshimo_chart_settings') || 'null');
  
  if (!stored || stored._v !== CHART_SETTINGS_VERSION) {
    const fresh = { ...CHART_DEFAULTS, _v: CHART_SETTINGS_VERSION };
    localStorage.setItem('eatshimo_chart_settings', JSON.stringify(fresh));
    return fresh;
  }
  return stored;
}
function saveChartSettings() {
  const keys = ['macros','burnt','weight','water','steps','sleep'];
  const settings = { _v: CHART_SETTINGS_VERSION };
  keys.forEach(k => {
    const el = document.getElementById('cs-toggle-' + k);
    settings[k] = el ? el.checked : true;
  });
  localStorage.setItem('eatshimo_chart_settings', JSON.stringify(settings));
  applyChartVisibility(settings);
  renderCharts();
}
function applyChartVisibility(settings) {
  const map = { macros:'cs-macros', burnt:'cs-burnt', weight:'cs-weight', water:'cs-water', steps:'cs-steps', sleep:'cs-sleep' };
  Object.entries(map).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (settings[k] !== false) ? '' : 'none';
  });
}
function loadChartSettingsUI() {
  const settings = getChartSettings();
  Object.keys(settings).filter(k => k !== '_v').forEach(k => {
    const el = document.getElementById('cs-toggle-' + k);
    if (el) el.checked = settings[k] !== false;
  });
  applyChartVisibility(settings);
}
function openChartSettings() {
  loadChartSettingsUI();
  document.getElementById('chart-settings-overlay').classList.remove('hidden');
}

function openFastingSettings() {
  const cfg = getFastingConfig();
  
  document.querySelectorAll('#fasting-settings-overlay .fast-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === cfg.preset);
  });
  const customRow = document.getElementById('fasting-custom-row');
  if (customRow) customRow.style.display = cfg.preset === 'custom' ? '' : 'none';
  const fhEl = document.getElementById('fast-hours');
  const ehEl = document.getElementById('eat-hours');
  if (fhEl) fhEl.value = cfg.fastingHours;
  if (ehEl) ehEl.value = cfg.eatingHours;
  const stEl = document.getElementById('fast-start-time');
  if (stEl) stEl.value = `${String(cfg.startHour||20).padStart(2,'0')}:${String(cfg.startMin||0).padStart(2,'0')}`;
  document.getElementById('fasting-settings-overlay').classList.remove('hidden');
}
function openFoodModSettings() {
  const settingEl = document.getElementById('foodmod-setting');
  if (settingEl) settingEl.value = getCooldownSetting();
  document.getElementById('foodmod-settings-overlay').classList.remove('hidden');
}

function initPeriodTabs() {
  const tabs = document.querySelectorAll('#chart-period-tabs .period-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const period = tab.dataset.period;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      chartPeriod = period;
      const customRange = document.getElementById('chart-custom-range');
      if (customRange) customRange.style.display = period === 'custom' ? '' : 'none';
      if (period !== 'custom') renderCharts();
    });
  });
}

function applyCustomRange() {
  chartDateFrom = document.getElementById('chart-date-from').value;
  chartDateTo   = document.getElementById('chart-date-to').value;
  if (!chartDateFrom || !chartDateTo || chartDateFrom > chartDateTo) return;
  
  const fromMs = new Date(chartDateFrom + 'T00:00:00').getTime();
  const toMs   = new Date(chartDateTo   + 'T00:00:00').getTime();
  const days   = Math.ceil((toMs - fromMs) / 864e5);
  const tabs = document.querySelectorAll('#chart-period-tabs .period-tab');
  tabs.forEach(t => {
    const p = t.dataset.period;
    if (p === 'daily'   && days > 90) { t.disabled = true; t.style.opacity = '0.4'; }
    else if (p === 'weekly' && days > 730) { t.disabled = true; t.style.opacity = '0.4'; }
    else { t.disabled = false; t.style.opacity = ''; }
  });
  renderCharts();
}

function setMacroView(view) {
  macroView = view;
  document.getElementById('mvt-stack').classList.toggle('active', view === 'stack');
  document.getElementById('mvt-pie').classList.toggle('active', view === 'pie');
  renderCharts();
}

function calcDayBMR(ds) {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  if (!p.weight || !p.height || !p.age) return 0;
  const bmr = p.gender === 'female'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
    : 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
  return Math.round(bmr);
}

function calcDayExerciseCals(ds) {
  const data = getDayData(ds);
  const lib  = getExLib();
  const exData = data.exercises || {};
  let total = 0;
  Object.entries(exData).forEach(([exId, exLog]) => {
    const ex = lib.find(e => e.id === exId);
    if (!ex) return;
    const sets = exLog.sets || [];
    const totalUnits = sets.reduce((a, b) => a + b, 0);
    if (totalUnits > 0) total += calcExCals(ex, totalUnits);
  });
  return total;
}

function getDatesInRange() {
  const today = nowInTZ();
  const result = [];
  if (chartPeriod === 'custom' && chartDateFrom && chartDateTo) {
    const from = new Date(chartDateFrom + 'T00:00:00');
    const to   = new Date(chartDateTo   + 'T00:00:00');
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1))
      result.push(dateStr(new Date(d)));
    return result;
  }
  const days = chartPeriod === 'daily' ? 30 : chartPeriod === 'weekly' ? 84 : 365;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    result.push(dateStr(d));
  }
  return result;
}

function getChartData() {
  const dates = getDatesInRange();
  const raw = dates.map(ds => {
    const data = getDayData(ds);
    const stepCals = calcStepCalories(data.steps || 0);
    const exCals   = calcDayExerciseCals(ds);
    const consumed = Math.round(data.meals.reduce((s, m) => s + m.calories, 0));
    const hasActivity = data.meals.length > 0 || exCals > 0;
    const bmr = hasActivity ? calcDayBMR(ds) : null;
    return {
      ds,
      label:    new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }),
      calories: consumed,
      protein:  Math.round(data.meals.reduce((s, m) => s + m.protein, 0)),
      carbs:    Math.round(data.meals.reduce((s, m) => s + m.carbs,   0)),
      fat:      Math.round(data.meals.reduce((s, m) => s + m.fat,     0)),
      weight:   data.weight || null,
      water:    data.water  || 0,
      steps:    data.steps  || 0,
      sleep:    data.sleep  || null,
      stepCals: hasActivity ? stepCals : null,
      exCals:   hasActivity ? exCals   : null,
      bmr,
      netCals:  hasActivity ? Math.round(consumed - stepCals - exCals - bmr) : null,
    };
  });

  if (chartPeriod === 'daily' || (chartPeriod === 'custom' && getDatesInRange().length <= 90)) {
    return raw.map(r => ({ ...r }));
  }

  const byKey = {};
  raw.forEach(r => {
    const d = new Date(r.ds + 'T00:00:00');
    let key, label;
    if (chartPeriod === 'monthly' || (chartPeriod === 'custom' && getDatesInRange().length > 90)) {
      key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      label = d.toLocaleDateString('en-US', { month:'short', year:'numeric' });
    } else {
      const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay());
      key   = dateStr(wStart);
      label = wStart.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    }
    if (!byKey[key]) byKey[key] = { label, items: [] };
    byKey[key].items.push(r);
  });

  return Object.values(byKey).map(({ label, items }) => {
    const n = items.length || 1;
    const avg = f => Math.round(items.reduce((s, i) => s + (f(i)||0), 0) / n);
    const avgF = f => { const v = items.reduce((s, i) => s + (f(i)||0), 0); return v ? parseFloat((v/n).toFixed(1)) : null; };
    const avgSkipNull = f => {
      const vals = items.map(f).filter(v => v !== null && v !== undefined);
      return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0) / vals.length) : null;
    };
    const wts = items.filter(i => i.weight).map(i => i.weight);
    return {
      label,
      calories: avg(i => i.calories),
      protein:  avg(i => i.protein),
      carbs:    avg(i => i.carbs),
      fat:      avg(i => i.fat),
      water:    avg(i => i.water),
      steps:    avg(i => i.steps),
      sleep:    avgF(i => i.sleep),
      weight:   wts.length ? parseFloat((wts.reduce((a,b)=>a+b,0)/wts.length).toFixed(1)) : null,
      stepCals: avgSkipNull(i => i.stepCals),
      exCals:   avgSkipNull(i => i.exCals),
      bmr:      avgSkipNull(i => i.bmr),
      netCals:  avgSkipNull(i => i.netCals),
    };
  });
}

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend:{display:false}, tooltip:{mode:'index',intersect:false,backgroundColor:'#23272f',titleColor:'#f0f1f4',bodyColor:'#9aa0b4',borderColor:'#3a3f4d',borderWidth:1} },
  scales: { x:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{font:{size:11,family:'Inter'},color:(document.documentElement.classList.contains('neo-dark')?'#9b9b9f':'#737373'),maxRotation:45,maxTicksLimit:12}}, y:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{font:{size:11,family:'Inter'},color:(document.documentElement.classList.contains('neo-dark')?'#9b9b9f':'#737373')},beginAtZero:true} }
};

function chartOpts() {
  const o = JSON.parse(JSON.stringify(CHART_OPTS));
  const dk = document.documentElement.classList.contains('neo-dark');
  ['x','y'].forEach(a => { o.scales[a].ticks.color = dk ? '#9b9b9f' : '#737373'; o.scales[a].grid.color = dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; });
  return o;
}
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function makeBarChart(id, labels, datasets, legendOn) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const opts = chartOpts();
  opts.plugins.legend.display = !!legendOn;
  if (legendOn) opts.plugins.legend.labels = { font:{size:11,family:'Inter'}, color:(document.documentElement.classList.contains('neo-dark')?'#9b9b9f':'#737373'), boxWidth:12 };
  charts[id] = new Chart(ctx, { type:'bar', data:{ labels, datasets }, options:opts });
}

function makeLineChart(id, labels, color, values) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const opts = chartOpts();
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data:values, borderColor:color, backgroundColor:color+'22', borderWidth:2.5, pointRadius:3, tension:0.35, fill:true, spanGaps:true }] },
    options: opts
  });
}

function makePieChart(id, labels, values, colors) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const total = values.reduce((a, b) => a + b, 0);
  const sliceLabelPlugin = {
    id: 'sliceLabelPlugin_' + id,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      ctx.save();
      ctx.font = '600 11px Inter';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      meta.data.forEach((arc, i) => {
        const val = values[i];
        if (!val || total <= 0) return;
        const pct = Math.round((val / total) * 100);
        if (pct < 5) return; 
        const pos = arc.tooltipPosition();
        ctx.fillText(`${pct}%`, pos.x, pos.y);
      });
      ctx.restore();
    }
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { font:{size:11,family:'Inter'}, color:(document.documentElement.classList.contains('neo-dark')?'#9b9b9f':'#737373'), boxWidth:12,
          generateLabels: chart => {
            const data = chart.data;
            return data.labels.map((label, i) => {
              const val = data.datasets[0].data[i];
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return { text: `${label} ${pct}%`, fillStyle: colors[i], strokeStyle: colors[i], lineWidth: 0, index: i };
            });
          }
        }
      },
      tooltip: {
        backgroundColor:'#23272f', titleColor:'#f0f1f4', bodyColor:'#9aa0b4',
        callbacks: {
          label: ctx => {
            const val = ctx.parsed;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label}: ${val}g (${pct}%)`;
          }
        }
      }
    }
  };
  charts[id] = new Chart(ctx, { type:'pie', data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderWidth:2 }] }, options:opts, plugins:[sliceLabelPlugin] });
}

function getAccentColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#171717';
}

function renderCharts() {
  const data = getChartData();
  if (!data || data.length === 0) return;

  const labels   = data.map(d => d.label);
  const accent   = getAccentColor();
  const settings = getChartSettings();
  applyChartVisibility(settings);

  makeBarChart('chart-calories', labels, [{
    label:'Calories', data:data.map(d=>d.calories), backgroundColor:accent+'cc', borderColor:accent, borderWidth:1, borderRadius:3
  }], false);

  if (settings.macros !== false) {
    if (macroView === 'pie') {
      const totP = data.reduce((s,d)=>s+d.protein,0);
      const totC = data.reduce((s,d)=>s+d.carbs,0);
      const totF = data.reduce((s,d)=>s+d.fat,0);
      
      const wrap = document.getElementById('macro-chart-wrap');
      if (wrap) wrap.style.height = '220px';
      makePieChart('chart-macros', ['Protein','Carbs','Fat'], [totP,totC,totF], ['#c0523a','#7b8fb0','#4a8c72']);
    } else {
      const wrap = document.getElementById('macro-chart-wrap');
      if (wrap) wrap.style.height = '';
      makeBarChart('chart-macros', labels, [
        { label:'Protein', data:data.map(d=>d.protein), backgroundColor:'#c0523acc', borderWidth:0, borderRadius:2 },
        { label:'Carbs',   data:data.map(d=>d.carbs),   backgroundColor:'#7b8fb0cc', borderWidth:0, borderRadius:2 },
        { label:'Fat',     data:data.map(d=>d.fat),     backgroundColor:'#4a8c72cc', borderWidth:0, borderRadius:2 },
      ], true);
      
      if (charts['chart-macros']) {
        charts['chart-macros'].options.scales.x.stacked = true;
        charts['chart-macros'].options.scales.y.stacked = true;
        charts['chart-macros'].update();
      }
    }
  }

  if (settings.burnt !== false) {
    const filter = document.getElementById('burnt-filter')?.value || 'all';
    let bDatasets;
    if (filter === 'steps') {
      bDatasets = [{ label:'Steps', data:data.map(d=>d.stepCals), backgroundColor:'#4a8c72cc', borderWidth:0, borderRadius:2 }];
    } else if (filter === 'bmr') {
      bDatasets = [{ label:'BMR', data:data.map(d=>d.bmr), backgroundColor:'#7b8fb0cc', borderWidth:0, borderRadius:2 }];
    } else if (filter === 'exercise') {
      bDatasets = [{ label:'Exercise', data:data.map(d=>d.exCals), backgroundColor:'#c0523acc', borderWidth:0, borderRadius:2 }];
    } else if (filter === 'net') {
      bDatasets = [{
        label: 'Net (Consumed − Burnt)',
        data: data.map(d => d.netCals),
        backgroundColor: data.map(d => d.netCals <= 0 ? '#4a8c72cc' : '#c0523acc'),
        borderWidth: 0, borderRadius: 2
      }];
    } else {
      bDatasets = [
        { label:'Steps',    data:data.map(d=>d.stepCals), backgroundColor:'#4a8c72cc', borderWidth:0, borderRadius:2 },
        { label:'BMR',      data:data.map(d=>d.bmr),      backgroundColor:'#7b8fb0cc', borderWidth:0, borderRadius:2 },
        { label:'Exercise', data:data.map(d=>d.exCals),   backgroundColor:'#c0523acc', borderWidth:0, borderRadius:2 },
      ];
    }
    makeBarChart('chart-burnt', labels, bDatasets, filter === 'all');
    if (filter === 'all' && charts['chart-burnt']) {
      charts['chart-burnt'].options.scales.x.stacked = true;
      charts['chart-burnt'].options.scales.y.stacked = true;
      charts['chart-burnt'].update();
    }
  }

  if (settings.weight !== false)
    makeLineChart('chart-weight', labels, accent, data.map(d=>d.weight));

  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  if (settings.water !== false) {
    let recText = '';
    if (p.weight) {
      const rec = Math.round(p.weight * 35);
      recText = `Recommended: <strong>${rec} ml/day</strong> based on your weight (35 ml/kg).`;
    }
    const recEl = document.getElementById('rec-water');
    if (recEl) recEl.innerHTML = recText;
    makeBarChart('chart-water', labels, [{ label:'Water (ml)', data:data.map(d=>d.water), backgroundColor:'#7b8fb0cc', borderWidth:0, borderRadius:2 }], false);
  }

  if (settings.steps !== false)
    makeBarChart('chart-steps', labels, [{ label:'Steps', data:data.map(d=>d.steps), backgroundColor:'#4a8c72cc', borderWidth:0, borderRadius:2 }], false);

  if (settings.sleep !== false) {
    let sleepRec = '';
    if (p.age) {
      const hrs = p.age < 13 ? 10 : p.age < 18 ? 9 : p.age < 65 ? 8 : 7;
      sleepRec = `Recommended: <strong>${hrs} hrs/night</strong> for your age group.`;
    }
    const recSlEl = document.getElementById('rec-sleep');
    if (recSlEl) recSlEl.innerHTML = sleepRec;
    makeBarChart('chart-sleep', labels, [{ label:'Sleep (hrs)', data:data.map(d=>d.sleep), backgroundColor:'#9b7fd4cc', borderWidth:0, borderRadius:2 }], false);
  }
}

function exportCSV() {
  const allKeys = getAllDayKeys();
  const rows = [];

  const prof = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  const calTarget = localStorage.getItem('eatshimo_cal_target') || '';
  rows.push(['=== PROFILE ===']);
  rows.push(['Gender','Age','Height (cm)','Weight (kg)','Activity','Calorie Target','Protein Goal (g)','Carbs Goal (g)','Fat Goal (g)']);
  rows.push([
    prof.gender || '', prof.age || '', prof.height || '', prof.weight || '',
    prof.activity || '', calTarget,
    prof.proteinGoal || '', prof.carbsGoal || '', prof.fatGoal || ''
  ]);
  rows.push(['']);

  rows.push(['=== DAILY LOGS ===']);
  rows.push(['Date','Total Calories','Protein (g)','Carbs (g)','Fat (g)','Fiber (g)','Water (ml)','Steps','Weight (kg)','Sleep (hrs)','Meal Name','Meal Grams','Meal Calories','Meal Protein','Meal Carbs','Meal Fat','Meal Fiber']);
  allKeys.forEach(ds => {
    const d = getDayData(ds);
    const totalCal   = d.meals.reduce((s,m)=>s+m.calories,0);
    const totalP     = d.meals.reduce((s,m)=>s+m.protein,0);
    const totalC     = d.meals.reduce((s,m)=>s+m.carbs,0);
    const totalF     = d.meals.reduce((s,m)=>s+m.fat,0);
    const totalFiber = d.meals.reduce((s,m)=>s+(m.fiber||0),0);
    if (d.meals.length === 0) {
      rows.push([ds, 0, 0, 0, 0, 0, d.water||0, d.steps||0, d.weight||'', d.sleep||'', '', '', '', '', '', '', '']);
    } else {
      d.meals.forEach((m, i) => {
        rows.push([
          i === 0 ? ds : '',
          i === 0 ? Math.round(totalCal) : '',
          i === 0 ? Math.round(totalP)   : '',
          i === 0 ? Math.round(totalC)   : '',
          i === 0 ? Math.round(totalF)   : '',
          i === 0 ? Math.round(totalFiber): '',
          i === 0 ? (d.water||0)         : '',
          i === 0 ? (d.steps||0)         : '',
          i === 0 ? (d.weight||'')       : '',
          i === 0 ? (d.sleep||'')        : '',
          `"${m.name}"`, m.grams,
          Math.round(m.calories), Math.round(m.protein),
          Math.round(m.carbs),    Math.round(m.fat),
          Math.round(m.fiber||0)
        ]);
      });
    }
  });
  rows.push(['']);

  rows.push(['=== FOOD LIBRARY ===']);
  rows.push(['Name','Serving (g)','Calories','Protein (g)','Carbs (g)','Fat (g)','Fiber (g)']);
  [...foods].sort((a,b)=>a.name.localeCompare(b.name)).forEach(f => {
    rows.push([`"${f.name}"`, f.grams, f.calories, f.protein, f.carbs, f.fat, f.fiber||0]);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  neoSave(`eatshimo-export-${dateStr(new Date())}.csv`, csv, 'text/csv');
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('import-status');
  status.textContent = 'Importing...';
  status.style.color = 'var(--text-dim)';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
      let mode = null;
      let importedDays = 0, importedFoods = 0;
      
      const dayMeals = {}; 

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('=== PROFILE ==='))      { mode = 'profile'; continue; }
        if (line.startsWith('=== DAILY LOGS ==='))   { mode = 'logs';    continue; }
        if (line.startsWith('=== FOOD LIBRARY ===')) { mode = 'foods';   continue; }

        if (line.startsWith('Gender,') || line.startsWith('Date,') || line.startsWith('Name,')) continue;

        if (mode === 'profile') {
          const cols = parseCSVLine(line);
          const p = {
            gender:      cols[0] || '',
            age:         parseFloat(cols[1]) || 0,
            height:      parseFloat(cols[2]) || 0,
            weight:      parseFloat(cols[3]) || 0,
            activity:    parseFloat(cols[4]) || 1.2,
            proteinGoal: parseFloat(cols[6]) || 0,
            carbsGoal:   parseFloat(cols[7]) || 0,
            fatGoal:     parseFloat(cols[8]) || 0,
          };
          localStorage.setItem('eatshimo_profile', JSON.stringify(p));
          if (cols[5]) localStorage.setItem('eatshimo_cal_target', cols[5]);
        }

        if (mode === 'logs') {
          const cols = parseCSVLine(line);
          
          const ds = cols[0]?.trim();
          if (ds && /^\d{4}-\d{2}-\d{2}$/.test(ds)) {
            if (!dayMeals[ds]) {
              dayMeals[ds] = {
                water:  parseFloat(cols[6]) || 0,
                steps:  parseInt(cols[7])   || 0,
                weight: cols[8] && cols[8].trim() ? parseFloat(cols[8]) : null,
                sleep:  cols[9] && cols[9].trim() ? parseFloat(cols[9]) : null,
                meals:  []
              };
            }
            
            const mealName = cols[10]?.replace(/"/g,'').trim();
            if (mealName) {
              dayMeals[ds].meals.push({
                name:     mealName,
                grams:    parseFloat(cols[11]) || 100,
                calories: parseFloat(cols[12]) || 0,
                protein:  parseFloat(cols[13]) || 0,
                carbs:    parseFloat(cols[14]) || 0,
                fat:      parseFloat(cols[15]) || 0,
                fiber:    parseFloat(cols[16]) || 0,
              });
            }
          } else if (ds === '' && cols[10]) {
            
            const lastDs = Object.keys(dayMeals).pop();
            if (lastDs) {
              const mealName = cols[10].replace(/"/g,'').trim();
              if (mealName) {
                dayMeals[lastDs].meals.push({
                  name:     mealName,
                  grams:    parseFloat(cols[11]) || 100,
                  calories: parseFloat(cols[12]) || 0,
                  protein:  parseFloat(cols[13]) || 0,
                  carbs:    parseFloat(cols[14]) || 0,
                  fat:      parseFloat(cols[15]) || 0,
                  fiber:    parseFloat(cols[16]) || 0,
                });
              }
            }
          }
        }

        if (mode === 'foods') {
          const cols = parseCSVLine(line);
          if (cols.length < 4) continue;
          const name = cols[0].replace(/"/g,'').trim();
          if (!name) continue;
          const exists = foods.some(f => f.name.toLowerCase() === name.toLowerCase());
          if (!exists) {
            foods.push({
              name,
              grams:    parseFloat(cols[1]) || 100,
              calories: parseFloat(cols[2]) || 0,
              protein:  parseFloat(cols[3]) || 0,
              carbs:    parseFloat(cols[4]) || 0,
              fat:      parseFloat(cols[5]) || 0,
              fiber:    parseFloat(cols[6]) || 0,
            });
            importedFoods++;
          }
        }
      }

      Object.keys(dayMeals).forEach(ds => {
        const incoming = dayMeals[ds];
        const existing = getDayData(ds);
        
        if (incoming.meals.length > 0) existing.meals = incoming.meals;
        if (incoming.water)  existing.water  = incoming.water;
        if (incoming.steps)  existing.steps  = incoming.steps;
        if (incoming.weight) existing.weight = incoming.weight;
        if (incoming.sleep)  existing.sleep  = incoming.sleep;
        saveDayData(ds, existing);
        importedDays++;
      });

      saveFoodsToDisk();
      renderLibrary();
      renderDailyLog();
      status.textContent = `Imported ${importedDays} day(s) and ${importedFoods} food(s) successfully.`;
      status.style.color = '#2a8a3e';
    } catch(err) {
      console.error(err);
      status.textContent = 'Import failed. Make sure it is a valid Eatshimo CSV file.';
      status.style.color = '#e84040';
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

async function deleteAllData() {
  if (!(await uiConfirm('This will permanently delete ALL your data — food library, daily logs, and profile. Are you sure?'))) return;
  if (!(await uiConfirm('Last warning: this cannot be undone. Delete everything?'))) return;
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo')) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  foods = [];
  uiAlert('All data deleted. Please refresh to reflect your changes.');
  location.reload();
}

function openAIEstimate() {
  const name  = document.getElementById('food-name').value.trim();
  const grams = document.getElementById('food-grams').value.trim();
  let prompt;
  if (name && grams) {
    prompt = `Estimate the nutrition for ${grams}g of ${name}. Give me: calories (kcal), protein (g), carbs (g), fat (g), and fiber (g). Keep the response short and in this exact format:\n\nFood: ${name}\nServing: ${grams}g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  } else if (name) {
    prompt = `Estimate the nutrition for a typical 100g serving of ${name}. Give me: calories (kcal), protein (g), carbs (g), fat (g), and fiber (g). Keep the response short and in this exact format:\n\nFood: ${name}\nServing: 100g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  } else {
    prompt = `Estimate the nutrition for a food of my choice. Give me calories (kcal), protein (g), carbs (g), fat (g), and fiber (g) per 100g serving in this format:\n\nFood: [name]\nServing: 100g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  }
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank');
}

const PRESETS = {
  common: [
    { name:'White Rice',          grams:100, calories:130, protein:2.7, carbs:28,  fat:0.3, fiber:0.4 },
    { name:'Loaf of White Bread', grams:30,  calories:79,  protein:2.7, carbs:15,  fat:1,   fiber:0.6 },
    { name:'Boiled Egg',          grams:50,  calories:78,  protein:6.3, carbs:0.6, fat:5.3, fiber:0   },
    { name:'Fried Egg',           grams:46,  calories:90,  protein:6.3, carbs:0.4, fat:6.8, fiber:0   },
    { name:'Banana',              grams:120, calories:107, protein:1.3, carbs:27,  fat:0.4, fiber:3.1 },
    { name:'Apple',               grams:182, calories:95,  protein:0.5, carbs:25,  fat:0.3, fiber:4.4 },
    { name:'Orange',              grams:130, calories:62,  protein:1.2, carbs:15,  fat:0.2, fiber:3.1 },
    { name:'Strawberries',        grams:100, calories:32,  protein:0.7, carbs:7.7, fat:0.3, fiber:2   },
    { name:'Mango',               grams:165, calories:99,  protein:1.4, carbs:25,  fat:0.6, fiber:2.6 },
    { name:'Fried Chicken',       grams:150, calories:360, protein:30,  carbs:12,  fat:20,  fiber:0.5 },
    { name:'Rotisserie Chicken',  grams:150, calories:250, protein:34,  carbs:0,   fat:12,  fiber:0   },
    { name:'Steak',               grams:150, calories:330, protein:38,  carbs:0,   fat:19,  fiber:0   },
    { name:'Butter',              grams:14,  calories:102, protein:0.1, carbs:0,   fat:11.5,fiber:0   },
    { name:'Peanut Butter',       grams:32,  calories:188, protein:8,   carbs:6,   fat:16,  fiber:1.9 },
  ],
  filipino: [
    { name:'Pandesal',       grams:40,  calories:120, protein:3.5, carbs:22,  fat:2.5, fiber:0.8 },
    { name:'Lugaw',          grams:200, calories:130, protein:3,   carbs:28,  fat:0.5, fiber:0.5 },
    { name:'Kare-Kare',      grams:200, calories:380, protein:24,  carbs:14,  fat:26,  fiber:3   },
    { name:'Sinangag',       grams:200, calories:300, protein:5,   carbs:54,  fat:8,   fiber:0.8 },
    { name:'Chicken Adobo',  grams:150, calories:320, protein:28,  carbs:4,   fat:20,  fiber:0.3 },
    { name:'Pork Adobo',     grams:150, calories:420, protein:25,  carbs:4,   fat:33,  fiber:0.2 },
    { name:'Pork Sinigang',  grams:250, calories:280, protein:20,  carbs:12,  fat:16,  fiber:2   },
    { name:'Beef Pares',     grams:200, calories:350, protein:28,  carbs:18,  fat:18,  fiber:0.5 },
    { name:'Tocino',         grams:80,  calories:230, protein:16,  carbs:12,  fat:13,  fiber:0   },
    { name:'Longganisa',     grams:80,  calories:280, protein:13,  carbs:8,   fat:22,  fiber:0   },
    { name:'Ensaymada',      grams:80,  calories:280, protein:5,   carbs:38,  fat:13,  fiber:0.5 },
    { name:'Tapa',           grams:80,  calories:210, protein:20,  carbs:4,   fat:12,  fiber:0   },
    { name:'Sisig',          grams:150, calories:430, protein:27,  carbs:5,   fat:34,  fiber:0.5 },
    { name:'Puto',           grams:40,  calories:90,  protein:2,   carbs:18,  fat:1.5, fiber:0.5 },
    { name:'Palabok',        grams:200, calories:310, protein:14,  carbs:42,  fat:10,  fiber:1.5 },
    { name:'Pancit Bihon',   grams:200, calories:270, protein:12,  carbs:40,  fat:7,   fiber:2   },
  ]
};

let activeTab = 'common';

function togglePresets() {
  const panel = document.getElementById('preset-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderPresets();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.preset-tab').forEach((btn,i) => {
    btn.classList.toggle('active', (i===0&&tab==='common')||(i===1&&tab==='filipino'));
  });
  renderPresets();
}

function renderPresets() {
  const list=document.getElementById('preset-list'), items=PRESETS[activeTab];
  list.innerHTML=items.map((f,i)=>`
    <div class="preset-item">
      <div class="preset-info">
        <span class="preset-name">${f.name}</span>
        <span class="preset-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g${f.fiber?' · Fiber '+f.fiber+'g':''}</span>
      </div>
      <button class="btn-add-preset" onclick="addPreset('${activeTab}',${i})">Add</button>
    </div>`).join('');
}

function addPreset(tab, index) {
  const f=PRESETS[tab][index];
  if (foods.some(e=>e.name.toLowerCase()===f.name.toLowerCase())) { uiAlert(`"${f.name}" is already in your library.`); return; }
  foods.push({...f}); saveFoodsToDisk(); renderLibrary();
  const btns=document.querySelectorAll('.btn-add-preset');
  if (btns[index]) { btns[index].textContent='✓ Added'; btns[index].disabled=true; }
}

function saveFood() {
  const name=document.getElementById('food-name').value.trim();
  if (!name) { uiAlert('Please enter a food name.'); return; }
  foods.push({
    name,
    grams:    parseFloat(document.getElementById('food-grams').value)    || 100,
    calories: parseFloat(document.getElementById('food-calories').value) || 0,
    protein:  parseFloat(document.getElementById('food-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('food-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('food-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('food-fiber').value)    || 0,
  });
  saveFoodsToDisk(); renderLibrary(); clearForm();
}

function clearForm() {
  ['food-name','food-grams','food-calories','food-protein','food-carbs','food-fat','food-fiber']
    .forEach(id=>document.getElementById(id).value='');
  document.getElementById('food-name').focus();
}

const LIBRARY_COLLAPSE_THRESHOLD = 5;

function expandLibrary() {
  libraryExpanded = true;
  renderLibrary();
}

function renderLibrary() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const list = document.getElementById('food-list');
  const sorted = [...foods].map((f,i) => ({...f, originalIndex:i})).sort((a,b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg">${query ? 'No foods match your search.' : 'No foods saved yet. Add one above or use Presets!'}</p>`;
    return;
  }

  const isSearching = query.length > 0;
  const showAll = libraryExpanded || isSearching || filtered.length <= LIBRARY_COLLAPSE_THRESHOLD;
  const visible = showAll ? filtered : filtered.slice(0, LIBRARY_COLLAPSE_THRESHOLD);
  const hiddenCount = filtered.length - LIBRARY_COLLAPSE_THRESHOLD;

  const itemsHTML = visible.map(f => `
    <div class="food-item">
      <div class="food-info">
        <div class="food-name">${f.name}</div>
        <div class="macros">
          <div class="macro-chip serving">${f.grams||100}g serving</div>
          <div class="macro-chip cal">Cal <span>${f.calories}</span></div>
          <div class="macro-chip">P <span>${f.protein}g</span></div>
          <div class="macro-chip">C <span>${f.carbs}g</span></div>
          <div class="macro-chip">F <span>${f.fat}g</span></div>
          ${f.fiber>0 ? `<div class="macro-chip fiber">Fiber <span>${f.fiber}g</span></div>` : ''}
        </div>
      </div>
      <div class="food-actions">
        <button class="btn-edit" onclick="openEdit(${f.originalIndex})">Edit</button>
        <button class="btn-delete" onclick="deleteFood(${f.originalIndex})">Delete</button>
      </div>
    </div>`).join('');

  const viewAllHTML = (!showAll && hiddenCount > 0) ? `
    <div class="library-view-all">
      <button class="btn-view-all" onclick="expandLibrary()">View All ${filtered.length} Foods ▾</button>
    </div>` : '';

  list.innerHTML = itemsHTML + viewAllHTML;
}

async function deleteFood(index) {
  if (!(await uiConfirm(`Delete "${foods[index].name}"?`))) return;
  foods.splice(index,1); saveFoodsToDisk(); renderLibrary();
}

function openEdit(index) {
  const f = foods[index];
  document.getElementById('edit-index').value    = index;
  document.getElementById('edit-name').value     = f.name;
  document.getElementById('edit-grams').value    = f.grams || 100;
  document.getElementById('edit-calories').value = f.calories;
  document.getElementById('edit-protein').value  = f.protein;
  document.getElementById('edit-carbs').value    = f.carbs;
  document.getElementById('edit-fat').value      = f.fat;
  document.getElementById('edit-fiber').value    = f.fiber || 0;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.add('hidden'); }

function updateFood() {
  const index = parseInt(document.getElementById('edit-index').value);
  const name  = document.getElementById('edit-name').value.trim();
  if (!name) { uiAlert('Food name cannot be empty.'); return; }
  foods[index] = {
    name,
    grams:    parseFloat(document.getElementById('edit-grams').value)    || 100,
    calories: parseFloat(document.getElementById('edit-calories').value) || 0,
    protein:  parseFloat(document.getElementById('edit-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('edit-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('edit-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('edit-fiber').value)    || 0,
  };
  saveFoodsToDisk(); renderLibrary(); closeModalDirect();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModalDirect(); closeLogModalDirect(); closeCalendarDirect();
    closeEditMealModalDirect(); closeTutorialDirect();
    ['add-ex-overlay','edit-ex-overlay','foodcat-overlay','editcooldown-overlay']
      .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  }
  if (e.key === 'Enter' && e.target.closest('#add-section')) saveFood();
});

let tutStep = 0;
const TUT_STEPS = 3;

function openTutorial() {
  tutStep = 0;
  renderTutStep();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function closeTutorial(e) {
  if (e.target === document.getElementById('tutorial-overlay')) closeTutorialDirect();
}

function closeTutorialDirect() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
  localStorage.setItem('eatshimo_tutorial_seen', '1');
}

function tutNav(dir) {
  tutStep += dir;
  if (tutStep >= TUT_STEPS) { closeTutorialDirect(); return; }
  if (tutStep < 0) tutStep = 0;
  renderTutStep();
}

function goToStep(n) { tutStep = n; renderTutStep(); }

function renderTutStep() {
  for (let i = 0; i < TUT_STEPS; i++) {
    document.getElementById('tut-step-' + i).classList.toggle('active', i === tutStep);
  }
  document.querySelectorAll('.tut-dot').forEach((d,i) => d.classList.toggle('active', i === tutStep));
  const prev = document.getElementById('tut-prev');
  const next = document.getElementById('tut-next');
  prev.style.visibility = tutStep === 0 ? 'hidden' : 'visible';
  next.textContent = tutStep === TUT_STEPS - 1 ? 'Get Started' : 'Next';
}

function getProfileForCalc() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  return {
    weight: parseFloat(p.weight) || 70,
    height: parseFloat(p.height) || 170,
    gender: p.gender || '',
  };
}

function calcStepCalories(steps) {
  const { weight, height, gender } = getProfileForCalc();
  const strideMult = gender === 'female' ? 0.413 : 0.415;
  const strideLenM = (height / 100) * strideMult;
  const distKm = (steps * strideLenM) / 1000;
  const timeHr = distKm / 5.0;
  let cal = 3.5 * weight * timeHr;
  if (gender === 'female') cal *= 0.95;
  return Math.round(cal);
}

function calcExCals(ex, totalUnits) {
  if (ex.calsPerUnit && ex.calsPerUnit > 0) return Math.round(ex.calsPerUnit * totalUnits);
  const { weight, gender } = getProfileForCalc();
  const totalSecs = ex.type === 'reps' ? totalUnits * (ex.secPerUnit || 2.5) : totalUnits;
  const hrs = totalSecs / 3600;
  let cal = (ex.met || 4.0) * weight * hrs;
  if (gender === 'female') cal *= 0.92;
  return Math.round(cal);
}

function getCardEnabled(name) {
  return localStorage.getItem('eatshimo_card_' + name) !== 'false';
}

function saveCardToggle(name, checkbox) {
  localStorage.setItem('eatshimo_card_' + name, checkbox.checked ? 'true' : 'false');
  renderDailyLog();
  if (name === 'extras') updateExtrasChartsVisibility();
}

function loadCardToggles() {
  ['extras','exercise','fasting','foodmod'].forEach(name => {
    const el = document.getElementById('toggle-' + name);
    if (el) el.checked = getCardEnabled(name);
  });
  updateExtrasChartsVisibility();
}

function updateExtrasChartsVisibility() {
  const show = getCardEnabled('extras');
  const chartSettings = getChartSettings();
  
  ['water','steps','sleep','weight'].forEach(k => {
    const el = document.getElementById('cs-' + k);
    if (el) el.style.display = (show && chartSettings[k] !== false) ? '' : 'none';
    
    const cb = document.getElementById('cs-toggle-' + k);
    if (cb) cb.disabled = !show;
  });
}

function openAskAI() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  const parts = [];
  if (p.age)    parts.push(`${p.age} years old`);
  if (p.gender) parts.push(p.gender);
  if (p.height) parts.push(`${p.height} cm tall`);
  if (p.weight) parts.push(`${p.weight} kg`);
  const who = parts.length ? `a ${parts.join(', ')}` : 'someone';

  const exName = document.getElementById('new-ex-name')?.value.trim();
  const exerciseDesc = exName ? `"${exName}"` : 'an exercise of your choice';

  const prompt = `For ${who}, estimate how many calories are burnt per repetition doing ${exerciseDesc}. Give a single decimal number (e.g. 0.4) I can enter directly, plus a one-line explanation of how you calculated it.`;

  navigator.clipboard?.writeText(prompt).catch(() => {});
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank');
}

function toggleCardCollapse(card) {
  const body = document.getElementById('body-' + card);
  const chevron = document.getElementById('chevron-' + card);
  const isCollapsed = body.style.display === 'none';
  body.style.display = isCollapsed ? '' : 'none';
  chevron.textContent = isCollapsed ? '▲' : '▼';
  localStorage.setItem('eatshimo_' + card + '_collapsed', isCollapsed ? 'false' : 'true');
}

function initCardCollapse(card) {
  const body = document.getElementById('body-' + card);
  const chevron = document.getElementById('chevron-' + card);
  if (!body || !chevron) return;
  const collapsed = localStorage.getItem('eatshimo_' + card + '_collapsed') === 'true';
  body.style.display = collapsed ? 'none' : '';
  chevron.textContent = collapsed ? '▼' : '▲';
}

function getExLib() {
  return JSON.parse(localStorage.getItem('eatshimo_ex_lib') || '[]');
}
function saveExLib(lib) { localStorage.setItem('eatshimo_ex_lib', JSON.stringify(lib)); }

function renderExerciseCard() {
  const lib = getExLib();
  const key = dateStr(currentDate);
  const data = getDayData(key);
  const exercises = data.exercises || {};
  const list = document.getElementById('exercise-list');
  if (!list) return;

  const loggedIds = Object.keys(exercises).filter(id => (exercises[id].sets || []).length > 0);

  if (loggedIds.length === 0) {
    list.innerHTML = `<p class="card-desc">Log workouts like pushups, planks, or runs and track calories burned per session.</p>`;
    return;
  }

  list.innerHTML = loggedIds.map(exId => {
    const ex = lib.find(e => e.id === exId);
    if (!ex) return '';
    const sets = exercises[exId].sets || [];
    const total = sets.reduce((a, b) => a + b, 0);
    const kcal = total > 0 ? calcExCals(ex, total) : 0;
    return `
    <div class="ex-item" data-ex-id="${ex.id}">
      <div class="ex-item-info">
        <span class="ex-name">${ex.name}</span>
        <span class="ex-stat">${total} reps · ${kcal} kcal</span>
      </div>
      <div class="ex-item-actions">
        <input type="number" class="ex-input" data-ex-id="${ex.id}" placeholder="+reps" min="1" />
        <button class="btn-log-set" data-ex-id="${ex.id}">+</button>
        <button class="btn-ex-settings" data-ex-id="${ex.id}">⚙</button>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.btn-ex-settings').forEach(btn => {
    btn.addEventListener('click', () => openEditExModal(btn.dataset.exId));
  });
  list.querySelectorAll('.btn-log-set').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.ex-item').querySelector('.ex-input');
      logExSetDirect(btn.dataset.exId, input);
    });
  });
  list.querySelectorAll('.ex-input').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { logExSetDirect(input.dataset.exId, input); } });
  });
}

function logExSetDirect(exId, input) {
  const val = parseFloat(input.value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  if (!data.exercises[exId]) data.exercises[exId] = { sets: [] };
  data.exercises[exId].sets.push(val);
  saveDayData(key, data);
  input.value = '';
  renderExerciseCard();
}

function renderExLibPicker(query) {
  const el = document.getElementById('ex-lib-picker');
  if (!el) return;
  const lib = getExLib();
  const q = (query || '').trim().toLowerCase();
  const filtered = q ? lib.filter(e => e.name.toLowerCase().includes(q)) : lib;

  if (lib.length === 0) {
    el.innerHTML = '<p class="card-desc" style="padding:6px 0;">No saved exercises yet — add one below and it\'ll show up here next time.</p>';
    return;
  }
  if (filtered.length === 0) {
    el.innerHTML = '<p class="empty-msg" style="padding:6px 0;">No matches.</p>';
    return;
  }
  el.innerHTML = filtered.map(ex => `
    <button type="button" class="ex-lib-chip" data-ex-id="${ex.id}">
      <span class="ex-lib-chip-name">${ex.name}</span>
      <span class="ex-lib-chip-cals">${ex.calsPerUnit} kcal/rep</span>
    </button>`).join('');
  el.querySelectorAll('.ex-lib-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const ex = lib.find(e => e.id === btn.dataset.exId);
      if (!ex) return;
      document.getElementById('new-ex-name').value = ex.name;
      document.getElementById('new-ex-cals-per-unit').value = ex.calsPerUnit;
      document.getElementById('new-ex-reps').focus();
    });
  });
}

function openAddExModal() {
  document.getElementById('new-ex-name').value = '';
  document.getElementById('new-ex-reps').value = '';
  document.getElementById('new-ex-cals-per-unit').value = '';
  const searchEl = document.getElementById('ex-lib-search');
  if (searchEl) searchEl.value = '';
  renderExLibPicker('');
  document.getElementById('add-ex-overlay').classList.remove('hidden');
}
function closeAddExModal() {
  document.getElementById('add-ex-overlay').classList.add('hidden');
}

function addCustomExercise() {
  const name = document.getElementById('new-ex-name').value.trim();
  const reps = parseFloat(document.getElementById('new-ex-reps').value) || 0;
  const calsPerUnit = parseFloat(document.getElementById('new-ex-cals-per-unit').value) || 0;
  if (!name) { uiAlert('Please enter an exercise name.'); return; }
  if (!calsPerUnit || calsPerUnit <= 0) { uiAlert('Please enter calories burnt per rep. Use "Ask AI for Calories Burnt" if unsure.'); return; }
  if (!reps || reps <= 0) { uiAlert('Please enter how many reps you did.'); return; }

  const lib = getExLib();
  
  let ex = lib.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (ex) {
    ex.calsPerUnit = calsPerUnit;
  } else {
    ex = { id: 'ex_' + Date.now(), name, calsPerUnit };
    lib.push(ex);
  }
  saveExLib(lib);

  const key = dateStr(currentDate), data = getDayData(key);
  if (!data.exercises[ex.id]) data.exercises[ex.id] = { sets: [] };
  data.exercises[ex.id].sets.push(reps);
  saveDayData(key, data);

  document.getElementById('add-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

let editExId = null;

function openEditExModal(exId) {
  editExId = exId;
  const ex = getExLib().find(e => e.id === exId);
  if (!ex) return;
  document.getElementById('edit-ex-name').value = ex.name;
  document.getElementById('edit-ex-cals-per-unit').value = ex.calsPerUnit || '';
  document.getElementById('edit-ex-overlay').classList.remove('hidden');
}

function saveEditEx() {
  const lib = getExLib();
  const idx = lib.findIndex(e => e.id === editExId);
  if (idx === -1) return;
  const name = document.getElementById('edit-ex-name').value.trim();
  const calsPerUnit = parseFloat(document.getElementById('edit-ex-cals-per-unit').value) || 0;
  if (!calsPerUnit || calsPerUnit <= 0) { uiAlert('Please enter calories burnt per rep.'); return; }
  if (name) lib[idx].name = name;
  lib[idx].calsPerUnit = calsPerUnit;
  saveExLib(lib);
  document.getElementById('edit-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

function deleteExercise() {
  if (!editExId) return;
  const key = dateStr(currentDate), data = getDayData(key);
  delete data.exercises[editExId];
  saveDayData(key, data);
  document.getElementById('edit-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

let fastingTimerInterval = null;

const FASTING_PRESETS = {
  '16:8':  { fastingHours: 16, eatingHours: 8 },
  '18:6':  { fastingHours: 18, eatingHours: 6 },
  '14:10': { fastingHours: 14, eatingHours: 10 },
};

function getFastingConfig() {
  return JSON.parse(localStorage.getItem('eatshimo_fasting') || '{"preset":"16:8","fastingHours":16,"eatingHours":8,"startHour":20,"startMin":0}');
}
function saveFastingConfig(cfg) { localStorage.setItem('eatshimo_fasting', JSON.stringify(cfg)); }

function setFastingPreset(preset) {
  const cfg = getFastingConfig();
  cfg.preset = preset;
  if (FASTING_PRESETS[preset]) {
    cfg.fastingHours = FASTING_PRESETS[preset].fastingHours;
    cfg.eatingHours  = FASTING_PRESETS[preset].eatingHours;
  }
  saveFastingConfig(cfg);
  renderFastingCard();
}

function updateCustomFasting() {
  const fh = parseInt(document.getElementById('fast-hours')?.value) || 16;
  const eh = parseInt(document.getElementById('eat-hours')?.value)  || 8;
  const cfg = getFastingConfig();
  cfg.fastingHours = fh; cfg.eatingHours = eh;
  saveFastingConfig(cfg);
  renderFastingCard();
}

function saveFastingStartTime() {
  const val = document.getElementById('fast-start-time')?.value || '20:00';
  const [h, m] = val.split(':').map(Number);
  const cfg = getFastingConfig();
  cfg.startHour = h; cfg.startMin = m || 0;
  saveFastingConfig(cfg);
  renderFastingCard();
}

function getFastingStatus(cfg) {
  const tz = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}').timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const nowMin = nowLocal.getHours() * 60 + nowLocal.getMinutes() + nowLocal.getSeconds() / 60;
  const startMin = (cfg.startHour || 20) * 60 + (cfg.startMin || 0);
  const fastMin  = (cfg.fastingHours || 16) * 60;
  const eatMin   = (cfg.eatingHours  || 8)  * 60;
  const sinceStart = ((nowMin - startMin) % 1440 + 1440) % 1440;
  if (sinceStart < fastMin) {
    return { phase: 'fasting', elapsed: sinceStart, remaining: fastMin - sinceStart, total: fastMin };
  } else {
    const eatElapsed = sinceStart - fastMin;
    return { phase: 'eating', elapsed: eatElapsed, remaining: eatMin - eatElapsed, total: eatMin };
  }
}

function fmtHHMM(totalMinutes) {
  const h = Math.floor(Math.abs(totalMinutes) / 60);
  const m = Math.floor(Math.abs(totalMinutes) % 60);
  return `${h}h ${m.toString().padStart(2,'0')}m`;
}

function formatTimeHHMM(h, m) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = ((h % 12) || 12);
  return `${hh}:${m.toString().padStart(2,'0')} ${suffix}`;
}

function renderFastingCard() {
  if (!document.getElementById('fasting-status-display')) return;
  const cfg = getFastingConfig();

  document.querySelectorAll('.fast-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === cfg.preset);
  });

  const customRow = document.getElementById('fasting-custom-row');
  if (customRow) customRow.style.display = cfg.preset === 'custom' ? '' : 'none';
  if (cfg.preset === 'custom') {
    const fhEl = document.getElementById('fast-hours');
    const ehEl = document.getElementById('eat-hours');
    if (fhEl) fhEl.value = cfg.fastingHours;
    if (ehEl) ehEl.value = cfg.eatingHours;
  }

  const stEl = document.getElementById('fast-start-time');
  if (stEl) stEl.value = `${String(cfg.startHour||20).padStart(2,'0')}:${String(cfg.startMin||0).padStart(2,'0')}`;

  const eatStartH = ((cfg.startHour || 20) + (cfg.fastingHours || 16)) % 24;
  const eatStartM = cfg.startMin || 0;
  const fastRestartH = (eatStartH + (cfg.eatingHours || 8)) % 24;
  const wlEl = document.getElementById('fasting-window-label');
  if (wlEl) wlEl.textContent =
    `Fast ${formatTimeHHMM(cfg.startHour||20, cfg.startMin||0)} – ${formatTimeHHMM(eatStartH, eatStartM)}  ·  Eat ${formatTimeHHMM(eatStartH, eatStartM)} – ${formatTimeHHMM(fastRestartH, eatStartM)}`;

  updateFastingDisplay(cfg);

  if (fastingTimerInterval) clearInterval(fastingTimerInterval);
  fastingTimerInterval = setInterval(() => {
    if (document.getElementById('fasting-status-display') && getCardEnabled('fasting'))
      updateFastingDisplay(getFastingConfig());
  }, 30000);
}

function updateFastingDisplay(cfg) {
  const el = document.getElementById('fasting-status-display');
  if (!el) return;
  const s = getFastingStatus(cfg);
  const pct = Math.round((s.elapsed / s.total) * 100);
  const isFasting = s.phase === 'fasting';
  el.innerHTML = `
    <div class="fasting-status-box ${isFasting ? 'fasting-active' : 'eating-active'}">
      <div class="fasting-phase-label">${isFasting ? 'Fasting' : 'Eating Window'}</div>
      <div class="fasting-remaining">${fmtHHMM(s.remaining)} remaining</div>
      <div class="fasting-bar-wrap"><div class="fasting-bar" style="width:${pct}%"></div></div>
      <div class="fasting-pct">${pct}% complete</div>
    </div>`;
}

function getFoodCats()    { return JSON.parse(localStorage.getItem('eatshimo_food_cats') || '[]'); }
function saveFoodCats(v)  { localStorage.setItem('eatshimo_food_cats', JSON.stringify(v)); }
function getFoodTags()    { return JSON.parse(localStorage.getItem('eatshimo_food_tags') || '{}'); }
function saveFoodTags(v)  { localStorage.setItem('eatshimo_food_tags', JSON.stringify(v)); }
function getCooldowns()   { return JSON.parse(localStorage.getItem('eatshimo_cooldowns') || '{}'); }
function saveCooldowns(v) { localStorage.setItem('eatshimo_cooldowns', JSON.stringify(v)); }
function getCooldownSetting() { return localStorage.getItem('eatshimo_cooldown_setting') || 'reset'; }
function saveCooldownSetting(v) {
  localStorage.setItem('eatshimo_cooldown_setting', v);
  renderFoodModCard();
}

function cooldownDaysRemaining(catId) {
  const cds = getCooldowns();
  const entry = cds[catId];
  if (!entry || !entry.lastConsumed) return 0;
  const daysSince = Math.floor((Date.now() - new Date(entry.lastConsumed + 'T00:00:00').getTime()) / 864e5);
  return Math.max(0, entry.currentCooldownDays - daysSince);
}

function renderFoodModCard() {
  const list = document.getElementById('foodmod-list');
  if (!list) return;
  const cats = getFoodCats();
  const setting = getCooldownSetting();
  const settingEl = document.getElementById('foodmod-setting');
  if (settingEl) settingEl.value = setting;

  if (cats.length === 0) {
    list.innerHTML = '<p class="card-desc">Set cooldown periods for foods like canned goods or sugary treats to space out how often you eat them.</p>';
    return;
  }

  list.innerHTML = cats.map(cat => {
    const rem = cooldownDaysRemaining(cat.id);
    const isReady = rem === 0;
    return `
    <div class="foodmod-item" data-cat-id="${cat.id}">
      <div class="foodmod-item-top">
        <div>
          <span class="foodmod-cat-name">${cat.name}</span>
          <span class="foodmod-cooldown-default">${cat.cooldownDays}d default</span>
        </div>
        <div class="foodmod-status ${isReady ? 'status-ready' : 'status-cooling'}">
          ${isReady ? '✓ Ready' : `${rem}d left`}
        </div>
      </div>
      <div class="foodmod-actions">
        <button class="btn-foodmod-action btn-foodmod-edit">Edit</button>
        ${isReady
          ? `<button class="btn-foodmod-action btn-foodmod-trigger">Start Cooldown</button>`
          : `<button class="btn-foodmod-action btn-foodmod-cd">Edit Cooldown</button>`}
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-cat-id]').forEach(item => {
    const catId = item.dataset.catId;
    item.querySelector('.btn-foodmod-edit')?.addEventListener('click', () => openFoodCatModal(catId));
    item.querySelector('.btn-foodmod-trigger')?.addEventListener('click', () => triggerCooldown(catId));
    item.querySelector('.btn-foodmod-cd')?.addEventListener('click', () => openEditCooldownModal(catId));
  });
}

function checkFoodModerator(foodName) {
  const tags = getFoodTags();
  const catIds = tags[foodName] || [];
  if (!catIds.length) return;
  const cats = getFoodCats();
  const cds  = getCooldowns();
  const setting = getCooldownSetting();
  
  const logDate = dateStr(currentDate);
  catIds.forEach(catId => {
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    
    if (cds[catId] && cds[catId].lastConsumed === logDate) return;
    const rem = cooldownDaysRemaining(catId);
    let newCooldown = cat.cooldownDays;
    if (rem > 0 && setting === 'extend') newCooldown = rem + cat.cooldownDays;
    cds[catId] = { lastConsumed: logDate, currentCooldownDays: newCooldown };
  });
  saveCooldowns(cds);
  if (getCardEnabled('foodmod') && document.getElementById('foodmod-list')) renderFoodModCard();
}

function triggerCooldown(catId) {
  const cat = getFoodCats().find(c => c.id === catId);
  if (!cat) return;
  const cds = getCooldowns();
  cds[catId] = { lastConsumed: dateStr(currentDate), currentCooldownDays: cat.cooldownDays };
  saveCooldowns(cds);
  renderFoodModCard();
}
let foodCatSelectedNames = [];

function openFoodCatModal(catId) {
  editingCatId = catId || null;
  const cats = getFoodCats();
  const tags = getFoodTags();
  const cat = catId ? cats.find(c => c.id === catId) : null;
  document.getElementById('foodcat-modal-title').textContent = cat ? 'Edit Food Category' : 'Add Food Category';
  document.getElementById('foodcat-name').value = cat ? cat.name : '';
  document.getElementById('foodcat-days').value = cat ? cat.cooldownDays : 7;
  document.getElementById('foodcat-delete-btn').style.display = cat ? '' : 'none';
  document.getElementById('foodcat-search').value = '';

  foodCatSelectedNames = catId
    ? Object.keys(tags).filter(name => (tags[name] || []).includes(catId))
    : [];

  renderFoodCatSelectedChips();
  renderFoodCatPickList('');
  document.getElementById('foodcat-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('foodcat-search').focus(), 100);
}

function renderFoodCatPickList(query) {
  const list = document.getElementById('foodcat-pick-list');
  const sorted = [...foods].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg" style="padding:16px 0;">${foods.length === 0 ? 'No foods in library yet.' : 'No foods match your search.'}</p>`;
    return;
  }
  list.innerHTML = filtered.map(f => {
    const selected = foodCatSelectedNames.includes(f.name);
    return `
      <div class="food-pick-item${selected ? ' selected' : ''}" onclick="toggleFoodCatTag('${f.name.replace(/'/g, "\\'")}')">
        <div class="pick-name">${f.name}</div>
        <div class="pick-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g</div>
      </div>`;
  }).join('');
}

function toggleFoodCatTag(name) {
  if (foodCatSelectedNames.includes(name)) {
    foodCatSelectedNames = foodCatSelectedNames.filter(n => n !== name);
  } else {
    foodCatSelectedNames.push(name);
  }
  renderFoodCatSelectedChips();
  renderFoodCatPickList(document.getElementById('foodcat-search').value);
}

function renderFoodCatSelectedChips() {
  const el = document.getElementById('foodcat-selected-chips');
  if (foodCatSelectedNames.length === 0) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  el.innerHTML = foodCatSelectedNames.map(name => `
    <span class="foodcat-chip">
      ${name}
      <span class="chip-remove" onclick="toggleFoodCatTag(this.dataset.name)" data-name="${name.replace(/"/g, '&quot;')}" role="button" aria-label="Remove">✕</span>
    </span>`).join('');
}

function saveFoodCat() {
  const name = document.getElementById('foodcat-name').value.trim();
  const days = parseInt(document.getElementById('foodcat-days').value) || 7;
  if (!name) { uiAlert('Please enter a category name.'); return; }

  const cats = getFoodCats();
  const tags = getFoodTags();

  let catId = editingCatId;
  if (catId) {
    const idx = cats.findIndex(c => c.id === catId);
    if (idx !== -1) { cats[idx].name = name; cats[idx].cooldownDays = days; }
  } else {
    catId = 'cat_' + Date.now();
    cats.push({ id: catId, name, cooldownDays: days });
  }
  saveFoodCats(cats);

  const prevTagged = Object.keys(tags).filter(fn => (tags[fn] || []).includes(catId));
  const newlyTagged = foodCatSelectedNames.filter(fn => !prevTagged.includes(fn));

  Object.keys(tags).forEach(foodName => {
    tags[foodName] = (tags[foodName] || []).filter(id => id !== catId);
  });
  foodCatSelectedNames.forEach(foodName => {
    if (!tags[foodName]) tags[foodName] = [];
    if (!tags[foodName].includes(catId)) tags[foodName].push(catId);
  });
  saveFoodTags(tags);

  if (newlyTagged.length > 0) {
    applyRetroactiveCooldowns(catId, days, newlyTagged);
  }

  document.getElementById('foodcat-overlay').classList.add('hidden');
  renderFoodModCard();
}

function applyRetroactiveCooldowns(catId, cooldownDays, newlyTaggedFoods) {
  if (!newlyTaggedFoods || newlyTaggedFoods.length === 0) return;

  if (cooldownDaysRemaining(catId) > 0) return;

  const cds = getCooldowns();
  const todayStr = dateStr(new Date());
  const todayMs  = new Date(todayStr + 'T00:00:00').getTime();

  let mostRecentDateStr = null;

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('eatshimo_day_')) continue;
    const ds = k.replace('eatshimo_day_', '');
    const logMs   = new Date(ds + 'T00:00:00').getTime();
    const daysAgo = Math.floor((todayMs - logMs) / 864e5);
    if (daysAgo < 0 || daysAgo >= cooldownDays) continue;
    try {
      const dayData = JSON.parse(localStorage.getItem(k));
      const meals = dayData?.meals || [];
      if (meals.some(m => newlyTaggedFoods.includes(m.name))) {
        if (!mostRecentDateStr || ds > mostRecentDateStr) mostRecentDateStr = ds;
      }
    } catch (e) {}
  }

  if (!mostRecentDateStr) return;
  cds[catId] = { lastConsumed: mostRecentDateStr, currentCooldownDays: cooldownDays };
  saveCooldowns(cds);
}

async function deleteFoodCat() {
  if (!editingCatId || !(await uiConfirm('Delete this food category?'))) return;
  saveFoodCats(getFoodCats().filter(c => c.id !== editingCatId));
  const cds = getCooldowns(); delete cds[editingCatId]; saveCooldowns(cds);
  const tags = getFoodTags();
  Object.keys(tags).forEach(k => { tags[k] = tags[k].filter(id => id !== editingCatId); });
  saveFoodTags(tags);
  document.getElementById('foodcat-overlay').classList.add('hidden');
  renderFoodModCard();
}

let editingCooldownCatId = null;

function openEditCooldownModal(catId) {
  editingCooldownCatId = catId;
  const cat = getFoodCats().find(c => c.id === catId);
  if (!cat) return;
  const rem = cooldownDaysRemaining(catId);
  document.getElementById('editcooldown-cat-name').textContent = cat.name;
  document.getElementById('editcooldown-default').value = cat.cooldownDays;
  document.getElementById('editcooldown-current').value = rem;
  document.getElementById('editcooldown-add').value = 1;
  document.getElementById('editcooldown-reduce').value = 1;
  document.getElementById('editcooldown-status').textContent =
    rem > 0 ? `Currently on cooldown — ${rem} day${rem !== 1 ? 's' : ''} remaining.` : 'No active cooldown.';
  document.getElementById('editcooldown-overlay').classList.remove('hidden');
}

function _setCooldownRemaining(days) {
  const cds = getCooldowns();
  if (days <= 0) {
    delete cds[editingCooldownCatId];
  } else {
    cds[editingCooldownCatId] = { lastConsumed: dateStr(new Date()), currentCooldownDays: days };
  }
  saveCooldowns(cds);
  renderFoodModCard();
  
  const rem = cooldownDaysRemaining(editingCooldownCatId);
  const statusEl = document.getElementById('editcooldown-status');
  if (statusEl) statusEl.textContent = rem > 0
    ? `Currently on cooldown — ${rem} day${rem !== 1 ? 's' : ''} remaining.`
    : 'No active cooldown.';
  const currentEl = document.getElementById('editcooldown-current');
  if (currentEl) currentEl.value = rem;
}

function applyCooldownExact() {
  const val = parseInt(document.getElementById('editcooldown-current').value) || 0;
  _setCooldownRemaining(val);
}

function applyCooldownAdd() {
  const add = parseInt(document.getElementById('editcooldown-add').value) || 1;
  const cur = cooldownDaysRemaining(editingCooldownCatId);
  _setCooldownRemaining(cur + add);
}

function applyCooldownReduce() {
  const reduce = parseInt(document.getElementById('editcooldown-reduce').value) || 1;
  const cur = cooldownDaysRemaining(editingCooldownCatId);
  _setCooldownRemaining(Math.max(0, cur - reduce));
}

function saveEditCooldownDefault() {
  const newDefault = parseInt(document.getElementById('editcooldown-default').value) || 1;
  const cats = getFoodCats();
  const idx = cats.findIndex(c => c.id === editingCooldownCatId);
  if (idx !== -1) { cats[idx].cooldownDays = newDefault; saveFoodCats(cats); }
  document.getElementById('editcooldown-overlay').classList.add('hidden');
  renderFoodModCard();
}

function saveEditCooldown() { saveEditCooldownDefault(); }

function clearOneCooldown() {
  const cds = getCooldowns();
  delete cds[editingCooldownCatId || editingCooldownCatId];
  saveCooldowns(cds);
  document.getElementById('editcooldown-overlay').classList.add('hidden');
  renderFoodModCard();
}

const ALL_CARD_KEYS = [
  'eatshimo_ex_lib',
  'eatshimo_fasting','eatshimo_food_cats','eatshimo_food_tags',
  'eatshimo_cooldowns','eatshimo_cooldown_setting'
];

function exportAllData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)); }
      catch(e) { data[k] = localStorage.getItem(k); }
    }
  }
  _downloadJSON(data, 'eatshimo_data.json');
}

function exportCardsData() {
  const data = {};
  ALL_CARD_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) { try { data[k] = JSON.parse(v); } catch(e) { data[k] = v; } }
  });
  _downloadJSON(data, 'eatshimo_cards.json');
}

function exportFoodLibrary() {
  _downloadJSON({ eatshimo_foods: JSON.parse(localStorage.getItem('eatshimo_foods') || '[]') }, 'eatshimo_food_library.json');
}

function _downloadJSON(obj, filename) { return neoSave(filename, JSON.stringify(obj, null, 2), 'application/json'); }

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      let count = 0;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('eatshimo')) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          count++;
        }
      });
      document.getElementById('import-status').textContent = `✓ Imported ${count} keys. Refreshing…`;
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      document.getElementById('import-status').textContent = '✗ Invalid JSON file.';
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

loadTheme();
renderLibrary();
renderDailyLog();

currentDate = nowInTZ();
if (!localStorage.getItem('eatshimo_tutorial_seen')) {
  /* neo: the tutorial opens on first visit to a Food / Health page */
}

/* ---------- part 4: stashimo (Supplies / Meal Planner / Distributor), isolated in its own scope as ST ---------- */
(function(){
const ICON_EDIT = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';
const ICON_CLOCK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const UNIT_PRESETS = ['piece','pack','bottle','box','can','kg','g','liter','ml'];

const LS_KEYS = {
  items: 'stashimo_items',
  types: 'stashimo_types',
  meals: 'stashimo_meals',
  weekIngredients: 'stashimo_week_ingredients',
  extraGrocery: 'stashimo_extra_grocery',
  week: 'stashimo_current_week',
  theme: 'stashimo_theme',
  tut: 'stashimo_tutorial_seen',
  pantryExpanded: 'stashimo_pantry_expanded',
  income: 'stashimo_income',
  budgetItems: 'stashimo_budget_items',
  distPlanName: 'stashimo_dist_plan_name',
  distNotes: 'stashimo_dist_notes',

  legacyTags: 'stashimo_tags',
  legacyPrice: 'stashimo_price_memory',
  legacyBoughtLog: 'stashimo_bought_log'
};

function qs(id){ return document.getElementById(id); }

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(str){
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

function formatMoney(n){
  n = Number(n) || 0;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function pad2(n){ return n < 10 ? '0' + n : '' + n; }
function toISODate(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }
function fromISODate(s){ const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
function addDays(d, n){ const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getMonday(d){
  const r = new Date(d);
  const day = r.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  r.setDate(r.getDate() + diff);
  r.setHours(0,0,0,0);
  return r;
}
function formatWeekRange(mondayISO){
  const mon = fromISODate(mondayISO);
  const sun = addDays(mon, 6);
  const monStr = mon.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  const sunStr = sun.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  return monStr + ' – ' + sunStr;
}

function loadJSON(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e){ return fallback; }
}

let items = loadJSON(LS_KEYS.items, []);
let types = loadJSON(LS_KEYS.types, []);
let meals = loadJSON(LS_KEYS.meals, []);
let weekIngredients = loadJSON(LS_KEYS.weekIngredients, {});
let extraGroceryItems = loadJSON(LS_KEYS.extraGrocery, {});
let currentWeekStart = localStorage.getItem(LS_KEYS.week) || toISODate(getMonday(new Date()));
let currentTheme = localStorage.getItem('eatshimo_theme') || localStorage.getItem(LS_KEYS.theme) || 'slate';
let pantryFilter = 'all';
let pantryExpanded = localStorage.getItem(LS_KEYS.pantryExpanded) === '1';
let incomeEntries = loadJSON(LS_KEYS.income, []);
let budgetItems = loadJSON(LS_KEYS.budgetItems, []);
let distPlanName = localStorage.getItem(LS_KEYS.distPlanName) || '';
let distNotes = localStorage.getItem(LS_KEYS.distNotes) || '';
let selectedTypeFilters = null;
let calViewDate = fromISODate(currentWeekStart);
let tutStep = 0;
let currentPage = 'pantry';

(function migrateLegacyData(){

  const legacyTagsRaw = localStorage.getItem(LS_KEYS.legacyTags);
  if (legacyTagsRaw && types.length === 0){
    try {
      const legacyTags = JSON.parse(legacyTagsRaw);
      types = legacyTags.map(t => ({ id: t.id, name: t.name }));
      items.forEach(i => {
        if (i.tagId !== undefined){ i.typeId = i.tagId; delete i.tagId; }
        if (i.type !== undefined){ delete i.type; }
        if (i.unit === undefined) i.unit = 'piece';
      });
      saveTypes(); saveItems();
      localStorage.removeItem(LS_KEYS.legacyTags);
      localStorage.removeItem(LS_KEYS.legacyPrice);
    } catch(e){}
  }

  let itemsChanged = false;
  items.forEach(i => {
    if (i.pricePerUnit !== undefined){
      i.minPrice = i.pricePerUnit;
      i.minUnits = 1;
      delete i.pricePerUnit;
      itemsChanged = true;
    }
    if (i.minPrice === undefined) i.minPrice = null;
    if (i.minUnits === undefined) i.minUnits = 1;

    if (i.unit === 'percent'){
      i.unit = 'piece';
      i.trackPercent = true;
      itemsChanged = true;
    }
    if (i.trackPercent === undefined) i.trackPercent = false;
    if (i.lastUnitPercent === undefined) i.lastUnitPercent = 100;
  });
  if (itemsChanged) saveItems();

  const legacyBoughtLog = loadJSON(LS_KEYS.legacyBoughtLog, null);
  let mealsChanged = false;
  meals = meals.map(m => {
    if (!m.versions) return m;
    mealsChanged = true;
    const lastVersion = m.versions[m.versions.length - 1];
    const weekStart = lastVersion.effectiveFrom;
    const ingredients = (lastVersion.ingredients || []).map(ing => ({
      id: ing.id, name: ing.name, cost: ing.cost != null ? ing.cost : null,
      bought: legacyBoughtLog ? !!legacyBoughtLog[weekStart + ':' + ing.id] : false
    }));
    return { id: m.id, weekStart, day: m.day, name: m.name, ingredients };
  });
  if (mealsChanged) saveMeals();

  let extrasChanged = false;
  Object.keys(extraGroceryItems).forEach(weekStart => {
    extraGroceryItems[weekStart] = (extraGroceryItems[weekStart] || []).map(it => {
      if (it.bought === undefined){
        extrasChanged = true;
        return Object.assign({}, it, { bought: legacyBoughtLog ? !!legacyBoughtLog[weekStart + ':' + it.id] : false });
      }
      return it;
    });
  });
  if (extrasChanged) saveExtraGroceryItems();

  let weekIngredientsChanged = false;
  meals.forEach(m => {
    if (!Array.isArray(m.ingredients)) return;
    weekIngredientsChanged = true;
    if (!weekIngredients[m.weekStart]) weekIngredients[m.weekStart] = [];
    const list = weekIngredients[m.weekStart];
    m.ingredients.forEach(ing => {
      const key = (ing.name || '').trim().toLowerCase();
      let match = list.find(w => w.name.trim().toLowerCase() === key);
      if (match){
        if (!match.mealIds.includes(m.id)) match.mealIds.push(m.id);
        if (match.cost == null && ing.cost != null) match.cost = ing.cost;
        if (!match.bought && ing.bought) match.bought = true;
      } else {
        list.push({
          id: ing.id || uid(), name: ing.name, cost: ing.cost != null ? ing.cost : null,
          bought: !!ing.bought, mealIds: [m.id]
        });
      }
    });
    delete m.ingredients;
  });
  if (weekIngredientsChanged){ saveMeals(); saveWeekIngredients(); }

  if (legacyBoughtLog) localStorage.removeItem(LS_KEYS.legacyBoughtLog);
})();

if (types.length === 0){
  types.push({ id: uid(), name: 'Food' });
  saveTypes();
}

function saveItems(){ localStorage.setItem(LS_KEYS.items, JSON.stringify(items)); }
function saveTypes(){ localStorage.setItem(LS_KEYS.types, JSON.stringify(types)); }
function saveMeals(){ localStorage.setItem(LS_KEYS.meals, JSON.stringify(meals)); }
function saveWeekIngredients(){ localStorage.setItem(LS_KEYS.weekIngredients, JSON.stringify(weekIngredients)); }
function saveExtraGroceryItems(){ localStorage.setItem(LS_KEYS.extraGrocery, JSON.stringify(extraGroceryItems)); }
function saveIncomeEntries(){ localStorage.setItem(LS_KEYS.income, JSON.stringify(incomeEntries)); }
function saveBudgetItems(){ localStorage.setItem(LS_KEYS.budgetItems, JSON.stringify(budgetItems)); }
function persistCurrentWeek(){ localStorage.setItem(LS_KEYS.week, currentWeekStart); }
function persistDistPlanName(){ localStorage.setItem(LS_KEYS.distPlanName, distPlanName); }
function persistDistNotes(){ localStorage.setItem(LS_KEYS.distNotes, distNotes); }

const PAGE_ORDER = ['pantry', 'planner', 'distributor'];

function showPage(name, btnEl, fromBottom){
  currentPage = name;
  if (name === 'pantry'){
    processAutoDeducts();
  }
  document.querySelectorAll('.st .page').forEach(p => p.classList.remove('active'));
  qs('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));
  const idx = PAGE_ORDER.indexOf(name);
  const navTabs = document.querySelectorAll('.nav-tab');
  const bottomBtns = document.querySelectorAll('.bottom-nav-btn');
  if (navTabs[idx]) navTabs[idx].classList.add('active');
  if (bottomBtns[idx]) bottomBtns[idx].classList.add('active');
}

function onUnitSelectChange(selectId, customInputId){
  const sel = qs(selectId);
  const customInput = qs(customInputId);
  customInput.style.display = (sel.value === 'custom') ? 'block' : 'none';
}

function onTrackPercentChange(checkboxId, percentFieldId){
  const checked = qs(checkboxId).checked;
  const percentField = qs(percentFieldId);
  if (percentField) percentField.style.display = checked ? 'block' : 'none';
  refreshAutoDeductModeOptions(checkboxId.replace('-track-percent', ''));
}

function toggleCollapsible(bodyId, chevronId){
  const body = qs(bodyId);
  const chevron = qs(chevronId);
  const nowHidden = body.classList.toggle('hidden');
  if (chevron) chevron.classList.toggle('open', !nowHidden);
}

function hexToRgba(hex, a){
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const LIGHT_NEUTRALS = {
  bg: '#f4f5f7', surface: '#ffffff', text: '#252830', textMid: '#555c6b', textDim: '#8a9099',
  inputBorder: '#dde0e8', success: '#4a8c72', danger: '#c0523a', warning: '#c98a2e'
};

function buildTheme(base){
  const computed = {
    accentDim: hexToRgba(base.border, base.dark ? 0.10 : 0.07),
    successDim: hexToRgba(base.success, 0.10),
    dangerDim: hexToRgba(base.danger, 0.08),
    warningDim: hexToRgba(base.warning, 0.10)
  };
  return Object.assign({}, computed, base);
}

const THEMES = {
  slate:   buildTheme(Object.assign({ label: 'Slate',   headerBg: '#2c313a', footerBg: '#2c313a', border: '#171717', borderLite: '#2e2e2e' }, LIGHT_NEUTRALS)),
  ocean:   buildTheme(Object.assign({ label: 'Ocean',   headerBg: '#0e3460', footerBg: '#0e3460', border: '#1a5276', borderLite: '#2e6f95' }, LIGHT_NEUTRALS)),
  forest:  buildTheme(Object.assign({ label: 'Forest',  headerBg: '#134a30', footerBg: '#134a30', border: '#1e6b45', borderLite: '#2f8a5c' }, LIGHT_NEUTRALS)),
  crimson: buildTheme(Object.assign({ label: 'Crimson', headerBg: '#5e1010', footerBg: '#5e1010', border: '#8b1a1a', borderLite: '#a83232' }, LIGHT_NEUTRALS)),
  violet:  buildTheme(Object.assign({ label: 'Violet',  headerBg: '#3d1d5e', footerBg: '#3d1d5e', border: '#5b2c8b', borderLite: '#7443ab' }, LIGHT_NEUTRALS)),
  teal:    buildTheme(Object.assign({ label: 'Teal',    headerBg: '#074a4a', footerBg: '#074a4a', border: '#0f6b6b', borderLite: '#1c8c8c' }, LIGHT_NEUTRALS)),
  cocoa:   buildTheme(Object.assign({ label: 'Cocoa',   headerBg: '#4a2510', footerBg: '#4a2510', border: '#6b3a1f', borderLite: '#8a4f2c' }, LIGHT_NEUTRALS)),
  dark:    buildTheme({
    label: 'Dark', dark: true,
    bg: '#12141e', surface: '#191c28', text: '#e2e4ef', textMid: '#b0b4c4', textDim: '#6b7180',
    inputBorder: '#2a2e3d', headerBg: '#0d0f16', footerBg: '#0d0f16', border: '#4a5568', borderLite: '#5f6b80',
    success: '#45b98a', danger: '#e0685a', warning: '#d99b3f'
  })
};

function applyTheme(key){ window.applyTheme(key); }

function selectTheme(key){
  currentTheme = key;
  localStorage.setItem(LS_KEYS.theme, key); localStorage.setItem('eatshimo_theme', key);
  applyTheme(key);
  renderThemeSwatches();
}

function renderThemeSwatches(){
  const grid = qs('theme-swatch-grid');
  if (!grid) return;
  grid.innerHTML = Object.keys(THEMES).map(key => {
    const t = THEMES[key];
    const selected = currentTheme === key;
    return `<button type="button" class="theme-pill${selected ? ' selected' : ''}" style="background:${t.border};" onclick="ST.selectTheme('${key}')">${t.label}</button>`;
  }).join('');
}

function refreshTypeSelects(){
  const opts = types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  qs('item-type').innerHTML = opts;
  qs('edit-item-type').innerHTML = opts;

  const restockOpts = '<option value="all">All Types</option>' +
    types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  const restockSel = qs('restock-type-filter');
  const prevVal = restockSel.value || 'all';
  restockSel.innerHTML = restockOpts;
  restockSel.value = types.some(t => t.id === prevVal) ? prevVal : 'all';
}

function openTypeModal(){
  qs('new-type-name').value = '';
  qs('editing-type-id').value = '';
  qs('type-save-btn').textContent = 'Add Type';
  renderTypeList();
  qs('type-modal-overlay').classList.remove('hidden');
}
function closeTypeModal(){
  qs('type-modal-overlay').classList.add('hidden');
  refreshTypeSelects();
  renderPantry();
  renderRestockEstimate();
}

function renderTypeList(){
  const wrap = qs('type-list');
  if (types.length === 0){
    wrap.innerHTML = '<p class="empty-msg">No types yet.</p>';
    return;
  }
  wrap.innerHTML = types.map(t => `
    <div class="type-manage-row">
      <span class="settings-row-label">${esc(t.name)}</span>
      <div class="type-manage-row-actions">
        <button class="btn-sm btn-edit" onclick="ST.editTypeInline('${t.id}')">Edit</button>
        <button class="btn-sm btn-delete" onclick="ST.deleteTypeConfirm('${t.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function editTypeInline(id){
  const t = types.find(x => x.id === id);
  if (!t) return;
  qs('new-type-name').value = t.name;
  qs('editing-type-id').value = t.id;
  qs('type-save-btn').textContent = 'Update Type';
}

function saveType(){
  const name = qs('new-type-name').value.trim();
  if (!name){ uiAlert('Please enter a type name.'); return; }
  const editingId = qs('editing-type-id').value;
  if (editingId){
    const t = types.find(x => x.id === editingId);
    if (t){ t.name = name; }
  } else {
    const newType = { id: uid(), name };
    types.push(newType);
    if (selectedTypeFilters) selectedTypeFilters.add(newType.id);
  }
  saveTypes();
  qs('new-type-name').value = '';
  qs('editing-type-id').value = '';
  qs('type-save-btn').textContent = 'Add Type';
  renderTypeList();
  refreshTypeSelects();
  renderTypeFilterCheckboxes();
  renderPantry();
  renderRestockEstimate();
}

async function deleteTypeConfirm(id){
  if (!(await uiConfirm('Delete this type? Items using it will move to "Other".'))) return;
  items.forEach(i => { if (i.typeId === id) i.typeId = null; });
  types = types.filter(t => t.id !== id);
  if (selectedTypeFilters) selectedTypeFilters.delete(id);
  saveTypes(); saveItems();
  renderTypeList();
  refreshTypeSelects();
  renderTypeFilterCheckboxes();
  renderPantry();
  renderRestockEstimate();
}

function recomputeStatus(item){
  if (item.currentCount == null) return;

  if (item.trackPercent){
    if (item.currentCount <= 0){ item.status = 'out'; return; }
    if (item.currentCount >= 2){

      item.lastUnitPercent = 100;
      item.status = 'ok';
      return;
    }

    if (item.lastUnitPercent == null) item.lastUnitPercent = 100;
    const target = item.targetPercent != null ? item.targetPercent : 20;
    if (item.lastUnitPercent <= 0) item.status = 'out';
    else if (item.lastUnitPercent < target) item.status = 'low';
    else item.status = 'ok';
    return;
  }

  if (item.currentCount <= 0) item.status = 'out';
  else if (item.targetCount != null && item.currentCount < item.targetCount) item.status = 'low';
  else item.status = 'ok';
}

function lastDayOfMonth(d){ return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

function computeAutoDeductTicksDue(ad, fromISO, toISO){
  if (!fromISO || fromISO >= toISO) return { ticks: 0, newFromISO: fromISO };
  const from = fromISODate(fromISO);
  const to = fromISODate(toISO);

  if (ad.freqType === 'days'){
    const n = Math.max(1, ad.freqN || 1);
    const diffDays = Math.round((to - from) / 86400000);
    const ticks = Math.floor(diffDays / n);
    if (ticks <= 0) return { ticks: 0, newFromISO: fromISO };
    return { ticks, newFromISO: toISODate(addDays(from, ticks * n)) };
  }

  if (ad.freqType === 'week'){
    const weekdays = (ad.freqWeekdays && ad.freqWeekdays.length) ? ad.freqWeekdays : [0];
    let ticks = 0, cursor = from, guard = 0;
    while (cursor < to && guard < 2000){
      cursor = addDays(cursor, 1);
      guard++;
      if (weekdays.includes((cursor.getDay() + 6) % 7)) ticks++;
    }
    return { ticks, newFromISO: toISO };
  }

  if (ad.freqType === 'month'){
    const targetDay = Math.min(31, Math.max(1, ad.freqMonthDay || 1));
    let ticks = 0, cursor = from, guard = 0;
    while (cursor < to && guard < 2000){
      cursor = addDays(cursor, 1);
      guard++;
      const isTarget = cursor.getDate() === targetDay;

      const isShortMonthFallback = targetDay > 28 && cursor.getDate() === lastDayOfMonth(cursor) && lastDayOfMonth(cursor) < targetDay;
      if (isTarget || isShortMonthFallback) ticks++;
    }
    return { ticks, newFromISO: toISO };
  }

  return { ticks: 0, newFromISO: fromISO };
}

function touchAutoDeductClock(item){
  if (!item.autoDeduct) return;
  const todayISO = toISODate(new Date());
  item.autoDeduct.lastAppliedDate = todayISO;
  if (item.autoDeduct.mode === 'percent'){
    item.autoDeduct.lastUnitReachedDate = (item.currentCount === 1) ? todayISO : null;
  }
}

function applyAutoDeductForItem(item, todayISO){
  const ad = item.autoDeduct;
  if (!ad || item.currentCount == null) return false;

  if (ad.mode === 'count'){
    if (item.currentCount <= 0) return false;
    const fromISO = ad.lastAppliedDate || todayISO;
    const { ticks, newFromISO } = computeAutoDeductTicksDue(ad, fromISO, todayISO);
    if (ticks <= 0) return false;
    const amount = Math.max(1, ad.amount || 1);
    item.currentCount = Math.max(0, item.currentCount - ticks * amount);
    ad.lastAppliedDate = newFromISO;
    recomputeStatus(item);
    return true;
  }

  if (ad.mode === 'percent'){

    if (item.currentCount === 1){
      if (!ad.lastUnitReachedDate) ad.lastUnitReachedDate = todayISO;
    } else {
      ad.lastUnitReachedDate = null;
      ad.lastAppliedDate = null;
      return false;
    }
    const fromISO = ad.lastAppliedDate || ad.lastUnitReachedDate;
    const { ticks, newFromISO } = computeAutoDeductTicksDue(ad, fromISO, todayISO);
    if (ticks <= 0) return false;
    const amount = Math.max(1, ad.amount || 1);
    const cur = item.lastUnitPercent != null ? item.lastUnitPercent : 100;
    const next = cur - ticks * amount;
    if (next <= 0){
      item.currentCount = 0;
      item.lastUnitPercent = 100;
      ad.lastUnitReachedDate = null;
    } else {
      item.lastUnitPercent = next;
    }
    ad.lastAppliedDate = newFromISO;
    recomputeStatus(item);
    return true;
  }

  return false;
}

function processAutoDeducts(){
  const todayISO = toISODate(new Date());
  let changed = false;
  items.forEach(item => { if (applyAutoDeductForItem(item, todayISO)) changed = true; });
  if (changed){
    saveItems();
    renderPantry();
    renderRestockEstimate();
  }
}

function autoDeductConfigsEqual(a, b){
  if (!a || !b) return false;
  if (a.mode !== b.mode || a.amount !== b.amount || a.freqType !== b.freqType) return false;
  if (a.freqType === 'days') return a.freqN === b.freqN;
  if (a.freqType === 'month') return a.freqMonthDay === b.freqMonthDay;
  if (a.freqType === 'week'){
    const wa = (a.freqWeekdays || []).slice().sort().join(',');
    const wb = (b.freqWeekdays || []).slice().sort().join(',');
    return wa === wb;
  }
  return true;
}

const AUTO_DEDUCT_DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function onAutoDeductToggle(prefix){
  const enabled = qs(`${prefix}-auto-deduct-enabled`).checked;
  qs(`${prefix}-auto-deduct-wrap`).style.display = enabled ? 'flex' : 'none';
  if (enabled){
    refreshAutoDeductModeOptions(prefix);
    renderAutoDeductFreqDetail(prefix);
  }
}

function onAutoDeductModeChange(prefix){}

function refreshAutoDeductModeOptions(prefix){
  const trackCheckbox = qs(`${prefix}-track-percent`);
  const modeSel = qs(`${prefix}-auto-deduct-mode`);
  if (!trackCheckbox || !modeSel) return;
  const trackPercent = trackCheckbox.checked;
  const percentOption = modeSel.querySelector('option[value="percent"]');
  if (percentOption) percentOption.disabled = !trackPercent;
  if (!trackPercent && modeSel.value === 'percent') modeSel.value = 'count';
}

function onAutoDeductFreqTypeChange(prefix){ renderAutoDeductFreqDetail(prefix); }

function renderAutoDeductFreqDetail(prefix, savedAd){
  const type = qs(`${prefix}-auto-deduct-freq-type`).value;
  const wrap = qs(`${prefix}-auto-deduct-freq-detail`);
  if (type === 'days'){
    const n = (savedAd && savedAd.freqType === 'days' && savedAd.freqN) ? savedAd.freqN : 1;
    wrap.innerHTML = `<div class="auto-deduct-row"><span class="auto-deduct-inline-label">Every</span><input type="number" id="${prefix}-auto-deduct-freq-n" min="1" value="${n}" /><span class="auto-deduct-inline-label">day(s)</span></div>`;
  } else if (type === 'week'){
    const selected = (savedAd && savedAd.freqType === 'week' && savedAd.freqWeekdays) ? savedAd.freqWeekdays : [];
    wrap.innerHTML = `<div class="weekday-toggle-row" id="${prefix}-auto-deduct-weekdays">${AUTO_DEDUCT_DAY_LETTERS.map((l, i) =>
      `<button type="button" class="weekday-toggle-btn ${selected.includes(i) ? 'active' : ''}" data-day="${i}" onclick="this.classList.toggle('active')">${l}</button>`
    ).join('')}</div>`;
  } else if (type === 'month'){
    const day = (savedAd && savedAd.freqType === 'month' && savedAd.freqMonthDay) ? savedAd.freqMonthDay : 1;
    wrap.innerHTML = `<div class="auto-deduct-row"><span class="auto-deduct-inline-label">Day</span><input type="number" id="${prefix}-auto-deduct-month-day" min="1" max="31" value="${day}" /><span class="auto-deduct-inline-label">of each month</span></div>`;
  }
}

function collectAutoDeductConfig(prefix){
  if (!qs(`${prefix}-auto-deduct-enabled`).checked) return null;
  const mode = qs(`${prefix}-auto-deduct-mode`).value;
  const amountRaw = qs(`${prefix}-auto-deduct-amount`).value;
  const amount = amountRaw === '' ? 1 : Math.max(1, parseFloat(amountRaw));
  const freqType = qs(`${prefix}-auto-deduct-freq-type`).value;
  const config = { mode, amount, freqType, lastAppliedDate: null, lastUnitReachedDate: null };

  if (freqType === 'days'){
    const nRaw = qs(`${prefix}-auto-deduct-freq-n`).value;
    config.freqN = nRaw === '' ? 1 : Math.max(1, parseInt(nRaw, 10));
  } else if (freqType === 'week'){
    const btns = document.querySelectorAll(`#${prefix}-auto-deduct-weekdays .weekday-toggle-btn.active`);
    config.freqWeekdays = Array.from(btns).map(b => parseInt(b.dataset.day, 10));
    if (config.freqWeekdays.length === 0){
      uiAlert('Please choose at least one day of the week for the auto-deduct schedule.');
      return false;
    }
  } else if (freqType === 'month'){
    const dayRaw = qs(`${prefix}-auto-deduct-month-day`).value;
    config.freqMonthDay = dayRaw === '' ? 1 : Math.min(31, Math.max(1, parseInt(dayRaw, 10)));
  }
  return config;
}

function applyAutoDeductConfigToItem(item, newConfig){
  if (!newConfig){ item.autoDeduct = null; return; }
  if (autoDeductConfigsEqual(newConfig, item.autoDeduct)){
    newConfig.lastAppliedDate = item.autoDeduct.lastAppliedDate;
    newConfig.lastUnitReachedDate = item.autoDeduct.lastUnitReachedDate;
    item.autoDeduct = newConfig;
  } else {
    item.autoDeduct = newConfig;
    touchAutoDeductClock(item);
  }
}

function resetAutoDeductForm(prefix){
  qs(`${prefix}-auto-deduct-enabled`).checked = false;
  qs(`${prefix}-auto-deduct-wrap`).style.display = 'none';
  qs(`${prefix}-auto-deduct-mode`).value = 'count';
  qs(`${prefix}-auto-deduct-amount`).value = '1';
  qs(`${prefix}-auto-deduct-freq-type`).value = 'days';
  qs(`${prefix}-auto-deduct-freq-detail`).innerHTML = '';
}

function populateAutoDeductForm(prefix, ad){
  qs(`${prefix}-auto-deduct-enabled`).checked = !!ad;
  qs(`${prefix}-auto-deduct-wrap`).style.display = ad ? 'flex' : 'none';
  qs(`${prefix}-auto-deduct-mode`).value = ad ? ad.mode : 'count';
  qs(`${prefix}-auto-deduct-amount`).value = ad ? ad.amount : '1';
  qs(`${prefix}-auto-deduct-freq-type`).value = ad ? ad.freqType : 'days';
  refreshAutoDeductModeOptions(prefix);
  if (ad) renderAutoDeductFreqDetail(prefix, ad);
  else qs(`${prefix}-auto-deduct-freq-detail`).innerHTML = '';
}

function adjustPercent(id, delta){
  const item = items.find(i => i.id === id);
  if (!item || !item.trackPercent || item.currentCount !== 1) return;
  const current = item.lastUnitPercent != null ? item.lastUnitPercent : 100;
  const next = current + delta;
  if (next <= 0){

    item.currentCount = 0;
    item.lastUnitPercent = 100;
  } else {
    item.lastUnitPercent = Math.min(100, next);
  }
  recomputeStatus(item);
  touchAutoDeductClock(item);
  saveItems();
  renderPantry();
  renderRestockEstimate();
}

async function setPercentDirectly(id){
  const item = items.find(i => i.id === id);
  if (!item || !item.trackPercent || item.currentCount !== 1) return;
  const current = item.lastUnitPercent != null ? item.lastUnitPercent : 100;
  const raw = await uiPrompt('Percent remaining in the last one (0-100):', current);
  if (raw === null) return;
  let pct = parseInt(raw, 10);
  if (isNaN(pct)) return;
  pct = Math.min(100, Math.max(0, pct));
  if (pct <= 0){
    item.currentCount = 0;
    item.lastUnitPercent = 100;
  } else {
    item.lastUnitPercent = pct;
  }
  recomputeStatus(item);
  touchAutoDeductClock(item);
  saveItems();
  renderPantry();
  renderRestockEstimate();
}

function resolveUnitFromInputs(selectId, customInputId){
  const sel = qs(selectId);
  if (sel.value === 'custom'){
    const custom = qs(customInputId).value.trim().toLowerCase();
    return custom || 'unit';
  }
  return sel.value;
}

function saveItem(){
  const name = qs('item-name').value.trim();
  if (!name){ uiAlert('Please enter an item name.'); return; }
  const typeId = qs('item-type').value || null;
  const unit = resolveUnitFromInputs('item-unit', 'item-unit-custom');
  const minPriceRaw = qs('item-min-price').value;
  const minPrice = minPriceRaw === '' ? null : Math.max(0, parseFloat(minPriceRaw));
  const minUnitsRaw = qs('item-min-units').value;
  const minUnits = minUnitsRaw === '' ? 1 : Math.max(1, parseInt(minUnitsRaw, 10));
  const currentRaw = qs('item-current').value;
  const targetRaw = qs('item-target').value;
  const currentCount = currentRaw === '' ? null : Math.max(0, parseInt(currentRaw, 10));
  const targetCount = targetRaw === '' ? null : Math.max(0, parseInt(targetRaw, 10));
  const trackPercent = qs('item-track-percent').checked;
  const targetPercentRaw = qs('item-target-percent').value;
  const targetPercent = targetPercentRaw === '' ? null : Math.min(100, Math.max(0, parseInt(targetPercentRaw, 10)));
  const autoDeductConfig = collectAutoDeductConfig('item');
  if (autoDeductConfig === false) return;
  const item = {
    id: uid(), name, typeId, unit, minPrice, minUnits, currentCount, targetCount, status: 'ok',
    trackPercent, targetPercent, lastUnitPercent: 100
  };
  recomputeStatus(item);
  applyAutoDeductConfigToItem(item, autoDeductConfig);
  items.push(item);
  saveItems();
  qs('item-name').value = '';
  qs('item-min-price').value = '';
  qs('item-min-units').value = '';
  qs('item-current').value = '';
  qs('item-target').value = '';
  qs('item-target-percent').value = '';
  qs('item-unit').value = 'piece';
  qs('item-unit-custom').style.display = 'none';
  qs('item-unit-custom').value = '';
  qs('item-track-percent').checked = false;
  qs('item-target-percent-wrap').style.display = 'none';
  resetAutoDeductForm('item');
  renderPantry();
  renderRestockEstimate();
}

function adjustCount(id, delta){
  const item = items.find(i => i.id === id);
  if (!item || item.currentCount == null) return;
  item.currentCount = Math.max(0, item.currentCount + delta);
  recomputeStatus(item);
  touchAutoDeductClock(item);
  saveItems();
  renderPantry();
  renderRestockEstimate();
}

function toggleStatus(id, status){
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (item.status === status){
    if (item.currentCount != null) recomputeStatus(item);
    else item.status = 'ok';
  } else {
    item.status = status;
    if (status === 'out' && item.currentCount != null) item.currentCount = 0;
  }
  touchAutoDeductClock(item);
  saveItems();
  renderPantry();
  renderRestockEstimate();
}

function setPantryFilter(filter, btnEl){
  pantryFilter = filter;
  document.querySelectorAll('#pantry-filter-pills .filter-pill').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  renderPantry();
}

function editItem(id){
  const item = items.find(i => i.id === id);
  if (!item) return;
  refreshTypeSelects();
  qs('edit-item-id').value = item.id;
  qs('edit-item-name').value = item.name;
  qs('edit-item-type').value = item.typeId || '';
  const isPreset = UNIT_PRESETS.includes(item.unit);
  qs('edit-item-unit').value = isPreset ? item.unit : 'custom';
  qs('edit-item-unit-custom').style.display = isPreset ? 'none' : 'block';
  qs('edit-item-unit-custom').value = isPreset ? '' : item.unit;
  qs('edit-item-min-price').value = item.minPrice != null ? item.minPrice : '';
  qs('edit-item-min-units').value = (item.minUnits != null && item.minUnits !== 1) ? item.minUnits : '';
  qs('edit-item-current').value = item.currentCount != null ? item.currentCount : '';
  qs('edit-item-target').value = item.targetCount != null ? item.targetCount : '';
  qs('edit-item-track-percent').checked = !!item.trackPercent;
  qs('edit-item-target-percent').value = item.targetPercent != null ? item.targetPercent : '';
  qs('edit-item-target-percent-wrap').style.display = item.trackPercent ? 'block' : 'none';
  populateAutoDeductForm('edit-item', item.autoDeduct);
  qs('item-modal-overlay').classList.remove('hidden');
}
function closeItemModal(){ qs('item-modal-overlay').classList.add('hidden'); }

function updateItem(){
  const id = qs('edit-item-id').value;
  const item = items.find(i => i.id === id);
  if (!item) return;
  item.name = qs('edit-item-name').value.trim() || item.name;
  item.typeId = qs('edit-item-type').value || null;
  item.unit = resolveUnitFromInputs('edit-item-unit', 'edit-item-unit-custom');
  const minPriceRaw = qs('edit-item-min-price').value;
  item.minPrice = minPriceRaw === '' ? null : Math.max(0, parseFloat(minPriceRaw));
  const minUnitsRaw = qs('edit-item-min-units').value;
  item.minUnits = minUnitsRaw === '' ? 1 : Math.max(1, parseInt(minUnitsRaw, 10));
  const currentRaw = qs('edit-item-current').value;
  const targetRaw = qs('edit-item-target').value;
  item.currentCount = currentRaw === '' ? null : Math.max(0, parseInt(currentRaw, 10));
  item.targetCount = targetRaw === '' ? null : Math.max(0, parseInt(targetRaw, 10));
  item.trackPercent = qs('edit-item-track-percent').checked;
  const targetPercentRaw = qs('edit-item-target-percent').value;
  item.targetPercent = targetPercentRaw === '' ? null : Math.min(100, Math.max(0, parseInt(targetPercentRaw, 10)));
  if (item.lastUnitPercent == null) item.lastUnitPercent = 100;
  const autoDeductConfig = collectAutoDeductConfig('edit-item');
  if (autoDeductConfig === false) return;
  applyAutoDeductConfigToItem(item, autoDeductConfig);
  recomputeStatus(item);
  saveItems();
  closeItemModal();
  renderPantry();
  renderRestockEstimate();
}

async function deleteItem(){
  const id = qs('edit-item-id').value;
  if (!(await uiConfirm('Delete this item?'))) return;
  items = items.filter(i => i.id !== id);
  saveItems();
  closeItemModal();
  renderPantry();
  renderRestockEstimate();
}

async function deleteItemInline(id){
  if (!(await uiConfirm('Delete this item?'))) return;
  items = items.filter(i => i.id !== id);
  saveItems();
  renderPantry();
  renderRestockEstimate();
}

function initTypeFilters(){
  selectedTypeFilters = new Set(types.map(t => t.id));
  selectedTypeFilters.add('none');
}

function toggleTypeFilterPanel(){
  toggleCollapsible('type-filter-panel', 'type-filter-chevron');
  if (!qs('type-filter-panel').classList.contains('hidden')) renderTypeFilterCheckboxes();
}

function renderTypeFilterCheckboxes(){
  const wrap = qs('type-filter-checkboxes');
  if (!selectedTypeFilters) initTypeFilters();
  const hasOrphans = items.some(i => !i.typeId || !types.find(t => t.id === i.typeId));
  let html = types.map(t => `
    <label class="type-filter-row">
      <input type="checkbox" ${selectedTypeFilters.has(t.id) ? 'checked' : ''} onchange="ST.toggleTypeFilter('${t.id}')" />
      ${esc(t.name)}
    </label>
  `).join('');
  if (hasOrphans){
    html += `<label class="type-filter-row">
      <input type="checkbox" ${selectedTypeFilters.has('none') ? 'checked' : ''} onchange="ST.toggleTypeFilter('none')" />
      Other
    </label>`;
  }
  wrap.innerHTML = html || '<p class="empty-msg">No types yet.</p>';
}

function toggleTypeFilter(key){
  if (selectedTypeFilters.has(key)) selectedTypeFilters.delete(key);
  else selectedTypeFilters.add(key);
  renderPantry();
}

function setAllTypeFilters(select){
  selectedTypeFilters = new Set();
  if (select){
    types.forEach(t => selectedTypeFilters.add(t.id));
    selectedTypeFilters.add('none');
  }
  renderTypeFilterCheckboxes();
  renderPantry();
}

function renderPantry(){
  if (!selectedTypeFilters) initTypeFilters();
  const search = qs('pantry-search').value.trim().toLowerCase();
  const filtered = items.filter(i => {
    if (pantryFilter !== 'all' && i.status !== pantryFilter) return false;
    const typeKey = (i.typeId && types.find(t => t.id === i.typeId)) ? i.typeId : 'none';
    if (!selectedTypeFilters.has(typeKey)) return false;
    if (search && !i.name.toLowerCase().includes(search)) return false;
    return true;
  });
  const wrap = qs('pantry-list');
  if (filtered.length === 0){
    wrap.innerHTML = '<p class="empty-msg">' +
      (items.length === 0 ? 'No items yet. Add your first item above!' : 'No items match your search/filter.') +
      '</p>';
    return;
  }
  const groups = {};
  filtered.forEach(i => {
    const key = (i.typeId && types.find(t => t.id === i.typeId)) ? i.typeId : 'none';
    if (!groups[key]) groups[key] = [];
    groups[key].push(i);
  });

  const total = filtered.length;
  const limit = pantryExpanded ? total : 10;
  let shown = 0;
  let html = '';

  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  });

  const groupEntries = [];
  types.forEach(t => { if (groups[t.id]) groupEntries.push({ key: t.id, label: t.name }); });
  if (groups['none']) groupEntries.push({ key: 'none', label: 'Other' });
  groupEntries.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  groupEntries.forEach(({ key, label }) => {
    if (shown >= limit) return;
    const remaining = limit - shown;
    const slice = groups[key].slice(0, remaining);
    html += renderGroupHtml(label, slice, groups[key].length);
    shown += slice.length;
  });

  if (total > 10){
    html += pantryExpanded
      ? `<button class="btn-secondary btn-full" onclick="ST.collapsePantryList()">Show Less</button>`
      : `<button class="btn-add-card-item" onclick="ST.expandPantryList()">View All ${total} Supplies</button>`;
  }

  wrap.innerHTML = html;
}

function expandPantryList(){
  pantryExpanded = true;
  localStorage.setItem(LS_KEYS.pantryExpanded, '1');
  renderPantry();
}
function collapsePantryList(){
  pantryExpanded = false;
  localStorage.setItem(LS_KEYS.pantryExpanded, '0');
  renderPantry();
}

function renderGroupHtml(name, groupItems, trueCount){
  const count = trueCount != null ? trueCount : groupItems.length;
  let html = `<div class="pantry-group">
    <div class="group-header"><span class="group-name">${esc(name)}</span><span class="group-count">(${count})</span></div>`;
  groupItems.forEach(i => html += renderItemCardHtml(i));
  html += `</div>`;
  return html;
}

function renderItemCardHtml(item){
  const statusLabelMap = { ok:'In Stock', low:'Needs Refill', out:'Out of Stock' };
  const unitLabel = esc(item.unit || 'piece');
  const isPercent = !!item.trackPercent;

  let countHtml = '';
  if (isPercent && item.currentCount != null){
    if (item.currentCount >= 2){
      countHtml = `<span class="pantry-count"><strong>${item.currentCount}</strong> ${unitLabel} in stock</span>`;
    } else if (item.currentCount === 1){
      const pct = item.lastUnitPercent != null ? item.lastUnitPercent : 100;
      const target = item.targetPercent != null ? item.targetPercent : 20;
      const barClass = pct < target ? 'low' : '';
      countHtml = `<div style="width:100%;"><span class="pantry-count">Last one: <strong>${pct}%</strong> left${item.targetPercent != null ? ' · refill under ' + target + '%' : ''}</span>
        <div class="pct-bar-wrap"><div class="pct-bar ${barClass}" style="width:${pct}%;"></div></div></div>`;
    } else {
      countHtml = '';
    }
  } else if (item.currentCount != null){
    countHtml = `<span class="pantry-count"><strong>${item.currentCount}</strong>${item.targetCount != null ? ' / ' + item.targetCount : ''} ${unitLabel}</span>`;
  }

  const priceHtml = (item.minPrice != null)
    ? (item.minUnits && item.minUnits > 1
        ? `<span class="pantry-count">₱${formatMoney(item.minPrice)} per ${item.minUnits} ${unitLabel}</span>`
        : `<span class="pantry-count">₱${formatMoney(item.minPrice)} / ${unitLabel}</span>`)
    : '';

  let trackedActions = '';
  if (item.currentCount != null){
    if (isPercent && item.currentCount === 1){
      trackedActions = `<button class="btn-pantry-action" onclick="ST.adjustPercent('${item.id}', -10)">−10%</button>
         <button class="btn-pantry-action" onclick="ST.setPercentDirectly('${item.id}')">Edit %</button>
         <button class="btn-pantry-action" onclick="ST.adjustCount('${item.id}', 1)">+1</button>`;
    } else if (isPercent && item.currentCount === 0){
      trackedActions = `<button class="btn-pantry-action" onclick="ST.adjustCount('${item.id}', 1)">+1</button>`;
    } else if (item.status === 'out'){
      trackedActions = `<button class="btn-pantry-action" onclick="ST.adjustCount('${item.id}', 1)">+1</button>`;
    } else {
      trackedActions = `<button class="btn-pantry-action" onclick="ST.adjustCount('${item.id}', -1)">−Used</button>
         <button class="btn-pantry-action" onclick="ST.adjustCount('${item.id}', 1)">+1</button>`;
    }
  }

  const needsRefillBtn = item.status === 'low'
    ? '' : `<button class="btn-pantry-action warn" onclick="ST.toggleStatus('${item.id}','low')">NR</button>`;
  const oosBtn = item.status === 'out'
    ? '' : `<button class="btn-pantry-action danger" onclick="ST.toggleStatus('${item.id}','out')">OOS</button>`;

  const autoDeductBtn = item.autoDeduct
    ? `<button class="st-icon-btn pantry-title-icon-btn" onclick="ST.editItem('${item.id}')" title="Auto-deduct is scheduled for this item">${ICON_CLOCK}</button>`
    : '';

  return `
    <div class="pantry-item status-${item.status}">
      <div class="pantry-item-top">
        <div class="pantry-item-name">${esc(item.name)}</div>
        ${autoDeductBtn}
        <span class="status-badge ${item.status}">${statusLabelMap[item.status]}</span>
      </div>
      <div class="pantry-item-meta">
        ${countHtml}
        ${priceHtml}
      </div>
      <div class="pantry-actions">
        ${trackedActions}
        ${needsRefillBtn}
        ${oosBtn}
        <button class="st-icon-btn" onclick="ST.editItem('${item.id}')" title="Edit">${ICON_EDIT}</button>
        <button class="st-icon-btn" onclick="ST.deleteItemInline('${item.id}')" title="Delete">${ICON_TRASH}</button>
      </div>
    </div>`;
}

function neededQtyForItem(item, mode){
  const needsRestock = item.status !== 'ok';
  if (mode === 'min'){
    return needsRestock ? 1 : 0;
  }

  if (item.targetCount != null){
    const cur = item.currentCount || 0;
    let qty = Math.max(item.targetCount - cur, 0);

    if (qty === 0 && needsRestock) qty = 1;
    return qty;
  }
  return needsRestock ? 1 : 0;
}

function batchCostForQty(item, qty){
  if (qty <= 0 || item.minPrice == null) return 0;
  const units = (item.minUnits && item.minUnits > 0) ? item.minUnits : 1;
  const batches = Math.ceil(qty / units);
  return batches * item.minPrice;
}

function renderRestockEstimate(){
  const filterTypeId = qs('restock-type-filter').value;
  const relevant = items.filter(i => filterTypeId === 'all' || i.typeId === filterTypeId);
  let minCost = 0, maxCost = 0;
  relevant.forEach(i => {
    minCost += batchCostForQty(i, neededQtyForItem(i, 'min'));
    maxCost += batchCostForQty(i, neededQtyForItem(i, 'max'));
  });
  qs('restock-min-cost').textContent = '₱' + formatMoney(minCost);
  qs('restock-max-cost').textContent = '₱' + formatMoney(maxCost);
}

function getWeekIngredients(weekStart){
  if (!weekIngredients[weekStart]) weekIngredients[weekStart] = [];
  return weekIngredients[weekStart];
}

function mealIngredientsFor(meal){
  return getWeekIngredients(meal.weekStart).filter(ing => ing.mealIds.includes(meal.id));
}

function unlinkMealIngredients(meal){
  const list = getWeekIngredients(meal.weekStart);
  list.forEach(ing => { ing.mealIds = ing.mealIds.filter(id => id !== meal.id); });
  weekIngredients[meal.weekStart] = list.filter(ing => ing.mealIds.length > 0);
  saveWeekIngredients();
}

function renderPlanner(){
  renderWeekNav();
  renderMealWeekList();
  renderGroceryList();
}

function renderWeekNav(){
  qs('week-range-text').textContent = formatWeekRange(currentWeekStart);
  const thisMonday = toISODate(getMonday(new Date()));
  qs('week-sub-text').textContent = (currentWeekStart === thisMonday) ? 'This week' : 'Tap to pick a week';
}

function changeWeek(delta){
  currentWeekStart = toISODate(addDays(fromISODate(currentWeekStart), delta * 7));
  persistCurrentWeek();
  renderPlanner();
}

function goToThisWeek(){
  currentWeekStart = toISODate(getMonday(new Date()));
  persistCurrentWeek();
  renderPlanner();
}

function mealsForCurrentWeek(){
  return meals.filter(m => m.weekStart === currentWeekStart);
}

function computeMealStatsFromIngredients(ingredients){
  const total = ingredients.length;
  const bought = ingredients.filter(ing => !!ing.bought).length;
  let status, label;
  if (total === 0){ status = 'none'; label = 'No Ingredients'; }
  else if (bought === total){ status = 'complete'; label = 'Complete'; }
  else if (bought === 0){ status = 'missing'; label = 'Missing'; }
  else { status = 'partial'; label = 'Partial'; }
  return { total, bought, status, label };
}

function computeMealStats(meal){
  return computeMealStatsFromIngredients(mealIngredientsFor(meal));
}

function renderMealWeekList(){
  const wrap = qs('meal-week-list');
  const weekMeals = mealsForCurrentWeek();
  if (weekMeals.length === 0){
    wrap.innerHTML = '<p class="empty-msg">No meals planned for this week yet.</p>';
    return;
  }
  let html = '';
  for (let day = 0; day < 7; day++){
    const dayMeals = weekMeals.filter(m => m.day === day);
    if (dayMeals.length === 0) continue;
    const dateObj = addDays(fromISODate(currentWeekStart), day);
    const dateLabel = dateObj.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    html += `<div class="day-group">
      <div class="day-group-header"><span class="day-group-name">${DAY_NAMES[day]}</span><span class="day-group-date">${dateLabel}</span></div>`;
    dayMeals.forEach(m => html += renderMealCardHtml(m));
    html += `</div>`;
  }
  wrap.innerHTML = html || '<p class="empty-msg">No meals planned for this week yet.</p>';
}

function renderMealCardHtml(meal){
  const ingredients = mealIngredientsFor(meal);
  const stats = computeMealStatsFromIngredients(ingredients);
  const noteHtml = meal.note ? `<p class="meal-note">${esc(meal.note)}</p>` : '';
  return `
    <div class="meal-card">
      <div class="meal-card-top">
        <div>
          <div class="meal-name">${esc(meal.name)}</div>
          <div class="meal-ingredient-count">${stats.total === 0 ? 'No ingredients added' : stats.bought + ' / ' + stats.total + ' bought'}</div>
        </div>
        <span class="meal-status ${stats.status}">${stats.label}</span>
      </div>
      ${noteHtml}
      <div class="meal-card-actions">
        <button class="btn-sm btn-edit" onclick="ST.editMeal('${meal.id}')">Edit</button>
        <button class="btn-sm btn-delete" onclick="ST.deleteMealInline('${meal.id}')">Delete</button>
      </div>
    </div>`;
}

function toggleIngredientBought(weekStart, ingId){
  const list = getWeekIngredients(weekStart);
  const ing = list.find(i => i.id === ingId);
  if (!ing) return;
  ing.bought = !ing.bought;
  saveWeekIngredients();
  renderMealWeekList();
  renderGroceryList();
}

function toggleExtraBought(extraId){
  const list = extraGroceryItems[currentWeekStart] || [];
  const item = list.find(i => i.id === extraId);
  if (!item) return;
  item.bought = !item.bought;
  saveExtraGroceryItems();
  renderGroceryList();
}

function renderGroceryList(){
  const weekList = getWeekIngredients(currentWeekStart);
  const rows = [];
  weekList.forEach(ing => {
    const mealNames = ing.mealIds
      .map(id => { const m = meals.find(mm => mm.id === id); return m ? m.name : null; })
      .filter(Boolean);
    rows.push({ ing, mealName: mealNames.join(', ') || 'Other', extra: false });
  });
  const extras = extraGroceryItems[currentWeekStart] || [];
  extras.forEach(ing => rows.push({ ing, mealName: 'Other', extra: true }));

  rows.sort((a, b) => (a.ing.bought ? 1 : 0) - (b.ing.bought ? 1 : 0));

  const totalCost = rows.reduce((s, r) => s + (r.ing.cost || 0), 0);
  const boughtCost = rows.filter(r => r.ing.bought).reduce((s, r) => s + (r.ing.cost || 0), 0);
  const remainingCost = totalCost - boughtCost;
  qs('grocery-total-cost').textContent = '₱' + formatMoney(totalCost);
  qs('grocery-bought-cost').textContent = '₱' + formatMoney(boughtCost);
  qs('grocery-remaining-cost').textContent = '₱' + formatMoney(remainingCost);

  const wrap = qs('grocery-list');
  if (rows.length === 0){
    wrap.innerHTML = '<p class="empty-msg">Nothing to buy yet. Plan a meal first, or add an item below.</p>';
    return;
  }
  wrap.innerHTML = rows.map(r => {
    const toggleCall = r.extra ? `toggleExtraBought('${r.ing.id}')` : `toggleIngredientBought('${currentWeekStart}','${r.ing.id}')`;
    const deleteBtn = r.extra
      ? `<button class="st-icon-btn" onclick="ST.deleteExtraGroceryItem('${r.ing.id}')" title="Remove">${ICON_TRASH}</button>`
      : '';
    return `
    <div class="grocery-item ${r.ing.bought ? 'bought' : ''}">
      <input type="checkbox" ${r.ing.bought ? 'checked' : ''} onchange="${toggleCall}" />
      <div class="grocery-item-info">
        <div class="grocery-item-name">${esc(r.ing.name)}</div>
        <div class="grocery-item-meal">${esc(r.mealName)}</div>
      </div>
      <div class="grocery-item-cost" onclick="ST.startEditGroceryCost(this,'${r.ing.id}',${r.extra})" title="Tap to edit price">${r.ing.cost != null ? '₱' + formatMoney(r.ing.cost) : 'Set price'}</div>
      ${deleteBtn}
    </div>`;
  }).join('');
}

function startEditGroceryCost(el, ingId, isExtra){
  const current = isExtra
    ? (extraGroceryItems[currentWeekStart] || []).find(i => i.id === ingId)
    : getWeekIngredients(currentWeekStart).find(i => i.id === ingId);
  if (!current) return;

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '0.01';
  input.className = 'grocery-item-cost-input';
  input.value = current.cost != null ? current.cost : '';
  input.placeholder = '₱';
  el.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const raw = input.value;
    const newCost = raw === '' ? null : Math.max(0, parseFloat(raw));
    commitGroceryItemCost(ingId, isExtra, newCost);
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter'){ input.blur(); }
    else if (e.key === 'Escape'){ committed = true; renderGroceryList(); }
  });
}

function commitGroceryItemCost(ingId, isExtra, newCost){
  if (isExtra){
    const list = extraGroceryItems[currentWeekStart] || [];
    const item = list.find(i => i.id === ingId);
    if (item) item.cost = newCost;
    saveExtraGroceryItems();
  } else {
    const list = getWeekIngredients(currentWeekStart);
    const ing = list.find(i => i.id === ingId);
    if (ing) ing.cost = newCost;
    saveWeekIngredients();
  }
  renderGroceryList();
}

function addExtraGroceryItem(){
  const name = qs('grocery-extra-name').value.trim();
  if (!name){ uiAlert('Please enter an item name.'); return; }
  const costRaw = qs('grocery-extra-cost').value;
  const cost = costRaw === '' ? null : Math.max(0, parseFloat(costRaw));
  if (!extraGroceryItems[currentWeekStart]) extraGroceryItems[currentWeekStart] = [];
  extraGroceryItems[currentWeekStart].push({ id: uid(), name, cost, bought: false });
  saveExtraGroceryItems();
  qs('grocery-extra-name').value = '';
  qs('grocery-extra-cost').value = '';
  renderGroceryList();
}

function deleteExtraGroceryItem(id){
  const list = extraGroceryItems[currentWeekStart] || [];
  extraGroceryItems[currentWeekStart] = list.filter(i => i.id !== id);
  saveExtraGroceryItems();
  renderGroceryList();
}

function openMealModal(){
  qs('meal-modal-title').textContent = 'Add Meal';
  qs('editing-meal-id').value = '';
  qs('meal-name').value = '';
  qs('meal-day').value = '0';
  qs('meal-note').value = '';
  qs('meal-ingredient-list').innerHTML = '';
  addIngredientRow();
  qs('meal-delete-btn').style.display = 'none';
  qs('meal-modal-overlay').classList.remove('hidden');
}
function closeMealModal(){ qs('meal-modal-overlay').classList.add('hidden'); }

function perMealShare(cost, mealCount){
  if (cost == null) return null;
  if (!mealCount || mealCount <= 1) return cost;
  return Math.ceil((cost / mealCount) / 5) * 5;
}

function addIngredientRow(name = '', cost = null, ingId = null, mealCount = 0){
  const list = qs('meal-ingredient-list');
  const rowId = ingId || uid();
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.dataset.rowId = rowId;
  const locked = !!ingId && mealCount > 1;
  const displayCost = locked ? perMealShare(cost, mealCount) : cost;
  if (locked) row.dataset.costLocked = '1';
  const lockedHint = locked
    ? `Shared with ${mealCount - 1} other meal${mealCount - 1 === 1 ? '' : 's'}: showing your ₱${formatMoney(displayCost)} share of the ₱${formatMoney(cost)} total. Edit the total price from the Grocery List.`
    : '';
  row.innerHTML = `
    <input type="text" class="ing-name-input" placeholder="e.g. Chicken thighs" value="${esc(name)}" oninput="ST.onIngredientNameInput(this)" />
    <input type="number" class="ing-cost-input" placeholder="₱ cost" min="0" step="0.01" value="${displayCost != null ? displayCost : ''}" ${locked ? 'disabled title="Shared ingredient. Edit the total price from the Grocery List"' : ''} />
    <button type="button" class="st-icon-btn" onclick="this.closest('.ingredient-row').remove()" title="Remove">${ICON_CLOSE}</button>
    <div class="ing-shared-hint">${lockedHint}</div>
  `;
  list.appendChild(row);
  if (name && !locked) onIngredientNameInput(row.querySelector('.ing-name-input'));
}

function onIngredientNameInput(inputEl){
  const row = inputEl.closest('.ingredient-row');
  const key = inputEl.value.trim().toLowerCase();

  const hint = row.querySelector('.ing-shared-hint');
  if (!hint) return;
  const editingId = qs('editing-meal-id').value;
  const editingMeal = editingId ? meals.find(m => m.id === editingId) : null;
  const weekStart = editingMeal ? editingMeal.weekStart : currentWeekStart;
  const weekList = getWeekIngredients(weekStart);
  const match = key
    ? weekList.find(w => w.id !== row.dataset.rowId && w.name.trim().toLowerCase() === key &&
        (!editingMeal || !w.mealIds.includes(editingMeal.id)))
    : null;
  if (match){
    const otherNames = match.mealIds
      .map(id => { const m = meals.find(mm => mm.id === id); return m ? m.name : null; })
      .filter(Boolean).join(', ');
    hint.textContent = otherNames ? `Also used in: ${otherNames}. Will share stock & purchase status.` : '';
  } else {
    hint.textContent = '';
  }
}

function editMeal(id){
  const meal = meals.find(m => m.id === id);
  if (!meal) return;
  qs('meal-modal-title').textContent = 'Edit Meal';
  qs('editing-meal-id').value = meal.id;
  qs('meal-name').value = meal.name;
  qs('meal-day').value = String(meal.day);
  qs('meal-note').value = meal.note || '';
  qs('meal-ingredient-list').innerHTML = '';
  const ingredients = mealIngredientsFor(meal);
  if (ingredients.length === 0) addIngredientRow();
  else ingredients.forEach(ing => addIngredientRow(ing.name, ing.cost, ing.id, ing.mealIds.length));
  qs('meal-delete-btn').style.display = 'block';
  qs('meal-modal-overlay').classList.remove('hidden');
}

function collectIngredientsFromModal(){
  const rows = Array.from(qs('meal-ingredient-list').querySelectorAll('.ingredient-row'));
  return rows.map(row => {
    const name = row.querySelector('.ing-name-input').value.trim();
    if (!name) return null;
    const costRaw = row.querySelector('.ing-cost-input').value;
    const cost = costRaw === '' ? null : Math.max(0, parseFloat(costRaw));
    const locked = row.dataset.costLocked === '1';
    return { id: row.dataset.rowId, name, cost, locked };
  }).filter(Boolean);
}

function saveMeal(){
  const name = qs('meal-name').value.trim();
  if (!name){ uiAlert('Please enter a meal name.'); return; }
  const day = parseInt(qs('meal-day').value, 10);
  const note = qs('meal-note').value.trim();
  const collected = collectIngredientsFromModal();

  const editingId = qs('editing-meal-id').value;
  let meal;
  let weekStart;
  if (editingId){
    meal = meals.find(m => m.id === editingId);
    if (!meal) return;
    weekStart = meal.weekStart;
    meal.name = name;
    meal.day = day;
    meal.note = note;
  } else {
    weekStart = currentWeekStart;
    meal = { id: uid(), weekStart, day, name, note };
    meals.push(meal);
  }

  const weekList = getWeekIngredients(weekStart);
  const keepIds = new Set();
  collected.forEach(row => {
    let wi = weekList.find(w => w.id === row.id);
    if (wi){
      wi.name = row.name;
      if (row.cost != null && !row.locked) wi.cost = row.cost;
      if (!wi.mealIds.includes(meal.id)) wi.mealIds.push(meal.id);
      keepIds.add(wi.id);
      return;
    }
    const key = row.name.trim().toLowerCase();
    const match = weekList.find(w => w.name.trim().toLowerCase() === key && !w.mealIds.includes(meal.id));
    if (match){
      if (row.cost != null) match.cost = row.cost;
      match.mealIds.push(meal.id);
      keepIds.add(match.id);
    } else {
      const fresh = { id: row.id || uid(), name: row.name, cost: row.cost, bought: false, mealIds: [meal.id] };
      weekList.push(fresh);
      keepIds.add(fresh.id);
    }
  });

  weekList.forEach(w => {
    if (w.mealIds.includes(meal.id) && !keepIds.has(w.id)){
      w.mealIds = w.mealIds.filter(id => id !== meal.id);
    }
  });
  weekIngredients[weekStart] = weekList.filter(w => w.mealIds.length > 0);

  saveMeals();
  saveWeekIngredients();
  closeMealModal();
  renderPlanner();
}

async function deleteMeal(){
  const id = qs('editing-meal-id').value;
  if (!id) return;
  if (!(await uiConfirm('Delete this meal?'))) return;
  const meal = meals.find(m => m.id === id);
  meals = meals.filter(m => m.id !== id);
  saveMeals();
  if (meal) unlinkMealIngredients(meal);
  closeMealModal();
  renderPlanner();
}

async function deleteMealInline(id){
  if (!(await uiConfirm('Delete this meal?'))) return;
  const meal = meals.find(m => m.id === id);
  meals = meals.filter(m => m.id !== id);
  saveMeals();
  if (meal) unlinkMealIngredients(meal);
  renderPlanner();
}

function openCalendar(){
  calViewDate = fromISODate(currentWeekStart);
  renderCalendar();
  qs('st-cal-overlay').classList.remove('hidden');
}
function closeCalendar(){ qs('st-cal-overlay').classList.add('hidden'); }
function calPrevMonth(){ calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth()-1, 1); renderCalendar(); }
function calNextMonth(){ calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth()+1, 1); renderCalendar(); }

function renderCalendar(){
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  qs('st-cal-month-label').textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayISO = toISODate(new Date());
  const selStartISO = currentWeekStart;
  const selEndISO = toISODate(addDays(fromISODate(currentWeekStart), 6));
  const weeksWithData = new Set(meals.map(m => m.weekStart));

  let html = '';
  for (let i = 0; i < firstWeekday; i++) html += '<span class="cal-empty"></span>';
  for (let d = 1; d <= daysInMonth; d++){
    const dateObj = new Date(year, month, d);
    const iso = toISODate(dateObj);
    const classes = ['cal-day'];
    if (iso === todayISO) classes.push('today');
    if (iso >= selStartISO && iso <= selEndISO) classes.push('in-selected-week');
    if (iso === selStartISO) classes.push('week-start');
    if (iso === selEndISO) classes.push('week-end');
    const dayMonday = toISODate(getMonday(dateObj));
    if (weeksWithData.has(dayMonday)) classes.push('has-data');
    html += `<span class="${classes.join(' ')}" onclick="ST.selectWeekFromDate('${iso}')">${d}</span>`;
  }
  qs('st-cal-grid').innerHTML = html;
}

function selectWeekFromDate(iso){
  currentWeekStart = toISODate(getMonday(fromISODate(iso)));
  persistCurrentWeek();
  renderPlanner();
  closeCalendar();
}

function openSettings(){ renderThemeSwatches(); qs('settings-overlay').classList.remove('hidden'); }
function closeSettings(){ qs('settings-overlay').classList.add('hidden'); }

function exportData(){
  const payload = {
    items, types, meals, weekIngredients, extraGroceryItems, incomeEntries, budgetItems,
    distPlanName, distNotes, exportedAt: new Date().toISOString(), version: 'stashimo-v0.10'
  };
  neoSave('stashimo-backup-' + toISODate(new Date()) + '.json', JSON.stringify(payload, null, 2), 'application/json');
}

async function importData(event){
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.items) || !Array.isArray(data.types) || !Array.isArray(data.meals)){
        uiAlert('This file doesn\'t look like a valid Stashimo backup.');
        return;
      }
      if (!(await uiConfirm('Importing will replace all current data. Continue?'))) return;
      items = data.items;
      types = data.types;
      meals = data.meals;
      weekIngredients = data.weekIngredients || {};
      extraGroceryItems = data.extraGroceryItems || {};
      incomeEntries = data.incomeEntries || [];
      budgetItems = data.budgetItems || [];
      distPlanName = data.distPlanName || '';
      distNotes = data.distNotes || '';
      saveItems(); saveTypes(); saveMeals(); saveWeekIngredients(); saveExtraGroceryItems();
      saveIncomeEntries(); saveBudgetItems(); persistDistPlanName(); persistDistNotes();
      refreshTypeSelects();
      initTypeFilters();
      renderPantry();
      renderRestockEstimate();
      renderPlanner();
      renderDistributor();
      closeSettings();
      uiAlert('Import complete!');
    } catch(e){
      uiAlert('Could not read that file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function resetAllData(){
  if (!(await uiConfirm('This will permanently erase all supplies, types, meal plans, and distributor data. Continue?'))) return;
  items = [];
  meals = [];
  weekIngredients = {};
  extraGroceryItems = {};
  types = [{ id: uid(), name: 'Food' }];
  incomeEntries = [];
  budgetItems = [];
  distPlanName = '';
  distNotes = '';
  saveItems(); saveTypes(); saveMeals(); saveWeekIngredients(); saveExtraGroceryItems();
  saveIncomeEntries(); saveBudgetItems(); persistDistPlanName(); persistDistNotes();
  refreshTypeSelects();
      initTypeFilters();
  renderPantry();
  renderRestockEstimate();
  renderPlanner();
  renderDistributor();
  closeSettings();
}

const TUT_STEP_FOR_PAGE = { pantry: 0, planner: 2, distributor: 3 };
function openTutorial(){
  tutStep = TUT_STEP_FOR_PAGE[currentPage] != null ? TUT_STEP_FOR_PAGE[currentPage] : 0;
  updateTutorialUI();
  qs('st-tutorial-overlay').classList.remove('hidden');
}
function closeTutorial(){ qs('st-tutorial-overlay').classList.add('hidden'); }
function goToTutStep(i){ tutStep = i; updateTutorialUI(); }
function tutNav(dir){
  const total = document.querySelectorAll('.st .tutorial-step').length;
  const next = tutStep + dir;
  if (next < 0 || next > total - 1) return;
  tutStep = next;
  updateTutorialUI();
}
function updateTutorialUI(){
  const total = document.querySelectorAll('.st .tutorial-step').length;
  document.querySelectorAll('.st .tutorial-step').forEach((el, i) => el.classList.toggle('active', i === tutStep));
  document.querySelectorAll('.st .tut-dot').forEach((el, i) => el.classList.toggle('active', i === tutStep));
  qs('st-tut-prev').style.visibility = tutStep === 0 ? 'hidden' : 'visible';
  const nextBtn = qs('st-tut-next');
  if (tutStep === total - 1){
    nextBtn.textContent = 'Done';
    nextBtn.onclick = closeTutorial;
  } else {
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => tutNav(1);
  }
}

function resetIncomeForm(){
  qs('editing-income-id').value = '';
  qs('income-name').value = '';
  qs('income-date').value = '';
  qs('income-amount').value = '';
  qs('save-income-btn').textContent = 'Save Income';
  qs('income-delete-btn').style.display = 'none';
}

function saveIncome(){
  const name = qs('income-name').value.trim();
  if (!name){ uiAlert('Please enter a name.'); return; }
  const date = qs('income-date').value;
  if (!date){ uiAlert('Please choose an expected date.'); return; }
  const amountRaw = qs('income-amount').value;
  const amount = amountRaw === '' ? 0 : Math.max(0, parseFloat(amountRaw));

  const editingId = qs('editing-income-id').value;
  if (editingId){
    const entry = incomeEntries.find(e => e.id === editingId);
    if (entry) Object.assign(entry, { name, date, amount });
  } else {
    incomeEntries.push({ id: uid(), name, date, amount });
  }
  saveIncomeEntries();
  resetIncomeForm();
  renderDistributor();
}

function editIncomeInline(id){
  const entry = incomeEntries.find(e => e.id === id);
  if (!entry) return;
  qs('editing-income-id').value = entry.id;
  qs('income-name').value = entry.name;
  qs('income-date').value = entry.date;
  qs('income-amount').value = entry.amount;
  qs('save-income-btn').textContent = 'Update Income';
  qs('income-delete-btn').style.display = 'block';
  qs('add-income-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteIncomeFromForm(){
  const id = qs('editing-income-id').value;
  if (!id) return;
  if (!(await uiConfirm('Delete this income entry?'))) return;
  incomeEntries = incomeEntries.filter(e => e.id !== id);
  saveIncomeEntries();
  resetIncomeForm();
  renderDistributor();
}

async function deleteIncomeInline(id){
  if (!(await uiConfirm('Delete this income entry?'))) return;
  incomeEntries = incomeEntries.filter(e => e.id !== id);
  saveIncomeEntries();
  renderDistributor();
}

function resetBudgetItemForm(){
  qs('editing-budget-item-id').value = '';
  qs('budget-item-name').value = '';
  qs('budget-item-date').value = '';
  qs('budget-item-amount').value = '';
  qs('budget-item-is-debt').checked = false;
  qs('save-budget-item-btn').textContent = 'Save Item';
  qs('budget-item-delete-btn').style.display = 'none';
}

function saveBudgetItem(){
  const name = qs('budget-item-name').value.trim();
  if (!name){ uiAlert('Please enter a name.'); return; }
  const date = qs('budget-item-date').value || null;
  const amountRaw = qs('budget-item-amount').value;
  const amount = amountRaw === '' ? 0 : Math.max(0, parseFloat(amountRaw));
  const isDebt = qs('budget-item-is-debt').checked;

  const editingId = qs('editing-budget-item-id').value;
  if (editingId){
    const item = budgetItems.find(i => i.id === editingId);
    if (item) Object.assign(item, { name, date, amount, isDebt });
  } else {
    budgetItems.push({ id: uid(), name, date, amount, isDebt, paid: false });
  }
  saveBudgetItems();
  resetBudgetItemForm();
  renderDistributor();
}

function editBudgetItemInline(id){
  const item = budgetItems.find(i => i.id === id);
  if (!item) return;
  qs('editing-budget-item-id').value = item.id;
  qs('budget-item-name').value = item.name;
  qs('budget-item-date').value = item.date || '';
  qs('budget-item-amount').value = item.amount;
  qs('budget-item-is-debt').checked = !!item.isDebt;
  qs('save-budget-item-btn').textContent = 'Update Item';
  qs('budget-item-delete-btn').style.display = 'block';
  qs('add-budget-item-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteBudgetItemFromForm(){
  const id = qs('editing-budget-item-id').value;
  if (!id) return;
  if (!(await uiConfirm('Delete this item?'))) return;
  budgetItems = budgetItems.filter(i => i.id !== id);
  saveBudgetItems();
  resetBudgetItemForm();
  renderDistributor();
}

async function deleteBudgetItemInline(id){
  if (!(await uiConfirm('Delete this item?'))) return;
  budgetItems = budgetItems.filter(i => i.id !== id);
  saveBudgetItems();
  renderDistributor();
}

function toggleBudgetItemPaid(id){
  const item = budgetItems.find(i => i.id === id);
  if (!item) return;
  item.paid = !item.paid;
  saveBudgetItems();
  renderDistributor();
}

function renderDistIncomeList(){
  const wrap = qs('income-list');
  if (incomeEntries.length === 0){
    wrap.innerHTML = '<p class="empty-msg">No income entries yet.</p>';
    return;
  }
  const sorted = incomeEntries.slice().sort((a, b) => a.date.localeCompare(b.date));
  wrap.innerHTML = sorted.map(e => `
    <div class="dist-item">
      <div class="dist-item-info">
        <div class="dist-item-name">${esc(e.name)}</div>
        <div class="dist-item-meta">${fromISODate(e.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>
      </div>
      <div class="dist-item-amount">₱${formatMoney(e.amount)}</div>
      <div class="dist-item-actions">
        <button class="st-icon-btn" onclick="ST.editIncomeInline('${e.id}')" title="Edit">${ICON_EDIT}</button>
        <button class="st-icon-btn" onclick="ST.deleteIncomeInline('${e.id}')" title="Delete">${ICON_TRASH}</button>
      </div>
    </div>
  `).join('');
}

function renderDistBudgetLists(){
  const regular = budgetItems.filter(i => !i.isDebt);
  const debts = budgetItems.filter(i => i.isDebt);

  const renderRow = (i) => `
    <div class="dist-item ${i.paid ? 'paid' : ''}">
      <input type="checkbox" ${i.paid ? 'checked' : ''} onchange="ST.toggleBudgetItemPaid('${i.id}')" title="Paid" />
      <div class="dist-item-info">
        <div class="dist-item-name">${esc(i.name)}</div>
        <div class="dist-item-meta">${i.date ? fromISODate(i.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'No date set'}</div>
      </div>
      <div class="dist-item-amount">₱${formatMoney(i.amount)}</div>
      <div class="dist-item-actions">
        <button class="st-icon-btn" onclick="ST.editBudgetItemInline('${i.id}')" title="Edit">${ICON_EDIT}</button>
        <button class="st-icon-btn" onclick="ST.deleteBudgetItemInline('${i.id}')" title="Delete">${ICON_TRASH}</button>
      </div>
    </div>`;

  qs('budget-items-list').innerHTML = regular.length
    ? regular.slice().sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999')).map(renderRow).join('')
    : '<p class="empty-msg">No planned items yet.</p>';

  qs('debt-items-list').innerHTML = debts.length
    ? debts.slice().sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999')).map(renderRow).join('')
    : '<p class="empty-msg">No debts or credit card purchases yet.</p>';
}

function renderDistPlanNameInput(){
  qs('dist-plan-name').value = distPlanName;
}

function onDistPlanNameChange(){
  distPlanName = qs('dist-plan-name').value.trim();
  persistDistPlanName();
}

function onDistNotesChange(){
  distNotes = qs('dist-other-notes').value;
  persistDistNotes();
}

function renderDistributorSummary(){
  const totalIncome = incomeEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalItems = budgetItems.reduce((s, i) => s + (i.amount || 0), 0);
  const totalDebtsAccrued = budgetItems.filter(i => i.isDebt).reduce((s, i) => s + (i.amount || 0), 0);

  const moneyLeft = totalIncome - totalItems;
  qs('dist-money-left').textContent = '₱' + formatMoney(moneyLeft);
  qs('dist-debts-accrued').textContent = '₱' + formatMoney(totalDebtsAccrued);
  qs('dist-expected-salary').textContent = incomeEntries.length > 0 ? '₱' + formatMoney(totalIncome) : 'None';
}

function buildDistributorPlanText(){
  const totalIncome = incomeEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalItems = budgetItems.reduce((s, i) => s + (i.amount || 0), 0);
  const totalDebtsAccrued = budgetItems.filter(i => i.isDebt).reduce((s, i) => s + (i.amount || 0), 0);
  const moneyLeft = totalIncome - totalItems;
  const expectedMoney = incomeEntries.length > 0 ? '₱' + formatMoney(totalIncome) : 'None';

  const lines = [];
  lines.push('STASHIMO - Distributor Plan');
  lines.push('Plan Name: ' + (distPlanName || 'Untitled Plan'));
  lines.push('');
  lines.push('Money Left: ₱' + formatMoney(moneyLeft));
  lines.push('Expected Money: ' + expectedMoney);
  lines.push('Debts Accrued: ₱' + formatMoney(totalDebtsAccrued));
  lines.push('');

  lines.push('Income:');
  if (incomeEntries.length === 0) lines.push('  (none)');
  else incomeEntries.slice().sort((a,b) => a.date.localeCompare(b.date)).forEach(e => {
    lines.push(`  - ${e.name}: ₱${formatMoney(e.amount)} (${fromISODate(e.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })})`);
  });
  lines.push('');

  const regular = budgetItems.filter(i => !i.isDebt);
  lines.push('Planned Items:');
  if (regular.length === 0) lines.push('  (none)');
  else regular.slice().sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999')).forEach(i => {
    const dateLabel = i.date ? fromISODate(i.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'No date set';
    lines.push(`  - ${i.name}: ₱${formatMoney(i.amount)} (${dateLabel})${i.paid ? ' [paid]' : ''}`);
  });
  lines.push('');

  const debts = budgetItems.filter(i => i.isDebt);
  lines.push('Debts & Credit Card Purchases:');
  if (debts.length === 0) lines.push('  (none)');
  else debts.slice().sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999')).forEach(i => {
    const dateLabel = i.date ? fromISODate(i.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'No date set';
    lines.push(`  - ${i.name}: ₱${formatMoney(i.amount)} (${dateLabel})${i.paid ? ' [paid]' : ''}`);
  });

  if (distNotes && distNotes.trim()){
    lines.push('');
    lines.push('Other Notes:');
    lines.push(distNotes.trim());
  }

  return lines.join('\n');
}

function copyDistributorPlan(){
  const text = buildDistributorPlanText();
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(
      () => uiAlert('Plan copied to clipboard.'),
      () => fallbackCopyText(text)
    );
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); uiAlert('Plan copied to clipboard.'); }
  catch(e){ uiAlert('Could not copy automatically. Use Export Plan instead.'); }
  document.body.removeChild(ta);
}

function exportDistributorPlan(){
  const text = buildDistributorPlanText();
  neoSave('stashimo-distributor-plan-' + toISODate(new Date()) + '.txt', text, 'text/plain');
}

async function clearDistributorEntries(){
  if (!(await uiConfirm('This clears all saved income and expenses/repayments in the Distributor tab. This can\'t be undone. Continue?'))) return;
  incomeEntries = [];
  budgetItems = [];
  saveIncomeEntries();
  saveBudgetItems();
  resetIncomeForm();
  resetBudgetItemForm();
  renderDistributor();
}

function renderDistributor(){
  renderDistPlanNameInput();
  renderDistributorSummary();
  renderDistIncomeList();
  renderDistBudgetLists();
  qs('dist-other-notes').value = distNotes;
}

applyTheme(currentTheme);
refreshTypeSelects();
processAutoDeducts();
renderPantry();
renderRestockEstimate();
renderPlanner();
renderDistributor();



window.ST={addDays,addExtraGroceryItem,addIngredientRow,adjustCount,adjustPercent,applyAutoDeductConfigToItem,applyAutoDeductForItem,applyTheme,autoDeductConfigsEqual,batchCostForQty,buildDistributorPlanText,buildTheme,calNextMonth,calPrevMonth,changeWeek,clearDistributorEntries,closeCalendar,closeItemModal,closeMealModal,closeSettings,closeTutorial,closeTypeModal,collapsePantryList,collectAutoDeductConfig,collectIngredientsFromModal,commitGroceryItemCost,computeAutoDeductTicksDue,computeMealStats,computeMealStatsFromIngredients,copyDistributorPlan,deleteBudgetItemFromForm,deleteBudgetItemInline,deleteExtraGroceryItem,deleteIncomeFromForm,deleteIncomeInline,deleteItem,deleteItemInline,deleteMeal,deleteMealInline,deleteTypeConfirm,editBudgetItemInline,editIncomeInline,editItem,editMeal,editTypeInline,esc,expandPantryList,exportData,exportDistributorPlan,fallbackCopyText,formatMoney,formatWeekRange,fromISODate,getMonday,getWeekIngredients,goToThisWeek,goToTutStep,hexToRgba,importData,initTypeFilters,lastDayOfMonth,loadJSON,mealIngredientsFor,mealsForCurrentWeek,neededQtyForItem,onAutoDeductFreqTypeChange,onAutoDeductModeChange,onAutoDeductToggle,onDistNotesChange,onDistPlanNameChange,onIngredientNameInput,onTrackPercentChange,onUnitSelectChange,openCalendar,openMealModal,openSettings,openTutorial,openTypeModal,pad2,perMealShare,persistCurrentWeek,persistDistNotes,persistDistPlanName,populateAutoDeductForm,processAutoDeducts,qs,recomputeStatus,refreshAutoDeductModeOptions,refreshTypeSelects,renderAutoDeductFreqDetail,renderCalendar,renderDistBudgetLists,renderDistIncomeList,renderDistPlanNameInput,renderDistributor,renderDistributorSummary,renderGroceryList,renderGroupHtml,renderItemCardHtml,renderMealCardHtml,renderMealWeekList,renderPantry,renderPlanner,renderRestockEstimate,renderThemeSwatches,renderTypeFilterCheckboxes,renderTypeList,renderWeekNav,resetAllData,resetAutoDeductForm,resetBudgetItemForm,resetIncomeForm,resolveUnitFromInputs,saveBudgetItem,saveBudgetItems,saveExtraGroceryItems,saveIncome,saveIncomeEntries,saveItem,saveItems,saveMeal,saveMeals,saveType,saveTypes,saveWeekIngredients,selectTheme,selectWeekFromDate,setAllTypeFilters,setPantryFilter,setPercentDirectly,showPage,startEditGroceryCost,toISODate,toggleBudgetItemPaid,toggleCollapsible,toggleExtraBought,toggleIngredientBought,toggleStatus,toggleTypeFilter,toggleTypeFilterPanel,touchAutoDeductClock,tutNav,uid,unlinkMealIngredients,updateItem,updateTutorialUI};
})();

/* ---------- part 5: routing between Home, Food/Health pages (eatshimo) and Supplies/Planner/Money pages (stashimo) ---------- */
(function(){
  const $=id=>document.getElementById(id), root=document.documentElement;
  // category map: change a page's group here (and in the sidebar markup)
  const R={home:{t:'Home'},
    library:{t:'Food Library',c:'Food',a:'es'}, daily:{t:'Daily Log',c:'Food',a:'es'}, profile:{t:'Profile',c:'Health',a:'es'},
    planner:{t:'Meal Planner',c:'Food',a:'st'}, pantry:{t:'Supplies',c:'Household',a:'st'}, distributor:{t:'Distributor',c:'Money',a:'st'}};
  const A={
    es:{top:'esTop',view:'view-es',help:'esHelp',title:'esTitle',tabs:'#esTabs .tab',seen:'eatshimo_tutorial_seen',show:r=>showPage(r),tut:()=>openTutorial(),mark:false},
    st:{top:'stTop',view:'view-st',help:'stHelp',title:'stTitle',tabs:'#stTabs .tab',seen:'stashimo_tutorial_seen',show:r=>ST.showPage(r),tut:()=>ST.openTutorial(),mark:true}};
  function route(){
    let r=(location.hash.match(/^#\/(\w+)/)||[])[1]; if(!R[r]) r='home';
    const home=r==='home', app=R[r].a;
    $('view-home').hidden=!home;
    Object.keys(A).forEach(k=>{const on=app===k;$(A[k].top).hidden=!on;$(A[k].view).hidden=!on;$(A[k].help).hidden=!on;});
    document.querySelectorAll('.sb-nav [data-route]').forEach(a=>a.classList.toggle('on',a.dataset.route===r));
    root.classList.remove('sb-open');
    if(!home){
      const x=A[app];
      $(x.title).innerHTML=R[r].t+'<small>'+R[r].c+'</small>';
      document.querySelectorAll(x.tabs).forEach(b=>b.classList.toggle('active',b.dataset.r===r));
      x.show(r);
      let seen=true;try{seen=!!localStorage.getItem(x.seen);}catch(_){}
      if(!seen&&$('nameSheet').hidden){ if(x.mark)try{localStorage.setItem(x.seen,'1');}catch(_){} setTimeout(x.tut,350); }
    }
    document.title=home?'neo':R[r].t+' \u00b7 neo';
    window.scrollTo(0,0);
  }
  document.querySelectorAll('#esTabs .tab,#stTabs .tab').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.r;});
  window.addEventListener('hashchange',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route);else route();
})();

/* ---------- part 6: offline support (service worker) ---------- */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}
