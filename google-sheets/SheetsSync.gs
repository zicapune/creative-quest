/**
 * ZICA CREATIVE QUEST — SheetsSync.gs
 * ------------------------------------------------------------------
 * Keeps a Google Sheets copy of everything in Supabase, and lets you edit
 * Questions + Settings in the sheet and push them to the live quiz.
 *
 * Paste into: a Google Sheet in the Azpire Gmail account → Extensions → Apps Script
 * (this is the ONLY file needed).
 *
 * Run once, in order:
 *   1. saveSyncSettings()        (fill the two values inside it first)
 *   2. setupSheetsSync()         creates the tabs and pulls Questions + Settings
 *   3. installSyncTrigger()      copies new data every 5 minutes
 *
 * The sheet also gets a "Creative Quest" menu → Sync now.
 * Every sync re-reads the last 3 minutes too, so a submission that was still being
 * saved during the previous sync is always picked up (rows are matched by ID, so
 * re-reading never creates duplicates).
 *
 * Any time:
 *   syncFromSupabase()           copy new/changed rows now
 *   pushQuestionsToSupabase()    after editing the Questions tab
 *   pushSettingsToSupabase()     after editing the Settings tab
 *   pullQuestionsAndSettings()   overwrite those two tabs with what's live
 *   resyncEverything()           rebuild the data tabs from scratch
 *
 * Data tabs (Leads, QuizAttempts, Certificates, MessageLog) are a COPY:
 * edits made there are overwritten on the next sync. Edit Questions/Settings only.
 */

var SYNC = {
  TABS: {
    leads: 'Leads',
    attempts: 'QuizAttempts',
    certificates: 'Certificates',
    messages: 'MessageLog',
    questions: 'Questions',
    settings: 'Settings'
  },
  HEADERS: {
    leads: ['Lead ID', 'Created', 'Updated', 'Name', 'Email', 'WhatsApp', 'Course Interest', 'Source', 'Campaign', 'Quiz Status',
      'Latest Score', 'Best Score', 'Total Questions', 'Attempts', 'Marketing Consent', 'Marketing Consent At', 'Consent Source', 'Email Check',
      'Email Status', 'Phone Status', 'Learning Access', 'Lessons Opened At', 'Name (first typed)', 'Email (first typed)',
      'WhatsApp (first typed)', 'Edits', 'Verified', 'Auth Provider'],
    attempts: ['Attempt ID', 'Lead ID', 'Started', 'Completed', 'Status', 'Attempt No', 'Question Set', 'Score', 'Total', 'Answers', 'Result',
      'Source', 'Campaign', 'Device'],
    certificates: ['Certificate ID', 'Lead ID', 'Name on Certificate', 'Issued', 'Updated', 'Score', 'Total', 'Verified Via',
      'Email Sent', 'WhatsApp Sent', 'Downloads', 'Revoked', 'Certificate Page'],
    messages: ['Log ID', 'Created', 'Updated', 'Lead ID', 'Channel', 'Category', 'Provider', 'To', 'Status', 'Provider Ref',
      'Delivery', 'Info'],
    // Sheet header → database column
    questions: [['Question ID', 'id'], ['Order', 'sort'], ['Active', 'active'], ['Category', 'category'], ['Type', 'type'],
      ['Topic', 'topic'], ['Question', 'question'], ['Option A', 'option_a'], ['Option B', 'option_b'], ['Option C', 'option_c'],
      ['Option D', 'option_d'], ['Correct', 'correct'], ['Explanation', 'explanation'], ['Asset', 'asset'], ['Asset Alt', 'asset_alt'],
      ['Set', 'set_name']],
    settings: [['Key', 'key'], ['Value', 'value'], ['Notes', 'notes']]
  },
  TEXT_COLS: ['Lead ID', 'Attempt ID', 'Certificate ID', 'Log ID', 'WhatsApp', 'WhatsApp (first typed)', 'Email', 'Created', 'Updated',
    'Started', 'Completed', 'Issued', 'Marketing Consent At', 'Lessons Opened At', 'Key', 'Value', 'Answers', 'Result']
};

/* ============================== ONE-TIME SETUP ============================== */

/** Fill both values, Run, then you may blank them again (they stay saved in Script Properties). */
function saveSyncSettings() {
  var FUNCTION_URL = 'https://elrgbounsplqheblmvaa.supabase.co/functions/v1/quest';
  var SYNC_TOKEN = '';     // paste the SYNC_TOKEN here (never commit it)
  var p = PropertiesService.getScriptProperties();
  if (FUNCTION_URL) p.setProperty('CQ_FUNCTION_URL', FUNCTION_URL.replace(/\/+$/, ''));
  if (SYNC_TOKEN) p.setProperty('CQ_SYNC_TOKEN', SYNC_TOKEN);
  Logger.log('Function URL: ' + (p.getProperty('CQ_FUNCTION_URL') || '— missing —'));
  Logger.log('Sync token: ' + (p.getProperty('CQ_SYNC_TOKEN') ? 'saved' : '— missing —'));
}

function setupSheetsSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SYNC.TABS).forEach(function (k) {
    var h = SYNC.HEADERS[k].map(function (x) { return Array.isArray(x) ? x[0] : x; });
    var sh = ss.getSheetByName(SYNC.TABS[k]) || ss.insertSheet(SYNC.TABS[k]);
    sh.getRange(1, 1, 1, h.length).setValues([h])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1d1736');
    sh.setFrozenRows(1);
    h.forEach(function (name, i) {
      if (SYNC.TEXT_COLS.indexOf(name) >= 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  });
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  pullQuestionsAndSettings();
  syncFromSupabase();
  Logger.log('✅ Sheets copy is ready.');
}

function installSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncFromSupabase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncFromSupabase').timeBased().everyMinutes(5).create();
  Logger.log('✅ Auto-copy every 5 minutes is on.');
}

/* ================================ MENU ================================ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Creative Quest')
    .addItem('Sync now', 'syncFromSupabase')
    .addSeparator()
    .addItem('Push Questions to the live quiz', 'pushQuestionsToSupabase')
    .addItem('Push Settings to the live quiz', 'pushSettingsToSupabase')
    .addItem('Reload Questions + Settings from the live quiz', 'pullQuestionsAndSettings')
    .addToUi();
}

/* ================================ DATA COPY ================================ */

function syncFromSupabase() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var cursor = props.getProperty('CQ_SYNC_CURSOR') || '';
    var total = 0;
    // Overlap: start 3 minutes before the last cursor (upsert by ID → no duplicates).
    var since = cursor ? new Date(new Date(cursor).getTime() - 3 * 60 * 1000).toISOString() : '';
    for (var round = 0; round < 6; round++) {
      var res = callQuest_('admin_export', { since: since });
      ['leads', 'attempts', 'certificates', 'messages'].forEach(function (k) {
        if (res[k] && res[k].length) { upsertRows_(SYNC.TABS[k], SYNC.HEADERS[k], res[k]); total += res[k].length; }
      });
      cursor = res.cursor;
      since = cursor;
      props.setProperty('CQ_SYNC_CURSOR', cursor);
      if (!res.more) break;
    }
    props.setProperty('CQ_LAST_SYNC', new Date().toISOString());
    Logger.log('✅ Synced ' + total + ' new/changed rows (incl. 3-min overlap). Cursor: ' + cursor);
  } finally {
    lock.releaseLock();
  }
}

function resyncEverything() {
  PropertiesService.getScriptProperties().deleteProperty('CQ_SYNC_CURSOR');
  syncFromSupabase();
}

/** Insert or update rows by their first column (the ID), in one write per tab. */
function upsertRows_(tabName, headers, rows) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sh) throw new Error('Missing tab ' + tabName + ' — run setupSheetsSync() first.');
  ensureHeaders_(sh, headers);
  var last = sh.getLastRow();
  var data = last >= 2 ? sh.getRange(2, 1, last - 1, headers.length).getValues() : [];
  var index = {};
  data.forEach(function (r, i) { index[String(r[0])] = i; });
  rows.forEach(function (obj) {
    var line = headers.map(function (h) { var v = obj[h]; return v === null || v === undefined ? '' : v; });
    var id = String(line[0]);
    if (index[id] !== undefined) data[index[id]] = line;
    else { index[id] = data.length; data.push(line); }
  });
  if (data.length) sh.getRange(2, 1, data.length, headers.length).setValues(data);
}

/** New columns added in a later version (e.g. Verified, Auth Provider) appear by themselves. */
function ensureHeaders_(sh, headers) {
  var cur = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  if (cur.join('|') === headers.join('|')) return;
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1d1736');
}

/* ============================ QUESTIONS & SETTINGS ============================ */

function pullQuestionsAndSettings() {
  var res = callQuest_('admin_pull', {});
  writeMapped_(SYNC.TABS.questions, SYNC.HEADERS.questions, res.questions || []);
  writeMapped_(SYNC.TABS.settings, SYNC.HEADERS.settings, res.settings || []);
  var q = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SYNC.TABS.questions);
  var n = Math.max(1, q.getLastRow() - 1);
  q.getRange(2, 3, n, 1).insertCheckboxes();
  q.getRange(2, 12, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['A', 'B', 'C', 'D'], true).build());
  [7, 13, 15].forEach(function (c) { q.setColumnWidth(c, 340); q.getRange(2, c, n, 1).setWrap(true); });
  Logger.log('✅ Pulled ' + (res.questions || []).length + ' questions and ' + (res.settings || []).length + ' settings.');
}

function pushQuestionsToSupabase() {
  var rows = readMapped_(SYNC.TABS.questions, SYNC.HEADERS.questions).filter(function (r) { return r.id && r.question; });
  rows.forEach(function (r) { r.active = r.active === true || String(r.active).toUpperCase() === 'TRUE'; });
  var res = callQuest_('admin_push', { questions: rows });
  Logger.log('✅ Pushed ' + res.questions + ' questions. Questions missing from the sheet were set inactive. Live within 1 minute.');
}

function pushSettingsToSupabase() {
  var rows = readMapped_(SYNC.TABS.settings, SYNC.HEADERS.settings).filter(function (r) { return r.key; });
  var res = callQuest_('admin_push', { settings: rows });
  Logger.log('✅ Pushed ' + res.settings + ' settings. Live within 1 minute.');
}

function writeMapped_(tabName, map, objs) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, map.length).clearContent();
  if (!objs.length) return;
  var values = objs.map(function (o) { return map.map(function (m) { var v = o[m[1]]; return v === null || v === undefined ? '' : v; }); });
  sh.getRange(2, 1, values.length, map.length).setValues(values);
}

function readMapped_(tabName, map) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, map.length).getValues().map(function (r) {
    var o = {};
    map.forEach(function (m, i) { o[m[1]] = typeof r[i] === 'string' ? r[i].trim() : r[i]; });
    return o;
  });
}

/* ================================== HTTP ================================== */

function callQuest_(action, payload) {
  var p = PropertiesService.getScriptProperties();
  var url = p.getProperty('CQ_FUNCTION_URL');
  var token = p.getProperty('CQ_SYNC_TOKEN');
  if (!url || !token) throw new Error('Run saveSyncSettings() first (Function URL + SYNC_TOKEN).');
  payload.action = action;
  payload.token = token;
  var resp = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var body = resp.getContentText();
  var json;
  try { json = JSON.parse(body); } catch (e) { throw new Error('Supabase replied HTTP ' + resp.getResponseCode() + ': ' + body.slice(0, 200)); }
  if (resp.getResponseCode() >= 300 || json.error) throw new Error('Supabase: ' + (json.error || ('HTTP ' + resp.getResponseCode())));
  return json;
}
