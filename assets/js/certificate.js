/* =====================================================================
   ZICA CREATIVE QUEST — certificate.js
   On-screen certificate preview. Uses the SAME layout numbers as the PDF
   (A4 landscape, 842 × 595 points) in supabase/functions/quest/index.ts,
   so what the student approves is what gets printed.
   ===================================================================== */
window.CQCert = (function () {
  'use strict';
  var W = 842, H = 595;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Positions use "bottom" in points, like the PDF (baseline minus a little descent).
  function at(x, baseline, size) { return 'bottom:calc(var(--u) * ' + (baseline - size * 0.22).toFixed(1) + ');font-size:calc(var(--u) * ' + size + ');' + (x != null ? 'left:calc(var(--u) * ' + x + ');' : ''); }

  function render(el, data, conf, opts) {
    conf = conf || {};
    opts = opts || {};
    var dark = conf.theme === 'dark';
    el.classList.add('cert');
    el.classList.toggle('cert--dark', dark);
    var name = data.name || opts.placeholderName || 'Your Name';
    var body = esc(conf.body || '');
    var score = conf.showScore && data.score != null && data.total ? '<div class="cert__score" style="' + at(null, 228, 12) + '">Quest score: ' + data.score + ' / ' + data.total + '</div>' : '';

    el.innerHTML =
      '<div class="cert__bg cert__bg--builtin"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i><i class="frame1"></i><i class="frame2"></i><i class="ring1"></i><i class="ring2"></i></div>' +
      (conf.bgUrl ? '<img class="cert__bgimg" alt="" src="' + esc(conf.bgUrl) + '">' : '') +
      '<div class="cert__logo">' +
        (conf.logoUrl ? '<img alt="ZICA" src="' + esc(conf.logoUrl) + '">' : '') +
        '<span class="cert__inst" style="font-size:calc(var(--u) * 15)">' + esc(conf.instituteLine || 'ZICA Pune') + '</span>' +
      '</div>' +
      '<div class="cert__title" style="' + at(null, 430, 30) + '">' + esc(conf.title || 'Certificate of Completion') + '</div>' +
      '<div class="cert__presented" style="' + at(null, 392, 13) + '">' + esc(conf.presented || '') + '</div>' +
      '<div class="cert__name" style="' + at(null, 330, 46) + '"><span>' + esc(name) + '</span></div>' +
      '<div class="cert__rule"></div>' +
      '<div class="cert__body" style="font-size:calc(var(--u) * 12.5);top:calc(var(--u) * ' + (H - 284 - 10) + ')">' + body + '</div>' +
      score +
      '<div class="cert__meta">' +
        '<div class="cert__label" style="' + at(70, 112, 8) + '">DATE OF ISSUE</div>' +
        '<div class="cert__val" style="' + at(70, 96, 12) + '">' + esc(data.issuedAt || today()) + '</div>' +
        '<div class="cert__label" style="' + at(70, 76, 8) + '">CERTIFICATE ID</div>' +
        '<div class="cert__val" style="' + at(70, 61, 11) + '">' + esc(data.id || 'ZCQ26-••••••') + '</div>' +
      '</div>' +
      (conf.signatureUrl ? '<img class="cert__sig" alt="" src="' + esc(conf.signatureUrl) + '">' : '') +
      '<div class="cert__sigline"></div>' +
      '<div class="cert__signame" style="' + at(null, 80, 12.5) + '">' + esc(conf.signatoryName || '') + '</div>' +
      '<div class="cert__sigtitle" style="' + at(null, 66, 9.5) + '">' + esc([conf.signatoryTitle, conf.instituteLine].filter(Boolean).join(', ')) + '</div>' +
      '<div class="cert__qr" aria-hidden="true"><svg viewBox="0 0 21 21">' + fakeQr() + '</svg></div>' +
      '<div class="cert__scan" style="font-size:calc(var(--u) * 7.5)">Scan to verify</div>';

    // Hide images that don't exist yet; built-in background shows instead.
    var bgImg = el.querySelector('.cert__bgimg');
    if (bgImg) {
      bgImg.onload = function () { el.querySelector('.cert__bg--builtin').style.display = 'none'; };
      bgImg.onerror = function () { bgImg.remove(); };
    }
    var logo = el.querySelector('.cert__logo img');
    if (logo) {
      logo.onload = function () { el.querySelector('.cert__inst').style.display = 'none'; };
      logo.onerror = function () { logo.remove(); };
    }
    var sig = el.querySelector('.cert__sig');
    if (sig) sig.onerror = function () { sig.remove(); };

    function scale() {
      el.style.setProperty('--u', (el.clientWidth / W) + 'px');
      fitName();
    }
    function fitName() {
      var span = el.querySelector('.cert__name span');
      var box = el.querySelector('.cert__name');
      if (!span || !el.clientWidth) return;
      var size = 46;
      box.style.fontSize = 'calc(var(--u) * ' + size + ')';
      var max = el.clientWidth * (600 / W);
      while (size > 20 && span.getBoundingClientRect().width > max) {
        size -= 1;
        box.style.fontSize = 'calc(var(--u) * ' + size + ')';
      }
    }
    if (window.ResizeObserver) new ResizeObserver(scale).observe(el);
    else window.addEventListener('resize', scale);
    scale();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);

    return {
      setName: function (n) {
        el.querySelector('.cert__name span').textContent = n || opts.placeholderName || 'Your Name';
        fitName();
      }
    };
  }

  function today() {
    try { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }); }
    catch (e) { return new Date().toDateString(); }
  }

  // Decorative stand-in for the QR in the preview (the PDF carries the real, scannable code)
  function fakeQr() {
    var out = '', seed = 7;
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#14112A"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#14112A"/>'; }
    for (var r = 0; r < 21; r++) for (var c = 0; c < 21; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.52) out += '<rect x="' + c + '" y="' + r + '" width="1" height="1" fill="#14112A"/>';
    }
    return '<rect width="21" height="21" fill="#fff"/>' + out + finder(0, 0) + finder(14, 0) + finder(0, 14);
  }

  return { render: render };
})();
