-- =====================================================================
-- ZICA CREATIVE QUEST — Supabase schema + starter data
-- Applied automatically by .github/workflows/deploy.yml (or paste into
-- Supabase → SQL Editor → Run).
-- Safe to run again: it never deletes leads, attempts or certificates,
-- and never overwrites questions/settings you have already edited.
-- The question seed at the bottom is GENERATED: edit tools/questions.mjs,
-- then run  node tools/build-seed.mjs
-- =====================================================================

-- ---------------------------------------------------------------- tables

create table if not exists public.settings (
  key        text primary key,
  value      text not null default '',
  notes      text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id          text primary key,
  sort        int  not null default 999,
  active      boolean not null default true,
  category    text not null default '',
  type        text not null default 'concept',
  topic       text not null default '',
  question    text not null,
  option_a    text not null default '',
  option_b    text not null default '',
  option_c    text not null default '',
  option_d    text not null default '',
  correct     text not null check (correct in ('A','B','C','D')),
  explanation text not null default '',
  asset       text not null default '',
  asset_alt   text not null default '',
  set_name    text not null default 'A',
  updated_at  timestamptz not null default now()
);
alter table public.questions add column if not exists set_name text not null default 'A';

create table if not exists public.leads (
  id                   text primary key,
  lead_key             text not null,                 -- secret held by the participant's browser
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  name                 text not null default '',
  email                text not null,
  phone                text not null,
  course               text not null default '',
  src                  text not null default '',
  campaign             text not null default '',
  latest_attempt_id    text,
  quiz_status          text not null default 'Not completed',
  latest_score         int,
  best_score           int,
  total_questions      int,
  attempts             int not null default 0,
  lesson_wa            boolean not null default false,
  marketing_consent    boolean not null default false,
  marketing_consent_at timestamptz,
  email_check          text not null default '',      -- ok | no_mail_server | disposable | unchecked
  email_status         text not null default 'Unverified',
  phone_status         text not null default 'Unverified',
  email_verified_at    timestamptz,
  phone_verified_at    timestamptz,
  learning_access      text not null default 'Granted',
  lessons_opened_at    timestamptz,
  name_original        text,
  email_original       text,
  phone_original       text,
  edit_count           int not null default 0,
  consent_source       text not null default ''
);
alter table public.leads add column if not exists consent_source text not null default '';
create unique index if not exists leads_phone_uq on public.leads (phone);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_updated_idx on public.leads (updated_at);

create table if not exists public.attempts (
  id           text primary key,
  lead_id      text references public.leads(id) on delete set null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  status       text not null default 'Started',
  attempt_no   int not null default 1,
  score        int,
  total        int not null,
  question_ids text[] not null,
  answers      jsonb not null default '{}'::jsonb,
  results      jsonb not null default '{}'::jsonb,
  src          text not null default '',
  campaign     text not null default '',
  device       text not null default ''
);
create index if not exists attempts_updated_idx on public.attempts (updated_at);
create index if not exists attempts_lead_idx on public.attempts (lead_id);

create table if not exists public.otp_codes (
  id          bigserial primary key,
  lead_id     text not null references public.leads(id) on delete cascade,
  channel     text not null,
  destination text not null,
  code_hash   text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  tries       int not null default 0,
  consumed_at timestamptz
);
create index if not exists otp_lead_idx on public.otp_codes (lead_id, created_at desc);

create table if not exists public.certificates (
  id           text primary key,                      -- e.g. ZCQ26-7K3M9P
  download_key text not null,
  lead_id      text not null unique references public.leads(id) on delete cascade,
  attempt_id   text,
  name         text not null,
  score        int,
  total        int,
  issued_at    timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  verified_via text not null default '',
  email_sent   text not null default '',
  wa_sent      text not null default '',
  downloads    int not null default 0,
  revoked      boolean not null default false
);
create index if not exists certs_updated_idx on public.certificates (updated_at);

create table if not exists public.message_log (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  lead_id         text,
  channel         text not null,                      -- email | whatsapp | sms
  category        text not null,                      -- otp | certificate | lesson
  provider        text not null default '',
  to_masked       text not null default '',
  status          text not null default '',
  provider_ref    text not null default '',
  delivery_status text not null default '',
  info            text not null default ''
);
create index if not exists msg_updated_idx on public.message_log (updated_at);
create index if not exists msg_ref_idx on public.message_log (provider_ref);
create index if not exists msg_lead_idx on public.message_log (lead_id);
create index if not exists certs_attempt_idx on public.certificates (attempt_id);

-- ------------------------------------------------------- updated_at stamps

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['settings','questions','leads','attempts','certificates','message_log'] loop
    execute format('drop trigger if exists trg_touch on public.%I', t);
    execute format('create trigger trg_touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ------------------------------------------- atomic "lock in an answer"
-- First answer for a question is final. Returns the stored answer either way.
create or replace function public.record_answer(p_attempt text, p_qid text, p_choice int, p_correct int)
returns jsonb language plpgsql set search_path = '' as $$
declare r public.attempts;
begin
  update public.attempts
     set answers = answers || jsonb_build_object(p_qid, p_choice),
         results = results || jsonb_build_object(p_qid, p_correct)
   where id = p_attempt
     and status = 'Started'
     and p_qid = any(question_ids)
     and not (answers ? p_qid);

  select * into r from public.attempts where id = p_attempt;
  if not found or not (r.answers ? p_qid) then return null; end if;

  return jsonb_build_object(
    'choice',   (r.answers ->> p_qid)::int,
    'correct',  (r.results ->> p_qid)::int,
    'answered', (select count(*) from jsonb_object_keys(r.answers)),
    'total',    r.total);
end $$;

-- ----------------------------------------------------------- lock it down
-- The browser never talks to these tables. Only the Edge Function (server
-- side, full database access) does. RLS on + no policies = public API sees nothing.
do $$
declare t text;
begin
  foreach t in array array['settings','questions','leads','attempts','otp_codes','certificates','message_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke execute on function public.record_answer(text, text, int, int) from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;

-- -------------------------------------------- private secrets (no public API)
-- The function reads SYNC_TOKEN / OTP_PEPPER / ALLOW_TEST_OTP / BREVO_API_KEY from here
-- unless the same name is set as a Supabase Edge Function secret (that wins).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (
  key text primary key, value text not null, updated_at timestamptz not null default now());
alter table private.app_secrets enable row level security;
revoke all on private.app_secrets from public, anon, authenticated;
insert into private.app_secrets(key, value) values
  ('SYNC_TOKEN', 'zcq_' || encode(extensions.gen_random_bytes(20), 'hex')),
  ('OTP_PEPPER', encode(extensions.gen_random_bytes(32), 'hex')),
  ('ALLOW_TEST_OTP', 'true')
on conflict (key) do nothing;
create table if not exists private.loadtest_runs (
  id bigint generated always as identity primary key, created_at timestamptz not null default now(),
  pass boolean not null default false, summary text not null default '');
alter table private.loadtest_runs enable row level security;
revoke all on private.loadtest_runs from public, anon, authenticated;

-- ------------------------------------------------------------- settings
insert into public.settings (key, value, notes) values
  ('institute_name',      'ZICA Pune · Kothrud', 'Header text when no logo image is found'),
  ('quiz_title',          'ZICA Creative Quest', 'Browser tab title'),
  ('quiz_tagline',        'Your imagination. Your next move.', 'Welcome headline'),
  ('quiz_intro',          'Think like an animator. See like a VFX artist. Discover what you could create.', 'Welcome sub-line'),
  ('campaign_name',       'creative_quest_2026', 'Default campaign tag (?utm_campaign= overrides)'),
  ('total_questions',     '25', 'Questions per attempt, taken from that attempt''s set (lowest sort first)'),
  ('landing_url',         '', 'https:// free-lessons page. Blank = friendly "on the list" screen'),
  ('reward_text',         'Free introductory lessons in animation, VFX, gaming & design', 'One line describing the free reward'),
  ('eligibility_note',    '', 'Leave blank unless an approved rule exists'),
  ('require_name',        'true', 'Name required on the contact form'),
  ('marketing_preticked', 'true', 'true = the course-updates checkbox starts ticked (students can untick)'),
  ('default_country_code','91', 'Pre-filled WhatsApp country code'),
  ('course_options',      'UI/UX Design, Game Art & Design, 3D Animation & VFX, Film Making & VFX, Motion Graphics & Editing, Graphic Design, Digital Design & Marketing, Product Visualisation & Ad Design, Architectural Design & Animation, Digital Photography, Creative Gen AI, Not sure yet', 'Comma-separated; blank hides the field'),
  ('privacy_url',         '', 'Optional privacy policy link'),
  ('contact_line',        'ZICA Pune, Kothrud', 'Small line on the final screens'),
  ('site_url',            'https://zicapune.github.io/creative-quest', 'REQUIRED for certificates: your live site, e.g. https://quest.zicapune.com (no trailing slash)'),
  ('logo_url',            'assets/img/logo.png', 'Official ZICA logo (path inside the site or https URL)'),
  ('avatar_name_url',     'assets/img/avatar-hello.png', 'Avatar on the name screen'),
  ('avatar_contact_url',  'assets/img/avatar-point.png', 'Avatar on the contact screen'),
  ('avatar_cert_url',     'assets/img/avatar-certificate.png', 'Avatar on the certificate screens'),
  ('trophy_url',          '', 'Optional trophy image (built-in trophy if blank)'),
  ('bg_image_url',        '', 'Optional cinematic page background'),
  ('cert_enabled',        'true', 'false = hide the certificate offer'),
  ('cert_title',          'Certificate of Completion', 'Big title on the certificate'),
  ('cert_presented',      'This certificate is proudly presented to', 'Line above the name'),
  ('cert_body',           'for successfully completing the ZICA Creative Quest — an interactive exploration of animation, VFX, gaming, design and filmmaking.', 'Paragraph under the name'),
  ('cert_show_score',     'false', 'true = print "Quest score: 12/15" on the certificate'),
  ('cert_theme',          'light', 'light = dark text (for a light background image); dark = light text'),
  ('cert_bg_url',         'assets/img/certificate-bg.jpg', 'A4 landscape background (built-in design used if missing)'),
  ('cert_logo_url',       'assets/img/cert-logo.png', 'Logo printed on the certificate (top-left)'),
  ('cert_logo2_url',      'assets/img/cert-logo-2.png', 'Partner logo printed top-right (blank = none)'),
  ('cert_signature_url',  'assets/img/signature.png', 'Transparent PNG signature (optional)'),
  ('signatory_name',      'Pallavi Shivarkar', 'Printed under the signature'),
  ('signatory_title',     'Managing Director', 'Printed under the signatory name'),
  ('cert_institute_line', 'ZICA Pune · Kothrud', 'Printed beside the signatory title'),
  ('otp_channel',         'email', 'email | whatsapp (whatsapp needs wa_provider set; falls back to email)'),
  ('email_from_name',     'ZICA Pune', 'Sender name on emails'),
  ('email_from_address',  '', 'Sender email — must be a VERIFIED sender in Brevo'),
  ('email_reply_to',      '', 'Optional reply-to address'),
  ('wa_provider',         'none', 'none | brevo | webhook   (DORMANT until you switch it)'),
  ('wa_template_otp',     '', 'Approved WhatsApp AUTHENTICATION template name/ID for the OTP'),
  ('wa_template_certificate','', 'Approved WhatsApp UTILITY template for the certificate link'),
  ('sms_provider',        'none', 'none | webhook   (India needs DLT registration first)')
on conflict (key) do nothing;

-- ------------------------------------------------------------ questions

-- ------------------------------------------- Google sign-in (Oct 2026)
alter table public.leads add column if not exists verified boolean not null default false;
alter table public.leads add column if not exists auth_provider text not null default 'manual';
alter table public.leads add column if not exists auth_user_id text not null default '';
insert into public.settings (key, value, notes) values
  ('otp_enabled', 'false', 'true = old 6-digit code step before the certificate (needs Brevo). false = certificate straight after details'),
  ('google_login', 'true', 'true = show "Continue with Google" (needs the Google provider switched on in Supabase Auth)')
on conflict (key) do nothing;

-- @@SEED_START@@ (generated by tools/build-seed.mjs — do not edit by hand)
insert into public.questions
  (id, sort, active, category, type, topic, question, option_a, option_b, option_c, option_d, correct, explanation, asset, asset_alt, set_name)
values
('A01', 1, true, 'Software & Tools', 'tool', '3D software', 'This is a 3D viewport. Which of these apps would you open to model the cube in it?', 'Photoshop', 'Blender', 'Premiere Pro', 'Microsoft Word', 'B', 'Blender is a free, open-source 3D suite for modeling, animation and rendering. Photoshop edits 2D images, Premiere Pro edits video, and Word is for documents.', 'svg:viewport', 'A 3D viewport with a perspective grid floor, a wireframe cube slowly rotating and a small red-green-blue axis gizmo in the corner.', 'A'),
('A02', 2, true, 'Visual Recognition', 'image', '2D vs 3D', 'Look at shapes A and B. Which one is drawn as a 3D object?', 'Shape A', 'Shape B', 'Both are 3D', 'Neither is 3D', 'B', 'A 3D object has width, height AND depth. Shape B shows three faces in three shades, so your eye reads depth. Shape A only has width and height — that is 2D.', 'svg:dims', 'Shape A is a flat orange square. Shape B is a cube showing its top, front and side faces in three shades.', 'A'),
('A03', 3, true, 'Animation Principles', 'animation', 'Squash & stretch', 'Watch the bouncing ball. Which animation principle is it showing?', 'Squash and stretch', 'Anticipation', 'Staging', 'Follow through', 'A', 'The ball flattens (squash) when it hits the ground and stretches as it speeds up. It makes objects feel soft, heavy and alive — it is the first of Disney''s 12 classic principles of animation.', 'svg:ball', 'A ball falls, flattens wide on impact, stretches tall as it bounces up, and repeats.', 'A'),
('A04', 4, true, 'Film Language', 'image', 'Storyboards', 'Before filming or animating, artists plan with panels like these. What are they called?', 'A texture map', 'A colour palette', 'A storyboard', 'A render farm', 'C', 'A storyboard is a comic-strip-style plan of a film, shot by shot. It lets the whole team agree on camera angles, action and timing before any expensive animation or filming starts.', 'svg:board', 'Three numbered sketch panels with arrows: a wide shot of a character near a house, a close-up of a smiling face, and the character running.', 'A'),
('A05', 5, true, 'Lighting', 'image', 'Key light direction', 'Look at the brightest spot and the shadow. Where is the main light coming from?', 'From the right', 'From directly below', 'From the upper left', 'From behind the ball', 'C', 'The side facing a light gets the brightest highlight, and the shadow falls on the opposite side. Lighting artists call this main light the key light — reading it is one of the first lighting skills you learn.', 'svg:light', 'A sphere that is brightest on its upper-left side and darker on the lower right, with a shadow stretching to the lower right.', 'A'),
('A06', 6, true, 'Animation Principles', 'animation', 'Keyframes', 'An animator sets the ball''s position only at frame 1 and frame 24, and the software fills in the rest. What are frames 1 and 24 called?', 'Keyframes', 'Layers', 'Renders', 'Storyboards', 'A', 'Keyframes mark the important poses or positions. The frames between them are in-betweens — the software (or an in-between artist in 2D) creates them.', 'svg:keys', 'A ball slides from left to right. Below it, a timeline from frame 1 to 24 has diamond markers on frames 1 and 24 and a moving playhead.', 'A'),
('A07', 7, true, 'Creative Puzzle', 'puzzle', 'Figure & negative space', 'Look closely at this image. What do you see?', 'Only a vase', 'Only two faces', 'Just random shapes', 'Both — a vase and two faces', 'D', 'This is Rubin''s vase. The light shape and the dark shapes both make sense, so your brain flips between a vase and two faces. Designers use this negative space to hide a second picture inside the first.', 'svg:vase', 'A light vase shape in the centre whose two edges also form the dark profiles of two faces looking at each other.', 'A'),
('A08', 8, true, 'VFX & Compositing', 'scenario', 'Compositing', 'An actor is filmed in front of a green screen, then placed inside a CGI castle. What is combining these layers into one shot called?', 'Rigging', 'Compositing', 'Sculpting', 'UV unwrapping', 'B', 'Compositing combines separate elements — live footage, CGI, effects and backgrounds — into one final image. Removing the green background first is called chroma keying.', 'svg:layers', 'Green-screen footage of an actor, plus a CGI castle background, equals a final shot with the actor standing in front of the castle.', 'A'),
('A09', 9, true, 'Animation Principles', 'animation', 'Anticipation', 'The character crouches down before leaping up. What is this small "get ready" move called?', 'Follow through', 'Anticipation', 'Staging', 'Arcs', 'B', 'Anticipation prepares the audience for an action — a crouch before a jump, a wind-up before a throw. Without it, movement feels sudden and weightless.', 'svg:jump', 'A rounded character crouches down, springs up into the air and lands, on a loop.', 'A'),
('A10', 10, true, '3D Basics', 'image', 'Rigging', 'The lines and dots inside this character are bones and joints that let animators pose it. What is this setup called?', 'A texture', 'A render', 'A storyboard', 'A rig', 'D', 'Rigging builds a digital skeleton with controls inside a 3D model. Animators move the rig — not every single polygon — to create poses.', 'svg:rig', 'A character outline with a skeleton of bones and joint dots inside; one arm slowly waves.', 'A'),
('A11', 11, true, 'Drawing & Perspective', 'image', 'Vanishing point', 'The edges of the road seem to meet at one point on the horizon. What is that point called?', 'The vanishing point', 'The pivot point', 'The highlight', 'The centre of mass', 'A', 'Parallel lines moving away from us appear to meet at a vanishing point on the horizon. Artists use it to draw roads, buildings and rooms with convincing depth — this is linear perspective.', 'svg:vp', 'A road stretching to the horizon, its edges converging to one glowing point, with poles getting smaller into the distance.', 'A'),
('A12', 12, true, '3D Basics', 'image', 'Materials & shaders', 'Same shape, three different looks. To make a 3D ball look like shiny metal instead of rubber, what does an artist change?', 'Its number of keyframes', 'The frame rate', 'Its material (shader)', 'The camera position', 'C', 'A material, also called a shader, tells the renderer how a surface reacts to light — how shiny, rough, metallic or transparent it is. The shape stays the same; only the surface changes.', 'svg:mats', 'Three identical spheres labelled rubber, plastic and metal: soft and matte, glossy with a small highlight, and mirror-like with sharp reflections.', 'A'),
('A13', 13, true, 'Gaming', 'tool', 'Game engines', 'Unreal Engine and Unity draw scenes like this one 60 times every second. What are they mainly used to create?', 'Printed posters and brochures', 'Music and podcasts', 'Video games and real-time 3D', 'Spreadsheets and reports', 'C', 'Unreal Engine and Unity are game engines: they draw 3D worlds in real time so players can interact with them. Today they are also used for films, virtual production and architecture.', 'svg:engine', 'A game scene with a small character on floating platforms, a play button and a 60 FPS counter.', 'A'),
('A14', 14, true, 'Colour', 'puzzle', 'Warm & cool colour', 'Which colour palette would make a scene feel warm, like a sunset?', 'Palette A', 'Palette B', 'Palette C', 'Palette D', 'B', 'Reds, oranges and yellows are warm colours — they suggest heat, sunlight and energy. Blues and greens feel cool and calm. Colour artists pick a palette to set the mood before anything moves.', 'svg:palettes', 'Four palettes: A is blues and teals, B is reds, oranges and yellows, C is greys, D is greens and teals.', 'A'),
('A15', 15, true, 'Film Language', 'image', 'Camera shots', 'In this shot, the character''s face fills almost the whole frame. What type of shot is it?', 'A wide shot', 'An aerial shot', 'An over-the-shoulder shot', 'A close-up', 'D', 'A close-up shows emotion and detail — perfect for a reaction. A wide shot shows the whole setting, an aerial shot looks down from above, and an over-the-shoulder shot frames a conversation.', 'svg:shot', 'A camera viewfinder with recording marks, filled almost completely by a character''s surprised face.', 'A'),
('A16', 16, true, 'Composition', 'image', 'Rule of thirds', 'The frame is split into a 3 × 3 grid and the subject sits where two lines cross. What is this guideline called?', 'Symmetry', 'The rule of thirds', 'Centre framing', 'The 180-degree rule', 'B', 'The rule of thirds places important things on the grid lines or where they cross. It usually feels more natural and interesting than putting everything dead centre — photographers, animators and UI designers all use it.', 'svg:thirds', 'A landscape at dusk with a 3 by 3 grid over it; a lone tree and the sun sit on the grid''s crossing points.', 'A'),
('A17', 17, true, 'Animation Basics', 'animation', 'Frame rate', 'Cinema films are traditionally shot at how many frames per second?', '5', '24', '100', '1,000', 'B', 'Most films run at 24 frames per second — fast enough for your eye to see smooth motion. Games often aim for 60, and a lot of 2D animation is drawn "on twos": 12 new drawings each second.', 'svg:fps', 'A flipbook flicking through pages of a running figure while a counter ticks from 1 to 24 frames, equal to one second.', 'A'),
('A18', 18, true, 'Colour', 'image', 'Complementary colours', 'Colours that sit opposite each other on the colour wheel — like blue and orange — are called…', 'Analogous colours', 'Monochrome colours', 'Pastel colours', 'Complementary colours', 'D', 'Complementary colours sit directly opposite on the wheel, so they make each other pop. That is why so many movie posters use orange and teal. Analogous colours are neighbours on the wheel.', 'svg:wheel', 'A twelve-segment colour wheel with the blue and orange segments highlighted and joined by an arrow across the centre.', 'A'),
('A19', 19, true, 'Character Design', 'image', 'Silhouette test', 'Character artists fill a pose with solid black to check that it still reads clearly. What is this check called?', 'A silhouette test', 'A colour test', 'A render test', 'A lighting test', 'A', 'If a pose or character design is recognisable as a pure black shape, it will read instantly on screen. Great game and cartoon characters all pass the silhouette test.', 'svg:silhouette', 'A character striking a dynamic pose, which fills in to a solid black silhouette and back again.', 'A'),
('A20', 20, true, 'Animation Principles', 'animation', 'Slow in & slow out', 'The ball''s positions are bunched up at the start and end of the move, and spread out in the middle. Which principle is this?', 'Squash and stretch', 'Staging', 'Slow in and slow out', 'Exaggeration', 'C', 'Real objects speed up and slow down gradually. Putting more drawings near the start and end of a move (and fewer in the middle) makes it ease in and ease out, instead of moving like a robot.', 'svg:ease', 'A ball glides between two points, speeding up in the middle; tick marks under its path are close together at both ends and wide apart in the middle.', 'A'),
('A21', 21, true, 'Animation Principles', 'animation', 'Arcs', 'A thrown ball follows a curved path, and so do swinging arms and turning heads. Which animation principle is this?', 'Timing', 'Solid drawing', 'Arcs', 'Appeal', 'C', 'Almost every natural movement travels along an arc. Animators trace these curves to check their motion — straight-line movement looks mechanical.', 'svg:arcs', 'A ball is thrown and travels along a dotted curved path, leaving fading copies of itself along the arc.', 'A'),
('A22', 22, true, 'Camera & Lens', 'image', 'Depth of field', 'Only the middle object is sharp — the ones in front and behind are blurry. What is this camera effect called?', 'Shallow depth of field', 'Motion blur', 'Lens flare', 'Vignette', 'A', 'Depth of field is how much of the scene is in focus. A shallow depth of field keeps only one distance sharp, guiding the viewer''s eye. 3D renders fake it to look like a real camera.', 'svg:dof', 'Three spheres at different distances; only the middle one is in sharp focus while the near and far ones are blurred, with a focus bracket on the middle one.', 'A'),
('A23', 23, true, '3D Basics', 'image', 'Polygons', '3D models are built from many small flat faces, like the highlighted one. What are these faces called?', 'Pixels', 'Vectors', 'Keyframes', 'Polygons', 'D', 'A 3D mesh is made of polygons — flat faces joined at edges and points called vertices. More polygons mean more detail but heavier files, so game artists balance the count carefully.', 'svg:mesh', 'A low-poly sphere drawn as a wireframe mesh with vertex dots; one face blinks highlighted in orange.', 'A'),
('A24', 24, true, '3D Basics', 'animation', 'UV unwrapping', 'Flattening a 3D model''s surface into a 2D layout, so a texture can be painted on it, is called…', 'Rigging', 'UV unwrapping', 'Rendering', 'Keyframing', 'B', 'UV unwrapping is like unfolding a cardboard box flat. Texture artists paint on the flat layout, and the software wraps the painting back around the 3D model.', 'svg:uv', 'A dice-patterned cube unfolds into a flat cross-shaped layout of six squares, then folds back up.', 'A'),
('A25', 25, true, 'Graphic Design', 'image', 'Vector vs pixel', 'Zoomed in, circle A turns blocky but circle B stays perfectly smooth. What kind of image is B?', 'A pixel (raster) image', 'A vector graphic', 'A photograph', 'A low-resolution GIF', 'B', 'Vector graphics are stored as maths — points and curves — so they stay crisp at any size. That is why logos are designed in vector apps like Illustrator. Pixel images are grids of coloured squares.', 'svg:vector', 'Two magnified circle edges: A is a staircase of square pixels, B is a smooth curve with anchor points and handles.', 'A'),
('B01', 1, true, 'Animation Principles', 'animation', 'Follow through', 'The character stops suddenly, but its antenna keeps swinging for a moment. Which animation principle is this?', 'Anticipation', 'Follow through', 'Staging', 'Solid drawing', 'B', 'Loose parts — hair, tails, clothes, antennae — keep moving after the body stops, then settle. Follow through (and its partner, overlapping action) makes animation feel physical.', 'svg:follow', 'A small round robot slides in and stops; its springy antenna keeps wobbling back and forth before it settles.', 'B'),
('B02', 2, true, 'Animation Principles', 'animation', 'Timing', 'Both balls travel the same distance, but ball B uses more frames, so it moves slower and feels heavier. Which principle is this?', 'Staging', 'Appeal', 'Arcs', 'Timing', 'D', 'Timing is the number of frames an action takes. Fewer frames feel fast and light; more frames feel slow and heavy. Changing only the timing can turn a ping-pong ball into a bowling ball.', 'svg:timing', 'Two lanes: ball A crosses quickly with four frame marks; ball B crosses slowly with twelve frame marks.', 'B'),
('B03', 3, true, 'Animation Principles', 'image', 'Exaggeration', 'Face B pushes the surprise far beyond real life — huge eyes, dropped jaw. Which principle is this?', 'Exaggeration', 'Follow through', 'Staging', 'Timing', 'A', 'Exaggeration pushes poses and expressions further than reality so emotions read instantly — even from the back of a cinema. It is a big part of what makes cartoons feel alive.', 'svg:exagg', 'Two faces side by side: A looks mildly surprised; B has enormous eyes, raised brows and a wide-open mouth.', 'B'),
('B04', 4, true, 'Animation Principles', 'image', 'Staging', 'Using light, position and camera so the audience knows exactly where to look is called…', 'Rendering', 'Rigging', 'Staging', 'Texturing', 'C', 'Staging presents an idea so clearly it can''t be missed — like a spotlight on the hero while everything else fades back. It comes from theatre and is one of the 12 principles of animation.', 'svg:stage', 'A stage where a spotlight shines on one character while two others stand in shadow.', 'B'),
('B05', 5, true, 'Animation Basics', 'animation', 'Walk cycle', 'An animation that loops seamlessly, like these steps, is called a…', 'Storyboard', 'Turnaround', 'Walk cycle', 'Render pass', 'C', 'A walk cycle is a set of poses where the last frame flows straight back into the first, so it can loop forever. It is one of the first exercises every animation student masters.', 'svg:walk', 'A simple figure walks on the spot, legs and arms swinging in a loop, with a circular loop arrow beside it.', 'B'),
('B06', 6, true, 'Character Design', 'image', 'Turnaround', 'A sheet showing the same character from the front, side and back is called a…', 'Turnaround (model sheet)', 'Storyboard', 'Mood board', 'Sprite sheet', 'A', 'A turnaround keeps a character consistent: 3D modelers build from it, and every animator draws the same proportions. Front, three-quarter, side and back views are standard.', 'svg:turn', 'One character drawn four times in a row — front, three-quarter, side and back — with guide lines at head, waist and feet.', 'B'),
('B07', 7, true, 'Lighting', 'image', 'Three-point lighting', 'In three-point lighting there is a key light, a fill light and a third light behind the subject. What is it called?', 'Ambient light', 'Sun light', 'Ring light', 'Back light (rim light)', 'D', 'The key light is the main light, the fill softens shadows, and the back (rim) light outlines the subject to separate it from the background. Film sets and 3D scenes use this setup every day.', 'svg:threepoint', 'A top-down diagram: a subject in the centre, a camera at the bottom, a key light and fill light on either side, and a third light behind marked with a question mark.', 'B'),
('B08', 8, true, 'Lighting', 'image', 'Colour temperature', 'A candle gives warm orange light. Which light colour would make a scene feel like moonlight?', 'Warm orange', 'Cool blue', 'Bright yellow', 'Deep red', 'B', 'Light has a colour temperature, measured in Kelvin. Candles and sunsets are warm (orange); moonlight and shade feel cool (blue). Lighting artists use this to tell the audience the time of day.', 'svg:temp', 'A scene split in two: a candle-lit room glowing orange on the left, a moonlit window glowing blue on the right, above a warm-to-cool Kelvin scale.', 'B'),
('B09', 9, true, 'Film Language', 'image', 'Low-angle shot', 'The camera looks up at the hero, making them feel big and powerful. What kind of shot is this?', 'A high-angle shot', 'A low-angle shot', 'A bird''s-eye view', 'A close-up', 'B', 'A low-angle shot places the camera below the subject, so they tower over us — great for heroes and villains. A high-angle shot does the opposite and makes characters look small.', 'svg:lowangle', 'A camera on the ground tilted upward at a tall hero standing against the sky, drawn in steep perspective.', 'B'),
('B10', 10, true, 'Film Language', 'image', 'Establishing shot', 'The wide opening shot that shows the audience where a scene takes place is called…', 'A close-up', 'A cutaway', 'An insert shot', 'An establishing shot', 'D', 'An establishing shot sets up the location — a city skyline, a school, a spaceship — before the story moves in closer. It gives the audience their bearings.', 'svg:establish', 'A wide view of a city skyline at dusk with a clapperboard reading Scene 1, Shot 1.', 'B'),
('B11', 11, true, 'VFX & Compositing', 'scenario', 'Chroma key', 'Why are chroma-key screens usually bright green?', 'Green is very different from skin tones, so it''s easy to remove', 'Green makes actors look better', 'Cameras can''t record green', 'Green is the cheapest paint', 'A', 'Keying software removes one colour. Bright green (or blue) is far away from human skin tones, so the computer can cut it out cleanly without eating into the actor. Digital cameras are also very sensitive to green.', 'svg:greenscreen', 'An actor in front of a green screen, with a colour wheel showing skin tones on one side and the green screen colour far away on the other.', 'B'),
('B12', 12, true, 'VFX & Compositing', 'animation', 'Particles', 'Fire, smoke, rain and sparks in VFX are often made from thousands of tiny moving points. What are they called?', 'Polygons', 'Keyframes', 'Particles', 'Layers', 'C', 'A particle system emits huge numbers of tiny points, each with its own speed, life and colour. Together they behave like sparks, dust, rain or magic — software like Houdini and Blender is built for it.', 'svg:particles', 'A glowing emitter shoots a fountain of spark particles that rise, drift and fade out.', 'B'),
('B13', 13, true, 'VFX & Compositing', 'image', 'Rotoscoping', 'Tracing an outline around something in live-action footage, frame by frame, is called…', 'Rigging', 'Rendering', 'Rotoscoping', 'Retopology', 'C', 'Rotoscoping traces shapes in footage so they can be cut out or animated over. VFX artists roto actors to put effects behind them; classic films traced real actors to animate them.', 'svg:roto', 'A video frame of a dancer, with a dashed orange outline of points being traced around her body, marked frame 042.', 'B'),
('B14', 14, true, 'VFX & Compositing', 'animation', 'Motion tracking', 'These markers help software follow the camera''s movement, so CGI stays glued to the shot. What is this called?', 'Motion tracking', 'Colour grading', 'Keying', 'Rendering', 'A', 'Motion (camera) tracking follows points in the footage to rebuild how the real camera moved. A virtual camera then copies that movement, so the CGI moves perfectly with the live action.', 'svg:track', 'A street scene drifting slowly while small X markers stick to the ground and walls, each with a crosshair and a short motion trail.', 'B'),
('B15', 15, true, '3D Basics', 'animation', 'Rendering', 'Turning a 3D scene into finished images is called…', 'Modeling', 'Rigging', 'Storyboarding', 'Rendering', 'D', 'Rendering calculates light, shadows and materials to turn a 3D scene into final pixels. A single movie frame can take hours, which is why studios use render farms full of computers.', 'svg:render', 'A wireframe 3D shape being filled in by glowing render tiles, square by square, with a progress bar.', 'B'),
('B16', 16, true, '3D Basics', 'animation', 'Extrude', 'Pulling a face of a model outward to add new geometry, like this, is called…', 'Bevel', 'Extrude', 'Mirror', 'Smooth', 'B', 'Extrude pushes or pulls a face to create new geometry attached to the old — the most used tool in 3D modeling. A whole building can start as one cube extruded again and again.', 'svg:extrude', 'A cube whose top face is pulled upward by an arrow handle, growing a taller block, then sinking back.', 'B'),
('B17', 17, true, 'Gaming', 'image', 'Isometric view', 'This angled view, popular in strategy and city-building games, is called…', 'Side-scrolling view', 'Isometric view', 'First-person view', 'Fish-eye view', 'B', 'Isometric view shows the world from a fixed angle above, with no vanishing points, so the whole map is easy to read. Many classic strategy and farming games use it.', 'svg:iso', 'A small diamond-shaped island of tiles with a house, trees and a path, drawn at an angle from above.', 'B'),
('B18', 18, true, 'Gaming', 'image', 'HUD', 'The health bar, mini-map and score drawn on top of a game screen are called the…', 'Level', 'Skybox', 'Texture', 'HUD', 'D', 'The HUD (heads-up display) shows the player key info without pausing the game. UI/UX designers in game studios design it so it''s readable in a split second.', 'svg:hud', 'A game screen with hearts and a health bar at the top left, a mini-map at the top right and a score at the bottom.', 'B'),
('B19', 19, true, 'Gaming', 'animation', 'Hitboxes', 'Games use invisible boxes like these to detect when something hits a character. What are they called?', 'Hitboxes', 'Skyboxes', 'Lightmaps', 'Text boxes', 'A', 'Hitboxes are simple invisible shapes the game checks for collisions — far faster than checking every pixel of a character. Fighting games tune them frame by frame.', 'svg:hitbox', 'A pixel-art character outlined by dashed boxes; a fireball flies in and the box flashes when it touches.', 'B'),
('B20', 20, true, 'Gaming', 'animation', 'Sprite sheet', 'A grid of frames like this, used to animate a 2D game character, is called a…', 'Storyboard', 'Colour palette', 'Sprite sheet', 'Turnaround', 'C', 'A sprite sheet packs every frame of a 2D character''s animation into one image. The game shows one cell at a time, very fast, so the character appears to move.', 'svg:sprites', 'A grid of six pixel-art frames of a running character, with a highlight jumping from frame to frame while a preview runs beside it.', 'B'),
('B21', 21, true, 'Typography', 'image', 'Serifs', 'The small "feet" at the ends of the strokes on this letter are called…', 'Kerning', 'Ligatures', 'Serifs', 'Pixels', 'C', 'Serifs are the small strokes at the ends of letters. Serif fonts (like Times) feel classic and bookish; sans-serif fonts (like the one you''re reading now) feel clean and modern.', 'svg:serif', 'A large letter T with its small feet and top end strokes highlighted in orange, next to a plain T without them.', 'B'),
('B22', 22, true, 'Typography', 'animation', 'Kerning', 'Adjusting the space between two specific letters, like this A and V, is called…', 'Kerning', 'Leading', 'Highlighting', 'Justifying', 'A', 'Kerning fixes awkward gaps between particular letter pairs, like A and V. Leading is the space between lines. Logo and UI designers kern by eye until the word looks evenly spaced.', 'svg:kerning', 'The letters A and V sit too far apart, then slide closer together until the gap looks even, with a spacing marker between them.', 'B'),
('B23', 23, true, 'Creative Puzzle', 'puzzle', 'Illusory contours', 'Look at the bright triangle in the middle. Is it actually drawn?', 'Yes, with thin white lines', 'Yes, it''s painted a lighter colour', 'It''s a shadow', 'No — your brain fills in the edges', 'D', 'This is the Kanizsa triangle. Only three "Pac-Man" shapes and three corners are drawn — your brain invents the missing edges. Designers use this "closure" effect to make logos with fewer lines.', 'svg:kanizsa', 'Three dark circles each with a wedge cut out, and three angled lines, arranged so a bright triangle seems to float in the middle.', 'B'),
('B24', 24, true, 'Creative Puzzle', 'puzzle', 'Visual sequence', 'Each frame turns the arrow a quarter turn clockwise. Which way will it point in frame 4?', 'Up', 'Right', 'Down', 'Left', 'D', 'Up → right → down → left: each frame is a 90° clockwise turn. Spotting patterns frame to frame is exactly how animators check the flow of a sequence.', 'svg:sequence', 'A film strip with three frames showing an arrow pointing up, then right, then down, and a fourth frame with a question mark.', 'B'),
('B25', 25, true, 'Software & Tools', 'scenario', 'Video editing', 'You want to join 20 video clips into one short film with music. What kind of software do you need?', 'A 3D sculpting app', 'A video editor, like Premiere Pro or DaVinci Resolve', 'A spreadsheet', 'A font editor', 'B', 'Video editors arrange clips on a timeline with tracks for video, music and sound, then export one film. Premiere Pro, DaVinci Resolve and Final Cut are industry favourites.', 'svg:timeline', 'An editing timeline with video tracks of coloured clips, an audio waveform track and a moving playhead.', 'B')
on conflict (id) do nothing;
-- @@SEED_END@@
