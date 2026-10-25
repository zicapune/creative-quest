/* =====================================================================
   ZICA CREATIVE QUEST — app.js  (v3 · viewport theme)
   welcome → name → quiz (+feedback) → result → contact → done
           → confirm details (edit ✏️) → verification code → certificate
   Answers, scores, codes and certificates are all decided on the server.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.CQ_CONFIG || {};
  var C = Object.assign({}, CFG.DEFAULTS || {});
  var API = window.CQ_API;
  var LETTERS = ['A', 'B', 'C', 'D'];
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var torusA = null, torusB = null;
  var S = {
    name: '', attemptId: '', attemptNo: 0, questions: [], idx: 0, selected: -1,
    locked: false, busy: false, answered: 0, result: null, startPromise: null,
    lead: null,            // { id, key }
    contact: null,         // { name, email, phone, countryCode, national, emailVerified, phoneVerified }
    landingUrl: '',
    otp: null,             // { channel, masked, testCode }
    certificate: null
  };

  /* ---------------------------- helpers ---------------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) { try { if (v == null) sessionStorage.removeItem('cq_' + k); else sessionStorage.setItem('cq_' + k, JSON.stringify(v)); } catch (e) {} }
  function recall(k) { try { return JSON.parse(sessionStorage.getItem('cq_' + k) || 'null'); } catch (e) { return null; } }
  function device() {
    var w = window.innerWidth || 1024;
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    return coarse && w < 768 ? 'mobile' : (coarse && w < 1366 ? 'tablet' : 'desktop');
  }
  function firstName() {
    var f = S.name ? S.name.split(' ')[0] : '';
    return f ? f.charAt(0).toUpperCase() + f.slice(1) : '';
  }
  function errText(err) {
    var m = String(err && err.message || err || '');
    return m.replace(/^Error:\s*/, '') || 'Something went wrong. Please try again.';
  }
  function isExpired(err) { return err && (err.code === 'expired' || /SESSION_EXPIRED/.test(String(err.message))); }

  var toastTimer;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, ms || 4000);
  }
  function busy(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-busy', !!on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  /* ---------------------------- screens ---------------------------- */
  var current = 'welcome';
  function show(name, focusId) {
    var prev = document.querySelector('.screen.is-active');
    if (prev) prev.classList.remove('is-active');
    var next = document.querySelector('[data-screen="' + name + '"]');
    next.classList.add('is-active');
    document.body.setAttribute('data-screen', name);
    current = name;
    $('toast').classList.remove('is-on');
    $('hudRight').textContent = HUD[name] || '';
    if (name === 'welcome' && torusA) torusA.start();
    window.scrollTo(0, 0);
    var f = focusId ? $(focusId) : next.querySelector('h2[tabindex="-1"], h1');
    if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, 60);
  }
  var HUD = { welcome: 'viewport · persp', name: 'scene setup', quiz: 'timeline', result: 'render complete', contact: 'export settings',
    done: 'output', confirm: 'final check', otp: 'verify', certificate: 'export · pdf', error: 'render failed' };
  function showFatal(msg) { $('errText').textContent = msg; show('error', 'errTitle'); }

  /* --------------------------- branding --------------------------- */
  function img(src, alt, cls, onFail) {
    var i = new Image();
    i.alt = alt || '';
    if (cls) i.className = cls;
    i.decoding = 'async';
    i.onerror = function () { i.remove(); if (onFail) onFail(); };
    i.src = src;
    return i;
  }

  function applyBranding() {
    var brand = $('brand');
    if (C.logoUrl && !brand.querySelector('.brand__logo')) {
      var l = img(C.logoUrl, C.institute || 'ZICA Pune', 'brand__logo');
      l.style.display = 'none';
      l.onload = function () { var t = brand.querySelector('.brand__word'); if (t) t.remove(); l.style.display = ''; };
      brand.insertBefore(l, brand.firstChild);
    }
    if (C.bgImageUrl) {
      var b = new Image();
      b.onload = function () { $('bgImg').style.backgroundImage = 'url("' + C.bgImageUrl.replace(/"/g, '%22') + '")'; $('bgImg').classList.add('is-on'); };
      b.src = C.bgImageUrl;
    }
    if (C.tagline) $('welcomeTagline').textContent = C.tagline;
    if (C.intro) $('welcomeIntro').textContent = C.intro;
    if (C.title) document.title = C.title;

    // Avatars: shown when the image exists, otherwise the built-in fallback stays
    Array.prototype.forEach.call(document.querySelectorAll('[data-avatar]'), function (slot) {
      var src = C[slot.getAttribute('data-avatar')];
      if (!src || slot.getAttribute('data-loaded') === src) return;
      slot.setAttribute('data-loaded', src);
      var a = img(src, '', 'avatar');
      a.onload = function () {
        Array.prototype.forEach.call(slot.querySelectorAll(':not(img)'), function (n) { if (n.parentNode === slot) n.remove(); });
        slot.classList.add('has-avatar');
        if (slot.id === 'mascotContact') $('contactWrap').classList.add('has-art');
      };
      slot.appendChild(a);
    });

    var sel = $('fCourse');
    if (sel.options.length <= 1 && C.courses && C.courses.length) {
      C.courses.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    }
    $('courseField').hidden = !(C.courses && C.courses.length);
    if (!$('fCc').value) $('fCc').value = C.countryCode || '91';
    $('waLessonRow').hidden = !C.waAvailable;
    if (C.privacyUrl && !$('notice').querySelector('a')) {
      $('notice').insertAdjacentHTML('beforeend', ' <a href="' + esc(C.privacyUrl) + '" target="_blank" rel="noopener">Privacy policy</a>.');
    }
    if (!marketingTouched) $('fMarketing').checked = C.marketingPreticked !== false;
    if (C.eligibilityNote) { $('eligNote').textContent = C.eligibilityNote; $('eligNote').hidden = false; }
    $('contactLine').textContent = C.contactLine || '';
    var certOn = !C.cert || C.cert.enabled !== false;
    $('btnUnlock').textContent = certOn ? 'Get My Free Lessons & Certificate' : 'Get My Free Lessons';
    if (C.totalQuestions) $('welcomeMeta').textContent = C.totalQuestions + ' questions · ~' + Math.max(3, Math.round(C.totalQuestions / 4)) + ' min · certificate';
    if (API.mode === 'demo') $('modeBadge').innerHTML = '<span class="demo-badge" title="Nothing is saved. Connect Supabase in assets/js/config.js to go live.">Demo mode</span>';
  }

  // Load live settings (welcome screen is already usable meanwhile)
  API.call('boot').then(function (live) {
    C = Object.assign({}, C, live || {});
    if (live && live.cert) C.cert = Object.assign({}, (CFG.DEFAULTS || {}).cert, live.cert);
    applyBranding();
  }).catch(function () { /* defaults are fine */ });

  /* ============================ 1. WELCOME ============================ */
  function startAttempt() {
    // Attempts are counted per device, so "Try again" (and a reload) gives the other question set.
    S.attemptNo = (Number(recall('attempts')) || 0) + 1;
    store('attempts', S.attemptNo);
    S.startPromise = API.call('start', { src: BOOT.src, campaign: BOOT.campaign, device: device(), attemptNo: S.attemptNo })
      .then(function (res) {
        S.attemptId = res.attemptId;
        S.questions = res.questions || [];
        S.set = res.set || '';
        CQVisuals.preload(S.questions.map(function (q) { return q.asset; }));
        return res;
      });
    S.startPromise.catch(function () {});
    return S.startPromise;
  }

  var qs = new URLSearchParams(location.search);
  var BOOT = {
    src: (qs.get('src') || qs.get('utm_source') || 'direct').replace(/[^\w.\-]/g, '_').slice(0, 60),
    campaign: (qs.get('utm_campaign') || qs.get('campaign') || '').replace(/[^\w.\-]/g, '_').slice(0, 80)
  };

  $('btnStart').addEventListener('click', function () {
    startAttempt();
    var saved = recall('name');
    if (saved) $('nameInput').value = saved;
    show('name', 'nameTitle');
  });

  /* ============================== 2. NAME ============================== */
  $('nameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    S.name = $('nameInput').value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (S.name) store('name', S.name);
    beginQuiz();
  });
  $('btnSkipName').addEventListener('click', function () { S.name = ''; beginQuiz(); });

  /* ============================== 3. QUIZ ============================== */
  function beginQuiz() {
    S.idx = 0; S.selected = -1; S.locked = false; S.answered = 0; S.result = null;
    show('quiz', 'qCount');
    $('qLoading').hidden = false;
    $('qLayout').hidden = true;
    setCount(0, 25);
    $('qCategory').textContent = '';
    $('qCheer').innerHTML = greetingLine();
    buildStrip(25);
    (S.startPromise || startAttempt()).then(function () {
      if (!S.questions.length) throw new Error('No questions are active right now.');
      buildStrip(S.questions.length);
      renderQuestion();
    }).catch(function (err) { $('qLoading').hidden = true; showFatal(errText(err)); });
  }

  function greetingLine() {
    return firstName() ? 'Hi <strong>' + esc(firstName()) + '</strong>! Ready to explore your creative side?' : 'Ready to explore your creative side?';
  }
  var CHEERS = ['You\'re making progress — keep going!', 'Nice rhythm. Keep it rolling!', 'Every answer teaches you something new.', 'Trust your eye — artists do.', 'Look closely — the details tell the story.'];
  function cheerFor(i, total) {
    if (i === 0) return greetingLine();
    if (i === total - 1) return 'Final question — you\'re almost there!';
    if (i === Math.floor(total / 2)) return 'Halfway there' + (firstName() ? ', ' + esc(firstName()) : '') + ' — nice work!';
    return CHEERS[i % CHEERS.length];
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function setCount(i, total) {
    $('qCount').innerHTML = '<span class="q-count__n">' + pad2(i + 1) + '</span><span class="q-count__of">/ ' + total + '</span>';
    $('qCount').setAttribute('aria-label', 'Question ' + (i + 1) + ' of ' + total);
  }
  var results = [];
  function buildStrip(n) {
    var html = '';
    for (var i = 0; i < n; i++) html += '<i class="tl__key" style="left:' + (n > 1 ? (i / (n - 1) * 100) : 0).toFixed(3) + '%"></i>';
    $('tlKeys').innerHTML = html;
    $('tl').setAttribute('aria-valuemax', String(n));
    results = [];
    updateStrip();
  }
  function updateStrip() {
    var keys = $('tlKeys').children, n = keys.length;
    for (var i = 0; i < n; i++) {
      keys[i].classList.toggle('is-done', i < S.answered && results[i] !== true);
      keys[i].classList.toggle('is-right', i < S.answered && results[i] === true);
      keys[i].classList.toggle('is-now', i === S.idx && i >= S.answered);
    }
    var pos = n > 1 ? (Math.min(S.idx, n - 1) / (n - 1) * 100) : 0;
    $('tlHead').style.left = pos + '%';
    $('tlHead').setAttribute('data-f', 'f' + pad2(Math.min(S.idx + 1, n)));
    $('tlFill').style.width = (n > 1 ? (Math.max(0, S.answered - 1) / (n - 1) * 100) : 0) + '%';
    $('tl').setAttribute('aria-valuenow', String(S.answered));
    $('tl').setAttribute('aria-valuetext', S.answered + ' of ' + n + ' answered');
  }

  function renderQuestion() {
    var q = S.questions[S.idx], total = S.questions.length;
    S.selected = -1; S.locked = false;
    $('qLoading').hidden = true;
    $('qLayout').hidden = false;
    setCount(S.idx, total);
    $('qCategory').textContent = q.category || '';
    $('qCheer').innerHTML = cheerFor(S.idx, total);
    $('qNudge').textContent = '';

    var vis = CQVisuals.render(q.asset, q.assetAlt);
    var hint = q.type === 'animation' ? '▶ watch closely' : (q.type === 'puzzle' ? '◆ creative puzzle' : (vis ? 'cam_01 · look closely' : ''));
    $('qVisual').innerHTML = vis;
    $('qHint').textContent = hint;
    $('qLayout').classList.toggle('no-visual', !vis);

    $('qText').textContent = q.text;
    var short = q.options.every(function (o) { return o.length <= 22; });
    var opts = $('opts');
    opts.className = 'opts' + (short && q.options.length === 4 ? ' opts--grid' : '');
    opts.innerHTML = q.options.map(function (o, i) {
      return '<button type="button" class="opt-card" role="radio" aria-checked="false" data-i="' + i + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
        '<span class="opt-card__key">' + LETTERS[i] + '</span><span class="opt-card__text">' + esc(o) + '</span></button>';
    }).join('');
    var btn = $('btnSubmit');
    btn.textContent = 'Submit & Continue';
    btn.classList.add('is-dim');
    busy(btn, false);
    updateStrip();
    setTimeout(function () { $('qText').focus({ preventScroll: true }); }, 40);
  }

  function select(i) {
    if (S.locked) return;
    S.selected = i;
    var cards = $('opts').querySelectorAll('.opt-card');
    for (var k = 0; k < cards.length; k++) {
      cards[k].setAttribute('aria-checked', k === i ? 'true' : 'false');
      cards[k].setAttribute('tabindex', k === i ? '0' : '-1');
    }
    $('btnSubmit').classList.remove('is-dim');
    $('qNudge').textContent = '';
  }
  $('opts').addEventListener('click', function (e) {
    var card = e.target.closest('.opt-card');
    if (card) select(Number(card.getAttribute('data-i')));
  });
  $('opts').addEventListener('keydown', function (e) {
    var n = $('opts').children.length;
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].indexOf(e.key) < 0) return;
    e.preventDefault();
    var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    var i = ((S.selected < 0 ? (dir > 0 ? -1 : 0) : S.selected) + dir + n) % n;
    select(i);
    $('opts').children[i].focus();
  });
  $('btnSubmit').addEventListener('click', submitCurrent);

  function submitCurrent() {
    if (S.busy || S.locked) return;
    if (S.selected < 0) {
      $('qNudge').textContent = 'Pick an option first — any guess is fine!';
      var opts = $('opts');
      opts.classList.remove('shake'); void opts.offsetWidth; opts.classList.add('shake');
      return;
    }
    var q = S.questions[S.idx], btn = $('btnSubmit');
    S.busy = true; busy(btn, true);
    API.call('answer', { attemptId: S.attemptId, qid: q.id, choice: S.selected }).then(function (res) {
      S.busy = false; busy(btn, false);
      S.locked = true;
      S.answered = Math.max(S.answered, S.idx + 1);
      results[S.idx] = !!res.correct;
      markAnswer(res);
      updateStrip();
      openSheet(res);
    }).catch(function (err) {
      S.busy = false; busy(btn, false);
      if (isExpired(err)) return restartExpired();
      toast(errText(err));
    });
  }

  function markAnswer(res) {
    var opts = $('opts');
    opts.classList.add('is-locked');
    var cards = opts.querySelectorAll('.opt-card');
    for (var k = 0; k < cards.length; k++) {
      cards[k].classList.toggle('is-correct', k === res.correctIndex);
      cards[k].classList.toggle('is-chosen', k === res.chosenIndex);
      cards[k].setAttribute('aria-disabled', 'true');
    }
  }

  /* ------------------------- 4. feedback sheet ------------------------- */
  var RIGHT = ['Correct!', 'Spot on!', 'Nailed it!', 'Exactly right!'];
  var LEARN = ['Good try!', 'Nice guess!', 'Good thinking!'];
  var ICON_RIGHT = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_LEARN = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0012 3z"/></svg>';

  function openSheet(res) {
    var sheet = $('sheet'), right = !!res.correct;
    sheet.classList.toggle('sheet--right', right);
    sheet.classList.toggle('sheet--learn', !right);
    $('fbIcon').innerHTML = right ? ICON_RIGHT : ICON_LEARN;
    var pool = right ? RIGHT : LEARN;
    $('fbTitle').textContent = pool[S.idx % pool.length];
    $('fbTag').textContent = right ? 'keyframe ' + pad2(S.idx + 1) + ' · set' : 'keyframe ' + pad2(S.idx + 1) + ' · learned';
    $('fbAnswer').textContent = right ? '' : 'The answer is: ' + res.correctText;
    $('fbText').textContent = res.explanation || '';
    $('btnNext').textContent = S.idx >= S.questions.length - 1 ? 'See My Score' : 'Next Question';
    busy($('btnNext'), false);
    $('scrim').classList.add('is-open');
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    setTimeout(function () { $('btnNext').focus({ preventScroll: true }); }, 350);
  }
  function closeSheet() {
    $('sheet').classList.remove('is-open');
    $('sheet').setAttribute('aria-hidden', 'true');
    $('scrim').classList.remove('is-open');
  }
  $('btnNext').addEventListener('click', nextQuestion);

  function nextQuestion() {
    if (S.busy) return;
    if (S.idx < S.questions.length - 1) {
      closeSheet();
      S.idx += 1;
      setTimeout(renderQuestion, 120);
      return;
    }
    S.busy = true; busy($('btnNext'), true);
    API.call('finish', { attemptId: S.attemptId }).then(function (res) {
      S.busy = false;
      if (res.incomplete) {
        busy($('btnNext'), false);
        var at = S.questions.findIndex(function (q) { return q.id === res.missing[0]; });
        closeSheet();
        S.idx = Math.max(0, at);
        renderQuestion();
        toast('One question still needs an answer.');
        return;
      }
      S.result = res;
      closeSheet();
      showResult();
      if (S.lead) API.call('link', { attemptId: S.attemptId, leadId: S.lead.id, leadKey: S.lead.key }).catch(function () {});
    }).catch(function (err) {
      S.busy = false; busy($('btnNext'), false);
      if (isExpired(err)) return restartExpired();
      toast(errText(err));
    });
  }

  function restartExpired() {
    closeSheet();
    toast('Your quest timed out, so we started a fresh one.');
    startAttempt();
    beginQuiz();
  }

  document.addEventListener('keydown', function (e) {
    if (current !== 'quiz' || e.altKey || e.ctrlKey || e.metaKey) return;
    var sheetOpen = $('sheet').classList.contains('is-open');
    if (sheetOpen && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== $('btnNext')) { e.preventDefault(); nextQuestion(); return; }
    if (sheetOpen || S.locked) return;
    var map = { '1': 0, '2': 1, '3': 2, '4': 3, A: 0, B: 1, C: 2, D: 3 };
    var k = e.key.toUpperCase();
    if (map[k] !== undefined && map[k] < $('opts').children.length) { select(map[k]); return; }
    if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('opt-card')) { e.preventDefault(); submitCurrent(); }
  });

  /* ============================ 5. RESULT ============================ */
  function scoreMessage(score, total) {
    var p = total ? score / total : 0;
    if (p >= 0.87) return 'You\'ve got a sharp creative eye. Imagine what you could make with the right tools and mentors.';
    if (p >= 0.6) return 'Strong instincts! You already think like a creator — the free lessons will sharpen that eye even more.';
    if (p >= 0.34) return 'Nice work! You picked up real studio vocabulary today — the kind artists use every single day.';
    return 'Every artist starts somewhere — and you just learned ' + total + ' things that studios use every day.';
  }

  function showResult() {
    var r = S.result;
    $('resTitle').textContent = firstName() ? 'Great job, ' + firstName() + '!' : 'Great job!';
    $('resKicker').textContent = 'quest complete · ' + r.total + ' keyframes';
    $('scoreTotal').textContent = r.total;
    $('scoreNum').textContent = '0';
    $('scoreCorrect').textContent = r.score + ' correct ' + (r.score === 1 ? 'answer' : 'answers') + ' out of ' + r.total;
    $('resMsg').textContent = scoreMessage(r.score, r.total);
    $('btnRetry').textContent = 'Try Again — ' + r.total + ' New Questions';
    $('btnPlayAgain').textContent = 'Play Again — ' + r.total + ' New Questions';
    $('recap').innerHTML = (r.recap || []).map(function (it) {
      return '<li><span class="recap__dot' + (it.correct ? ' is-ok' : '') + '" aria-hidden="true"></span>' + esc(it.topic) +
        '<span class="sr-only">' + (it.correct ? ' (answered correctly)' : ' (learned)') + '</span></li>';
    }).join('');
    $('keystrip').innerHTML = (r.recap || []).map(function (it, i) { return '<i class="' + (it.correct ? 'is-right' : '') + '" style="--i:' + i + '"></i>'; }).join('');
    $('renderLabel2').innerHTML = 'final render · <b>0%</b>';
    if (!torusB && window.CQTorus) torusB = CQTorus($('torus2'), { mix: 0 });
    if (torusB) { torusB.set(0); torusB.start(); }
    show('result', 'resTitle');
    setTimeout(function () {
      countUp($('scoreNum'), r.score, 1100);
      if (torusB) torusB.set(1);
      renderPercent(1600);
      confetti();
    }, 250);
  }
  function renderPercent(ms) {
    var t0 = performance.now(), el = $('renderLabel2');
    (function tick(t) {
      var k = Math.min(1, (t - t0) / ms);
      el.innerHTML = 'final render · <b>' + Math.round(100 * (1 - Math.pow(1 - k, 2))) + '%</b>';
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function countUp(el, to, ms) {
    if (reduceMotion || to === 0) { el.textContent = String(to); return; }
    var t0 = performance.now();
    (function tick(t) {
      var k = Math.min(1, (t - t0) / ms);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function confetti(box) {
    if (reduceMotion) return;
    if (!box) {
      box = document.querySelector('.result__copy .confetti');
      if (!box) { box = document.createElement('div'); box.className = 'confetti'; document.querySelector('.result__copy').appendChild(box); }
    }
    var cols = ['#ffb547', '#ff7a1a', '#5ce1e6', '#eceef4', '#ffb547', '#ff7a1a'], html = '';
    for (var i = 0; i < 34; i++) {
      var a = (Math.PI * 2 * i) / 34 + Math.random() * .3, d = 70 + Math.random() * 90;
      html += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d - 30) + 'px;--r:' +
        Math.round(Math.random() * 720 - 360) + 'deg;--c:' + cols[i % cols.length] + ';--d:' + (Math.random() * .15).toFixed(2) + 's"></i>';
    }
    box.innerHTML = html;
  }

  $('btnUnlock').addEventListener('click', function () {
    if (S.lead) { showDone(); return; }
    if (!$('fName').value && S.name) $('fName').value = S.name;
    show('contact', 'contactTitle');
  });
  $('btnRetry').addEventListener('click', retry);
  $('btnPlayAgain').addEventListener('click', retry);
  function retry() { startAttempt(); beginQuiz(); }

  /* ============================ 6. CONTACT ============================ */
  var marketingTouched = false;
  $('fMarketing').addEventListener('change', function () { marketingTouched = true; });
  function normalizePhone(raw, cc) {
    var s = String(raw || '').trim(), digits = s.replace(/\D/g, '');
    cc = String(cc || '91').replace(/\D/g, '') || '91';
    var full;
    if (/^(\+|00)/.test(s)) full = s.indexOf('00') === 0 ? digits.replace(/^00/, '') : digits;
    else if (cc === '91') {
      if (digits.length === 10) full = '91' + digits;
      else if (digits.length === 11 && digits.charAt(0) === '0') full = '91' + digits.slice(1);
      else if (digits.length === 12 && digits.indexOf('91') === 0) full = digits;
      else return '';
    } else full = cc + digits.replace(/^0+/, '');
    if (full.indexOf('91') === 0) return /^91[6-9]\d{9}$/.test(full) ? '+' + full : '';
    return /^[1-9]\d{7,14}$/.test(full) ? '+' + full : '';
  }
  function validEmail(e) {
    e = String(e || '').trim().toLowerCase();
    return e.length <= 254 && /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e);
  }
  function setErr(inputId, errId, msg) {
    $(errId).textContent = msg || '';
    $(inputId).classList.toggle('is-invalid', !!msg);
    $(inputId).setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) $(inputId).setAttribute('aria-describedby', errId); else $(inputId).removeAttribute('aria-describedby');
  }
  function validateForm() {
    var ok = true, first = null;
    if (C.requireName !== false && $('fName').value.trim().length < 2) { setErr('fName', 'eName', 'Please tell us your name.'); ok = false; first = first || 'fName'; }
    else setErr('fName', 'eName', '');
    if (!validEmail($('fEmail').value)) { setErr('fEmail', 'eEmail', 'Please check your email address.'); ok = false; first = first || 'fEmail'; }
    else setErr('fEmail', 'eEmail', '');
    if (!normalizePhone($('fPhone').value, $('fCc').value)) { setErr('fPhone', 'ePhone', 'Please enter a valid WhatsApp mobile number, including the country code.'); ok = false; first = first || 'fPhone'; }
    else setErr('fPhone', 'ePhone', '');
    if (first) $(first).focus();
    return ok;
  }
  [['fName', 'eName'], ['fEmail', 'eEmail'], ['fPhone', 'ePhone']].forEach(function (p) {
    $(p[0]).addEventListener('input', function () { if ($(p[1]).textContent) setErr(p[0], p[1], ''); });
  });
  ['fCc', 'edCc'].forEach(function (id) { $(id).addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); }); });

  var leadBusy = false;
  $('leadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (leadBusy || !validateForm()) return;
    leadBusy = true;
    var btn = $('btnLead');
    busy(btn, true);
    API.call('lead', {
      attemptId: S.attemptId, leadKey: S.lead ? S.lead.key : '',
      name: $('fName').value, email: $('fEmail').value, countryCode: $('fCc').value, phone: $('fPhone').value,
      course: $('fCourse').value, waLesson: !$('waLessonRow').hidden && $('fWaLesson').checked,
      marketing: $('fMarketing').checked,
      consentSource: $('fMarketing').checked ? (marketingTouched ? 'Ticked by user' : 'Pre-ticked, kept') : (marketingTouched ? 'Unticked by user' : 'Not ticked'),
      website: $('fWebsite').value, src: BOOT.src, campaign: BOOT.campaign
    }).then(function (res) {
      leadBusy = false; busy(btn, false);
      if (!res.ok) {
        var er = res.errors || {};
        setErr('fName', 'eName', er.name); setErr('fEmail', 'eEmail', er.email); setErr('fPhone', 'ePhone', er.phone);
        $(er.name ? 'fName' : (er.email ? 'fEmail' : 'fPhone')).focus();
        return;
      }
      S.lead = { id: res.leadId, key: res.leadKey };
      S.contact = res.contact || null;
      S.landingUrl = res.landingUrl || '';
      if (!S.name && $('fName').value.trim()) S.name = $('fName').value.trim();
      saveSession();
      showDone();
    }).catch(function (err) { leadBusy = false; busy(btn, false); toast(errText(err)); });
  });
  $('btnBackScore').addEventListener('click', function () { show('result', 'resTitle'); });

  function saveSession() {
    store('lead', S.lead); store('contact', S.contact); store('landing', S.landingUrl); store('cert', S.certificate);
  }

  /* ============================== 7. DONE ============================== */
  function showDone() {
    var nm = firstName(), link = $('btnLessons');
    if (S.landingUrl) {
      $('doneTitle').textContent = nm ? 'You\'re in, ' + nm + '!' : 'You\'re in!';
      $('doneText').textContent = 'Your free lessons are ready. Open them now, or grab your certificate first.';
      link.href = S.landingUrl; link.hidden = false;
    } else {
      $('doneTitle').textContent = nm ? 'You\'re on the list, ' + nm + '!' : 'You\'re on the list!';
      $('doneText').textContent = 'Our free lessons page is opening very soon. The ZICA Pune team will share your access link with you.';
      link.hidden = true;
    }
    var certOn = !C.cert || C.cert.enabled !== false;
    $('certOffer').hidden = !certOn;
    $('btnClaim').textContent = S.certificate ? 'View My Certificate' : 'Get My Certificate';
    show('done', 'doneTitle');
  }
  $('btnLessons').addEventListener('click', function () {
    if (S.lead) API.call('opened', { leadId: S.lead.id, leadKey: S.lead.key }).catch(function () {});
  });
  $('btnClaim').addEventListener('click', function () {
    if (S.certificate) return showCertificate();
    openConfirm();
  });

  /* ========================= 8. CONFIRM DETAILS ========================= */
  var preview = null;
  var draft = {};

  function certName(n) {
    n = String(n || '').replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').trim();
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$/.test(n)) return '';
    if (n === n.toLowerCase() || n === n.toUpperCase()) {
      n = n.toLowerCase().replace(/(^|[\s'-])([a-zà-öø-ÿ])/g, function (m, p, c) { return p + c.toUpperCase(); });
    }
    return n;
  }
  function prettyPhone(cc, nat) {
    nat = String(nat || '');
    if (cc === '91' && nat.length === 10) nat = nat.slice(0, 5) + ' ' + nat.slice(5);
    return '+' + cc + ' ' + nat;
  }

  function openConfirm() {
    var c = S.contact || {};
    draft = {
      name: certName(c.name) || c.name || S.name || '',
      email: c.email || '',
      cc: c.countryCode || C.countryCode || '91',
      national: c.national || ''
    };
    if (!preview) {
      preview = CQCert.render($('certPreview'), { name: draft.name }, C.cert || {}, { placeholderName: 'Your Name' });
    }
    paintDetails();
    ['name', 'email', 'phone'].forEach(function (f) { closeEditor(f); setDetailErr(f, ''); });
    $('fConfirm').checked = false;
    $('otpHint').innerHTML = otpHint();
    show('confirm', 'confirmTitle');
    // Names that can't be printed open the editor straight away
    if (!certName(draft.name)) {
      openEditor('name');
      setDetailErr('name', 'Please type your name in English letters, exactly as it should be printed.');
    }
  }

  function otpHint() {
    return C.otpChannel === 'whatsapp'
      ? 'We\'ll send a 6-digit code to your <strong>WhatsApp</strong> to confirm it\'s really you.'
      : 'We\'ll send a 6-digit code to your <strong>email</strong> to confirm it\'s really you.';
  }

  function paintDetails() {
    var c = S.contact || {};
    $('dvName').textContent = draft.name || 'Add your name';
    $('dvEmail').textContent = draft.email;
    $('dvPhone').textContent = prettyPhone(draft.cc, draft.national);
    $('bdEmail').textContent = c.emailVerified && c.email === draft.email ? 'Verified' : '';
    $('bdPhone').textContent = c.phoneVerified ? 'Verified' : '';
    if (preview) preview.setName(certName(draft.name) || draft.name);
  }

  function detailEl(f) { return document.querySelector('.detail[data-field="' + f + '"]'); }
  function openEditor(f) {
    var el = detailEl(f);
    el.classList.add('is-editing');
    el.querySelector('.detail__editor').hidden = false;
    el.querySelector('.detail__edit').setAttribute('aria-expanded', 'true');
    if (f === 'name') { $('edName').value = draft.name; $('edName').focus(); }
    if (f === 'email') { $('edEmail').value = draft.email; $('edEmail').focus(); }
    if (f === 'phone') { $('edCc').value = draft.cc; $('edPhone').value = draft.national; $('edPhone').focus(); }
  }
  function closeEditor(f) {
    var el = detailEl(f);
    el.classList.remove('is-editing');
    el.querySelector('.detail__editor').hidden = true;
    el.querySelector('.detail__edit').setAttribute('aria-expanded', 'false');
  }
  function setDetailErr(f, msg) {
    var id = { name: 'ecName', email: 'ecEmail', phone: 'ecPhone' }[f];
    $(id).textContent = msg || '';
    detailEl(f).classList.toggle('has-error', !!msg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.detail__edit'), function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.detail').getAttribute('data-field');
      if (detailEl(f).classList.contains('is-editing')) { commitEditor(f); closeEditor(f); }
      else openEditor(f);
    });
  });

  // Live updates while typing (preview follows the name instantly)
  $('edName').addEventListener('input', function () {
    draft.name = this.value;
    $('dvName').textContent = draft.name;
    if (preview) preview.setName(certName(draft.name) || draft.name);
    setDetailErr('name', '');
  });
  $('edEmail').addEventListener('input', function () { draft.email = this.value.trim(); $('dvEmail').innerHTML = esc(draft.email).replace('@', '@<wbr>'); setDetailErr('email', ''); });
  ['edCc', 'edPhone'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      draft.cc = $('edCc').value || '91'; draft.national = $('edPhone').value.trim();
      $('dvPhone').textContent = prettyPhone(draft.cc, draft.national.replace(/\D/g, ''));
      setDetailErr('phone', '');
    });
  });
  ['edName', 'edEmail', 'edPhone'].forEach(function (id) {
    $(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var f = this.closest('.detail').getAttribute('data-field'); commitEditor(f); closeEditor(f); }
      if (e.key === 'Escape') { e.preventDefault(); var g = this.closest('.detail').getAttribute('data-field'); closeEditor(g); }
    });
  });
  function commitEditor(f) {
    if (f === 'name') { var n = certName(draft.name); if (n) draft.name = n; }
    paintDetails();
  }

  function localCheck() {
    var ok = true;
    if (!certName(draft.name)) { setDetailErr('name', 'Use English letters (2–60), exactly as it should be printed.'); openEditor('name'); ok = false; }
    if (!validEmail(draft.email)) { setDetailErr('email', 'Please check your email address.'); if (ok) openEditor('email'); ok = false; }
    if (!normalizePhone(draft.national, draft.cc)) { setDetailErr('phone', 'Please enter a valid WhatsApp mobile number.'); if (ok) openEditor('phone'); ok = false; }
    return ok;
  }

  var sendBusy = false;
  $('btnSendCode').addEventListener('click', function () {
    if (sendBusy) return;
    ['name', 'email', 'phone'].forEach(function (f) { if (detailEl(f).classList.contains('is-editing')) { commitEditor(f); } });
    if (!localCheck()) return;
    if (!$('fConfirm').checked) {
      toast('Please tick the box to confirm your details are correct.');
      var chk = document.querySelector('.confirm__check');
      chk.classList.remove('shake'); void chk.offsetWidth; chk.classList.add('shake');
      return;
    }
    ['name', 'email', 'phone'].forEach(closeEditor);
    sendBusy = true;
    var btn = $('btnSendCode');
    busy(btn, true);
    API.call('confirm', { leadId: S.lead.id, leadKey: S.lead.key, name: draft.name, email: draft.email, countryCode: draft.cc, phone: draft.national })
      .then(function (res) {
        if (!res.ok) {
          var er = res.errors || {};
          ['name', 'email', 'phone'].forEach(function (f) { if (er[f]) { setDetailErr(f, er[f]); openEditor(f); } });
          throw null;
        }
        S.contact = res.contact;
        if (res.contact && res.contact.name) { draft.name = res.contact.name; S.name = res.contact.name; }
        saveSession();
        paintDetails();
        return API.call('otp_send', { leadId: S.lead.id, leadKey: S.lead.key });
      })
      .then(function (otp) {
        sendBusy = false; busy(btn, false);
        S.otp = otp;
        openOtp();
      })
      .catch(function (err) {
        sendBusy = false; busy(btn, false);
        if (!err) return;
        if (err.code === 'no_lead') { S.lead = null; saveSession(); show('contact', 'contactTitle'); }
        if (err.code === 'cooldown' && S.otp) { openOtp(); return; }
        toast(errText(err));
      });
  });
  $('btnBackDone').addEventListener('click', showDone);

  /* ============================== 9. OTP ============================== */
  var resendTimer = null;
  function openOtp() {
    var o = S.otp || {};
    var where = o.channel === 'whatsapp' ? 'WhatsApp' : 'email';
    $('otpSentTo').innerHTML = 'We sent it to your ' + where + ' <strong>' + esc(o.masked || '') + '</strong>.';
    var tc = $('testCode');
    if (o.testCode) {
      tc.innerHTML = '<strong>' + (API.mode === 'demo' ? 'Demo mode' : 'Test mode') + '</strong> — no message is sent yet. Your code is <span class="testcode__code">' + esc(o.testCode) + '</span>';
      tc.hidden = false;
    } else tc.hidden = true;
    $('otpInput').value = '';
    $('otpErr').textContent = '';
    show('otp', 'otpTitle');
    setTimeout(function () { $('otpInput').focus(); }, 120);
    startResendTimer(45);
  }
  function startResendTimer(sec) {
    var b = $('btnResend');
    clearInterval(resendTimer);
    b.disabled = true;
    var left = sec;
    b.textContent = 'Send a new code (' + left + 's)';
    resendTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) { clearInterval(resendTimer); b.disabled = false; b.textContent = 'Send a new code'; return; }
      b.textContent = 'Send a new code (' + left + 's)';
    }, 1000);
  }
  $('otpInput').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 6);
    $('otpErr').textContent = '';
    if (this.value.length === 6) verifyCode();
  });
  $('otpForm').addEventListener('submit', function (e) { e.preventDefault(); verifyCode(); });

  var verifyBusy = false;
  function verifyCode() {
    var code = $('otpInput').value;
    if (verifyBusy) return;
    if (code.length !== 6) { $('otpErr').textContent = 'Enter all 6 digits.'; return; }
    verifyBusy = true;
    busy($('btnVerify'), true);
    API.call('otp_verify', { leadId: S.lead.id, leadKey: S.lead.key, code: code }).then(function (res) {
      verifyBusy = false; busy($('btnVerify'), false);
      S.certificate = Object.assign({}, res.certificate, { emailed: res.emailed, masked: res.masked });
      saveSession();
      clearInterval(resendTimer);
      showCertificate(true);
    }).catch(function (err) {
      verifyBusy = false; busy($('btnVerify'), false);
      $('otpErr').textContent = errText(err);
      $('otpInput').select();
    });
  }
  $('btnResend').addEventListener('click', function () {
    var b = $('btnResend');
    busy(b, true);
    API.call('otp_send', { leadId: S.lead.id, leadKey: S.lead.key }).then(function (otp) {
      busy(b, false);
      S.otp = otp;
      openOtp();
      toast('A new code is on its way.');
    }).catch(function (err) { busy(b, false); toast(errText(err)); });
  });
  $('btnChangeDetails').addEventListener('click', function () { clearInterval(resendTimer); openConfirm(); });

  /* =========================== 10. CERTIFICATE =========================== */
  var finalPreview = null;
  function showCertificate(fresh) {
    var cert = S.certificate;
    var nm = cert.name.split(' ')[0];
    $('certTitle').textContent = 'Congratulations, ' + nm + '!';
    $('certSub').textContent = 'Your ZICA Creative Quest certificate is ready.';
    $('certFinal').innerHTML = '';
    finalPreview = CQCert.render($('certFinal'), cert, C.cert || {});
    var pdf = $('btnPdf');
    if (cert.pdfUrl) {
      pdf.href = cert.pdfUrl;
      pdf.hidden = false;
    } else {
      pdf.hidden = true; // demo mode: no server, no PDF
    }
    var page = $('btnCertPage');
    page.href = cert.pageUrl || '#';
    page.hidden = !cert.pageUrl;
    var l2 = $('btnLessons2');
    l2.hidden = !S.landingUrl;
    if (S.landingUrl) l2.href = S.landingUrl;

    var note;
    if (API.mode === 'demo') note = 'Demo mode: connect Supabase to create the downloadable PDF and email it.';
    else if (cert.emailed) note = 'We\'ve also emailed the download link to ' + esc(cert.masked || 'your inbox') + '.';
    else note = 'Save your PDF now — the email copy isn\'t switched on yet.';
    $('certNote').innerHTML = note;
    show('certificate', 'certTitle');
    if (fresh) setTimeout(function () { var c = document.createElement('div'); c.className = 'confetti confetti--wide'; document.querySelector('.certdone__head').appendChild(c); confetti(c); setTimeout(function () { c.remove(); }, 1800); }, 200);
  }
  $('btnShare').addEventListener('click', function () {
    var cert = S.certificate || {};
    var url = String(cert.pageUrl || location.href).replace(/&k=[^&]+/, '');
    var data = { title: 'My ZICA Creative Quest certificate', text: 'I just completed the ZICA Creative Quest! Try it yourself:', url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied — paste it anywhere to share.'); });
  });

  /* =============================== init =============================== */
  if (window.CQTorus) { torusA = CQTorus($('torus'), { mix: 0 }); torusA.start(); }
  $('btnStart').addEventListener('pointerenter', function () { if (torusA) { torusA.set(0.35); $('renderLabel').innerHTML = 'viewport · <b>rendering…</b>'; } });
  $('btnStart').addEventListener('pointerleave', function () { if (torusA) { torusA.set(0); $('renderLabel').innerHTML = 'viewport · <b>wireframe</b>'; } });
  try { applyBranding(); } catch (e) { if (window.console) console.error(e); }
  S.lead = recall('lead');
  S.contact = recall('contact');
  S.landingUrl = recall('landing') || '';
  S.certificate = recall('cert');
})();
