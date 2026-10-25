/* =====================================================================
   ZICA CREATIVE QUEST — visuals.js
   Built-in, original SVG visuals for questions (no external files).
   Use one in the Questions sheet → Asset column as  svg:<name>
     svg:dims  svg:ball  svg:board  svg:light  svg:keys  svg:vase
     svg:layers  svg:jump  svg:rig  svg:vp  svg:mats  svg:palettes  svg:shot
   Or put an https:// image / GIF / .mp4 URL (or a Drive file link) instead.
   ===================================================================== */
var CQVisuals = (function () {
  'use strict';

  var INK = '#2A2545', LINE = '#3A3460', TEXT = '#A9A6C2';
  var uid = 0;
  function id(p) { uid += 1; return p + uid; }
  function wrap(inner, label) {
    return '<svg class="viz" viewBox="0 0 400 240" role="img" aria-label="' + esc(label || '') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function badge(x, y, t, fill) {
    return '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + (fill || '#221D40') + '" stroke="#7B5CFF" stroke-width="1.5"/>' +
           '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#F4F3FA">' + t + '</text>';
  }
  /** Catmull-Rom through points → smooth cubic path segments (no leading M). */
  function smooth(pts) {
    var d = '';
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  var V = {};

  /* 2D vs 3D */
  V.dims = function () {
    return wrap(
      '<ellipse cx="110" cy="182" rx="56" ry="8" fill="#000" opacity=".35"/>' +
      '<rect x="62" y="70" width="96" height="96" rx="3" fill="#7B5CFF"/>' +
      '<ellipse cx="290" cy="182" rx="62" ry="10" fill="#000" opacity=".45"/>' +
      '<polygon points="290,58 344,86 290,114 236,86" fill="#C3B6FF"/>' +
      '<polygon points="236,86 290,114 290,176 236,148" fill="#7B5CFF"/>' +
      '<polygon points="290,114 344,86 344,148 290,176" fill="#4529C4"/>' +
      badge(110, 214, 'A') + badge(290, 214, 'B'));
  };

  /* Bouncing ball — squash & stretch */
  V.ball = function () {
    var g = id('gb');
    return wrap(
      '<defs><radialGradient id="' + g + '" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFE7B0"/><stop offset=".35" stop-color="#FFA24A"/><stop offset="1" stop-color="#C8461A"/></radialGradient></defs>' +
      '<rect x="0" y="212" width="400" height="28" fill="#0E0B1F"/>' +
      '<line x1="40" y1="212" x2="360" y2="212" stroke="' + LINE + '" stroke-width="2"/>' +
      '<ellipse class="v-ball-shadow" cx="200" cy="214" rx="30" ry="5" fill="#000"/>' +
      '<circle class="v-ball" cx="200" cy="186" r="26" fill="url(#' + g + ')"/>');
  };

  /* Storyboard — three panels */
  V.board = function () {
    var paper = '#F1EEFA', pen = '#2A2545';
    function panel(x, n, art) {
      return '<rect x="' + x + '" y="52" width="104" height="80" rx="4" fill="' + paper + '"/>' +
        '<rect x="' + x + '" y="52" width="104" height="80" rx="4" fill="none" stroke="#7B5CFF" stroke-width="1.5"/>' +
        badge(x + 14, 36, n) +
        '<g fill="none" stroke="' + pen + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + art + '</g>' +
        '<rect x="' + x + '" y="146" width="88" height="6" rx="3" fill="' + LINE + '"/>' +
        '<rect x="' + x + '" y="160" width="62" height="6" rx="3" fill="' + LINE + '"/>';
    }
    var p1 = '<line x1="20" y1="118" x2="108" y2="118"/><rect x="62" y="84" width="34" height="34"/><polyline points="58,86 79,68 100,86"/>' +
             '<circle cx="36" cy="88" r="6"/><line x1="36" y1="94" x2="36" y2="108"/><line x1="36" y1="108" x2="30" y2="118"/><line x1="36" y1="108" x2="42" y2="118"/><line x1="28" y1="99" x2="44" y2="99"/>';
    var p2 = '<circle cx="200" cy="96" r="30"/><circle cx="189" cy="90" r="3" fill="' + pen + '"/><circle cx="211" cy="90" r="3" fill="' + pen + '"/><path d="M186 106 q14 12 28 0"/><path d="M174 80 q26 -26 52 0"/>';
    var p3 = '<circle cx="330" cy="76" r="6"/><line x1="330" y1="82" x2="322" y2="100"/><line x1="322" y1="100" x2="334" y2="118"/><line x1="322" y1="100" x2="310" y2="112"/><line x1="327" y1="89" x2="340" y2="96"/><line x1="327" y1="89" x2="314" y2="86"/>' +
             '<line x1="292" y1="80" x2="306" y2="80"/><line x1="288" y1="92" x2="304" y2="92"/><line x1="292" y1="104" x2="304" y2="104"/><line x1="290" y1="122" x2="368" y2="122"/>';
    var arrow = function (x) { return '<path d="M' + x + ' 92 l8 0 m-4 -5 l5 5 -5 5" fill="none" stroke="#F2C14E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'; };
    return wrap(panel(20, '1', p1) +
      panel(148, '2', p2) + panel(276, '3', p3) + arrow(130) + arrow(258));
  };

  /* Lighting — key light from upper left */
  V.light = function () {
    var g = id('gl'), f = id('fl'), fl = id('fg');
    return wrap(
      '<defs>' +
        '<radialGradient id="' + g + '" cx=".3" cy=".26" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".1" stop-color="#FFE9C9"/><stop offset=".42" stop-color="#9580FF"/><stop offset=".8" stop-color="#2B2063"/><stop offset="1" stop-color="#140F33"/></radialGradient>' +
        '<filter id="' + f + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>' +
        '<linearGradient id="' + fl + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1636"/><stop offset="1" stop-color="#0B0918"/></linearGradient>' +
      '</defs>' +
      '<rect x="0" y="160" width="400" height="80" fill="url(#' + fl + ')"/>' +
      '<ellipse cx="236" cy="184" rx="92" ry="15" fill="#000" opacity=".75" filter="url(#' + f + ')" transform="rotate(8 236 184)"/>' +
      '<circle cx="180" cy="116" r="64" fill="url(#' + g + ')"/>');
  };

  /* Keyframes — ball between frame 1 and frame 24 */
  V.keys = function () {
    var ticks = '', x;
    for (var i = 0; i < 24; i++) {
      x = 60 + i * (280 / 23);
      ticks += '<line x1="' + x.toFixed(1) + '" y1="' + (i % 4 === 0 ? 186 : 190) + '" x2="' + x.toFixed(1) + '" y2="198" stroke="#4A4470" stroke-width="1.2"/>';
    }
    var ghosts = '';
    [0.12, 0.3, 0.5, 0.7, 0.88].forEach(function (t) {
      var gx = 60 + t * 280;
      ghosts += '<circle cx="' + gx + '" cy="96" r="5" fill="#A895FF" opacity=".25"/>';
    });
    function diamond(cx) { return '<rect x="' + (cx - 7) + '" y="164" width="14" height="14" transform="rotate(45 ' + cx + ' 171)" fill="#F2C14E" stroke="#FFE29A" stroke-width="1"/>'; }
    return wrap(
      '<line x1="60" y1="96" x2="340" y2="96" stroke="' + LINE + '" stroke-width="1.5" stroke-dasharray="4 6"/>' + ghosts +
      '<circle cx="60" cy="96" r="22" fill="none" stroke="#F2C14E" stroke-width="1.5" stroke-dasharray="4 4" opacity=".8"/>' +
      '<circle cx="340" cy="96" r="22" fill="none" stroke="#F2C14E" stroke-width="1.5" stroke-dasharray="4 4" opacity=".8"/>' +
      '<g class="v-key-move"><circle cx="60" cy="96" r="20" fill="#7B5CFF"/><circle cx="54" cy="90" r="6" fill="#C3B6FF" opacity=".8"/></g>' +
      '<rect x="40" y="156" width="320" height="48" rx="8" fill="#0E0B1F" stroke="' + LINE + '"/>' + ticks +
      diamond(60) + diamond(340) +
      '<text x="60" y="226" text-anchor="middle" font-size="13" font-weight="700" fill="' + TEXT + '">1</text>' +
      '<text x="340" y="226" text-anchor="middle" font-size="13" font-weight="700" fill="' + TEXT + '">24</text>' +
      '<text x="200" y="226" text-anchor="middle" font-size="12" fill="#6F6B8C">frames</text>' +
      '<g class="v-key-move"><line x1="60" y1="150" x2="60" y2="206" stroke="#FF8A3D" stroke-width="2"/><polygon points="54,146 66,146 60,154" fill="#FF8A3D"/></g>');
  };

  /* Rubin's vase */
  V.vase = function () {
    var half = [[12, 76], [32, 70], [56, 60], [74, 55], [86, 62], [110, 34], [124, 52], [134, 45], [142, 51], [150, 46], [164, 58], [180, 45], [198, 60], [228, 72]];
    var right = half.map(function (p) { return [200 + p[1], p[0]]; });
    var left = half.slice().reverse().map(function (p) { return [200 - p[1], p[0]]; });
    var d = 'M' + right[0][0] + ' ' + right[0][1] + smooth(right) + ' L' + left[0][0] + ' ' + left[0][1] + smooth(left) + ' Z';
    return wrap(
      '<rect x="92" y="10" width="216" height="220" rx="10" fill="#1A1535"/>' +
      '<path d="' + d + '" fill="#EDE9FF"/>');
  };

  /* Compositing: footage + CGI = final */
  V.layers = function () {
    function castle(x, y, s) {
      var c = '#0D0A20';
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + c + '">' +
        '<rect x="8" y="30" width="88" height="40"/>' +
        '<rect x="0" y="12" width="22" height="58"/><rect x="82" y="12" width="22" height="58"/><rect x="40" y="2" width="24" height="68"/>' +
        '<rect x="0" y="6" width="6" height="8"/><rect x="8" y="6" width="6" height="8"/><rect x="16" y="6" width="6" height="8"/>' +
        '<rect x="82" y="6" width="6" height="8"/><rect x="90" y="6" width="6" height="8"/><rect x="98" y="6" width="6" height="8"/>' +
        '<rect x="40" y="-4" width="6" height="8"/><rect x="49" y="-4" width="6" height="8"/><rect x="58" y="-4" width="6" height="8"/>' +
        '<rect x="47" y="48" width="10" height="22" rx="5" fill="#F2C14E" opacity=".75"/></g>';
    }
    function sky(x, cid) {
      return '<clipPath id="' + cid + '"><rect x="' + x + '" y="70" width="104" height="80" rx="6"/></clipPath>' +
        '<g clip-path="url(#' + cid + ')"><rect x="' + x + '" y="70" width="104" height="80" fill="#2A2068"/>' +
        '<rect x="' + x + '" y="118" width="104" height="32" fill="#4B2C7A"/>' +
        '<circle cx="' + (x + 80) + '" cy="88" r="9" fill="#FFE29A"/>' + castle(x + 6, 92, .88) + '</g>';
    }
    function actor(cx, by, fill) {
      return '<g fill="' + fill + '"><circle cx="' + cx + '" cy="' + (by - 44) + '" r="9"/><rect x="' + (cx - 12) + '" y="' + (by - 33) + '" width="24" height="33" rx="10"/></g>';
    }
    var c1 = id('c'), c2 = id('c');
    return wrap(
      '<rect x="12" y="70" width="104" height="80" rx="6" fill="#2FBF71"/>' + actor(64, 150, '#3B2F5C') +
      '<text x="136" y="118" text-anchor="middle" font-size="26" font-weight="800" fill="#F2C14E">+</text>' +
      sky(148, c1) +
      '<text x="270" y="118" text-anchor="middle" font-size="26" font-weight="800" fill="#F2C14E">=</text>' +
      sky(284, c2) + actor(336, 150, '#3B2F5C') +
      '<rect x="284" y="70" width="104" height="80" rx="6" fill="none" stroke="#F2C14E" stroke-width="2"/>' +
      '<text x="64" y="174" text-anchor="middle" font-size="12.5" fill="' + TEXT + '">Footage</text>' +
      '<text x="200" y="174" text-anchor="middle" font-size="12.5" fill="' + TEXT + '">CGI background</text>' +
      '<text x="336" y="174" text-anchor="middle" font-size="12.5" font-weight="700" fill="#FFE29A">Final shot</text>');
  };

  /* Anticipation — crouch before jump */
  V.jump = function () {
    return wrap(
      '<rect x="0" y="206" width="400" height="34" fill="#0E0B1F"/>' +
      '<line x1="60" y1="206" x2="340" y2="206" stroke="' + LINE + '" stroke-width="2"/>' +
      '<ellipse class="v-jump-shadow" cx="200" cy="208" rx="34" ry="5" fill="#000"/>' +
      '<g class="v-jump">' +
        '<rect x="172" y="132" width="56" height="74" rx="28" fill="#3D7BFF"/>' +
        '<rect x="178" y="138" width="20" height="40" rx="10" fill="#6E9BFF" opacity=".55"/>' +
        '<circle cx="190" cy="160" r="7" fill="#fff"/><circle cx="210" cy="160" r="7" fill="#fff"/>' +
        '<circle cx="192" cy="161" r="3.2" fill="#14112A"/><circle cx="212" cy="161" r="3.2" fill="#14112A"/>' +
        '<path d="M193 178 q7 5 14 0" fill="none" stroke="#14112A" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>');
  };

  /* Rig — skeleton inside a character */
  V.rig = function () {
    var mesh = 'stroke="#3A3366" stroke-width="22" stroke-linecap="round" fill="none" opacity=".9"';
    var bone = 'stroke="#FF8A3D" stroke-width="3" stroke-linecap="round" fill="none"';
    function j(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#F2C14E" stroke="#14112A" stroke-width="2"/>'; }
    return wrap(
      '<g ' + mesh + '>' +
        '<line x1="200" y1="84" x2="200" y2="146"/><line x1="168" y1="90" x2="150" y2="124"/><line x1="150" y1="124" x2="142" y2="156"/>' +
        '<line x1="190" y1="148" x2="184" y2="184"/><line x1="184" y1="184" x2="180" y2="218"/>' +
        '<line x1="210" y1="148" x2="216" y2="184"/><line x1="216" y1="184" x2="220" y2="218"/>' +
        '<line x1="168" y1="90" x2="232" y2="90"/>' +
      '</g>' +
      '<circle cx="200" cy="52" r="22" fill="#3A3366"/>' +
      '<g class="v-arm"><line x1="232" y1="90" x2="252" y2="122" ' + mesh + '/><line x1="252" y1="122" x2="262" y2="154" ' + mesh + '/>' +
        '<line x1="232" y1="90" x2="252" y2="122" ' + bone + '/><line x1="252" y1="122" x2="262" y2="154" ' + bone + '/>' + j(252, 122) + j(262, 154) + '</g>' +
      '<g ' + bone + '>' +
        '<line x1="200" y1="52" x2="200" y2="80"/><line x1="200" y1="80" x2="200" y2="146"/>' +
        '<line x1="200" y1="88" x2="168" y2="90"/><line x1="200" y1="88" x2="232" y2="90"/>' +
        '<line x1="168" y1="90" x2="150" y2="124"/><line x1="150" y1="124" x2="142" y2="156"/>' +
        '<line x1="200" y1="146" x2="190" y2="148"/><line x1="200" y1="146" x2="210" y2="148"/>' +
        '<line x1="190" y1="148" x2="184" y2="184"/><line x1="184" y1="184" x2="180" y2="218"/>' +
        '<line x1="210" y1="148" x2="216" y2="184"/><line x1="216" y1="184" x2="220" y2="218"/>' +
      '</g>' +
      j(200, 52) + j(200, 80) + j(200, 112) + j(200, 146) + j(168, 90) + j(232, 90) + j(150, 124) + j(142, 156) +
      j(190, 148) + j(210, 148) + j(184, 184) + j(216, 184) + j(180, 218) + j(220, 218));
  };

  /* Linear perspective — vanishing point */
  V.vp = function () {
    var sky = id('sk'), glow = id('gw');
    var poles = '';
    [0, .34, .58, .75, .86, .93].forEach(function (t) {
      var h = 92 * (1 - t) + 4;
      var lx = 18 + (200 - 18) * t, ly = 236 + (100 - 236) * t;
      var rx = 382 + (200 - 382) * t;
      poles += '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y2="' + (ly - h).toFixed(1) + '" stroke="#A895FF" stroke-width="' + (3.5 * (1 - t) + .8).toFixed(1) + '" stroke-linecap="round"/>' +
               '<line x1="' + rx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y2="' + (ly - h).toFixed(1) + '" stroke="#A895FF" stroke-width="' + (3.5 * (1 - t) + .8).toFixed(1) + '" stroke-linecap="round"/>';
    });
    var dashes = '';
    [[104, 108], [114, 122], [130, 144], [156, 178], [196, 232]].forEach(function (s) {
      dashes += '<line x1="200" y1="' + s[0] + '" x2="200" y2="' + s[1] + '" stroke="#F2C14E" stroke-width="' + ((s[1] - 100) / 40 + .6).toFixed(1) + '" stroke-linecap="round"/>';
    });
    return wrap(
      '<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120E2E"/><stop offset=".75" stop-color="#3A2470"/><stop offset="1" stop-color="#B0507A"/></linearGradient>' +
      '<radialGradient id="' + glow + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFB46B" stop-opacity=".7"/><stop offset="1" stop-color="#FFB46B" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="0" y="0" width="400" height="100" fill="url(#' + sky + ')"/>' +
      '<ellipse cx="200" cy="100" rx="120" ry="34" fill="url(#' + glow + ')"/>' +
      '<rect x="0" y="100" width="400" height="140" fill="#100D22"/>' +
      '<polygon points="40,240 360,240 200,100" fill="#231E40"/>' +
      '<line x1="40" y1="240" x2="200" y2="100" stroke="#8E79FF" stroke-width="2"/><line x1="360" y1="240" x2="200" y2="100" stroke="#8E79FF" stroke-width="2"/>' +
      '<line x1="0" y1="100" x2="400" y2="100" stroke="#5C4C9A" stroke-width="1"/>' +
      dashes + poles +
      '<circle cx="200" cy="100" r="3.2" fill="#FFE29A"/><circle class="v-pulse" cx="200" cy="100" r="6" fill="none" stroke="#FFE29A" stroke-width="1.2"/>');
  };

  /* Materials — rubber / plastic / metal */
  V.mats = function () {
    var a = id('ma'), b = id('mb'), c = id('mc'), cl = id('mcl');
    return wrap(
      '<defs>' +
        '<radialGradient id="' + a + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFB089"/><stop offset=".5" stop-color="#D2582E"/><stop offset="1" stop-color="#5E200E"/></radialGradient>' +
        '<radialGradient id="' + b + '" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#7FA6FF"/><stop offset=".55" stop-color="#2F5FE0"/><stop offset="1" stop-color="#0E1D5C"/></radialGradient>' +
        '<linearGradient id="' + c + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FAFAFF"/><stop offset=".22" stop-color="#9C97BC"/><stop offset=".44" stop-color="#1F1B38"/>' +
          '<stop offset=".5" stop-color="#E9E6FA"/><stop offset=".62" stop-color="#5B5680"/><stop offset=".85" stop-color="#2A2645"/><stop offset="1" stop-color="#B9B4D6"/></linearGradient>' +
        '<clipPath id="' + cl + '"><circle cx="320" cy="108" r="44"/></clipPath>' +
      '</defs>' +
      '<rect x="0" y="160" width="400" height="80" fill="#0E0B1F"/>' +
      '<ellipse cx="80" cy="158" rx="40" ry="7" fill="#000" opacity=".5"/><ellipse cx="200" cy="158" rx="40" ry="7" fill="#000" opacity=".5"/><ellipse cx="320" cy="158" rx="40" ry="7" fill="#000" opacity=".5"/>' +
      '<circle cx="80" cy="108" r="44" fill="url(#' + a + ')"/>' +
      '<circle cx="200" cy="108" r="44" fill="url(#' + b + ')"/>' +
      '<ellipse cx="184" cy="88" rx="10" ry="6" fill="#fff" transform="rotate(-30 184 88)"/>' +
      '<g clip-path="url(#' + cl + ')"><rect x="270" y="60" width="100" height="100" fill="url(#' + c + ')" transform="rotate(-18 320 108)"/></g>' +
      '<circle cx="320" cy="108" r="44" fill="none" stroke="#fff" stroke-opacity=".25"/>' +
      '<ellipse cx="305" cy="80" rx="7" ry="3.5" fill="#fff" transform="rotate(-30 305 80)"/>' +
      '<text x="80" y="196" text-anchor="middle" font-size="14" font-weight="700" fill="' + TEXT + '">Rubber</text>' +
      '<text x="200" y="196" text-anchor="middle" font-size="14" font-weight="700" fill="' + TEXT + '">Plastic</text>' +
      '<text x="320" y="196" text-anchor="middle" font-size="14" font-weight="700" fill="' + TEXT + '">Metal</text>');
  };

  /* Warm / cool palettes */
  V.palettes = function () {
    var rows = [
      ['A', ['#0B3D91', '#1565C0', '#1E88E5', '#26C6DA', '#80DEEA']],
      ['B', ['#B71C1C', '#E64A19', '#FB8C00', '#FFB300', '#FFE082']],
      ['C', ['#212121', '#424242', '#757575', '#9E9E9E', '#E0E0E0']],
      ['D', ['#1B5E20', '#2E7D32', '#43A047', '#26A69A', '#80CBC4']]
    ];
    var out = '';
    rows.forEach(function (r, i) {
      var y = 36 + i * 48;
      out += badge(46, y + 18, r[0]);
      r[1].forEach(function (col, k) {
        out += '<rect x="' + (78 + k * 58) + '" y="' + y + '" width="52" height="36" rx="' + (k === 0 ? 8 : 3) + '" fill="' + col + '"/>';
      });
    });
    return wrap(out);
  };

  /* Close-up shot in a viewfinder */
  V.shot = function () {
    var cl = id('sc');
    var corner = function (x, y, dx, dy) { return '<path d="M' + x + ' ' + (y + dy * 18) + ' L' + x + ' ' + y + ' L' + (x + dx * 18) + ' ' + y + '" fill="none" stroke="#F4F3FA" stroke-width="3" stroke-linecap="round"/>'; };
    return wrap(
      '<defs><clipPath id="' + cl + '"><rect x="24" y="22" width="352" height="196" rx="6"/></clipPath></defs>' +
      '<rect x="24" y="22" width="352" height="196" rx="6" fill="#2B1F55"/>' +
      '<g clip-path="url(#' + cl + ')">' +
        '<circle cx="200" cy="150" r="118" fill="#F2B07E"/>' +
        '<path d="M82 120 Q92 20 200 24 Q308 20 318 120 Q300 70 200 64 Q100 70 82 120Z" fill="#3B2A22"/>' +
        '<ellipse cx="156" cy="128" rx="20" ry="23" fill="#fff"/><ellipse cx="244" cy="128" rx="20" ry="23" fill="#fff"/>' +
        '<circle cx="158" cy="132" r="10" fill="#1A1430"/><circle cx="242" cy="132" r="10" fill="#1A1430"/>' +
        '<circle cx="162" cy="128" r="3" fill="#fff"/><circle cx="246" cy="128" r="3" fill="#fff"/>' +
        '<path d="M130 92 Q156 78 180 92" fill="none" stroke="#3B2A22" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M220 92 Q244 78 270 92" fill="none" stroke="#3B2A22" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="200" cy="196" rx="15" ry="19" fill="#5A2230"/>' +
        '<path d="M196 150 q4 10 0 16" fill="none" stroke="#C9845A" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      corner(36, 34, 1, 1) + corner(364, 34, -1, 1) + corner(36, 206, 1, -1) + corner(364, 206, -1, -1) +
      '<circle class="v-rec" cx="52" cy="50" r="5" fill="#FF4D4D"/>' +
      '<text x="62" y="55" font-size="13" font-weight="800" fill="#F4F3FA">REC</text>' +
      '');
  };

  /* Built-in trophy for the score screen (used when Settings → TROPHY_URL is blank) */
  function trophy() {
    var g = id('tg'), h = id('th');
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C2"/><stop offset=".4" stop-color="#F2C14E"/><stop offset="1" stop-color="#B9791A"/></linearGradient>' +
      '<linearGradient id="' + h + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2352"/><stop offset="1" stop-color="#151129"/></linearGradient></defs>' +
      '<path d="M34 22 C14 22 14 52 40 54" fill="none" stroke="url(#' + g + ')" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M86 22 C106 22 106 52 80 54" fill="none" stroke="url(#' + g + ')" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M32 14 H88 V36 C88 56 76 68 60 68 C44 68 32 56 32 36 Z" fill="url(#' + g + ')"/>' +
      '<path d="M42 20 V36 C42 48 48 56 56 60" fill="none" stroke="#FFF7DC" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      '<rect x="54" y="66" width="12" height="16" fill="url(#' + g + ')"/>' +
      '<rect x="40" y="82" width="40" height="10" rx="3" fill="url(#' + g + ')"/>' +
      '<rect x="34" y="92" width="52" height="16" rx="4" fill="url(#' + h + ')" stroke="#F2C14E" stroke-width="1.5"/>' +
      '<path d="M60 26 l3.5 7.2 7.9 1.1 -5.7 5.6 1.3 7.9 -7-3.7 -7 3.7 1.3-7.9 -5.7-5.6 7.9-1.1z" fill="#FFF7DC"/>' +
      '</svg>';
  }

  function isVideo(u) { return /\.(mp4|webm)(\?|#|$)/i.test(u); }

  /** Returns HTML for an asset string, or '' when there is nothing to show. */
  function render(asset, alt) {
    asset = String(asset || '').trim();
    if (!asset) return '';
    if (asset.indexOf('svg:') === 0) {
      var fn = V[asset.slice(4)];
      return fn ? fn().replace('aria-label=""', 'aria-label="' + esc(alt || '') + '"') : '';
    }
    if (!/^https:\/\//i.test(asset)) return '';
    if (isVideo(asset)) {
      return '<video src="' + esc(asset) + '" autoplay muted loop playsinline preload="auto" aria-label="' + esc(alt || '') + '"></video>';
    }
    return '<img src="' + esc(asset) + '" alt="' + esc(alt || '') + '" decoding="async">';
  }

  function preload(list) {
    (list || []).forEach(function (a) {
      if (a && /^https:\/\//i.test(a) && !isVideo(a)) { var im = new Image(); im.src = a; }
    });
  }

  return { render: render, preload: preload, trophy: trophy, has: function (n) { return !!V[n]; } };
})();
