/* Stashimo (Supplies / Meal Planner / Distributor) for neo.
   Loaded by app.js the first time a Stashimo page is opened; uses the markup in stashimo.html.
   Everything runs in its own scope and is exposed as window.ST for the inline handlers. */
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
let currentTheme = neoTheme.current();
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

function applyTheme(key){ neoTheme.apply(key); }

function selectTheme(key){
  currentTheme = key;
  neoTheme.set(key);
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
