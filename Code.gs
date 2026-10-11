/**
 * neo backend — Google Apps Script Web App
 * SETUP: open your Google Sheet > Extensions > Apps Script > paste this file > set SECRET below >
 *        run setup() once (authorize) > Deploy > New deployment > Web app (Execute as: Me, Access: Anyone) > copy the /exec URL
 *        into config.js (or the app's Settings page). After editing this file: Deploy > Manage deployments > New version.
 * Each tab is created automatically: column A = id, then the fields below, last column = updated.
 * Dates are stored as text (yyyy-MM-dd) so Sheets never reformats them. Add your own extra columns to the right of "updated" freely.
 */
const SECRET = 'jpafnba1804!';   // must match config.js
const SHEET_ID = '';                   // leave blank when this script is opened from the sheet itself

const SCHEMA = {
  Profile:    ['name', 'birthday', 'sex', 'heightCm', 'weightKg', 'goalWeightKg', 'activity', 'calorieTarget', 'notes'],
  DailyLog:   ['date', 'meal', 'food', 'calories', 'protein', 'carbs', 'fat', 'water', 'weightKg', 'notes'],
  Foods:      ['name', 'serving', 'calories', 'protein', 'carbs', 'fat'],
  Meals:      ['date', 'slot', 'food', 'notes'],
  Todos:      ['title', 'due', 'priority', 'status', 'notes'],
  Habits:     ['name', 'note'],
  HabitLog:   ['habit', 'date'],
  Events:     ['date', 'time', 'title', 'notes'],
  Notes:      ['title', 'body', 'pinned'],
  Finance:    ['date', 'type', 'category', 'amount', 'account', 'notes'],
  Budgets:    ['kind', 'name', 'category', 'amount', 'saved', 'deadline'],
  Categories: ['name', 'kind']
};
const SEED_CATEGORIES = [['Food', 'expense'], ['Transport', 'expense'], ['Bills', 'expense'], ['Rent', 'expense'], ['Shopping', 'expense'], ['Health', 'expense'], ['Entertainment', 'expense'], ['Other', 'expense'], ['Salary', 'income'], ['Business', 'income'], ['Other income', 'income']];

function setup() { Object.keys(SCHEMA).forEach(tab_); }

function doGet(e) {
  const cb = e.parameter.callback, p = e.parameter;
  try {
    if ((p.secret || '') !== SECRET) return out_({ ok: false, error: 'unauthorized' }, cb);
    if (p.action === 'ping') return out_({ ok: true, tabs: Object.keys(SCHEMA) }, cb);
    if (p.action === 'list') return out_({ ok: true, rows: list_(p.tab) }, cb);
    if (p.action === 'delete') return out_(del_(p.tab, p.id), cb);
    return out_({ ok: false, error: 'unknown action' }, cb);
  } catch (err) { return out_({ ok: false, error: String(err.message || err) }, cb); }
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.secret !== SECRET) return out_({ ok: false, error: 'unauthorized' });
    if (b.action === 'save') return out_({ ok: true, row: save_(b.tab, b.row) });
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) { return out_({ ok: false, error: String(err.message || err) }); }
}

function out_(obj, cb) {
  const s = JSON.stringify(obj);
  return cb ? ContentService.createTextOutput(cb + '(' + s + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
            : ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }

function tab_(name) {
  if (!SCHEMA[name]) throw new Error('Unknown tab: ' + name);
  const ss = ss_(); let sh = ss.getSheetByName(name);
  if (!sh) {
    const H = ['id'].concat(SCHEMA[name], ['updated']);
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), H.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, H.length).setValues([H]).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (name === 'Categories') SEED_CATEGORIES.forEach(c => save_('Categories', { name: c[0], kind: c[1] }, sh));
  }
  return sh;
}

function head_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }

function list_(tab) {
  const sh = tab_(tab), n = sh.getLastRow(); if (n < 2) return [];
  const H = head_(sh);
  return sh.getRange(2, 1, n - 1, H.length).getValues().filter(r => r[0] !== '').map(r => { const o = {}; H.forEach((h, i) => { if (h) o[h] = String(r[i]); }); return o; });
}

function findRow_(sh, id) {
  const n = sh.getLastRow(); if (n < 2 || !id) return 0;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function save_(tab, row, shArg) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shArg || tab_(tab), H = head_(sh);
    row.updated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    let r = findRow_(sh, row.id);
    if (!r) { row.id = Utilities.getUuid().replace(/-/g, '').slice(0, 10); r = sh.getLastRow() + 1; }
    const cur = r <= sh.getLastRow() ? sh.getRange(r, 1, 1, H.length).getValues()[0] : [];
    const vals = H.map((h, i) => row[h] !== undefined ? String(row[h]) : (cur[i] !== undefined ? cur[i] : ''));
    sh.getRange(r, 1, 1, H.length).setNumberFormat('@').setValues([vals]);
    const o = {}; H.forEach((h, i) => o[h] = vals[i]); return o;
  } finally { lock.releaseLock(); }
}

function del_(tab, id) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { const sh = tab_(tab), r = findRow_(sh, id); if (!r) return { ok: false, error: 'Not found.' }; sh.deleteRow(r); return { ok: true }; }
  finally { lock.releaseLock(); }
}
