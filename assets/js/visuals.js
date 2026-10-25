/* =====================================================================
   ZICA CREATIVE QUEST — visuals.js
   Original animated SVG visuals for every question (no image files).
   Palette = the ZICA Pune deck's "viewport" theme:
   graphite · keyframe amber · selection orange · active cyan.
   Use in the Questions sheet → Asset column as  svg:<name>
   Or put an https:// image / GIF / .mp4 URL there instead.
   ===================================================================== */
var CQVisuals = (function () {
  'use strict';

  var INK = '#0d0e13', P2 = '#15171f', P3 = '#1d2030', LINE = '#2b2f42', TXT = '#eceef4', MUTE = '#8d93a8',
      KEY = '#ffb547', SEL = '#ff7a1a', ACT = '#5ce1e6', NO = '#ff5c6c', MONO = "'JetBrains Mono', ui-monospace, monospace";
  var uid = 0;
  function id(p) { uid += 1; return 'v' + p + uid; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wrap(inner) { return '<svg class="viz" viewBox="0 0 400 240" role="img" aria-label="" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }
  function badge(x, y, t) {
    return '<rect x="' + (x - 14) + '" y="' + (y - 14) + '" width="28" height="28" rx="8" fill="' + P3 + '" stroke="' + KEY + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-family="' + MONO + '" font-size="14" font-weight="700" fill="' + KEY + '">' + t + '</text>';
  }
  function label(x, y, t, fill, anchor, size) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="' + MONO + '" font-size="' + (size || 11) + '" fill="' + (fill || MUTE) + '">' + t + '</text>';
  }
  function floor(y0, color, op) { // viewport floor grid, converging to a horizon
    var g = '<g stroke="' + (color || ACT) + '" stroke-opacity="' + (op || 0.18) + '" stroke-width="1">';
    for (var i = -10; i <= 10; i++) g += '<line x1="' + (200 + i * 14) + '" y1="' + y0 + '" x2="' + (200 + i * 70) + '" y2="240"/>';
    [0, 6, 14, 26, 42, 62].forEach(function (d) { g += '<line x1="0" y1="' + (y0 + d) + '" x2="400" y2="' + (y0 + d) + '"/>'; });
    return g + '</g>';
  }
  function smooth(pts) { // Catmull-Rom → cubic segments
    var d = '';
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function radial(idv, stops, cx, cy) {
    return '<radialGradient id="' + idv + '" cx="' + (cx || 0.35) + '" cy="' + (cy || 0.3) + '" r=".8">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</radialGradient>';
  }

  var V = {};

  /* ================================================================ SET A */

  /* A01 — Blender-style viewport, wireframe cube orbiting (selection outline) */
  V.viewport = function () {
    var frames = [], N = 48;
    var vs = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    var E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    var tilt = -0.42;
    for (var f = 0; f <= N; f++) {
      var a = f / N * Math.PI * 2;
      var P = vs.map(function (v) {
        var x = v[0] * Math.cos(a) + v[2] * Math.sin(a), z = -v[0] * Math.sin(a) + v[2] * Math.cos(a), y = v[1];
        var y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        var s = 260 / (z2 + 6);
        return [200 + x * s, 112 + y2 * s];
      });
      frames.push(E.map(function (e) { return 'M' + P[e[0]][0].toFixed(1) + ' ' + P[e[0]][1].toFixed(1) + 'L' + P[e[1]][0].toFixed(1) + ' ' + P[e[1]][1].toFixed(1); }).join(''));
    }
    var d = frames.join(';');
    return wrap(
      '<rect width="400" height="240" fill="#14161e"/>' + floor(150, ACT, 0.16) +
      '<line x1="0" y1="198" x2="400" y2="198" stroke="' + NO + '" stroke-opacity=".45"/>' +
      '<line x1="200" y1="150" x2="200" y2="240" stroke="#7ddc5a" stroke-opacity=".45"/>' +
      '<path d="' + frames[0] + '" fill="none" stroke="' + SEL + '" stroke-width="2.2" stroke-linejoin="round"><animate attributeName="d" dur="14s" repeatCount="indefinite" values="' + d + '"/></path>' +
      '<g transform="translate(360 40)"><circle r="20" fill="' + P3 + '" opacity=".8"/>' +
      '<line x1="0" y1="0" x2="14" y2="5" stroke="' + NO + '" stroke-width="2.5"/><circle cx="14" cy="5" r="4" fill="' + NO + '"/>' +
      '<line x1="0" y1="0" x2="-6" y2="-14" stroke="#7ddc5a" stroke-width="2.5"/><circle cx="-6" cy="-14" r="4" fill="#7ddc5a"/>' +
      '<line x1="0" y1="0" x2="-9" y2="9" stroke="#4d8dff" stroke-width="2.5"/><circle cx="-9" cy="9" r="4" fill="#4d8dff"/></g>' +
      label(14, 22, 'User Perspective', MUTE, 'start') + label(14, 36, '(1) Collection | Cube', TXT, 'start'));
  };

  /* A02 — 2D vs 3D */
  V.dims = function () {
    return wrap(
      '<ellipse cx="110" cy="182" rx="56" ry="8" fill="#000" opacity=".4"/>' +
      '<rect x="62" y="70" width="96" height="96" rx="3" fill="' + SEL + '"/>' +
      '<ellipse cx="290" cy="182" rx="62" ry="10" fill="#000" opacity=".5"/>' +
      '<polygon points="290,58 344,86 290,114 236,86" fill="#ffd08a"/>' +
      '<polygon points="236,86 290,114 290,176 236,148" fill="' + KEY + '"/>' +
      '<polygon points="290,114 344,86 344,148 290,176" fill="#c06a12"/>' +
      badge(110, 212, 'A') + badge(290, 212, 'B'));
  };

  /* A03 — squash & stretch */
  V.ball = function () {
    var g = id('b');
    return wrap('<defs>' + radial(g, [[0, '#ffe6bf'], [0.35, KEY], [1, '#b8460a']]) + '</defs>' +
      floor(150, ACT, 0.1) +
      '<line x1="40" y1="212" x2="360" y2="212" stroke="' + LINE + '" stroke-width="2"/>' +
      '<ellipse class="v-ball-shadow" cx="200" cy="214" rx="30" ry="5" fill="#000"/>' +
      '<circle class="v-ball" cx="200" cy="186" r="26" fill="url(#' + g + ')"/>');
  };

  /* A04 — storyboard */
  V.board = function () {
    var paper = '#eceef4', pen = '#1d2030';
    function panel(x, n, art) {
      return '<rect x="' + x + '" y="52" width="104" height="80" rx="4" fill="' + paper + '"/>' +
        badge(x + 14, 34, n) +
        '<g fill="none" stroke="' + pen + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + art + '</g>' +
        '<rect x="' + x + '" y="146" width="88" height="6" rx="3" fill="' + LINE + '"/>' +
        '<rect x="' + x + '" y="160" width="62" height="6" rx="3" fill="' + LINE + '"/>';
    }
    var p1 = '<line x1="30" y1="118" x2="116" y2="118"/><rect x="70" y="84" width="34" height="34"/><polyline points="66,86 87,68 108,86"/>' +
      '<circle cx="44" cy="88" r="6"/><line x1="44" y1="94" x2="44" y2="108"/><line x1="44" y1="108" x2="38" y2="118"/><line x1="44" y1="108" x2="50" y2="118"/><line x1="36" y1="99" x2="52" y2="99"/>';
    var p2 = '<circle cx="200" cy="96" r="30"/><circle cx="189" cy="90" r="3" fill="' + pen + '"/><circle cx="211" cy="90" r="3" fill="' + pen + '"/><path d="M186 106 q14 12 28 0"/><path d="M174 80 q26 -26 52 0"/>';
    var p3 = '<circle cx="334" cy="76" r="6"/><line x1="334" y1="82" x2="326" y2="100"/><line x1="326" y1="100" x2="338" y2="118"/><line x1="326" y1="100" x2="314" y2="112"/><line x1="331" y1="89" x2="344" y2="96"/><line x1="331" y1="89" x2="318" y2="86"/>' +
      '<line x1="296" y1="80" x2="310" y2="80"/><line x1="292" y1="92" x2="308" y2="92"/><line x1="296" y1="104" x2="308" y2="104"/><line x1="292" y1="122" x2="370" y2="122"/>';
    var arrow = function (x) { return '<path d="M' + x + ' 92 l8 0 m-4 -5 l5 5 -5 5" fill="none" stroke="' + KEY + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'; };
    return wrap(panel(20, '1', p1) + panel(148, '2', p2) + panel(276, '3', p3) + arrow(130) + arrow(258) +
      label(200, 210, 'SC 04 — 3 panels', MUTE));
  };

  /* A05 — key light direction */
  V.light = function () {
    var g = id('l'), f = id('f');
    return wrap('<defs>' + radial(g, [[0, '#ffffff'], [0.1, '#fff1d6'], [0.42, '#e0904a'], [0.8, '#4a2410'], [1, '#1b0f08']], 0.3, 0.26) +
      '<filter id="' + f + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
      '<rect x="0" y="160" width="400" height="80" fill="' + P2 + '"/>' + floor(160, ACT, 0.08) +
      '<ellipse cx="236" cy="184" rx="92" ry="15" fill="#000" opacity=".8" filter="url(#' + f + ')" transform="rotate(8 236 184)"/>' +
      '<circle cx="180" cy="116" r="64" fill="url(#' + g + ')"/>');
  };

  /* A06 — keyframes (the deck's timeline) */
  V.keys = function () {
    var ticks = '', x;
    for (var i = 0; i < 24; i++) {
      x = 60 + i * (280 / 23);
      ticks += '<line x1="' + x.toFixed(1) + '" y1="' + (i % 4 === 0 ? 186 : 190) + '" x2="' + x.toFixed(1) + '" y2="198" stroke="#4a4f66" stroke-width="1.2"/>';
    }
    var ghosts = '';
    [0.12, 0.3, 0.5, 0.7, 0.88].forEach(function (t) { ghosts += '<circle cx="' + (60 + t * 280) + '" cy="96" r="5" fill="' + ACT + '" opacity=".25"/>'; });
    function diamond(cx) { return '<rect x="' + (cx - 7) + '" y="164" width="14" height="14" transform="rotate(45 ' + cx + ' 171)" fill="' + KEY + '"/>'; }
    return wrap(
      '<line x1="60" y1="96" x2="340" y2="96" stroke="' + LINE + '" stroke-width="1.5" stroke-dasharray="4 6"/>' + ghosts +
      '<circle cx="60" cy="96" r="22" fill="none" stroke="' + KEY + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      '<circle cx="340" cy="96" r="22" fill="none" stroke="' + KEY + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      '<g class="v-key-move"><circle cx="60" cy="96" r="18" fill="' + SEL + '"/><circle cx="54" cy="90" r="6" fill="#ffd08a" opacity=".85"/></g>' +
      '<rect x="40" y="156" width="320" height="48" rx="8" fill="' + P2 + '" stroke="' + LINE + '"/>' + ticks + diamond(60) + diamond(340) +
      label(60, 226, '1', TXT, 'middle', 13) + label(340, 226, '24', TXT, 'middle', 13) + label(200, 226, 'frames', MUTE) +
      '<g class="v-key-move"><line x1="60" y1="150" x2="60" y2="206" stroke="' + ACT + '" stroke-width="2"/><polygon points="54,146 66,146 60,154" fill="' + ACT + '"/></g>');
  };

  /* A07 — Rubin's vase */
  V.vase = function () {
    var half = [[12, 76], [32, 70], [56, 60], [74, 55], [86, 62], [110, 34], [124, 52], [134, 45], [142, 51], [150, 46], [164, 58], [180, 45], [198, 60], [228, 72]];
    var right = half.map(function (p) { return [200 + p[1], p[0]]; });
    var left = half.slice().reverse().map(function (p) { return [200 - p[1], p[0]]; });
    var d = 'M' + right[0][0] + ' ' + right[0][1] + smooth(right) + ' L' + left[0][0] + ' ' + left[0][1] + smooth(left) + ' Z';
    return wrap('<rect x="92" y="10" width="216" height="220" rx="10" fill="' + INK + '" stroke="' + LINE + '"/><path d="' + d + '" fill="' + TXT + '"/>');
  };

  /* A08 — compositing */
  V.layers = function () {
    function castle(x, y, s) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#07080c">' +
        '<rect x="8" y="30" width="88" height="40"/><rect x="0" y="12" width="22" height="58"/><rect x="82" y="12" width="22" height="58"/><rect x="40" y="2" width="24" height="68"/>' +
        '<rect x="0" y="6" width="6" height="8"/><rect x="8" y="6" width="6" height="8"/><rect x="16" y="6" width="6" height="8"/>' +
        '<rect x="82" y="6" width="6" height="8"/><rect x="90" y="6" width="6" height="8"/><rect x="98" y="6" width="6" height="8"/>' +
        '<rect x="40" y="-4" width="6" height="8"/><rect x="49" y="-4" width="6" height="8"/><rect x="58" y="-4" width="6" height="8"/>' +
        '<rect x="47" y="48" width="10" height="22" rx="5" fill="' + KEY + '" opacity=".8"/></g>';
    }
    function sky(x, cid) {
      return '<clipPath id="' + cid + '"><rect x="' + x + '" y="70" width="104" height="80" rx="6"/></clipPath>' +
        '<g clip-path="url(#' + cid + ')"><rect x="' + x + '" y="70" width="104" height="80" fill="#1b2a44"/>' +
        '<rect x="' + x + '" y="116" width="104" height="34" fill="#5a2f1c"/><circle cx="' + (x + 80) + '" cy="88" r="9" fill="#ffd08a"/>' + castle(x + 6, 92, 0.88) + '</g>';
    }
    function actor(cx, by) { return '<g fill="#2b2f42"><circle cx="' + cx + '" cy="' + (by - 44) + '" r="9" fill="#d9a07a"/><rect x="' + (cx - 12) + '" y="' + (by - 33) + '" width="24" height="33" rx="10"/></g>'; }
    var c1 = id('c'), c2 = id('c');
    return wrap(
      '<rect x="12" y="70" width="104" height="80" rx="6" fill="#2fbf71"/>' + actor(64, 150) +
      '<text x="136" y="118" text-anchor="middle" font-size="26" font-weight="800" fill="' + KEY + '">+</text>' + sky(148, c1) +
      '<text x="270" y="118" text-anchor="middle" font-size="26" font-weight="800" fill="' + KEY + '">=</text>' + sky(284, c2) + actor(336, 150) +
      '<rect x="284" y="70" width="104" height="80" rx="6" fill="none" stroke="' + KEY + '" stroke-width="2"/>' +
      label(64, 174, 'footage') + label(200, 174, 'CGI plate') + label(336, 174, 'final shot', KEY));
  };

  /* A09 — anticipation */
  V.jump = function () {
    return wrap(floor(150, ACT, 0.12) +
      '<line x1="60" y1="206" x2="340" y2="206" stroke="' + LINE + '" stroke-width="2"/>' +
      '<ellipse class="v-jump-shadow" cx="200" cy="208" rx="34" ry="5" fill="#000"/>' +
      '<g class="v-jump"><rect x="172" y="132" width="56" height="74" rx="28" fill="' + ACT + '"/>' +
      '<rect x="178" y="138" width="20" height="40" rx="10" fill="#c6f7f8" opacity=".5"/>' +
      '<circle cx="190" cy="160" r="7" fill="#fff"/><circle cx="210" cy="160" r="7" fill="#fff"/>' +
      '<circle cx="192" cy="161" r="3.2" fill="' + INK + '"/><circle cx="212" cy="161" r="3.2" fill="' + INK + '"/>' +
      '<path d="M193 178 q7 5 14 0" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/></g>');
  };

  /* A10 — rig */
  V.rig = function () {
    var mesh = 'stroke="#2b2f42" stroke-width="22" stroke-linecap="round" fill="none"';
    var bone = 'stroke="' + SEL + '" stroke-width="3" stroke-linecap="round" fill="none"';
    function j(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + KEY + '" stroke="' + INK + '" stroke-width="2"/>'; }
    return wrap(floor(170, ACT, 0.1) +
      '<g ' + mesh + '><line x1="200" y1="84" x2="200" y2="146"/><line x1="168" y1="90" x2="150" y2="124"/><line x1="150" y1="124" x2="142" y2="156"/>' +
      '<line x1="190" y1="148" x2="184" y2="184"/><line x1="184" y1="184" x2="180" y2="218"/><line x1="210" y1="148" x2="216" y2="184"/><line x1="216" y1="184" x2="220" y2="218"/>' +
      '<line x1="168" y1="90" x2="232" y2="90"/></g><circle cx="200" cy="52" r="22" fill="#2b2f42"/>' +
      '<g class="v-arm"><line x1="232" y1="90" x2="252" y2="122" ' + mesh + '/><line x1="252" y1="122" x2="262" y2="154" ' + mesh + '/>' +
      '<line x1="232" y1="90" x2="252" y2="122" ' + bone + '/><line x1="252" y1="122" x2="262" y2="154" ' + bone + '/>' + j(252, 122) + j(262, 154) + '</g>' +
      '<g ' + bone + '><line x1="200" y1="52" x2="200" y2="80"/><line x1="200" y1="80" x2="200" y2="146"/>' +
      '<line x1="200" y1="88" x2="168" y2="90"/><line x1="200" y1="88" x2="232" y2="90"/><line x1="168" y1="90" x2="150" y2="124"/><line x1="150" y1="124" x2="142" y2="156"/>' +
      '<line x1="200" y1="146" x2="190" y2="148"/><line x1="200" y1="146" x2="210" y2="148"/><line x1="190" y1="148" x2="184" y2="184"/><line x1="184" y1="184" x2="180" y2="218"/>' +
      '<line x1="210" y1="148" x2="216" y2="184"/><line x1="216" y1="184" x2="220" y2="218"/></g>' +
      j(200, 52) + j(200, 80) + j(200, 112) + j(200, 146) + j(168, 90) + j(232, 90) + j(150, 124) + j(142, 156) +
      j(190, 148) + j(210, 148) + j(184, 184) + j(216, 184) + j(180, 218) + j(220, 218));
  };

  /* A11 — vanishing point */
  V.vp = function () {
    var sky = id('s'), glow = id('g'), poles = '';
    [0, 0.34, 0.58, 0.75, 0.86, 0.93].forEach(function (t) {
      var h = 92 * (1 - t) + 4, lx = 18 + (200 - 18) * t, ly = 236 + (100 - 236) * t, rx = 382 + (200 - 382) * t, w = (3.5 * (1 - t) + 0.8).toFixed(1);
      poles += '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y2="' + (ly - h).toFixed(1) + '" stroke="' + ACT + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
        '<line x1="' + rx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y2="' + (ly - h).toFixed(1) + '" stroke="' + ACT + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    });
    var dashes = '';
    [[104, 108], [114, 122], [130, 144], [156, 178], [196, 232]].forEach(function (s) {
      dashes += '<line x1="200" y1="' + s[0] + '" x2="200" y2="' + s[1] + '" stroke="' + KEY + '" stroke-width="' + ((s[1] - 100) / 40 + 0.6).toFixed(1) + '" stroke-linecap="round"/>';
    });
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0e13"/><stop offset=".7" stop-color="#3a1d12"/><stop offset="1" stop-color="#c25a14"/></linearGradient>' +
      '<radialGradient id="' + glow + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + KEY + '" stop-opacity=".75"/><stop offset="1" stop-color="' + KEY + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="0" y="0" width="400" height="100" fill="url(#' + sky + ')"/><ellipse cx="200" cy="100" rx="120" ry="34" fill="url(#' + glow + ')"/>' +
      '<rect x="0" y="100" width="400" height="140" fill="#101219"/><polygon points="40,240 360,240 200,100" fill="#1d2030"/>' +
      '<line x1="40" y1="240" x2="200" y2="100" stroke="' + SEL + '" stroke-width="2"/><line x1="360" y1="240" x2="200" y2="100" stroke="' + SEL + '" stroke-width="2"/>' +
      '<line x1="0" y1="100" x2="400" y2="100" stroke="#4a4f66"/>' + dashes + poles +
      '<circle cx="200" cy="100" r="3.2" fill="#fff"/><circle class="v-pulse" cx="200" cy="100" r="6" fill="none" stroke="#fff" stroke-width="1.2"/>');
  };

  /* A12 — materials */
  V.mats = function () {
    var a = id('m'), b = id('m'), c = id('m'), cl = id('m');
    return wrap('<defs>' + radial(a, [[0, '#ffb894'], [0.5, '#d2582e'], [1, '#4e1a0b']], 0.38, 0.32) + radial(b, [[0, '#c6f7f8'], [0.5, '#1fa7ad'], [1, '#063539']], 0.4, 0.35) +
      '<linearGradient id="' + c + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafaff"/><stop offset=".22" stop-color="#9ea3b8"/><stop offset=".44" stop-color="#1d2030"/>' +
      '<stop offset=".5" stop-color="#eceef4"/><stop offset=".62" stop-color="#5a5f73"/><stop offset=".85" stop-color="#262a38"/><stop offset="1" stop-color="#c0c4d2"/></linearGradient>' +
      '<clipPath id="' + cl + '"><circle cx="320" cy="108" r="44"/></clipPath></defs>' + floor(160, ACT, 0.1) +
      '<ellipse cx="80" cy="158" rx="40" ry="7" fill="#000" opacity=".55"/><ellipse cx="200" cy="158" rx="40" ry="7" fill="#000" opacity=".55"/><ellipse cx="320" cy="158" rx="40" ry="7" fill="#000" opacity=".55"/>' +
      '<circle cx="80" cy="108" r="44" fill="url(#' + a + ')"/><circle cx="200" cy="108" r="44" fill="url(#' + b + ')"/>' +
      '<ellipse cx="184" cy="88" rx="10" ry="6" fill="#fff" transform="rotate(-30 184 88)"/>' +
      '<g clip-path="url(#' + cl + ')"><rect x="270" y="60" width="100" height="100" fill="url(#' + c + ')" transform="rotate(-18 320 108)"/></g>' +
      '<circle cx="320" cy="108" r="44" fill="none" stroke="#fff" stroke-opacity=".25"/><ellipse cx="305" cy="80" rx="7" ry="3.5" fill="#fff" transform="rotate(-30 305 80)"/>' +
      label(80, 198, 'rubber', TXT, 'middle', 13) + label(200, 198, 'plastic', TXT, 'middle', 13) + label(320, 198, 'metal', TXT, 'middle', 13));
  };

  /* A13 — game engine: real-time scene */
  V.engine = function () {
    var sky = id('e');
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14304a"/><stop offset="1" stop-color="#2d5b6e"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + sky + ')"/>' +
      '<circle cx="320" cy="60" r="22" fill="#ffd08a" opacity=".9"/>' +
      '<path d="M0 200 L60 150 L110 185 L170 130 L240 190 L300 150 L400 200 L400 240 L0 240Z" fill="#1d3b4a"/>' +
      '<rect x="40" y="184" width="110" height="16" rx="3" fill="' + SEL + '"/><rect x="40" y="200" width="110" height="40" fill="#5a2f1c"/>' +
      '<rect x="190" y="150" width="70" height="12" rx="3" fill="' + SEL + '"/><rect x="290" y="118" width="64" height="12" rx="3" fill="' + SEL + '"/>' +
      '<g class="v-coin"><circle cx="322" cy="100" r="7" fill="' + KEY + '"/><circle cx="322" cy="100" r="3" fill="#fff3d6"/></g>' +
      '<g class="v-hop"><rect x="84" y="158" width="20" height="26" rx="6" fill="' + ACT + '"/><rect x="88" y="164" width="5" height="5" fill="' + INK + '"/><rect x="96" y="164" width="5" height="5" fill="' + INK + '"/></g>' +
      '<rect x="10" y="10" width="84" height="22" rx="6" fill="' + INK + '" opacity=".75"/>' + label(52, 25, '▶ PLAY', '#7ddc5a') +
      '<rect x="306" y="206" width="84" height="22" rx="6" fill="' + INK + '" opacity=".75"/>' + label(348, 221, '60 FPS', KEY));
  };

  /* A14 — palettes */
  V.palettes = function () {
    var rows = [['A', ['#0b3d91', '#1565c0', '#1e88e5', '#26c6da', '#80deea']], ['B', ['#b71c1c', '#e64a19', '#fb8c00', '#ffb300', '#ffe082']],
                ['C', ['#212121', '#424242', '#757575', '#9e9e9e', '#e0e0e0']], ['D', ['#1b5e20', '#2e7d32', '#43a047', '#26a69a', '#80cbc4']]];
    var out = '';
    rows.forEach(function (r, i) {
      var y = 34 + i * 48;
      out += badge(46, y + 18, r[0]);
      r[1].forEach(function (col, k) { out += '<rect x="' + (78 + k * 58) + '" y="' + y + '" width="52" height="36" rx="' + (k === 0 ? 8 : 3) + '" fill="' + col + '"/>'; });
    });
    return wrap(out);
  };

  /* A15 — close-up in a viewfinder */
  V.shot = function () {
    var cl = id('s');
    var corner = function (x, y, dx, dy) { return '<path d="M' + x + ' ' + (y + dy * 18) + ' L' + x + ' ' + y + ' L' + (x + dx * 18) + ' ' + y + '" fill="none" stroke="' + TXT + '" stroke-width="3" stroke-linecap="round"/>'; };
    return wrap('<defs><clipPath id="' + cl + '"><rect x="24" y="22" width="352" height="196" rx="6"/></clipPath></defs>' +
      '<rect x="24" y="22" width="352" height="196" rx="6" fill="#1d2030"/>' +
      '<g clip-path="url(#' + cl + ')"><circle cx="200" cy="150" r="118" fill="#e8a77a"/>' +
      '<path d="M82 120 Q92 20 200 24 Q308 20 318 120 Q300 70 200 64 Q100 70 82 120Z" fill="#3b2a22"/>' +
      '<ellipse cx="156" cy="128" rx="20" ry="23" fill="#fff"/><ellipse cx="244" cy="128" rx="20" ry="23" fill="#fff"/>' +
      '<circle cx="158" cy="132" r="10" fill="' + INK + '"/><circle cx="242" cy="132" r="10" fill="' + INK + '"/><circle cx="162" cy="128" r="3" fill="#fff"/><circle cx="246" cy="128" r="3" fill="#fff"/>' +
      '<path d="M130 92 Q156 78 180 92" fill="none" stroke="#3b2a22" stroke-width="7" stroke-linecap="round"/><path d="M220 92 Q244 78 270 92" fill="none" stroke="#3b2a22" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="200" cy="196" rx="15" ry="19" fill="#5a2230"/><path d="M196 150 q4 10 0 16" fill="none" stroke="#c9845a" stroke-width="3" stroke-linecap="round"/></g>' +
      corner(36, 34, 1, 1) + corner(364, 34, -1, 1) + corner(36, 206, 1, -1) + corner(364, 206, -1, -1) +
      '<circle class="v-rec" cx="52" cy="50" r="5" fill="' + NO + '"/>' + label(62, 54, 'REC', TXT, 'start', 12) + label(350, 54, '00:00:12:08', TXT, 'end'));
  };

  /* A16 — rule of thirds */
  V.thirds = function () {
    var sky = id('t');
    var dots = '';
    [[133, 80], [267, 80], [133, 160], [267, 160]].forEach(function (p) { dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + KEY + '"/>'; });
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2135"/><stop offset=".65" stop-color="#7a3a1a"/><stop offset="1" stop-color="#e07a2a"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + sky + ')"/>' +
      '<circle cx="267" cy="80" r="16" fill="#ffd08a"/>' +
      '<path d="M0 175 Q80 150 160 168 T320 160 T400 170 L400 240 L0 240Z" fill="#1d1410"/>' +
      '<path d="M0 205 Q120 186 220 200 T400 196 L400 240 L0 240Z" fill="#0d0a08"/>' +
      '<g fill="#0d0a08"><rect x="131" y="118" width="5" height="52"/><circle cx="133" cy="112" r="18"/><circle cx="122" cy="124" r="12"/><circle cx="145" cy="124" r="12"/></g>' +
      '<g stroke="' + ACT + '" stroke-opacity=".75" stroke-width="1.2" stroke-dasharray="5 5"><line x1="133" y1="0" x2="133" y2="240"/><line x1="267" y1="0" x2="267" y2="240"/><line x1="0" y1="80" x2="400" y2="80"/><line x1="0" y1="160" x2="400" y2="160"/></g>' + dots);
  };

  /* A17 — frame rate flipbook (no giveaway number) */
  V.fps = function () {
    var poses = [
      'M0 -26 L0 0 M0 0 L-9 18 M0 0 L10 16 M0 -18 L-10 -6 M0 -18 L10 -10',
      'M0 -26 L0 0 M0 0 L-3 18 M0 0 L4 18 M0 -18 L-5 -4 M0 -18 L6 -4',
      'M0 -26 L0 0 M0 0 L10 17 M0 0 L-8 16 M0 -18 L10 -6 M0 -18 L-10 -10',
      'M0 -26 L0 0 M0 0 L3 18 M0 0 L-4 18 M0 -18 L5 -4 M0 -18 L-6 -4'
    ];
    var g = '';
    poses.forEach(function (d, i) {
      g += '<g class="v-flip" style="animation-delay:' + (i * 0.25) + 's"><circle cx="0" cy="-33" r="7" fill="none" stroke="' + INK + '" stroke-width="3"/><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
    });
    var ticks = '';
    for (var i = 0; i < 24; i++) ticks += '<rect class="v-tick" style="animation-delay:' + (i / 24).toFixed(3) + 's" x="' + (64 + i * 11.5) + '" y="196" width="7" height="16" rx="2" fill="' + KEY + '"/>';
    return wrap('<rect x="120" y="30" width="160" height="130" rx="6" fill="#c9ccd6"/><rect x="114" y="36" width="160" height="130" rx="6" fill="#dcdfe7"/>' +
      '<rect x="108" y="42" width="160" height="130" rx="6" fill="' + TXT + '"/>' +
      '<g transform="translate(188 128)">' + g + '</g>' +
      '<rect x="58" y="190" width="284" height="28" rx="6" fill="' + P2 + '" stroke="' + LINE + '"/>' + ticks +
      label(200, 234, '? frames = 1 second', MUTE));
  };

  /* A18 — colour wheel, complementary pair */
  V.wheel = function () {
    var cols = ['#ff3b30', '#ff7a1a', '#ffb547', '#ffe14d', '#a5d63f', '#3dbd5d', '#1fb5a7', '#2a8fd6', '#2f5bdb', '#6a4ce0', '#a63ec9', '#e0397d'];
    var out = '', cx = 200, cy = 118, R = 92, r = 44;
    cols.forEach(function (c, i) {
      var a0 = (i / 12) * Math.PI * 2 - Math.PI / 2 - Math.PI / 12, a1 = a0 + Math.PI / 6;
      var hi = i === 1 || i === 7;
      var RR = hi ? R + 10 : R;
      var p = function (a, rad) { return (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1); };
      out += '<path d="M' + p(a0, r) + ' L' + p(a0, RR) + ' A' + RR + ' ' + RR + ' 0 0 1 ' + p(a1, RR) + ' L' + p(a1, r) + ' A' + r + ' ' + r + ' 0 0 0 ' + p(a0, r) + 'Z" fill="' + c + '" opacity="' + (hi ? 1 : 0.35) + '" stroke="' + INK + '" stroke-width="2"/>';
    });
    var a = (1 / 12) * Math.PI * 2 - Math.PI / 2, b = (7 / 12) * Math.PI * 2 - Math.PI / 2;
    out += '<line x1="' + (cx + Math.cos(a) * 54).toFixed(1) + '" y1="' + (cy + Math.sin(a) * 54).toFixed(1) + '" x2="' + (cx + Math.cos(b) * 54).toFixed(1) + '" y2="' + (cy + Math.sin(b) * 54).toFixed(1) + '" stroke="' + TXT + '" stroke-width="2.4" stroke-dasharray="5 4" class="v-dash"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + TXT + '"/>';
    return wrap(out);
  };

  /* A19 — silhouette test */
  V.silhouette = function () {
    var fig = '<circle cx="200" cy="58" r="17"/>' +
      '<path d="M200 76 L196 140 L178 196 M196 140 L232 176 L222 200" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M199 86 L160 60 L146 30 M199 88 L240 104 L268 88" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<rect x="186" y="78" width="26" height="60" rx="11"/>';
    return wrap(floor(190, ACT, 0.12) +
      '<g fill="' + ACT + '" stroke="' + ACT + '">' + fig + '</g>' +
      '<g fill="' + SEL + '" stroke="' + SEL + '" opacity=".9"><path d="M146 30 l-6 -10 m6 10 l10 -6" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="v-sil" fill="#050608" stroke="#050608">' + fig + '<path d="M146 30 l-6 -10 m6 10 l10 -6" stroke-width="5" stroke-linecap="round"/></g>' +
      label(330, 34, 'fill: black', MUTE, 'start'));
  };

  /* A20 — slow in & slow out */
  V.ease = function () {
    var ticks = '';
    for (var i = 0; i <= 10; i++) {
      var t = i / 10, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var x = 70 + e * 260;
      ticks += '<line x1="' + x.toFixed(1) + '" y1="150" x2="' + x.toFixed(1) + '" y2="170" stroke="' + KEY + '" stroke-width="2"/><circle cx="' + x.toFixed(1) + '" cy="120" r="5" fill="' + ACT + '" opacity=".22"/>';
    }
    return wrap('<line x1="60" y1="160" x2="340" y2="160" stroke="' + LINE + '" stroke-width="2"/>' + ticks +
      '<circle class="v-ease" cx="70" cy="120" r="18" fill="' + SEL + '"/>' +
      label(70, 196, 'slow', MUTE) + label(200, 196, 'fast', MUTE) + label(330, 196, 'slow', MUTE));
  };

  /* A21 — arcs */
  V.arcs = function () {
    var path = 'M50 196 Q200 -20 350 196';
    var ghosts = '';
    for (var i = 1; i < 8; i++) {
      var t = i / 8, x = (1 - t) * (1 - t) * 50 + 2 * (1 - t) * t * 200 + t * t * 350, y = (1 - t) * (1 - t) * 196 + 2 * (1 - t) * t * -20 + t * t * 196;
      ghosts += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="10" fill="' + ACT + '" opacity="' + (0.12 + i * 0.03).toFixed(2) + '"/>';
    }
    return wrap(floor(196, ACT, 0.1) + '<path d="' + path + '" fill="none" stroke="' + KEY + '" stroke-width="2" stroke-dasharray="3 7"/>' + ghosts +
      '<circle r="13" fill="' + SEL + '"><animateMotion dur="2.2s" repeatCount="indefinite" path="' + path + '" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".3 0 .7 1"/></circle>' +
      '<line x1="30" y1="198" x2="370" y2="198" stroke="' + LINE + '" stroke-width="2"/>');
  };

  /* A22 — depth of field */
  V.dof = function () {
    var b1 = id('d'), b2 = id('d'), g1 = id('d'), g2 = id('d'), g3 = id('d');
    return wrap('<defs><filter id="' + b1 + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '<filter id="' + b2 + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
      radial(g1, [[0, '#ffd8b0'], [0.5, SEL], [1, '#3a1608']]) + radial(g2, [[0, '#d9fbff'], [0.5, ACT], [1, '#0c3a44']]) + radial(g3, [[0, '#fff1d6'], [0.5, KEY], [1, '#4a2a06']]) + '</defs>' +
      floor(150, ACT, 0.1) +
      '<circle cx="306" cy="90" r="26" fill="url(#' + g3 + ')" filter="url(#' + b2 + ')"/>' +
      '<circle cx="196" cy="120" r="40" fill="url(#' + g2 + ')"/>' +
      '<circle cx="80" cy="168" r="60" fill="url(#' + g1 + ')" filter="url(#' + b1 + ')"/>' +
      '<g fill="none" stroke="' + KEY + '" stroke-width="2.2" class="v-focus"><path d="M144 68 h-8 v14 M248 68 h8 v14 M144 172 h-8 v-14 M248 172 h8 v-14"/></g>' +
      label(196, 196, 'focus', KEY));
  };

  /* A23 — polygons */
  V.mesh = function () {
    var cx = 200, cy = 118, R = 84, lat = 6, lon = 10, pts = [], out = '';
    for (var i = 0; i <= lat; i++) {
      var phi = -Math.PI / 2 + (i / lat) * Math.PI, row = [];
      for (var j = 0; j < lon; j++) {
        var th = (j / lon) * Math.PI * 2 + 0.25;
        var x = Math.cos(phi) * Math.cos(th), z = Math.cos(phi) * Math.sin(th), y = Math.sin(phi);
        var y2 = y * Math.cos(-0.35) - z * Math.sin(-0.35), z2 = y * Math.sin(-0.35) + z * Math.cos(-0.35);
        row.push([cx + x * R, cy + y2 * R, z2]);
      }
      pts.push(row);
    }
    for (var a = 0; a < lat; a++) for (var b = 0; b < lon; b++) {
      var p = [pts[a][b], pts[a][(b + 1) % lon], pts[a + 1][(b + 1) % lon], pts[a + 1][b]];
      var z = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4;
      if (z < -0.05) continue;
      var hi = a === 2 && b === 3;
      out += '<polygon points="' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '" fill="' + (hi ? SEL : '#1d2030') + '" ' +
        (hi ? 'class="v-blink" ' : '') + 'fill-opacity="' + (hi ? 0.9 : (0.35 + z * 0.4).toFixed(2)) + '" stroke="' + ACT + '" stroke-opacity=".7" stroke-width="1.1"/>';
    }
    pts.forEach(function (row) { row.forEach(function (q) { if (q[2] > -0.05) out += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2" fill="' + TXT + '"/>'; }); });
    return wrap(out + label(330, 214, 'faces: 60', MUTE, 'start'));
  };

  /* A24 — UV unwrap: cube ↔ flat cross */
  V.uv = function () {
    function pips(x, y, s, n) {
      var P = { 1: [[.5, .5]], 2: [[.25, .25], [.75, .75]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.25, .25], [.75, .25], [.25, .75], [.75, .75]],
        5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.25, .22], [.75, .22], [.25, .5], [.75, .5], [.25, .78], [.75, .78]] }[n];
      return P.map(function (p) { return '<circle cx="' + (x + p[0] * s).toFixed(1) + '" cy="' + (y + p[1] * s).toFixed(1) + '" r="' + (s * 0.08).toFixed(1) + '" fill="' + INK + '"/>'; }).join('');
    }
    var s = 40, ox = 220, oy = 40, net = '';
    [[1, 0, 1], [0, 1, 2], [1, 1, 3], [2, 1, 4], [3, 1, 5], [1, 2, 6]].forEach(function (c) {
      var x = ox + c[0] * s, y = oy + c[1] * s;
      net += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" fill="' + (c[2] === 3 ? KEY : TXT) + '" stroke="' + SEL + '" stroke-width="1.5"/>' + pips(x, y, s, c[2]);
    });
    var cube = '<polygon points="96,62 146,86 96,110 46,86" fill="' + TXT + '" stroke="' + SEL + '" stroke-width="1.5"/>' +
      '<polygon points="46,86 96,110 96,170 46,146" fill="#c9ccd6" stroke="' + SEL + '" stroke-width="1.5"/>' +
      '<polygon points="96,110 146,86 146,146 96,170" fill="' + KEY + '" stroke="' + SEL + '" stroke-width="1.5"/>' +
      '<circle cx="96" cy="86" r="4" fill="' + INK + '"/><circle cx="62" cy="108" r="3.4" fill="' + INK + '"/><circle cx="80" cy="148" r="3.4" fill="' + INK + '"/>' +
      '<circle cx="112" cy="116" r="3.4" fill="' + INK + '"/><circle cx="130" cy="140" r="3.4" fill="' + INK + '"/><circle cx="121" cy="128" r="3.4" fill="' + INK + '"/>';
    return wrap('<rect x="210" y="30" width="180" height="140" rx="6" fill="' + P2 + '" stroke="' + LINE + '"/>' +
      '<g class="v-uv-net">' + net + '</g><g class="v-uv-cube">' + cube + '</g>' +
      '<path d="M160 116 h36 m-8 -6 l8 6 -8 6" fill="none" stroke="' + ACT + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      label(96, 200, '3D model', MUTE) + label(300, 200, 'flat layout', MUTE));
  };

  /* A25 — pixel vs vector */
  V.vector = function () {
    var px = '', cx = 60, cy = 200, R = 140, step = 14;
    for (var y = 40; y < 196; y += step) for (var x = 40; x < 186; x += step) {
      var d = Math.hypot(x + step / 2 - cx, y + step / 2 - cy);
      if (d < R) px += '<rect x="' + x + '" y="' + y + '" width="' + step + '" height="' + step + '" fill="' + SEL + '" stroke="' + INK + '" stroke-width="1"/>';
    }
    var cl = id('p'), cl2 = id('p');
    return wrap('<defs><clipPath id="' + cl + '"><rect x="40" y="40" width="146" height="156" rx="6"/></clipPath><clipPath id="' + cl2 + '"><rect x="214" y="40" width="146" height="156" rx="6"/></clipPath></defs>' +
      '<rect x="40" y="40" width="146" height="156" rx="6" fill="' + P2 + '" stroke="' + LINE + '"/><g clip-path="url(#' + cl + ')">' + px + '</g>' +
      '<rect x="214" y="40" width="146" height="156" rx="6" fill="' + P2 + '" stroke="' + LINE + '"/>' +
      '<g clip-path="url(#' + cl2 + ')"><circle cx="234" cy="200" r="140" fill="' + SEL + '"/></g>' +
      '<g stroke="' + ACT + '" stroke-width="1.4" fill="none"><line x1="250" y1="62" x2="330" y2="78"/><line x1="356" y1="150" x2="340" y2="110"/></g>' +
      '<g fill="' + INK + '" stroke="' + ACT + '" stroke-width="1.6"><rect x="285" y="64" width="9" height="9"/><rect x="345" y="121" width="9" height="9"/></g>' +
      '<g fill="' + ACT + '"><circle cx="250" cy="62" r="3.5"/><circle cx="330" cy="78" r="3.5"/><circle cx="356" cy="150" r="3.5"/><circle cx="340" cy="110" r="3.5"/></g>' +
      badge(113, 222, 'A') + badge(287, 222, 'B') + label(200, 26, 'zoom 1600%', MUTE));
  };

  /* ================================================================ SET B */

  /* B01 — follow through */
  V.follow = function () {
    return wrap(floor(160, ACT, 0.12) + '<line x1="20" y1="196" x2="380" y2="196" stroke="' + LINE + '" stroke-width="2"/>' +
      '<g class="v-slide"><ellipse cx="200" cy="198" rx="40" ry="5" fill="#000" opacity=".5"/>' +
      '<g class="v-antenna"><path d="M200 120 Q202 90 210 70" fill="none" stroke="' + TXT + '" stroke-width="3" stroke-linecap="round"/><circle cx="210" cy="68" r="8" fill="' + SEL + '"/></g>' +
      '<rect x="164" y="118" width="72" height="62" rx="20" fill="' + ACT + '"/><rect x="176" y="134" width="48" height="22" rx="10" fill="' + INK + '"/>' +
      '<circle cx="190" cy="145" r="5" fill="' + KEY + '"/><circle cx="210" cy="145" r="5" fill="' + KEY + '"/>' +
      '<circle cx="180" cy="186" r="10" fill="' + P3 + '" stroke="' + TXT + '" stroke-width="2"/><circle cx="220" cy="186" r="10" fill="' + P3 + '" stroke="' + TXT + '" stroke-width="2"/></g>');
  };

  /* B02 — timing: 4 frames vs 12 frames */
  V.timing = function () {
    var a = '', b = '';
    for (var i = 0; i < 4; i++) a += '<rect x="' + (70 + i * (260 / 3) - 1) + '" y="96" width="2" height="12" fill="' + KEY + '"/>';
    for (var k = 0; k < 12; k++) b += '<rect x="' + (70 + k * (260 / 11) - 1) + '" y="186" width="2" height="12" fill="' + KEY + '"/>';
    return wrap('<line x1="60" y1="102" x2="340" y2="102" stroke="' + LINE + '" stroke-width="2"/>' + a +
      '<line x1="60" y1="192" x2="340" y2="192" stroke="' + LINE + '" stroke-width="2"/>' + b +
      '<circle class="v-time-a" cx="70" cy="74" r="16" fill="' + ACT + '"/><circle class="v-time-b" cx="70" cy="164" r="16" fill="' + SEL + '"/>' +
      badge(28, 74, 'A') + badge(28, 164, 'B') + label(372, 106, '4 fr', MUTE, 'end') + label(372, 196, '12 fr', MUTE, 'end'));
  };

  /* B03 — exaggeration */
  V.exagg = function () {
    function face(cx, k) {
      var eye = 9 + k * 12, brow = 10 + k * 16, mouthH = 6 + k * 26;
      return '<circle cx="' + cx + '" cy="112" r="62" fill="#e8a77a"/>' +
        '<ellipse cx="' + (cx - 22) + '" cy="102" rx="' + eye + '" ry="' + (eye * 1.15) + '" fill="#fff"/><ellipse cx="' + (cx + 22) + '" cy="102" rx="' + eye + '" ry="' + (eye * 1.15) + '" fill="#fff"/>' +
        '<circle cx="' + (cx - 22) + '" cy="104" r="' + (4 + k * 2) + '" fill="' + INK + '"/><circle cx="' + (cx + 22) + '" cy="104" r="' + (4 + k * 2) + '" fill="' + INK + '"/>' +
        '<path d="M' + (cx - 36) + ' ' + (88 - brow) + ' q14 -' + (6 + k * 6) + ' 26 0 M' + (cx + 10) + ' ' + (88 - brow) + ' q14 -' + (6 + k * 6) + ' 26 0" fill="none" stroke="#3b2a22" stroke-width="5" stroke-linecap="round"/>' +
        '<ellipse cx="' + cx + '" cy="' + (140 + k * 8) + '" rx="' + (8 + k * 6) + '" ry="' + mouthH / 2 + '" fill="#5a2230"/>';
    }
    return wrap(face(110, 0) + '<g class="v-boing">' + face(290, 1) + '</g>' + badge(110, 210, 'A') + badge(290, 210, 'B'));
  };

  /* B04 — staging */
  V.stage = function () {
    var cone = id('s');
    function guy(x, col, o) { return '<g opacity="' + o + '"><circle cx="' + x + '" cy="128" r="13" fill="' + col + '"/><rect x="' + (x - 14) + '" y="144" width="28" height="44" rx="12" fill="' + col + '"/></g>'; }
    return wrap('<defs><linearGradient id="' + cone + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + KEY + '" stop-opacity=".5"/><stop offset="1" stop-color="' + KEY + '" stop-opacity=".05"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="#08090c"/><rect x="0" y="186" width="400" height="54" fill="#1d1410"/>' +
      '<path d="M0 0 h50 q-10 120 0 186 h-50z M400 0 h-50 q10 120 0 186 h50z" fill="#5a1414"/>' +
      '<polygon class="v-spot" points="186,0 214,0 260,196 140,196" fill="url(#' + cone + ')"/>' +
      '<ellipse cx="200" cy="194" rx="62" ry="9" fill="' + KEY + '" opacity=".35"/>' +
      guy(110, '#3a3f55', 0.6) + guy(290, '#3a3f55', 0.6) + guy(200, SEL, 1) +
      '<circle cx="195" cy="126" r="2.5" fill="' + INK + '"/><circle cx="205" cy="126" r="2.5" fill="' + INK + '"/>');
  };

  /* B05 — walk cycle */
  V.walk = function () {
    return wrap(floor(170, ACT, 0.12) + '<line x1="80" y1="206" x2="320" y2="206" stroke="' + LINE + '" stroke-width="2"/>' +
      '<g class="v-bob"><circle cx="200" cy="70" r="15" fill="none" stroke="' + TXT + '" stroke-width="4"/>' +
      '<line x1="200" y1="86" x2="200" y2="142" stroke="' + TXT + '" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="v-armL"><line x1="200" y1="96" x2="200" y2="136" stroke="' + ACT + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="v-armR"><line x1="200" y1="96" x2="200" y2="136" stroke="' + SEL + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="v-legL"><line x1="200" y1="142" x2="200" y2="204" stroke="' + ACT + '" stroke-width="6" stroke-linecap="round"/></g>' +
      '<g class="v-legR"><line x1="200" y1="142" x2="200" y2="204" stroke="' + SEL + '" stroke-width="6" stroke-linecap="round"/></g></g>' +
      '<g fill="none" stroke="' + KEY + '" stroke-width="2.4" stroke-linecap="round"><path d="M320 92 a26 26 0 1 1 -10 -20"/><path d="M314 64 l-4 8 9 2"/></g>' +
      label(308, 150, 'loop', KEY, 'middle'));
  };

  /* B06 — turnaround */
  V.turn = function () {
    var out = '<g stroke="' + ACT + '" stroke-opacity=".35" stroke-dasharray="4 4"><line x1="20" y1="56" x2="380" y2="56"/><line x1="20" y1="128" x2="380" y2="128"/><line x1="20" y1="200" x2="380" y2="200"/></g>';
    var xs = [65, 155, 245, 335], names = ['front', '3/4', 'side', 'back'];
    xs.forEach(function (x, i) {
      out += '<rect x="' + (x - 18) + '" y="96" width="36" height="66" rx="14" fill="' + (i === 3 ? '#c0611a' : SEL) + '"/>' +
        '<rect x="' + (x - 13) + '" y="160" width="10" height="40" rx="4" fill="' + P3 + '"/><rect x="' + (x + 3) + '" y="160" width="10" height="40" rx="4" fill="' + P3 + '"/>' +
        '<circle cx="' + x + '" cy="74" r="20" fill="#e8a77a"/>';
      if (i === 0) out += '<path d="M' + (x - 20) + ' 70 q20 -30 40 0" fill="#3b2a22"/><circle cx="' + (x - 7) + '" cy="76" r="2.6" fill="' + INK + '"/><circle cx="' + (x + 7) + '" cy="76" r="2.6" fill="' + INK + '"/>';
      if (i === 1) out += '<path d="M' + (x - 20) + ' 70 q16 -30 40 -2 q-14 -6 -22 6" fill="#3b2a22"/><circle cx="' + (x + 2) + '" cy="76" r="2.6" fill="' + INK + '"/><circle cx="' + (x + 13) + '" cy="76" r="2.4" fill="' + INK + '"/>';
      if (i === 2) out += '<path d="M' + (x - 20) + ' 74 q6 -32 34 -18 q-14 -2 -16 16 q-6 -6 -18 2" fill="#3b2a22"/><circle cx="' + (x + 11) + '" cy="76" r="2.6" fill="' + INK + '"/><path d="M' + (x + 19) + ' 78 l5 4 -5 2" fill="#e8a77a"/>';
      if (i === 3) out += '<path d="M' + (x - 20) + ' 76 q20 -40 40 0 q-20 12 -40 0" fill="#3b2a22"/>';
      out += label(x, 226, names[i], MUTE);
    });
    return wrap(out);
  };

  /* B07 — three-point lighting (top view) */
  V.threepoint = function () {
    function lamp(x, y, rot, col, txt) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><polygon points="0,0 70,-26 70,26" fill="' + col + '" opacity=".14"/><rect x="-14" y="-10" width="22" height="20" rx="4" fill="' + col + '"/></g>' +
        label(x, y + (y > 120 ? 30 : -18), txt, col);
    }
    return wrap('<rect x="20" y="16" width="360" height="208" rx="10" fill="' + P2 + '" stroke="' + LINE + '"/>' +
      '<g stroke="' + LINE + '">' + [60, 100, 140, 180].map(function (y) { return '<line x1="20" y1="' + y + '" x2="380" y2="' + y + '"/>'; }).join('') + '</g>' +
      lamp(90, 170, -30, KEY, 'key') + lamp(310, 170, -150, ACT, 'fill') +
      '<g class="v-pulse-soft">' + lamp(200, 46, 90, '#a9aec2', '?') + '</g>' +
      '<circle cx="200" cy="120" r="20" fill="' + SEL + '"/>' + label(200, 124, 'subject', INK, 'middle', 8) +
      '<g transform="translate(200 206)"><rect x="-16" y="-10" width="32" height="18" rx="4" fill="' + TXT + '"/><polygon points="-8,-10 8,-10 4,-18 -4,-18" fill="' + TXT + '"/></g>' + label(240, 210, 'camera', MUTE, 'start'));
  };

  /* B08 — colour temperature */
  V.temp = function () {
    var g = id('k'), w = id('k'), c = id('k');
    return wrap('<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a1a"/><stop offset=".35" stop-color="#ffd8a0"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#7fb2ff"/></linearGradient>' +
      radial(w, [[0, '#ffcf80'], [0.5, '#7a3a10'], [1, '#160b06']], 0.5, 0.55) + radial(c, [[0, '#a8ccff'], [0.5, '#1a2e5a'], [1, '#070b16']], 0.5, 0.4) + '</defs>' +
      '<rect x="16" y="16" width="180" height="150" rx="8" fill="url(#' + w + ')"/><rect x="204" y="16" width="180" height="150" rx="8" fill="url(#' + c + ')"/>' +
      '<rect x="100" y="104" width="12" height="34" rx="2" fill="#f1e6d0"/><path class="v-flame" d="M106 82 q-9 12 0 22 q9 -10 0 -22" fill="' + KEY + '"/>' +
      '<circle cx="320" cy="60" r="18" fill="#dbe8ff"/><circle cx="328" cy="54" r="16" fill="#152447"/>' +
      '<rect x="40" y="184" width="320" height="14" rx="7" fill="url(#' + g + ')"/>' +
      label(40, 220, '2000 K', MUTE, 'start') + label(200, 220, '5500 K', MUTE) + label(360, 220, '10000 K', MUTE, 'end'));
  };

  /* B09 — low-angle shot */
  V.lowangle = function () {
    var sky = id('l');
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14304a"/><stop offset="1" stop-color="#e07a2a"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + sky + ')"/>' +
      '<polygon points="160,230 240,230 226,90 174,90" fill="' + SEL + '"/>' +
      '<polygon points="150,240 196,240 194,226 156,226" fill="' + INK + '"/><polygon points="204,240 250,240 244,226 206,226" fill="' + INK + '"/>' +
      '<polygon points="174,96 140,150 150,154 182,110" fill="#c0611a"/><polygon points="226,96 260,150 250,154 218,110" fill="#c0611a"/>' +
      '<circle cx="200" cy="72" r="20" fill="#e8a77a"/><path d="M182 66 q18 -22 36 0" fill="#3b2a22"/>' +
      '<path d="M226 92 q50 20 40 70" fill="none" stroke="' + NO + '" stroke-width="10" stroke-linecap="round" opacity=".85"/>' +
      '<g transform="translate(62 214) rotate(-35)"><rect x="-20" y="-12" width="40" height="24" rx="5" fill="' + INK + '" stroke="' + TXT + '" stroke-width="2"/><circle cx="22" cy="0" r="7" fill="' + INK + '" stroke="' + ACT + '" stroke-width="2"/></g>' +
      '<g stroke="' + ACT + '" stroke-width="1.4" stroke-dasharray="4 5" opacity=".8"><line x1="80" y1="200" x2="200" y2="60"/><line x1="80" y1="200" x2="250" y2="140"/></g>');
  };

  /* B10 — establishing shot */
  V.establish = function () {
    var sky = id('e'), win = '';
    var bld = [[20, 120, 40], [64, 90, 34], [102, 140, 30], [136, 70, 44], [184, 110, 36], [224, 60, 40], [268, 100, 34], [306, 130, 30], [340, 84, 44]];
    var out = '';
    bld.forEach(function (b, i) {
      out += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + (220 - b[1]) + '" fill="' + (i % 2 ? '#141722' : '#181c29') + '"/>';
      for (var y = b[1] + 10; y < 210; y += 14) for (var x = b[0] + 6; x < b[0] + b[2] - 6; x += 10) if ((x * 7 + y * 3 + i) % 5 === 0) win += '<rect x="' + x + '" y="' + y + '" width="4" height="6" fill="' + KEY + '" opacity=".85"/>';
    });
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0e13"/><stop offset=".6" stop-color="#3a1d4a"/><stop offset="1" stop-color="#e07a2a"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + sky + ')"/><circle cx="300" cy="50" r="2" fill="#fff"/><circle cx="60" cy="34" r="1.5" fill="#fff"/><circle cx="180" cy="22" r="1.5" fill="#fff"/>' +
      out + win + '<rect x="0" y="216" width="400" height="24" fill="#08090c"/>' +
      '<g transform="translate(18 16)"><rect width="96" height="44" rx="4" fill="' + INK + '" stroke="' + TXT + '" stroke-width="1.4"/>' +
      '<path d="M0 0 h96 v10 h-96z" fill="' + TXT + '"/><g fill="' + INK + '"><path d="M10 0 h12 l-8 10 h-12z M34 0 h12 l-8 10 h-12z M58 0 h12 l-8 10 h-12z M82 0 h12 l-8 10 h-12z"/></g>' +
      '<text x="8" y="26" font-family="' + MONO + '" font-size="9" fill="' + TXT + '">SCENE 1</text><text x="8" y="38" font-family="' + MONO + '" font-size="9" fill="' + KEY + '">SHOT 1</text></g>');
  };

  /* B11 — chroma key */
  V.greenscreen = function () {
    var cols = ['#ff3b30', '#ff7a1a', '#ffb547', '#ffe14d', '#a5d63f', '#00d14a', '#1fb5a7', '#2a8fd6', '#2f5bdb', '#6a4ce0', '#a63ec9', '#e0397d'];
    var bar = '';
    cols.forEach(function (c, i) { bar += '<rect x="' + (220 + i * 13) + '" y="104" width="13" height="22" fill="' + c + '"/>'; });
    return wrap('<rect x="16" y="20" width="176" height="200" rx="8" fill="#00d14a"/>' +
      '<g><circle cx="104" cy="96" r="22" fill="#d9a07a"/><path d="M84 88 q20 -28 40 0" fill="#3b2a22"/><rect x="76" y="122" width="56" height="98" rx="22" fill="#2b2f42"/>' +
      '<rect x="64" y="128" width="16" height="60" rx="8" fill="#d9a07a"/><rect x="128" y="128" width="16" height="60" rx="8" fill="#d9a07a"/></g>' +
      '<rect x="212" y="70" width="172" height="100" rx="8" fill="' + P2 + '" stroke="' + LINE + '"/>' + label(298, 90, 'hue', MUTE) + bar +
      '<g><polygon points="246,132 240,144 252,144" fill="#d9a07a"/><polygon points="292,132 286,144 298,144" fill="#00d14a"/></g>' +
      label(232, 160, 'skin', '#d9a07a', 'start') + label(282, 160, 'screen', '#00d14a', 'start') +
      '<path d="M252 150 h32" stroke="' + KEY + '" stroke-width="1.6" stroke-dasharray="3 3"/>');
  };

  /* B12 — particles */
  V.particles = function () {
    var out = '';
    for (var i = 0; i < 34; i++) {
      var dx = ((i * 37) % 120) - 60, dy = 120 + ((i * 53) % 60), dl = ((i * 0.137) % 2.2).toFixed(2), sz = 2 + (i % 4);
      out += '<circle class="v-part" style="--dx:' + dx + 'px;--dy:-' + dy + 'px;animation-delay:-' + dl + 's" cx="200" cy="196" r="' + sz + '" fill="' + [KEY, SEL, '#fff3d6', KEY][i % 4] + '"/>';
    }
    return wrap('<rect width="400" height="240" fill="#08090c"/>' + floor(196, ACT, 0.1) + out +
      '<ellipse cx="200" cy="200" rx="34" ry="7" fill="' + SEL + '" opacity=".5"/><rect x="186" y="196" width="28" height="14" rx="3" fill="' + P3 + '" stroke="' + KEY + '"/>' +
      label(330, 30, 'count: 34,000', MUTE, 'start'));
  };

  /* B13 — rotoscoping */
  V.roto = function () {
    var body = [[200, 46], [214, 52], [216, 70], [208, 84], [232, 96], [262, 82], [270, 90], [238, 112], [228, 140], [250, 196], [238, 200], [212, 150], [196, 152], [176, 200], [162, 196], [184, 140], [174, 110], [140, 96], [142, 86], [176, 94], [192, 84], [186, 68], [188, 52]];
    var d = 'M' + body[0][0] + ' ' + body[0][1] + smooth(body.concat([body[0]])) + 'Z';
    var dots = body.filter(function (p, i) { return i % 2 === 0; }).map(function (p) { return '<rect x="' + (p[0] - 3) + '" y="' + (p[1] - 3) + '" width="6" height="6" fill="' + INK + '" stroke="' + SEL + '" stroke-width="1.5"/>'; }).join('');
    return wrap('<rect x="20" y="16" width="360" height="208" rx="6" fill="#262a38"/><rect x="20" y="170" width="360" height="54" fill="#1d2030"/>' +
      '<path d="' + d + '" fill="#5a5f73"/>' +
      '<path class="v-trace" d="' + d + '" fill="none" stroke="' + SEL + '" stroke-width="2.2" stroke-dasharray="6 4"/>' + dots +
      '<rect x="20" y="16" width="360" height="22" fill="' + INK + '" opacity=".7"/>' + label(30, 31, 'ROTO · shape_01', TXT, 'start') + label(370, 31, 'frame 042', KEY, 'end'));
  };

  /* B14 — motion tracking */
  V.track = function () {
    function mark(x, y) {
      return '<g transform="translate(' + x + ' ' + y + ')"><line x1="-16" y1="0" x2="-4" y2="0" stroke="' + ACT + '" stroke-opacity=".5" stroke-width="2"/>' +
        '<path d="M-5 -5 L5 5 M-5 5 L5 -5" stroke="' + KEY + '" stroke-width="2.2"/><rect x="-9" y="-9" width="18" height="18" fill="none" stroke="' + ACT + '" stroke-width="1"/></g>';
    }
    return wrap('<defs><clipPath id="' + id('t') + 'c"><rect width="400" height="240"/></clipPath></defs>' +
      '<g class="v-pan"><rect x="-40" y="0" width="480" height="240" fill="#1a1d28"/>' +
      '<rect x="-30" y="40" width="120" height="140" fill="#262a38"/><rect x="110" y="20" width="90" height="160" fill="#2e3344"/><rect x="220" y="56" width="130" height="124" fill="#262a38"/><rect x="370" y="30" width="80" height="150" fill="#2e3344"/>' +
      '<polygon points="-40,180 440,180 440,240 -40,240" fill="#121520"/><path d="M-40 214 H440" stroke="#4a4f66" stroke-width="3" stroke-dasharray="20 16"/>' +
      mark(30, 70) + mark(150, 60) + mark(260, 90) + mark(330, 150) + mark(80, 196) + mark(220, 206) + mark(390, 120) + '</g>' +
      '<rect x="0" y="0" width="400" height="22" fill="' + INK + '" opacity=".75"/>' + label(10, 15, 'CAMERA TRACK', TXT, 'start') + label(390, 15, 'solve 0.31 px', '#7ddc5a', 'end'));
  };

  /* B15 — rendering (bucket tiles reveal the finished render) */
  V.render = function () {
    var g = id('r'), tiles = '', n = 0;
    for (var y = 0; y < 4; y++) for (var x = 0; x < 6; x++) {
      tiles += '<rect class="v-tile" style="animation-delay:' + (n * 0.11).toFixed(2) + 's" x="' + (80 + x * 40) + '" y="' + (30 + y * 40) + '" width="40" height="40" fill="' + P2 + '" stroke="' + KEY + '" stroke-opacity=".25"/>';
      n++;
    }
    var wire = '';
    for (var i = -3; i <= 3; i++) wire += '<ellipse cx="200" cy="110" rx="' + Math.abs(70 * Math.cos(i / 3.4 * Math.PI / 2)).toFixed(1) + '" ry="70" fill="none"/>';
    for (var j = -3; j <= 3; j++) wire += '<ellipse cx="200" cy="' + (110 + j * 20) + '" rx="' + (70 * Math.sqrt(1 - Math.pow(j / 3.5, 2))).toFixed(1) + '" ry="5" fill="none"/>';
    return wrap('<defs>' + radial(g, [[0, '#ffe6bf'], [0.4, SEL], [1, '#2a0f04']]) + '</defs>' +
      '<rect x="80" y="30" width="240" height="160" fill="#1d2030"/><circle cx="200" cy="110" r="70" fill="url(#' + g + ')"/>' +
      '<ellipse cx="226" cy="168" rx="60" ry="8" fill="#000" opacity=".35"/>' +
      tiles + '<g stroke="' + ACT + '" stroke-opacity=".35" stroke-width="1">' + wire + '</g>' +
      '<rect x="80" y="30" width="240" height="160" fill="none" stroke="' + LINE + '"/>' +
      '<rect x="80" y="204" width="240" height="8" rx="4" fill="' + P3 + '"/><rect class="v-bar" x="80" y="204" width="240" height="8" rx="4" fill="' + KEY + '"/>' +
      label(80, 228, 'Rendering…', MUTE, 'start') + label(320, 228, 'Cycles', MUTE, 'end'));
  };

  /* B16 — extrude */
  V.extrude = function () {
    var lo = { t: '200,92 260,120 200,148 140,120', l: '140,120 200,148 200,190 140,162', r: '200,148 260,120 260,162 200,190' };
    var hi = { t: '200,42 260,70 200,98 140,70', l: '140,70 200,98 200,190 140,162', r: '200,98 260,70 260,162 200,190' };
    function poly(a, b, fill, stroke) {
      return '<polygon points="' + a + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6"><animate attributeName="points" dur="3s" repeatCount="indefinite" values="' + a + ';' + b + ';' + b + ';' + a + ';' + a + '" keyTimes="0;.35;.6;.9;1" calcMode="spline" keySplines=".3 0 .2 1;0 0 1 1;.3 0 .2 1;0 0 1 1"/></polygon>';
    }
    return wrap(floor(150, ACT, 0.12) +
      poly(lo.l, hi.l, '#2b2f42', ACT) + poly(lo.r, hi.r, '#1d2030', ACT) + poly(lo.t, hi.t, SEL, KEY) +
      '<g><line x1="200" y1="120" x2="200" y2="70" stroke="#4d8dff" stroke-width="3"><animate attributeName="y1" dur="3s" repeatCount="indefinite" values="120;70;70;120;120" keyTimes="0;.35;.6;.9;1"/><animate attributeName="y2" dur="3s" repeatCount="indefinite" values="70;20;20;70;70" keyTimes="0;.35;.6;.9;1"/></line>' +
      '<polygon points="194,74 206,74 200,62" fill="#4d8dff"><animateTransform attributeName="transform" type="translate" dur="3s" repeatCount="indefinite" values="0 0;0 -50;0 -50;0 0;0 0" keyTimes="0;.35;.6;.9;1"/></polygon></g>' +
      label(300, 214, 'E  ↑', KEY, 'start', 13));
  };

  /* B17 — isometric */
  V.iso = function () {
    function tile(cx, cy, col) { return '<polygon points="' + cx + ',' + (cy - 15) + ' ' + (cx + 30) + ',' + cy + ' ' + cx + ',' + (cy + 15) + ' ' + (cx - 30) + ',' + cy + '" fill="' + col + '" stroke="' + INK + '" stroke-width="1"/>'; }
    var out = '';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      var cx = 200 + (c - r) * 30, cy = 52 + (c + r) * 15;
      out += tile(cx, cy, (r === 2 || c === 1) ? '#b8875a' : ((r + c) % 2 ? '#3d8b4a' : '#46a055'));
    }
    var house = '<polygon points="200,92 230,107 230,135 200,150 170,135 170,107" fill="#2b2f42"/>' +
      '<polygon points="170,107 200,122 200,150 170,135" fill="#e8dcc8"/><polygon points="200,122 230,107 230,135 200,150" fill="#cdbfa8"/>' +
      '<polygon points="166,106 200,74 234,106 200,124" fill="' + SEL + '"/><polygon points="200,74 234,106 200,124" fill="#c0611a"/>' +
      '<rect x="210" y="128" width="8" height="14" fill="' + INK + '" transform="skewY(-26.5) translate(0 106)"/>';
    function tree(x, y) { return '<rect x="' + (x - 2) + '" y="' + (y - 10) + '" width="4" height="12" fill="#5a2f1c"/><circle cx="' + x + '" cy="' + (y - 18) + '" r="11" fill="#1f6b33"/><circle cx="' + (x - 3) + '" cy="' + (y - 21) + '" r="5" fill="#2f8f46"/>'; }
    return wrap('<rect width="400" height="240" fill="#0f1f2c"/>' + out + house + tree(290, 134) + tree(110, 134) + tree(260, 182));
  };

  /* B18 — HUD */
  V.hud = function () {
    var sky = id('h');
    var hearts = '';
    for (var i = 0; i < 3; i++) hearts += '<path transform="translate(' + (20 + i * 22) + ' 20)" d="M8 15 L1 8 a4.2 4.2 0 0 1 7 -5 a4.2 4.2 0 0 1 7 5z" fill="' + (i < 2 ? NO : '#3a3f55') + '"/>';
    return wrap('<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3a5a"/><stop offset="1" stop-color="#40806e"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + sky + ')"/><path d="M0 180 Q100 150 200 176 T400 168 V240 H0Z" fill="#26493a"/>' +
      '<g class="v-hop"><rect x="186" y="150" width="22" height="30" rx="7" fill="' + KEY + '"/><rect x="191" y="157" width="5" height="5" fill="' + INK + '"/><rect x="199" y="157" width="5" height="5" fill="' + INK + '"/></g>' +
      '<g class="v-hud">' + hearts + '<rect x="20" y="42" width="110" height="8" rx="4" fill="' + INK + '" opacity=".6"/><rect x="20" y="42" width="72" height="8" rx="4" fill="#7ddc5a"/>' +
      '<circle cx="356" cy="44" r="30" fill="' + INK + '" opacity=".7" stroke="' + TXT + '" stroke-width="1.5"/><path d="M340 40 h18 v10 h10" fill="none" stroke="' + MUTE + '" stroke-width="2"/><circle class="v-blink" cx="356" cy="44" r="3.5" fill="' + KEY + '"/>' +
      '<rect x="138" y="206" width="124" height="24" rx="6" fill="' + INK + '" opacity=".7"/>' + label(200, 222, 'SCORE 004250', TXT) +
      '<rect x="20" y="206" width="56" height="24" rx="6" fill="' + INK + '" opacity=".7"/>' + label(48, 222, '◆ 12', ACT) + '</g>');
  };

  /* B19 — hitbox */
  V.hitbox = function () {
    var px = function (x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>'; };
    var hero = px(132, 96, 32, 28, '#e8a77a') + px(128, 88, 40, 12, '#3b2a22') + px(152, 104, 6, 6, INK) + px(128, 124, 40, 40, SEL) +
      px(118, 128, 10, 26, '#e8a77a') + px(168, 128, 10, 26, '#e8a77a') + px(132, 164, 12, 30, '#2b2f42') + px(152, 164, 12, 30, '#2b2f42');
    return wrap('<rect width="400" height="240" fill="#121520"/>' + floor(194, ACT, 0.12) + '<line x1="0" y1="196" x2="400" y2="196" stroke="' + LINE + '" stroke-width="2"/>' + hero +
      '<rect class="v-hit" x="112" y="84" width="72" height="112" fill="' + NO + '" fill-opacity="0" stroke="' + ACT + '" stroke-width="2" stroke-dasharray="6 4"/>' +
      '<rect x="126" y="86" width="44" height="40" fill="none" stroke="' + KEY + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<g class="v-fireball"><circle cx="350" cy="130" r="12" fill="' + SEL + '"/><circle cx="350" cy="130" r="6" fill="#fff3d6"/>' +
      '<rect x="336" y="116" width="28" height="28" fill="none" stroke="' + ACT + '" stroke-width="1.5" stroke-dasharray="4 3"/></g>');
  };

  /* B20 — sprite sheet */
  V.sprites = function () {
    var poses = [[-8, 8, 8, -8], [-3, 3, 3, -3], [8, -8, -8, 8], [3, -3, -3, 3], [-8, 8, 8, -8], [0, 0, 0, 0]];
    function runner(dx, dy, p) {
      var x = dx, y = dy;
      return '<rect x="' + (x - 6) + '" y="' + (y - 26) + '" width="12" height="12" fill="#e8a77a"/><rect x="' + (x - 7) + '" y="' + (y - 14) + '" width="14" height="16" fill="' + ACT + '"/>' +
        '<rect x="' + (x - 6 + p[0]) + '" y="' + (y + 2) + '" width="5" height="14" fill="' + TXT + '"/><rect x="' + (x + 1 + p[1]) + '" y="' + (y + 2) + '" width="5" height="14" fill="' + MUTE + '"/>' +
        '<rect x="' + (x - 11 + p[2] / 2) + '" y="' + (y - 12) + '" width="4" height="12" fill="#e8a77a"/><rect x="' + (x + 7 + p[3] / 2) + '" y="' + (y - 12) + '" width="4" height="12" fill="#e8a77a"/>';
    }
    var grid = '', prev = '';
    for (var i = 0; i < 6; i++) {
      var gx = 30 + (i % 3) * 64, gy = 50 + Math.floor(i / 3) * 76;
      grid += '<rect x="' + gx + '" y="' + gy + '" width="60" height="72" fill="' + P2 + '" stroke="' + LINE + '"/>' + runner(gx + 30, gy + 46, poses[i]) + label(gx + 6, gy + 12, String(i + 1), MUTE, 'start', 9);
      prev += '<g class="v-sframe" style="animation-delay:' + (i * 0.12).toFixed(2) + 's">' + runner(312, 150, poses[i]) + '</g>';
    }
    return wrap(grid + '<rect class="v-sel6" x="30" y="50" width="60" height="72" fill="none" stroke="' + SEL + '" stroke-width="2.5"/>' +
      '<rect x="252" y="70" width="120" height="120" rx="8" fill="' + P2 + '" stroke="' + LINE + '"/>' + prev + label(312, 206, 'preview', MUTE));
  };

  /* B21 — serifs */
  V.serif = function () {
    return wrap('<g fill="' + TXT + '"><rect x="58" y="40" width="130" height="22"/><rect x="110" y="40" width="26" height="150"/>' +
      '<g fill="' + SEL + '" class="v-blink-soft"><rect x="84" y="182" width="78" height="10" rx="2"/><path d="M58 40 h12 v40 q-4 -18 -12 -22z"/><path d="M188 40 h-12 v40 q4 -18 12 -22z"/></g></g>' +
      '<g fill="#5a5f73"><rect x="232" y="40" width="120" height="22"/><rect x="279" y="40" width="26" height="152"/></g>' +
      '<path d="M88 206 l-8 8 m8 -8 l-14 -2" stroke="' + KEY + '" stroke-width="2" fill="none"/>' + label(122, 230, 'T', TXT) + label(292, 230, 'T', MUTE));
  };

  /* B22 — kerning */
  V.kerning = function () {
    return wrap('<line x1="40" y1="186" x2="360" y2="186" stroke="' + LINE + '" stroke-width="2"/>' +
      '<polygon points="96,186 140,52 166,52 210,186 184,186 174,152 132,152 122,186" fill="' + TXT + '"/><polygon points="138,128 168,128 153,82" fill="' + INK + '"/>' +
      '<g class="v-kern"><polygon points="186,52 212,52 244,156 276,52 302,52 258,186 230,186" fill="' + KEY + '"/>' +
      '<g stroke="' + ACT + '" stroke-width="2"><line x1="210" y1="204" x2="236" y2="204"/><line x1="210" y1="198" x2="210" y2="210"/></g></g>' +
      label(330, 222, 'AV −80', ACT, 'end'));
  };

  /* B23 — Kanizsa triangle */
  V.kanizsa = function () {
    var A = [200, 34], B = [96, 210], C = [304, 210], r = 30;
    function pac(p, a1, a2) {
      var x1 = p[0] + Math.cos(a1) * r, y1 = p[1] + Math.sin(a1) * r, x2 = p[0] + Math.cos(a2) * r, y2 = p[1] + Math.sin(a2) * r;
      return '<path d="M' + p[0] + ' ' + p[1] + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + r + ' ' + r + ' 0 1 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' Z" fill="' + SEL + '"/>';
    }
    function ang(p, q) { return Math.atan2(q[1] - p[1], q[0] - p[0]); }
    var out = '<rect x="40" y="0" width="320" height="240" fill="' + TXT + '"/>' +
      pac(A, ang(A, C), ang(A, B)) + pac(B, ang(B, A), ang(B, C)) + pac(C, ang(C, B), ang(C, A));
    var D = [200, 236], E = [126, 92], F = [274, 92];
    function corner(p, q1, q2) { return '<path d="M' + (p[0] + (q1[0] - p[0]) * 0.3).toFixed(1) + ' ' + (p[1] + (q1[1] - p[1]) * 0.3).toFixed(1) + ' L' + p[0] + ' ' + p[1] + ' L' + (p[0] + (q2[0] - p[0]) * 0.3).toFixed(1) + ' ' + (p[1] + (q2[1] - p[1]) * 0.3).toFixed(1) + '" fill="none" stroke="' + INK + '" stroke-width="3"/>'; }
    out += corner(D, E, F) + corner(E, D, F) + corner(F, D, E);
    return wrap(out);
  };

  /* B24 — rotation sequence */
  V.sequence = function () {
    var out = '<rect x="10" y="40" width="380" height="160" rx="6" fill="#08090c"/>';
    for (var i = 0; i < 26; i++) { out += '<rect x="' + (18 + i * 14.6) + '" y="48" width="8" height="8" rx="2" fill="' + LINE + '"/><rect x="' + (18 + i * 14.6) + '" y="184" width="8" height="8" rx="2" fill="' + LINE + '"/>'; }
    [0, 90, 180].forEach(function (rot, k) {
      var x = 20 + k * 93;
      out += '<rect x="' + x + '" y="64" width="85" height="112" rx="4" fill="' + P2 + '" stroke="' + LINE + '"/>' +
        '<g transform="translate(' + (x + 42.5) + ' 120) rotate(' + rot + ')"><path d="M0 -30 L18 -6 H7 V28 H-7 V-6 H-18Z" fill="' + KEY + '"/></g>' + label(x + 8, 78, String(k + 1), MUTE, 'start', 10);
    });
    out += '<rect x="299" y="64" width="85" height="112" rx="4" fill="' + P2 + '" stroke="' + SEL + '" stroke-width="2" class="v-pulse-soft"/>' +
      '<text x="341" y="136" text-anchor="middle" font-size="44" font-weight="800" fill="' + SEL + '">?</text>' + label(307, 78, '4', MUTE, 'start', 10);
    return wrap(out);
  };

  /* B25 — editing timeline */
  V.timeline = function () {
    var wave = '';
    for (var i = 0; i < 64; i++) { var h = 3 + Math.abs(Math.sin(i * 0.7) * 10 + Math.sin(i * 0.23) * 6); wave += '<rect x="' + (64 + i * 4.8) + '" y="' + (190 - h / 2) + '" width="2.4" height="' + h.toFixed(1) + '" fill="#7ddc5a" opacity=".8"/>'; }
    return wrap('<rect x="10" y="10" width="380" height="220" rx="8" fill="' + P2 + '" stroke="' + LINE + '"/>' +
      '<rect x="10" y="10" width="380" height="24" rx="8" fill="' + P3 + '"/>' + label(22, 26, '00:00:08:12', KEY, 'start') + label(378, 26, 'my_short_film.prproj', MUTE, 'end', 9) +
      '<g font-family="' + MONO + '" font-size="10" fill="' + MUTE + '"><text x="22" y="74">V2</text><text x="22" y="122">V1</text><text x="22" y="194">A1</text></g>' +
      '<rect x="120" y="58" width="80" height="26" rx="4" fill="#a63ec9"/>' +
      '<rect x="60" y="104" width="90" height="30" rx="4" fill="#2a8fd6"/><rect x="152" y="104" width="70" height="30" rx="4" fill="#1fb5a7"/><rect x="224" y="104" width="110" height="30" rx="4" fill="#2a8fd6"/><rect x="336" y="104" width="44" height="30" rx="4" fill="#1fb5a7"/>' +
      '<rect x="60" y="176" width="320" height="30" rx="4" fill="#1d3b2a"/>' + wave +
      '<g class="v-playhead"><line x1="80" y1="40" x2="80" y2="218" stroke="' + SEL + '" stroke-width="2"/><polygon points="72,40 88,40 80,50" fill="' + SEL + '"/></g>');
  };

  /* ---- Built-in "final render" medal for the score screen ---- */
  function trophy() {
    var g = id('t');
    return '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2b0"/><stop offset=".45" stop-color="' + KEY + '"/><stop offset="1" stop-color="' + SEL + '"/></linearGradient></defs>' +
      '<rect x="22" y="22" width="76" height="76" rx="8" transform="rotate(45 60 60)" fill="url(#' + g + ')"/>' +
      '<rect x="36" y="36" width="48" height="48" rx="5" transform="rotate(45 60 60)" fill="' + INK + '"/>' +
      '<path d="M46 61 l10 10 l19 -22" fill="none" stroke="' + KEY + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function isVideo(u) { return /\.(mp4|webm)(\?|#|$)/i.test(u); }

  function render(asset, alt) {
    asset = String(asset || '').trim();
    if (!asset) return '';
    if (asset.indexOf('svg:') === 0) {
      var fn = V[asset.slice(4)];
      return fn ? fn().replace('aria-label=""', 'aria-label="' + esc(alt || '') + '"') : '';
    }
    if (!/^https:\/\//i.test(asset)) return '';
    if (isVideo(asset)) return '<video src="' + esc(asset) + '" autoplay muted loop playsinline preload="auto" aria-label="' + esc(alt || '') + '"></video>';
    return '<img src="' + esc(asset) + '" alt="' + esc(alt || '') + '" decoding="async">';
  }

  function preload(list) {
    (list || []).forEach(function (a) { if (a && /^https:\/\//i.test(a) && !isVideo(a)) { var im = new Image(); im.src = a; } });
  }

  return { render: render, preload: preload, trophy: trophy, names: function () { return Object.keys(V); } };
})();
