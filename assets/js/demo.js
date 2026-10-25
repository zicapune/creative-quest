/* =====================================================================
   ZICA CREATIVE QUEST — demo.js   (PREVIEW ONLY)
   ---------------------------------------------------------------------
   Pretends to be the Supabase server so the site works before Supabase
   is connected. Loaded ONLY when config.js has no SUPABASE_URL.
   Nothing is saved except in this browser tab; the OTP code is shown on screen.
   The live deploy (GitHub Actions) removes demo.js + demo-questions.js.
   ===================================================================== */
window.CQ_DEMO = (function () {
  'use strict';
  var ALL = window.CQ_DEMO_QUESTIONS || [];
  var LIMIT = ((window.CQ_CONFIG || {}).DEFAULTS || {}).totalQuestions || 25;
  function setOf(name) { return ALL.filter(function (q) { return q.set === name; }).slice(0, LIMIT); }

  var store = { attempts: {}, lead: null, otp: null, cert: null };
  try { var saved = JSON.parse(sessionStorage.getItem('cq_demo') || 'null'); if (saved) store = saved; } catch (e) {}
  function save() { try { sessionStorage.setItem('cq_demo', JSON.stringify(store)); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rid(n) { var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function fail(msg, code) { var e = new Error(msg); e.code = code || 'user'; throw e; }
  function maskEmail(e) { var p = String(e).split('@'); return p[1] ? p[0].slice(0, 2) + '••••@' + p[1] : e; }
  function phoneOk(p, cc) {
    var d = String(p || '').replace(/\D/g, ''); cc = String(cc || '91').replace(/\D/g, '') || '91';
    if (/^\s*\+/.test(p)) return d.length >= 8 && d.length <= 15 ? '+' + d : '';
    if (cc === '91') { if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? '+91' + d : ''; }
    d = d.replace(/^0+/, ''); return (cc + d).length >= 8 && (cc + d).length <= 15 ? '+' + cc + d : '';
  }
  function emailOk(e) { e = String(e || '').trim().toLowerCase(); return /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e) ? e : ''; }
  function certName(n) {
    n = String(n || '').replace(/\s+/g, ' ').trim();
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$/.test(n)) return '';
    if (n === n.toLowerCase() || n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|[\s'-])([a-zà-öø-ÿ])/g, function (m, p, c) { return p + c.toUpperCase(); });
    return n;
  }
  function contact(l) { return { name: l.name, email: l.email, phone: l.phone, countryCode: l.phone.indexOf('+91') === 0 ? '91' : '', national: l.phone.replace(/^\+91/, '').replace(/^\+/, ''), emailVerified: !!l.verified, phoneVerified: false }; }
  function pub(q) { return { id: q.id, category: q.category, type: q.type, text: q.text, options: q.options, asset: q.asset, assetAlt: q.assetAlt }; }
  function byId(id) { return ALL.filter(function (q) { return q.id === id; })[0]; }

  var A = {
    boot: function () { return Object.assign({}, window.CQ_CONFIG.DEFAULTS, { demo: true }); },
    start: function (b) {
      var setName = (Number(b.attemptNo) || 1) % 2 === 0 ? 'B' : 'A';
      var list = setOf(setName);
      if (!list.length) { setName = 'A'; list = setOf('A'); }
      var id = 'A-000000-' + rid(6);
      store.attempts[id] = { qids: list.map(function (q) { return q.id; }), ans: {}, res: {}, done: false, score: 0 }; save();
      return { attemptId: id, questions: list.map(pub), total: list.length, set: setName };
    },
    answer: function (b) {
      var a = store.attempts[b.attemptId]; if (!a) fail('SESSION_EXPIRED', 'expired');
      var q = byId(b.qid);
      if (a.ans[q.id] === undefined) { a.ans[q.id] = b.choice; a.res[q.id] = b.choice === q.correct ? 1 : 0; save(); }
      return { correct: a.res[q.id] === 1, chosenIndex: a.ans[q.id], correctIndex: q.correct, correctText: q.options[q.correct], explanation: q.explanation, answered: Object.keys(a.ans).length, total: a.qids.length };
    },
    finish: function (b) {
      var a = store.attempts[b.attemptId]; if (!a) fail('SESSION_EXPIRED', 'expired');
      var missing = a.qids.filter(function (id) { return a.ans[id] === undefined; });
      if (missing.length) return { incomplete: true, missing: missing };
      a.done = true; a.score = a.qids.reduce(function (s, id) { return s + (a.res[id] ? 1 : 0); }, 0); save();
      return { score: a.score, total: a.qids.length, recap: a.qids.map(function (id) { return { topic: byId(id).topic, correct: !!a.res[id] }; }) };
    },
    lead: function (b) {
      var errors = {};
      var name = String(b.name || '').trim(), email = emailOk(b.email), phone = phoneOk(b.phone, b.countryCode);
      if (name.length < 2) errors.name = 'Please tell us your name.';
      if (!email) errors.email = 'Please check your email address.';
      if (!phone) errors.phone = 'Please enter a valid WhatsApp mobile number, including the country code.';
      if (Object.keys(errors).length) return { ok: false, errors: errors };
      var a = store.attempts[b.attemptId];
      store.lead = { id: 'L-DEMO' + rid(4), key: rid(24), name: name, email: email, phone: phone, best: a ? a.score : 0, total: a ? a.qids.length : LIMIT, verified: false };
      save();
      return { ok: true, leadId: store.lead.id, leadKey: store.lead.key, landingUrl: '', contact: contact(store.lead), waQueued: false };
    },
    link: function () { return { ok: true }; },
    opened: function () { return { ok: true }; },
    confirm: function (b) {
      if (!store.lead) fail('Please enter your details again.', 'no_lead');
      var errors = {};
      var name = certName(b.name), email = emailOk(b.email), phone = phoneOk(b.phone, b.countryCode);
      if (!name) errors.name = 'Use English letters for your name (2–60 characters), exactly as it should be printed.';
      if (!email) errors.email = 'Please check your email address.';
      if (!phone) errors.phone = 'Please enter a valid WhatsApp mobile number, including the country code.';
      if (Object.keys(errors).length) return { ok: false, errors: errors };
      Object.assign(store.lead, { name: name, email: email, phone: phone }); save();
      return { ok: true, contact: contact(store.lead), otp: { channel: 'email', masked: maskEmail(email) } };
    },
    otp_send: function () {
      if (!store.lead) fail('Please enter your details again.', 'no_lead');
      store.otp = String(Math.floor(100000 + Math.random() * 900000)); save();
      return { ok: true, channel: 'test', masked: maskEmail(store.lead.email), testCode: store.otp, note: 'DEMO MODE — no message is sent.' };
    },
    otp_verify: function (b) {
      if (!store.otp || String(b.code) !== store.otp) fail('That code doesn\'t match. Check the code and try again.', 'wrong_code');
      store.otp = null;
      var id = (store.cert && store.cert.id) || ('ZCQ26-' + rid(6));
      store.cert = { id: id, name: store.lead.name, issuedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), score: store.lead.best, total: store.lead.total };
      save();
      return { ok: true, certificate: Object.assign({ pageUrl: 'certificate.html?id=' + id + '&k=demo', pdfUrl: '' }, store.cert), emailed: false, whatsapped: false, masked: maskEmail(store.lead.email) };
    },
    cert: function (b) {
      if (!store.cert || store.cert.id !== String(b.id || '').toUpperCase()) return { valid: false };
      return Object.assign({ valid: true, cert: window.CQ_CONFIG.DEFAULTS.cert, pdfUrl: '', verifiedVia: 'test' }, store.cert);
    }
  };

  return {
    call: function (action, data) {
      return wait(action === 'answer' ? 160 : 240).then(function () {
        if (!A[action]) fail('Unknown action');
        return A[action](data);
      });
    }
  };
})();
