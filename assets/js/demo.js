/* =====================================================================
   ZICA CREATIVE QUEST — demo.js   (PREVIEW ONLY)
   ---------------------------------------------------------------------
   Pretends to be the Supabase server so the site works on GitHub Pages
   before Supabase is connected. Loaded ONLY when config.js has no SUPABASE_URL.
   Nothing is saved anywhere except this browser tab. The OTP code is shown on screen.
   Go-live: once config.js is filled you may delete this file (it contains a copy of
   the starter answer key; the live quiz checks answers on the server instead).
   ===================================================================== */
window.CQ_DEMO = (function () {
  'use strict';
  var Q = [
{
"id": "Q01",
"category": "Software & Tools",
"type": "tool",
"topic": "3D software",
"text": "Which of these is a 3D modeling software?",
"options": [
"Blender",
"Photoshop",
"After Effects",
"Premiere Pro"
],
"correct": 0,
"explanation": "Blender is a free, open-source 3D suite used for modeling, animation and rendering. Photoshop edits images, After Effects creates motion graphics and composites, and Premiere Pro edits video.",
"asset": "",
"assetAlt": ""
},
{
"id": "Q02",
"category": "Visual Recognition",
"type": "image",
"topic": "2D vs 3D",
"text": "Look at shapes A and B. Which one is drawn as a 3D object?",
"options": [
"Shape A",
"Shape B",
"Both are 3D",
"Neither is 3D"
],
"correct": 1,
"explanation": "A 3D object has width, height AND depth. Shape B shows three faces with different shading, so your eye reads depth. Shape A only has width and height — that is 2D.",
"asset": "svg:dims",
"assetAlt": "Shape A is a flat purple square. Shape B is a cube showing its top, front and side faces in three shades."
},
{
"id": "Q03",
"category": "Animation Principles",
"type": "animation",
"topic": "Squash & stretch",
"text": "Watch the bouncing ball. Which animation principle is it showing?",
"options": [
"Squash and Stretch",
"Anticipation",
"Staging",
"Follow Through"
],
"correct": 0,
"explanation": "The ball flattens (squash) when it hits the ground and stretches as it speeds up. It makes objects feel soft, heavy and alive — it is the first of the 12 classic principles of animation.",
"asset": "svg:ball",
"assetAlt": "A ball falls, flattens wide on impact, stretches tall as it bounces up, and repeats."
},
{
"id": "Q04",
"category": "Visual Recognition",
"type": "image",
"topic": "Storyboards",
"text": "Before filming or animating, artists draw panels like these. What are they called?",
"options": [
"A storyboard",
"A texture map",
"A colour palette",
"A render farm"
],
"correct": 0,
"explanation": "A storyboard is a comic-strip-style plan of a film, shot by shot. It helps the whole team agree on camera angles, action and timing before any expensive animation or filming starts.",
"asset": "svg:board",
"assetAlt": "Three numbered sketch panels with arrows: a wide shot of a character near a house, a close-up of a face, and the character running."
},
{
"id": "Q05",
"category": "Visual Recognition",
"type": "image",
"topic": "Key light direction",
"text": "Look at the bright highlight and the shadow. Where is the main light coming from?",
"options": [
"From the upper left",
"From the right",
"From directly below",
"From behind the ball"
],
"correct": 0,
"explanation": "The side facing a light gets the brightest highlight, and the shadow falls on the opposite side. Lighting artists call this main light the key light — reading it is one of the first lighting skills you learn.",
"asset": "svg:light",
"assetAlt": "A sphere that is brightest on its upper-left side, darker on the lower right, with a shadow falling to the lower right."
},
{
"id": "Q06",
"category": "Animation Principles",
"type": "animation",
"topic": "Keyframes",
"text": "An animator sets the ball's position only at frame 1 and frame 24, and the software fills in the frames between. What are frames 1 and 24 called?",
"options": [
"Keyframes",
"Layers",
"Renders",
"Storyboards"
],
"correct": 0,
"explanation": "Keyframes mark the important poses or positions. The frames between them are called in-betweens — the software (or an in-between artist in 2D) creates them.",
"asset": "svg:keys",
"assetAlt": "A ball slides from left to right. Below it, a timeline from frame 1 to 24 has diamond markers on frames 1 and 24 and a moving playhead."
},
{
"id": "Q07",
"category": "Creative Puzzle",
"type": "puzzle",
"topic": "Figure & negative space",
"text": "Look closely at this image. What do you see?",
"options": [
"Two faces",
"A vase",
"Both — it depends how you look",
"Just abstract shapes"
],
"correct": 2,
"explanation": "This is the famous Rubin's vase illusion. The light shape and the dark shapes both make sense, so your brain flips between a vase and two faces. Designers use this negative space to hide a second image inside the first.",
"asset": "svg:vase",
"assetAlt": "A light vase shape in the centre whose two edges also form the dark profiles of two faces looking at each other."
},
{
"id": "Q08",
"category": "VFX & Compositing",
"type": "scenario",
"topic": "Compositing",
"text": "An actor is filmed in front of a green screen and then placed inside a CGI castle. What is combining these layers into one shot called?",
"options": [
"Compositing",
"Rigging",
"Sculpting",
"UV unwrapping"
],
"correct": 0,
"explanation": "Compositing combines separate elements — live footage, CGI, effects and backgrounds — into one final image. Removing the green background first is called chroma keying.",
"asset": "svg:layers",
"assetAlt": "Green-screen footage of an actor plus a CGI castle background equals a final shot with the actor standing in front of the castle."
},
{
"id": "Q09",
"category": "Animation Principles",
"type": "animation",
"topic": "Anticipation",
"text": "The character bends down before leaping up. What is this small \"get ready\" move called?",
"options": [
"Anticipation",
"Follow Through",
"Staging",
"Arcs"
],
"correct": 0,
"explanation": "Anticipation prepares the audience for an action — a crouch before a jump, a wind-up before a throw. Without it, movement feels sudden and weightless.",
"asset": "svg:jump",
"assetAlt": "A rounded character crouches down, then springs up into the air and lands, on a loop."
},
{
"id": "Q10",
"category": "3D Basics",
"type": "image",
"topic": "Rigging",
"text": "The lines and dots inside this character are bones and joints that let animators pose it. What is this setup called?",
"options": [
"A rig",
"A texture",
"A render",
"A storyboard"
],
"correct": 0,
"explanation": "Rigging builds a digital skeleton with controls inside a 3D model. Animators move the rig — not every single polygon — to create poses.",
"asset": "svg:rig",
"assetAlt": "A character outline with a skeleton of bones and joint dots inside; one arm slowly waves."
},
{
"id": "Q11",
"category": "Visual Recognition",
"type": "image",
"topic": "Vanishing point",
"text": "The edges of the road seem to meet at one point on the horizon. What is that point called?",
"options": [
"The vanishing point",
"The pivot point",
"The highlight",
"The centre of mass"
],
"correct": 0,
"explanation": "Parallel lines moving away from us appear to meet at a vanishing point on the horizon. Artists use it to draw roads, buildings and rooms with convincing depth — this is called linear perspective.",
"asset": "svg:vp",
"assetAlt": "A road stretching to the horizon, its edges converging to one point, with poles getting smaller into the distance."
},
{
"id": "Q12",
"category": "3D Basics",
"type": "concept",
"topic": "Materials & shaders",
"text": "To make a 3D ball look like shiny metal instead of rubber, what does an artist mainly change?",
"options": [
"Its material (shader)",
"Its number of keyframes",
"The frame rate",
"The camera position"
],
"correct": 0,
"explanation": "A material, also called a shader, tells the renderer how a surface reacts to light — how shiny, rough, metallic or transparent it is. The shape stays the same; only the surface changes.",
"asset": "svg:mats",
"assetAlt": "Three identical spheres labelled rubber, plastic and metal: soft and matte, glossy with a small highlight, and mirror-like with sharp reflections."
},
{
"id": "Q13",
"category": "Software & Tools",
"type": "tool",
"topic": "Game engines",
"text": "Unreal Engine and Unity are mainly used to create…",
"options": [
"Video games and real-time 3D",
"Printed posters and brochures",
"Music and podcasts",
"Spreadsheets and reports"
],
"correct": 0,
"explanation": "Unreal Engine and Unity are game engines: they draw 3D worlds in real time so players can interact with them. Today they are also used for films, virtual production and architecture.",
"asset": "",
"assetAlt": ""
},
{
"id": "Q14",
"category": "Creative Puzzle",
"type": "puzzle",
"topic": "Warm & cool colour",
"text": "Which colour palette would make a scene feel warm, like a sunset?",
"options": [
"Palette A",
"Palette B",
"Palette C",
"Palette D"
],
"correct": 1,
"explanation": "Reds, oranges and yellows are warm colours — they suggest heat, sunlight and energy. Blues and greens feel cool and calm. Colour artists choose a palette to set a scene's mood before anything moves.",
"asset": "svg:palettes",
"assetAlt": "Four palettes: A is blues and teals, B is reds, oranges and yellows, C is greys, D is greens and teals."
},
{
"id": "Q15",
"category": "Film Language",
"type": "concept",
"topic": "Camera shots",
"text": "In this film shot, the character's face fills almost the whole frame. What type of shot is it?",
"options": [
"A close-up",
"A wide shot",
"An aerial shot",
"An over-the-shoulder shot"
],
"correct": 0,
"explanation": "A close-up shows emotion and detail — perfect for a reaction. A wide shot shows the whole setting, an aerial shot looks down from above, and an over-the-shoulder shot frames a conversation.",
"asset": "svg:shot",
"assetAlt": "A camera viewfinder frame with recording marks, filled almost completely by a character's surprised face."
}
];

  var store = { attempts: {}, lead: null, otp: null, cert: null };
  try { var saved = JSON.parse(sessionStorage.getItem('cq_demo') || 'null'); if (saved) store = saved; } catch (e) {}
  function save() { try { sessionStorage.setItem('cq_demo', JSON.stringify(store)); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rid(n) { var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function fail(msg, code, fields) { var e = new Error(msg); e.code = code || 'user'; e.fields = fields || null; throw e; }
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
  function byId(id) { return Q.filter(function (q) { return q.id === id; })[0]; }

  var A = {
    boot: function () { return Object.assign({}, window.CQ_CONFIG.DEFAULTS, { demo: true }); },
    start: function () {
      var id = 'A-000000-' + rid(6);
      store.attempts[id] = { ans: {}, res: {}, done: false, score: 0 }; save();
      return { attemptId: id, questions: Q.map(pub), total: Q.length };
    },
    answer: function (b) {
      var a = store.attempts[b.attemptId]; if (!a) fail('SESSION_EXPIRED', 'expired');
      var q = byId(b.qid);
      if (a.ans[q.id] === undefined) { a.ans[q.id] = b.choice; a.res[q.id] = b.choice === q.correct ? 1 : 0; save(); }
      return { correct: a.res[q.id] === 1, chosenIndex: a.ans[q.id], correctIndex: q.correct, correctText: q.options[q.correct], explanation: q.explanation, answered: Object.keys(a.ans).length, total: Q.length };
    },
    finish: function (b) {
      var a = store.attempts[b.attemptId]; if (!a) fail('SESSION_EXPIRED', 'expired');
      var missing = Q.filter(function (q) { return a.ans[q.id] === undefined; }).map(function (q) { return q.id; });
      if (missing.length) return { incomplete: true, missing: missing };
      a.done = true; a.score = Q.reduce(function (s, q) { return s + (a.res[q.id] ? 1 : 0); }, 0); save();
      return { score: a.score, total: Q.length, recap: Q.map(function (q) { return { topic: q.topic, correct: !!a.res[q.id] }; }) };
    },
    lead: function (b) {
      var errors = {};
      var name = String(b.name || '').trim(), email = emailOk(b.email), phone = phoneOk(b.phone, b.countryCode);
      if (name.length < 2) errors.name = 'Please tell us your name.';
      if (!email) errors.email = 'Please check your email address.';
      if (!phone) errors.phone = 'Please enter a valid WhatsApp mobile number, including the country code.';
      if (Object.keys(errors).length) return { ok: false, errors: errors };
      var a = store.attempts[b.attemptId];
      store.lead = { id: 'L-DEMO' + rid(4), key: rid(24), name: name, email: email, phone: phone, best: a ? a.score : 0, total: Q.length, verified: false };
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
      return wait(action === 'answer' ? 180 : 260).then(function () {
        if (!A[action]) fail('Unknown action');
        return A[action](data);
      });
    }
  };
})();
