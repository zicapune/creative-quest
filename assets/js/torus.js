/* =====================================================================
   ZICA CREATIVE QUEST — torus.js
   The visit deck's cold-open object: a torus drawn live in JavaScript.
   mix 0 = cyan wireframe, mix 1 = fully "rendered" (keyframe-amber shading).
   Pauses itself when off-screen or when the tab is hidden.
   ===================================================================== */
window.CQTorus = function (canvas, opts) {
  'use strict';
  opts = opts || {};
  var ctx = canvas.getContext('2d');
  var small = Math.min(window.innerWidth, window.innerHeight) < 700;
  var U = opts.U || (small ? 40 : 56), V = opts.V || (small ? 16 : 22), R = 1, r = 0.42, verts = [];
  for (var i = 0; i < U; i++) for (var j = 0; j < V; j++) {
    var u = i / U * Math.PI * 2, v = j / V * Math.PI * 2;
    verts.push([(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v),
      Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)]);
  }
  var light = (function () { var l = [-0.5, -0.7, -0.6], m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m]; })();
  var mix = opts.mix || 0, target = mix, raf = 0, t0 = performance.now(), visible = true, running = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rot(p, a, b) {
    var x = p[0], y = p[1], z = p[2];
    var y1 = y * Math.cos(a) - z * Math.sin(a), z1 = y * Math.sin(a) + z * Math.cos(a);
    return [x * Math.cos(b) + z1 * Math.sin(b), y1, -x * Math.sin(b) + z1 * Math.cos(b)];
  }

  function draw(now) {
    var t = reduce ? 6 : (now - t0) / 1000;
    mix += (target - mix) * 0.06;
    var a = 0.62 + Math.sin(t * 0.35) * 0.22, b = t * 0.4;
    var W = canvas.width, H = canvas.height, sc = W / 3.1, cz = 3.4;
    var P = verts.map(function (p) {
      var q = rot(p, a, b), n = rot([p[3], p[4], p[5]], a, b), z = q[2] + cz, f = 2.4 / z;
      return { x: W / 2 + q[0] * f * sc, y: H / 2 + q[1] * f * sc, z: z, n: n };
    });
    ctx.clearRect(0, 0, W, H);
    var quads = [];
    for (var i = 0; i < U; i++) for (var j = 0; j < V; j++) {
      var a0 = i * V + j, a1 = ((i + 1) % U) * V + j, a2 = ((i + 1) % U) * V + (j + 1) % V, a3 = i * V + (j + 1) % V;
      var q = [P[a0], P[a1], P[a2], P[a3]];
      q.z = (q[0].z + q[1].z + q[2].z + q[3].z) / 4;
      quads.push(q);
    }
    quads.sort(function (m, n) { return n.z - m.z; });
    var lw = Math.max(1, W / 750);
    for (var k = 0; k < quads.length; k++) {
      var Q = quads[k];
      var nx = (Q[0].n[0] + Q[2].n[0]) / 2, ny = (Q[0].n[1] + Q[2].n[1]) / 2, nz = (Q[0].n[2] + Q[2].n[2]) / 2;
      ctx.beginPath(); ctx.moveTo(Q[0].x, Q[0].y); ctx.lineTo(Q[1].x, Q[1].y); ctx.lineTo(Q[2].x, Q[2].y); ctx.lineTo(Q[3].x, Q[3].y); ctx.closePath();
      if (mix > 0.01) {
        var d = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]); d = 0.18 + 0.82 * d;
        var spec = Math.pow(d, 22), rim = Math.pow(1 - Math.min(1, Math.abs(nz)), 3);
        var rr = Math.round(20 + 235 * d * d + 60 * spec + 40 * rim), gg = Math.round(8 + 150 * d * d * d + 120 * spec + 200 * rim), bb = Math.round(6 + 30 * d + 140 * spec + 210 * rim);
        ctx.globalAlpha = mix;
        ctx.fillStyle = 'rgb(' + Math.min(255, rr) + ',' + Math.min(255, gg) + ',' + Math.min(255, bb) + ')';
        ctx.fill();
      }
      if (mix < 0.99) {
        ctx.globalAlpha = (1 - mix) * (nz < 0.15 ? 0.75 : 0.18);
        ctx.strokeStyle = '#5ce1e6'; ctx.lineWidth = lw; ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(draw);
  }

  function start() { if (running || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(draw); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting && es[0].intersectionRatio > 0; visible ? start() : stop(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

  return {
    start: start, stop: stop,
    set: function (m) { target = Math.max(0, Math.min(1, m)); },
    get: function () { return mix; }
  };
};
