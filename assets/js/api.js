/* =====================================================================
   ZICA CREATIVE QUEST — api.js
   One door to the server. LIVE = Supabase Edge Function "quest".
   DEMO = demo.js in the browser (loaded only when config.js has no Supabase URL).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.CQ_CONFIG || {};
  var base = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var url = CFG.FUNCTION_URL || (base ? base + '/functions/v1/' + (CFG.FUNCTION_NAME || 'quest') : '');
  // Run the function next to the database (Mumbai), wherever the phone is: one fast hop instead of many slow ones.
  if (url && CFG.FUNCTION_REGION) url += (url.indexOf('?') < 0 ? '?' : '&') + 'forceFunctionRegion=' + encodeURIComponent(CFG.FUNCTION_REGION);
  var mode = url ? 'live' : 'demo';

  var demoReady = null;
  function loadScript(name) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      var me = document.querySelector('script[src*="assets/js/api.js"]');
      s.src = (me ? me.src.replace(/api\.js(\?.*)?$/, '') : 'assets/js/') + name;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Preview files missing (' + name + ').')); };
      document.head.appendChild(s);
    });
  }
  function loadDemo() {
    if (!demoReady) demoReady = loadScript('demo-questions.js').then(function () { return loadScript('demo.js'); }).then(function () { return window.CQ_DEMO; });
    return demoReady;
  }

  function ApiError(message, code, fields) {
    var e = new Error(message || 'Something went wrong. Please try again.');
    e.code = code || '';
    e.fields = fields || null;
    return e;
  }

  function post(action, data, attempt) {
    var body = Object.assign({ action: action }, data || {});
    var headers = { 'content-type': 'application/json' };
    if (CFG.SUPABASE_ANON_KEY) {
      headers.apikey = CFG.SUPABASE_ANON_KEY;
      headers.authorization = 'Bearer ' + CFG.SUPABASE_ANON_KEY;
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        clearTimeout(timer);
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.error) throw ApiError(j.error || ('Server error (' + r.status + ')'), j.code, j.fields);
          return j;
        });
      }, function (netErr) {
        clearTimeout(timer);
        // One quiet retry for flaky mobile networks
        if (!attempt) return new Promise(function (res) { setTimeout(res, 900); }).then(function () { return post(action, data, 1); });
        throw ApiError('Connection dropped. Check your internet and try again.', 'network');
      });
  }

  window.CQ_API = {
    mode: mode,
    functionUrl: url,
    call: function (action, data) {
      if (mode === 'live') return post(action, data);
      return loadDemo().then(function (demo) { return demo.call(action, data || {}); });
    }
  };
})();
