// =====================================================================
// ZICA CREATIVE QUEST — Supabase Edge Function "quest"
// ---------------------------------------------------------------------
// One function, many actions. The browser POSTs { action, ... } here.
//
//   boot          public settings for the site
//   start         new quiz attempt → public questions (no answers).
//                 Attempt 1, 3, 5… get question set A; attempts 2, 4… get set B.
//   answer        check ONE answer server-side (first answer is final)
//   finish        score the attempt
//   lead          save contact details (+ email/phone validation)
//   link          attach a retry attempt to an existing lead
//   opened        participant opened the free lessons
//   confirm       final check / edit of name, email, number before the certificate
//   cert_issue    create the certificate (when settings.otp_enabled = false — the default)
//   otp_send      DORMANT unless otp_enabled = true: send a 6-digit code (email; WhatsApp/SMS dormant)
//   otp_verify    DORMANT unless otp_enabled = true: check the code → issue certificate
//   cert          public verification of a certificate id
//   GET ?action=pdf&id=…&k=…   download the certificate PDF (generated on demand)
//   admin_export  (SYNC_TOKEN) rows changed since a time → Google Sheets
//   admin_push    (SYNC_TOKEN) Questions / Settings from Google Sheets → database
//   admin_purge_loadtest (SYNC_TOKEN) delete rows created by tools/loadtest.mjs
//   POST ?hook=email&token=…   Brevo email delivery events
//   POST ?hook=whatsapp&token=…  WhatsApp delivery events (dormant)
//
// Sign-in: "Continue with Google" uses Supabase Auth's Google provider in the browser; the browser
// sends the Supabase access token with `lead`, and this function checks it with Supabase Auth.
// Without Google, details are saved with verified = false.
//
// SECRETS (Supabase → Edge Functions → Secrets):
//   BREVO_API_KEY     Brevo API key (emails: OTP + certificate link)
//   SYNC_TOKEN        long random string shared with SheetsSync.gs
//   OTP_PEPPER        long random string used to hash OTP codes
//   ALLOW_TEST_OTP    "true" ONLY while testing without Brevo: shows the code on screen
//   WA_API_KEY, WA_SENDER, WA_ENDPOINT   (dormant WhatsApp)
//   SMS_API_KEY, SMS_ENDPOINT, SMS_SENDER (dormant SMS)
// SUPABASE_DB_URL is provided automatically by Supabase.
// =====================================================================

import postgres from 'npm:postgres@3.4.5';
import type { PDFDocument, PDFFont, PDFImage, RGB } from 'npm:pdf-lib@1.17.1';

// deno-lint-ignore no-explicit-any
type Any = any;

// Secrets: a Supabase function secret wins; otherwise the private.app_secrets table
// (not reachable through the public API) — so setup needs no dashboard pasting.
const SECRETS: Record<string, string> = {};
let secretsAt = 0;
const env = (k: string, d = '') => Deno.env.get(k) || SECRETS[k] || d;
// Connect through Supavisor's TRANSACTION pooler (port 6543), not the direct database port:
// each function instance would otherwise hold its own direct connections, and a classroom of
// students spins up enough instances to exhaust the free plan's 60 Postgres connections.
// DB_POOLER_HOST secret overrides the host; set it to "direct" to bypass the pooler.
function dbUrl() {
  const raw = Deno.env.get('SUPABASE_DB_URL') || '';
  const host = Deno.env.get('DB_POOLER_HOST') || 'aws-0-ap-south-1.pooler.supabase.com';
  if (host === 'direct') return raw;
  try {
    const u = new URL(raw);
    const m = /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(u.hostname);
    if (!m) return raw;
    u.hostname = host; u.port = '6543'; u.username = 'postgres.' + m[1];
    return u.toString();
  } catch (_) { return raw; }
}
// One connection per instance, dropped after 2 idle seconds: instances come and go with traffic,
// so this keeps the total far below the pooler's client limit even in a burst.
const sql = postgres(dbUrl(), { prepare: false, max: 1, idle_timeout: 2, max_lifetime: 60, connect_timeout: 10 });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

class UserError extends Error {
  code: string;
  fields?: Record<string, string>;
  constructor(message: string, code = 'user', fields?: Record<string, string>) { super(message); this.code = code; this.fields = fields; }
}

/** One database round trip fills every cache a cold instance needs (secrets, settings, questions). */
async function warm() {
  const now = Date.now();
  const needS = now - secretsAt >= 60_000;
  const needB = !bankCache || now - bankCache.at >= TTL;
  const needC = needB || !cfgCache || now - cfgCache.at >= TTL;
  if (!needS && !needC) return;
  try {
    const rows = await sql`
      select 's' as t, key, value, null::jsonb as q from private.app_secrets where ${needS}
      union all select 'c', key, value, null from public.settings where ${needC}
      union all select 'q', id, null, to_jsonb(x) from public.questions x where active and ${needB}`;
    if (needS) {
      for (const k of Object.keys(SECRETS)) delete SECRETS[k];
      for (const r of rows) if (r.t === 's') SECRETS[r.key] = String(r.value ?? '');
      secretsAt = now;
    }
    if (needC) {
      const c: Record<string, string> = {};
      for (const r of rows) if (r.t === 'c') c[r.key] = String(r.value ?? '').trim();
      cfgCache = { at: now, cfg: c };
    }
    if (needB) bankCache = buildBank(cfgCache!.cfg, rows.filter((r: Any) => r.t === 'q').map((r: Any) => r.q));
  } catch (e) {
    console.error('warm', e);
    // Never run without secrets (a missing OTP_PEPPER would make every code "wrong"): fail this
    // request so the browser retries. With older secrets in memory, carry on and retry in ~10 s.
    if (needS && !Object.keys(SECRETS).length) throw e;
    if (needS) secretsAt = now - 50_000;
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8' } });

// ============================================================== ROUTER

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const url = new URL(req.url);
  try {
    await warm();
    if (req.method === 'GET') {
      const a = url.searchParams.get('action');
      if (a === 'pdf') return await downloadPdf(url.searchParams);
      if (a === 'ping') return json({ ok: true, time: new Date().toISOString() });
      return json({ error: 'Not found' }, 404);
    }
    const hook = url.searchParams.get('hook');
    if (hook) return await handleWebhook(hook, url, req);

    const body = await req.json().catch(() => ({}));
    const fn = ACTIONS[String(body.action || '')];
    if (!fn) return json({ error: 'Unknown action' }, 400);
    return json(await fn(body));
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message, code: e.code, fields: e.fields || null }, 400);
    console.error(e);
    return json({ error: 'Something went wrong on our side. Please try again.' }, 500);
  }
});

const ACTIONS: Record<string, (b: Any) => Promise<unknown>> = {
  boot: actBoot, start: actStart, answer: actAnswer, finish: actFinish,
  lead: actLead, link: actLink, opened: actOpened,
  confirm: actConfirm, otp_send: actOtpSend, otp_verify: actOtpVerify, cert_issue: actCertIssue, cert: actCert,
  admin_export: actAdminExport, admin_push: actAdminPush
};

// ============================================================== CONFIG CACHE

let cfgCache: { at: number; cfg: Record<string, string> } | null = null;
let bankCache: { at: number; sets: Record<string, Any[]>; key: Record<string, Any> } | null = null;
const TTL = 60_000;

async function cfg(): Promise<Record<string, string>> {
  if (cfgCache && Date.now() - cfgCache.at < TTL) return cfgCache.cfg;
  const rows = await sql`select key, value from settings`;
  const c: Record<string, string> = {};
  for (const r of rows) c[r.key] = String(r.value ?? '').trim();
  cfgCache = { at: Date.now(), cfg: c };
  return c;
}

async function bank() {
  if (bankCache && Date.now() - bankCache.at < TTL) return bankCache;
  const c = await cfg();
  const rows = await sql`select * from questions where active`;
  bankCache = buildBank(c, rows);
  return bankCache;
}

function buildBank(c: Record<string, string>, input: Any[]) {
  const limit = clampInt(c.total_questions, 1, 60, 25);
  const rows = [...input].sort((a, b) => String(a.set_name).localeCompare(String(b.set_name)) || (a.sort - b.sort) || String(a.id).localeCompare(String(b.id)));
  const sets: Record<string, Any[]> = {};
  const key: Record<string, Any> = {};
  for (const r of rows) {
    const options = [r.option_a, r.option_b, r.option_c, r.option_d].map((o: string) => String(o || '').trim()).filter(Boolean);
    const correct = 'ABCD'.indexOf(String(r.correct).toUpperCase());
    if (!r.question || options.length < 2 || correct < 0 || correct >= options.length) continue;
    const set = String(r.set_name || 'A').trim().toUpperCase() || 'A';
    sets[set] = sets[set] || [];
    if (sets[set].length >= limit) continue;
    sets[set].push({ id: r.id, category: r.category, type: String(r.type || 'concept').toLowerCase(), text: r.question, options, asset: r.asset || '', assetAlt: r.asset_alt || '' });
    key[r.id] = { correct, correctText: options[correct], explanation: r.explanation, topic: r.topic || r.category, optionCount: options.length };
  }
  return { at: Date.now(), sets, key };
}

/** Odd attempts → set A, even attempts → set B (falls back to whichever set has questions). */
function pickSet(sets: Record<string, Any[]>, attemptNo: number) {
  const names = Object.keys(sets).filter((k) => sets[k].length).sort();
  if (!names.length) return { name: '', list: [] as Any[] };
  const wanted = attemptNo % 2 === 0 ? 'B' : 'A';
  const name = sets[wanted]?.length ? wanted : names[(attemptNo - 1) % names.length];
  return { name, list: sets[name] };
}

/** tools/loadtest.mjs sends a token as `lt`; its rows are tagged and kept out of the Sheet.
 *  LOADTEST_TOKEN (optional) only unlocks load-test actions — never the Sheet export. */
function isLoadTest(b: Any) { return ltTokenOk(b?.lt); }
function ltTokenOk(t: unknown) {
  const v = String(t || '');
  return v.length >= 16 && [env('SYNC_TOKEN'), env('LOADTEST_TOKEN')].some((w) => w.length >= 16 && v === w);
}
function requireLtToken(t: unknown) { if (!ltTokenOk(t)) throw new UserError('Not allowed', 'auth'); }

const truthy = (v: unknown, d = false) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s ? ['true', 'yes', 'y', '1', 'on'].includes(s) : d;
};
const list = (v: string) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

function siteUrl(c: Record<string, string>) { return String(c.site_url || '').replace(/\/+$/, ''); }
function absUrl(c: Record<string, string>, path: string) {
  path = String(path || '').trim();
  if (!path) return '';
  if (/^https:\/\//i.test(path)) return path;
  const base = siteUrl(c);
  return base ? base + '/' + path.replace(/^\/+/, '') : '';
}
function emailProvider() { return env('BREVO_API_KEY') ? 'brevo' : 'none'; }
/** The 6-digit code step is OFF unless settings.otp_enabled = true (it needs Brevo or WhatsApp). */
function otpEnabled(c: Record<string, string>) { return truthy(c.otp_enabled, false); }

/** Checks a Supabase Auth access token (from "Continue with Google") with Supabase Auth itself. */
async function googleUser(accessToken: string) {
  const token = String(accessToken || '').trim();
  if (!token || token.length > 4000) return null;
  const base = env('SUPABASE_URL').replace(/\/+$/, '');
  let key = env('SUPABASE_ANON_KEY');
  if (!key) { try { key = Object.values(JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS', '{}')) as Record<string, string>)[0] || ''; } catch (_) { key = ''; } }
  try {
    const r = await fetch(base + '/auth/v1/user', { headers: { apikey: key, authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const u: Any = await r.json();
    const email = normalizeEmail(u?.email);
    const provider = String(u?.app_metadata?.provider || '');
    if (!email || provider !== 'google') return null;
    const md = u.user_metadata || {};
    return { id: String(u.id || ''), email, name: cleanName(md.full_name || md.name || '') };
  } catch (_) { return null; }
}

// =============================================================== ACTIONS

async function actBoot() {
  const c = await cfg();
  return {
    title: c.quiz_title, tagline: c.quiz_tagline, intro: c.quiz_intro, institute: c.institute_name,
    logoUrl: c.logo_url, avatarNameUrl: c.avatar_name_url, avatarContactUrl: c.avatar_contact_url, avatarCertUrl: c.avatar_cert_url,
    trophyUrl: c.trophy_url, bgImageUrl: c.bg_image_url,
    courses: list(c.course_options), countryCode: (c.default_country_code || '91').replace(/\D/g, '') || '91',
    requireName: truthy(c.require_name, true), marketingPreticked: truthy(c.marketing_preticked, true), rewardText: c.reward_text, eligibilityNote: c.eligibility_note,
    privacyUrl: httpsOnly(c.privacy_url), contactLine: c.contact_line, hasLanding: !!httpsOnly(c.landing_url),
    waAvailable: false, // lesson link on WhatsApp: switch on together with wa_provider (see bottom of file)
    cert: certPublicConfig(c),
    otpChannel: otpChannelFor(c),
    otpEnabled: otpEnabled(c),
    googleLogin: truthy(c.google_login, true),
    totalQuestions: clampInt(c.total_questions, 1, 60, 25)
  };
}

function certPublicConfig(c: Record<string, string>) {
  return {
    enabled: truthy(c.cert_enabled, true), title: c.cert_title, presented: c.cert_presented, body: c.cert_body,
    showScore: truthy(c.cert_show_score), theme: c.cert_theme === 'dark' ? 'dark' : 'light',
    bgUrl: c.cert_bg_url, logoUrl: c.cert_logo_url, logo2Url: c.cert_logo2_url, signatureUrl: c.cert_signature_url,
    signatoryName: c.signatory_name, signatoryTitle: c.signatory_title, instituteLine: c.cert_institute_line
  };
}

async function actStart(b: Any) {
  const { sets } = await bank();
  const attemptNo = clampInt(b.attemptNo, 1, 99, 1);
  const pick = pickSet(sets, attemptNo);
  if (!pick.list.length) throw new UserError('The quiz is being updated. Please try again in a few minutes.');
  const id = 'A-' + ymd() + '-' + randomId(6);
  const device = ['mobile', 'tablet', 'desktop'].includes(b.device) ? b.device : 'desktop';
  const qids = pick.list.map((q: Any) => q.id);
  const src = isLoadTest(b) ? 'loadtest' : token(b.src || 'direct', 60);
  await sql`insert into attempts (id, attempt_no, total, question_ids, src, campaign, device)
            values (${id}, ${attemptNo}, ${qids.length}, ${qids}, ${src}, ${token(b.campaign || '', 80)}, ${device})`;
  return { attemptId: id, questions: pick.list, total: qids.length, set: pick.name };
}

async function actAnswer(b: Any) {
  const attemptId = String(b.attemptId || '');
  const qid = String(b.qid || '');
  if (!/^A-\d{6}-[A-Z0-9]{6}$/.test(attemptId)) throw new UserError('SESSION_EXPIRED', 'expired');
  const k = (await bank()).key[qid];
  if (!k) throw new UserError('This question was just updated. Please restart the quiz.', 'stale');
  const choice = clampInt(b.choice, 0, k.optionCount - 1, -1);
  if (choice < 0) throw new UserError('Please pick one of the options.');

  const [row] = await sql`select record_answer(${attemptId}, ${qid}, ${choice}, ${choice === k.correct ? 1 : 0}) as r`;
  const r = row?.r;
  if (!r) throw new UserError('SESSION_EXPIRED', 'expired');
  return {
    correct: r.correct === 1, chosenIndex: r.choice, correctIndex: k.correct, correctText: k.correctText,
    explanation: k.explanation, answered: Number(r.answered), total: r.total
  };
}

async function actFinish(b: Any) {
  const attemptId = String(b.attemptId || '');
  const [a] = await sql`select * from attempts where id = ${attemptId}`;
  if (!a) throw new UserError('SESSION_EXPIRED', 'expired');
  const missing = a.question_ids.filter((q: string) => !(q in a.answers));
  if (missing.length) return { incomplete: true, missing };

  let score = a.score;
  if (a.status !== 'Completed') {
    score = a.question_ids.reduce((s: number, q: string) => s + (Number(a.results[q]) === 1 ? 1 : 0), 0);
    await sql`update attempts set status = 'Completed', score = ${score}, completed_at = now() where id = ${attemptId} and status = 'Started'`;
  }
  const { key } = await bank();
  const recap = a.question_ids.map((q: string) => ({ topic: key[q]?.topic || q, correct: Number(a.results[q]) === 1 }));
  return { score, total: a.total, recap };
}

async function actLead(b: Any) {
  const c = await cfg();
  if (String(b.website || '').trim()) return { ok: true, leadId: '', leadKey: '', landingUrl: httpsOnly(c.landing_url) }; // honeypot

  // "Continue with Google": the email comes from the verified Google account, never from the form.
  let g: { id: string; email: string; name: string } | null = null;
  if (b.accessToken) {
    g = await googleUser(b.accessToken);
    if (!g) throw new UserError('Your Google sign-in expired. Please tap "Continue with Google" again, or continue without Google.', 'google_expired');
  }

  const errors: Record<string, string> = {};
  const name = cleanName(b.name) || (g ? g.name : '');
  if (truthy(c.require_name, true) && name.length < 2) errors.name = 'Please tell us your name.';
  const email = g ? g.email : normalizeEmail(b.email);
  if (!email) errors.email = 'Please check your email address.';
  const phone = normalizePhone(b.phone);
  if (!phone) errors.phone = PHONE_ERROR;
  let emailCheck = g ? 'ok' : 'unchecked';
  if (email && !g) {
    emailCheck = await checkEmailDomain(email);
    if (emailCheck === 'disposable') errors.email = 'Please use your own email address — temporary inboxes can\'t receive your certificate.';
    if (emailCheck === 'no_mail_server') errors.email = 'That email domain can\'t receive mail. Please check the spelling.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  let course = String(b.course || '').trim().slice(0, 60);
  if (course && !list(c.course_options).includes(course)) course = '';
  const marketing = b.marketing === true;
  const consentSource = ['Ticked by user', 'Pre-ticked, kept', 'Unticked by user', 'Not ticked'].includes(b.consentSource) ? b.consentSource : (marketing ? 'Ticked' : 'Not ticked');
  const attempt = await finishedAttempt(String(b.attemptId || ''));
  const verified = !!g;
  const provider = g ? 'google' : 'manual';

  const loadTest = isLoadTest(b);
  const saveLead = () => sql.begin(async (tx: Any) => {
    let [lead] = await tx`select * from leads where phone = ${phone} for update`;
    if (!lead) [lead] = await tx`select * from leads where email = ${email} order by created_at limit 1 for update`;

    if (!lead) {
      const id = 'L-' + randomId(8);
      [lead] = await tx`insert into leads ${tx({
        id, lead_key: randomId(24), name, email, phone, course,
        src: loadTest ? 'loadtest' : token(b.src || attempt?.src || 'direct', 60), campaign: token(b.campaign || attempt?.campaign || c.campaign_name || '', 80),
        marketing_consent: marketing, marketing_consent_at: marketing ? new Date() : null, consent_source: consentSource,
        email_check: emailCheck, name_original: name, email_original: email, phone_original: phone,
        lesson_wa: b.waLesson === true,
        verified, auth_provider: provider, auth_user_id: g ? g.id : '',
        email_status: verified ? 'Verified (Google)' : 'Not verified', email_verified_at: verified ? new Date() : null
      })} returning *`;
    } else {
      const sameOwner = String(b.leadKey || '') === lead.lead_key;
      const sameGoogle = !!g && lead.verified && lead.auth_provider === 'google' && lead.email === email;
      // A Google-verified entry can only be changed by its owner (same browser or same Google account).
      if (lead.verified && !sameOwner && !sameGoogle) {
        const field = lead.phone === phone ? 'phone' : 'email';
        return { conflict: field };
      }
      const upgrade = verified || lead.verified; // never downgrade a verified entry
      await tx`update leads set
          name  = ${name || lead.name},
          email = ${email},
          phone = ${phone},
          email_check = ${emailCheck},
          email_status = ${upgrade ? 'Verified (Google)' : (email !== lead.email ? 'Not verified' : lead.email_status)},
          email_verified_at = ${verified ? new Date() : (upgrade ? lead.email_verified_at : (email !== lead.email ? null : lead.email_verified_at))},
          verified = ${upgrade},
          auth_provider = ${verified ? 'google' : lead.auth_provider},
          auth_user_id = ${g ? g.id : lead.auth_user_id},
          course = ${course || lead.course},
          marketing_consent = ${marketing},
          consent_source = ${consentSource},
          marketing_consent_at = ${marketing !== lead.marketing_consent ? new Date() : lead.marketing_consent_at},
          lesson_wa = ${b.waLesson === true}
        where id = ${lead.id}`;
      [lead] = await tx`select * from leads where id = ${lead.id}`;
    }
    if (attempt) await linkAttempt(tx, lead, attempt);
    return lead;
  });

  // Two submissions with the same new number at the same instant: the second one hits the
  // unique index, then simply finds and updates the first one. No duplicate, no error.
  let leadRow: Any;
  try { leadRow = await saveLead(); } catch (e: Any) {
    if (e?.code !== '23505') throw e;
    leadRow = await saveLead();
  }
  if (leadRow?.conflict) {
    return { ok: false, errors: { [leadRow.conflict]: leadRow.conflict === 'phone'
      ? 'This mobile number is already registered with a Google account. Use "Continue with Google" with that same account.'
      : 'This email is already registered with Google. Use "Continue with Google" with that account.' } };
  }

  return {
    ok: true, leadId: leadRow.id, leadKey: leadRow.lead_key, landingUrl: httpsOnly(c.landing_url),
    contact: contactOf(leadRow), waQueued: false
  };
}

async function actLink(b: Any) {
  const lead = await ownedLead(b);
  const attempt = await finishedAttempt(String(b.attemptId || ''));
  if (!attempt) return { ok: false };
  await sql.begin((tx: Any) => linkAttempt(tx, lead, attempt));
  return { ok: true };
}

async function actOpened(b: Any) {
  const lead = await ownedLead(b);
  await sql`update leads set learning_access = 'Opened', lessons_opened_at = coalesce(lessons_opened_at, now()) where id = ${lead.id}`;
  return { ok: true };
}

/** Final check before the certificate. Any field may change; changed contacts lose "verified". */
async function actConfirm(b: Any) {
  const c = await cfg();
  const lead = await ownedLead(b);
  const errors: Record<string, string> = {};

  const name = certificateName(b.name);
  if (!name) errors.name = 'Use English letters for your name (2–60 characters), exactly as it should be printed.';
  // A Google-verified email is locked: it always stays the Google account's address.
  const email = lead.verified ? lead.email : normalizeEmail(b.email);
  if (!email) errors.email = 'Please check your email address.';
  const phone = normalizePhone(b.phone);
  if (!phone) errors.phone = PHONE_ERROR;
  let emailCheck = lead.email_check;
  if (email && email !== lead.email) {
    emailCheck = await checkEmailDomain(email);
    if (emailCheck === 'disposable') errors.email = 'Please use your own email address — temporary inboxes can\'t receive your certificate.';
    if (emailCheck === 'no_mail_server') errors.email = 'That email domain can\'t receive mail. Please check the spelling.';
  }
  if (phone && phone !== lead.phone) {
    const [other] = await sql`select id from leads where phone = ${phone} and id <> ${lead.id}`;
    if (other) errors.phone = 'This number is already linked to another entry. Please use your own number.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const emailChanged = email !== lead.email, phoneChanged = phone !== lead.phone, nameChanged = name !== lead.name;
  const edits = (emailChanged ? 1 : 0) + (phoneChanged ? 1 : 0) + (nameChanged ? 1 : 0);
  const [row] = await sql`update leads set
      name = ${name}, email = ${email}, phone = ${phone}, email_check = ${emailCheck},
      email_status = ${emailChanged ? 'Not verified' : lead.email_status},
      email_verified_at = ${emailChanged ? null : lead.email_verified_at},
      phone_status = ${phoneChanged ? 'Unverified' : lead.phone_status},
      phone_verified_at = ${phoneChanged ? null : lead.phone_verified_at},
      edit_count = edit_count + ${edits}
    where id = ${lead.id} returning *`;

  // A certificate already issued keeps its id; the name is refreshed after the next verification.
  return { ok: true, contact: contactOf(row), otp: otpTarget(c, row) };
}

async function actOtpSend(b: Any) {
  const c = await cfg();
  if (!otpEnabled(c)) throw new UserError('Verification codes are switched off — your certificate is created straight away.', 'otp_off');
  const lead = await ownedLead(b);
  if (!lead.latest_attempt_id) throw new UserError('Finish the quiz first to unlock your certificate.');
  const target = otpTarget(c, lead);

  // Limits: 45 s between codes, max 5 codes per hour per participant.
  const [recent] = await sql`select count(*)::int as n, max(created_at) as last from otp_codes where lead_id = ${lead.id} and created_at > now() - interval '1 hour'`;
  if (recent.n >= 5) throw new UserError('Too many codes requested. Please try again in an hour.', 'rate');
  if (recent.last && Date.now() - new Date(recent.last).getTime() < 45_000) {
    throw new UserError('Please wait a few seconds before asking for another code.', 'cooldown');
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
  await sql`update otp_codes set consumed_at = now() where lead_id = ${lead.id} and consumed_at is null`;
  await sql`insert into otp_codes (lead_id, channel, destination, code_hash, expires_at)
            values (${lead.id}, ${target.channel}, ${target.destination}, ${await hashCode(lead.id, code)}, now() + interval '10 minutes')`;

  if (lead.src === 'loadtest') {
    return { ok: true, channel: 'test', masked: target.masked, testCode: code, note: 'Load test — nothing sent.' };
  }

  let sent: { ok: boolean; info: string } = { ok: false, info: '' };
  if (target.channel === 'email') {
    sent = await sendEmail(lead, 'otp', `${code} is your ZICA Creative Quest code`, emailOtpHtml(c, lead.name, code));
  } else if (target.channel === 'whatsapp') {
    sent = await sendWhatsApp(c, lead, 'otp', c.wa_template_otp, { code });
  }

  if (!sent.ok) {
    if (truthy(env('ALLOW_TEST_OTP'))) {
      return { ok: true, channel: 'test', masked: target.masked, testCode: code, note: 'TEST MODE — code shown because no message provider is connected.' };
    }
    throw new UserError('We couldn\'t send your code right now. Please try again in a minute.', 'send_failed');
  }
  return { ok: true, channel: target.channel, masked: target.masked };
}

async function actOtpVerify(b: Any) {
  const c = await cfg();
  if (!otpEnabled(c)) throw new UserError('Verification codes are switched off — your certificate is created straight away.', 'otp_off');
  const lead = await ownedLead(b);
  const code = String(b.code || '').replace(/\D/g, '');
  if (code.length !== 6) throw new UserError('Enter the 6-digit code.', 'code');

  const [otp] = await sql`select * from otp_codes where lead_id = ${lead.id} order by created_at desc limit 1`;
  if (!otp) throw new UserError('That code has expired. Tap "Send a new code".', 'expired_code');
  const matches = (await hashCode(lead.id, code)) === otp.code_hash;
  if (otp.consumed_at) {
    // Same code, used seconds ago: a double tap (or two tabs). Hand back the same certificate.
    if (matches && Date.now() - new Date(otp.consumed_at).getTime() < 120_000) return await sameCertificate(c, lead, otp);
    throw new UserError('That code has expired. Tap "Send a new code".', 'expired_code');
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) throw new UserError('That code has expired. Tap "Send a new code".', 'expired_code');
  if (otp.tries >= 5) throw new UserError('Too many wrong tries. Tap "Send a new code".', 'locked');
  if (!matches) {
    await sql`update otp_codes set tries = tries + 1 where id = ${otp.id}`;
    throw new UserError(`That code doesn't match. ${Math.max(0, 4 - otp.tries)} tries left.`, 'wrong_code');
  }
  // The destination must still be the lead's current one (they may have edited after sending)
  const current = otp.channel === 'whatsapp' ? lead.phone : lead.email;
  if (otp.channel !== 'test' && otp.destination !== current) throw new UserError('Your details changed after the code was sent. Please send a new code.', 'stale_code');

  const [claimed] = await sql`update otp_codes set consumed_at = now() where id = ${otp.id} and consumed_at is null returning id`;
  if (!claimed) return await sameCertificate(c, lead, otp); // the other tap won the race
  if (otp.channel === 'whatsapp') {
    await sql`update leads set phone_status = 'Verified (WhatsApp code)', phone_verified_at = now() where id = ${lead.id}`;
  } else {
    await sql`update leads set email_status = ${otp.channel === 'email' && emailProvider() !== 'none' ? 'Verified (email code)' : 'Test code (not verified)'},
              email_verified_at = ${emailProvider() !== 'none' ? new Date() : null} where id = ${lead.id}`;
  }

  const [fresh] = await sql`select * from leads where id = ${lead.id}`;
  const cert = await issueCertificate(c, fresh, otp.channel === 'test' || emailProvider() === 'none' ? 'test' : otp.channel);

  // Deliver the link (only on channels that are switched on)
  const pageUrl = certPageUrl(c, cert, true);
  const pdfUrl = certPdfUrl(cert);
  const mail = fresh.src === 'loadtest' ? { ok: false, info: 'load test' } : await sendEmail(fresh, 'certificate', 'Your ZICA Creative Quest certificate', emailCertHtml(c, fresh.name, pageUrl, pdfUrl, cert.id));
  let wa = { ok: false, info: 'off' };
  if (fresh.src !== 'loadtest' && String(c.wa_provider || 'none') !== 'none' && c.wa_template_certificate) {
    wa = await sendWhatsApp(c, fresh, 'certificate', c.wa_template_certificate, { name: fresh.name, link: pageUrl });
  }
  await sql`update certificates set email_sent = ${mail.ok ? 'Sent' : 'Not sent'}, wa_sent = ${wa.ok ? 'Sent' : (wa.info === 'off' ? 'Off' : 'Failed')} where id = ${cert.id}`;

  return {
    ok: true,
    certificate: { id: cert.id, name: cert.name, issuedAt: fmtDateLong(cert.issued_at), pageUrl, pdfUrl, score: cert.score, total: cert.total },
    emailed: mail.ok, whatsapped: wa.ok, masked: maskEmail(fresh.email)
  };
}

/** Certificate straight after the details check (no code step). Safe to repeat: one certificate per student. */
async function actCertIssue(b: Any) {
  const c = await cfg();
  if (otpEnabled(c)) throw new UserError('Please verify with the code first.', 'otp_required');
  if (!truthy(c.cert_enabled, true)) throw new UserError('Certificates are switched off right now.', 'cert_off');
  const lead = await ownedLead(b);
  if (!lead.latest_attempt_id) throw new UserError('Finish the quiz first to unlock your certificate.');
  if (!certificateName(lead.name)) throw new UserError('Please check the name on your certificate.', 'name');
  const cert = await issueCertificate(c, lead, lead.verified ? lead.auth_provider || 'google' : 'unverified');
  const pageUrl = certPageUrl(c, cert, true);
  const pdfUrl = certPdfUrl(cert);
  // Email copy only once an email provider is connected (Brevo); nothing is logged otherwise.
  let mail = { ok: false, info: 'off' };
  if (lead.src !== 'loadtest' && emailProvider() !== 'none' && c.email_from_address) {
    mail = await sendEmail(lead, 'certificate', 'Your ZICA Creative Quest certificate', emailCertHtml(c, lead.name, pageUrl, pdfUrl, cert.id));
    await sql`update certificates set email_sent = ${mail.ok ? 'Sent' : 'Not sent'} where id = ${cert.id}`;
  }
  return {
    ok: true,
    certificate: { id: cert.id, name: cert.name, issuedAt: fmtDateLong(cert.issued_at), pageUrl, pdfUrl, score: cert.score, total: cert.total },
    emailed: mail.ok, whatsapped: false, masked: maskEmail(lead.email)
  };
}

/** A double tap: the other request already used this code and is creating the certificate.
 *  Wait for it (up to ~4 s) and return the same certificate. */
async function sameCertificate(c: Record<string, string>, lead: Any, otp: Any) {
  let made: Any = null;
  for (let i = 0; i < 16 && !made; i++) {
    [made] = await sql`select * from certificates where lead_id = ${lead.id} and updated_at >= ${otp.created_at}`;
    if (!made) await new Promise((r) => setTimeout(r, 250));
  }
  if (!made) throw new UserError('That code was already used. Tap "Send a new code".', 'used_code');
  return {
    ok: true,
    certificate: { id: made.id, name: made.name, issuedAt: fmtDateLong(made.issued_at), pageUrl: certPageUrl(c, made, true), pdfUrl: certPdfUrl(made), score: made.score, total: made.total },
    emailed: made.email_sent === 'Sent', whatsapped: made.wa_sent === 'Sent', masked: maskEmail(lead.email)
  };
}

async function actCert(b: Any) {
  const id = String(b.id || '').toUpperCase();
  if (!/^ZCQ\d{2}-[A-Z0-9]{6}$/.test(id)) return { valid: false };
  const [r] = await sql`select * from certificates where id = ${id}`;
  if (!r || r.revoked) return { valid: false, revoked: !!r?.revoked };
  const c = await cfg();
  const withKey = String(b.k || '') === r.download_key;
  return {
    valid: true, id: r.id, name: r.name, issuedAt: fmtDateLong(r.issued_at),
    score: r.score, total: r.total, cert: certPublicConfig(c),
    pdfUrl: withKey ? certPdfUrl(r) : '', verifiedVia: r.verified_via === 'test' ? 'test' : 'verified'
  };
}

// ============================================================ ADMIN (Sheets)

function requireToken(t: unknown) {
  const want = env('SYNC_TOKEN');
  if (!want || want.length < 16 || String(t || '') !== want) throw new UserError('Not allowed', 'auth');
}

async function actAdminExport(b: Any) {
  requireToken(b.token);
  const since = b.since && !isNaN(Date.parse(b.since)) ? new Date(b.since) : new Date(0);
  const [{ t: now }] = await sql`select clock_timestamp() as t`; // database clock, not the function's
  const lim = 3000;
  // Load-test rows (src = 'loadtest') never reach the Sheet.
  const leads = await sql`select * from leads where updated_at > ${since} and updated_at <= ${now} and src <> 'loadtest' order by updated_at limit ${lim}`;
  const attempts = await sql`select * from attempts where updated_at > ${since} and updated_at <= ${now} and src <> 'loadtest' order by updated_at limit ${lim}`;
  const certs = await sql`select c.* from certificates c join leads l on l.id = c.lead_id
                          where c.updated_at > ${since} and c.updated_at <= ${now} and l.src <> 'loadtest' order by c.updated_at limit ${lim}`;
  const msgs = await sql`select m.* from message_log m left join leads l on l.id = m.lead_id
                         where m.updated_at > ${since} and m.updated_at <= ${now} and coalesce(l.src, '') <> 'loadtest' order by m.updated_at limit ${lim}`;
  const c = await cfg();
  const more = [leads, attempts, certs, msgs].some((r) => r.length === lim);
  // If a table hit the limit, only advance the cursor to the oldest "last row" so nothing is skipped.
  const cursor = more
    ? [leads, attempts, certs, msgs].filter((r) => r.length === lim).map((r) => new Date(r[r.length - 1].updated_at)).sort((a, b) => +a - +b)[0]
    : new Date(now);

  return {
    cursor: cursor.toISOString(), more,
    leads: leads.map((l: Any) => ({
      'Lead ID': l.id, 'Created': ist(l.created_at), 'Updated': ist(l.updated_at), 'Name': l.name, 'Email': l.email, 'WhatsApp': l.phone,
      'Course Interest': l.course, 'Source': l.src, 'Campaign': l.campaign, 'Quiz Status': l.quiz_status,
      'Latest Score': l.latest_score, 'Best Score': l.best_score, 'Total Questions': l.total_questions, 'Attempts': l.attempts,
      'Marketing Consent': l.marketing_consent ? 'Yes' : 'No', 'Marketing Consent At': ist(l.marketing_consent_at), 'Consent Source': l.consent_source,
      'Email Check': l.email_check, 'Email Status': l.email_status, 'Phone Status': l.phone_status,
      'Learning Access': l.learning_access, 'Lessons Opened At': ist(l.lessons_opened_at),
      'Name (first typed)': l.name_original, 'Email (first typed)': l.email_original, 'WhatsApp (first typed)': l.phone_original, 'Edits': l.edit_count,
      'Verified': l.verified ? 'TRUE' : 'FALSE', 'Auth Provider': l.auth_provider
    })),
    attempts: attempts.map((a: Any) => ({
      'Attempt ID': a.id, 'Lead ID': a.lead_id || '', 'Started': ist(a.started_at), 'Completed': ist(a.completed_at), 'Status': a.status,
      'Attempt No': a.attempt_no, 'Question Set': (a.question_ids[0] || '').charAt(0), 'Score': a.score ?? '', 'Total': a.total,
      'Answers': a.question_ids.map((q: string) => q + ':' + (q in a.answers ? 'ABCD'[a.answers[q]] : '-')).join(' | '),
      'Result': a.question_ids.map((q: string) => (q in a.results ? (Number(a.results[q]) ? '✓' : '✗') : '·')).join(''),
      'Source': a.src, 'Campaign': a.campaign, 'Device': a.device
    })),
    certificates: certs.map((x: Any) => ({
      'Certificate ID': x.id, 'Lead ID': x.lead_id, 'Name on Certificate': x.name, 'Issued': ist(x.issued_at), 'Updated': ist(x.updated_at),
      'Score': x.score ?? '', 'Total': x.total ?? '', 'Verified Via': x.verified_via, 'Email Sent': x.email_sent, 'WhatsApp Sent': x.wa_sent,
      'Downloads': x.downloads, 'Revoked': x.revoked ? 'Yes' : 'No', 'Certificate Page': certPageUrl(c, x, true)
    })),
    messages: msgs.map((m: Any) => ({
      'Log ID': String(m.id), 'Created': ist(m.created_at), 'Updated': ist(m.updated_at), 'Lead ID': m.lead_id || '', 'Channel': m.channel,
      'Category': m.category, 'Provider': m.provider, 'To': m.to_masked, 'Status': m.status, 'Provider Ref': m.provider_ref,
      'Delivery': m.delivery_status, 'Info': m.info
    }))
  };
}

async function actAdminPush(b: Any) {
  requireToken(b.token);
  let q = 0, s = 0;
  if (Array.isArray(b.questions)) {
    const ids: string[] = [];
    for (const r of b.questions) {
      const id = String(r.id || '').trim();
      if (!id || !r.question) continue;
      ids.push(id);
      const row = {
        id, sort: clampInt(r.sort, 0, 9999, 999), active: truthy(r.active, false), category: String(r.category || ''),
        type: String(r.type || 'concept'), topic: String(r.topic || ''), question: String(r.question),
        option_a: String(r.option_a || ''), option_b: String(r.option_b || ''), option_c: String(r.option_c || ''), option_d: String(r.option_d || ''),
        correct: 'ABCD'.includes(String(r.correct || '').toUpperCase()) && String(r.correct).length === 1 ? String(r.correct).toUpperCase() : 'A',
        explanation: String(r.explanation || ''), asset: String(r.asset || ''), asset_alt: String(r.asset_alt || ''),
        set_name: /^[A-Z]$/.test(String(r.set_name || '').trim().toUpperCase()) ? String(r.set_name).trim().toUpperCase() : 'A'
      };
      await sql`insert into questions ${sql(row)} on conflict (id) do update set ${sql(row, Object.keys(row).filter((k) => k !== 'id') as Any)}`;
      q++;
    }
    if (ids.length) await sql`update questions set active = false where not (id = any(${ids}))`;
  }
  if (Array.isArray(b.settings)) {
    for (const r of b.settings) {
      const key = String(r.key || '').trim();
      if (!key) continue;
      await sql`insert into settings (key, value, notes) values (${key}, ${String(r.value ?? '')}, ${String(r.notes ?? '')})
                on conflict (key) do update set value = excluded.value, notes = excluded.notes`;
      s++;
    }
  }
  cfgCache = null; bankCache = null;
  return { ok: true, questions: q, settings: s };
}

async function actAdminPull(b: Any) { // used by SheetsSync.gs → pullQuestionsAndSettings()
  requireToken(b.token);
  return { questions: await sql`select * from questions order by set_name, sort, id`, settings: await sql`select key, value, notes from settings order by key` };
}
ACTIONS.admin_pull = actAdminPull;

async function actAdminPurgeLoadtest(b: Any) { // used by tools/loadtest.mjs after a run
  requireLtToken(b.token);
  const leads = await sql`delete from leads where src = 'loadtest' returning id`; // cascades to otp_codes + certificates
  const att = await sql`delete from attempts where src = 'loadtest' returning id`;
  const ids = leads.map((r: Any) => r.id);
  if (ids.length) await sql`delete from message_log where lead_id = any(${ids})`;
  return { ok: true, leads: leads.length, attempts: att.length };
}
ACTIONS.admin_purge_loadtest = actAdminPurgeLoadtest;

async function actAdminLoadtestReport(b: Any) { // used by tools/loadtest.mjs to prove nothing was lost or doubled
  requireLtToken(b.token);
  const [r] = await sql`select
      (select count(*)::int from attempts where src = 'loadtest') as attempts,
      (select count(*)::int from attempts where src = 'loadtest' and status = 'Completed') as completed,
      (select count(*)::int from attempts where src = 'loadtest' and (select count(*) from jsonb_object_keys(answers)) <> total) as incomplete_answers,
      (select count(*)::int from attempts where src = 'loadtest' and status = 'Completed' and score is distinct from
          (select count(*) from jsonb_each_text(results) where value = '1')) as score_mismatch,
      (select count(*)::int from leads where src = 'loadtest') as leads,
      (select count(*)::int from (select phone from leads group by phone having count(*) > 1) d) as duplicate_phones,
      (select count(*)::int from attempts a join leads l on l.id = a.lead_id where l.src = 'loadtest') as linked_attempts,
      (select count(*)::int from certificates c join leads l on l.id = c.lead_id where l.src = 'loadtest') as certificates`;
  return r;
}
ACTIONS.admin_loadtest_report = actAdminLoadtestReport;

async function actAdminLoadtestNote(b: Any) { // tools/loadtest.mjs saves its printed summary (private.loadtest_runs)
  requireLtToken(b.token);
  await sql`insert into private.loadtest_runs (pass, summary) values (${b.pass === true}, ${String(b.summary || '').slice(0, 20000)})`;
  return { ok: true };
}
ACTIONS.admin_loadtest_note = actAdminLoadtestNote;

// ============================================================ LEAD HELPERS

async function ownedLead(b: Any) {
  const id = String(b.leadId || ''), k = String(b.leadKey || '');
  if (!/^L-[A-Z0-9]{8}$/.test(id) || k.length < 20) throw new UserError('Please enter your details again.', 'no_lead');
  const [lead] = await sql`select * from leads where id = ${id}`;
  if (!lead || lead.lead_key !== k) throw new UserError('Please enter your details again.', 'no_lead');
  return lead;
}

async function finishedAttempt(id: string) {
  if (!/^A-\d{6}-[A-Z0-9]{6}$/.test(id)) return null;
  const [a] = await sql`select * from attempts where id = ${id}`;
  return a && a.status === 'Completed' ? a : null;
}

async function linkAttempt(tx: Any, lead: Any, attempt: Any) {
  // Conditional update: a repeated or simultaneous link of the same attempt counts once.
  const [moved] = await tx`update attempts set lead_id = ${lead.id} where id = ${attempt.id} and lead_id is distinct from ${lead.id} returning id`;
  if (!moved) return;
  const best = lead.best_score == null ? attempt.score : Math.max(lead.best_score, attempt.score);
  await tx`update leads set latest_attempt_id = ${attempt.id}, quiz_status = 'Completed', latest_score = ${attempt.score},
           best_score = ${best}, total_questions = ${attempt.total}, attempts = attempts + 1 where id = ${lead.id}`;
}

function contactOf(l: Any) {
  const national = String(l.phone || '').replace(/^\+91/, '');
  return {
    name: l.name, email: l.email, phone: l.phone, countryCode: '91', national,
    emailVerified: !!l.verified, phoneVerified: !!l.phone_verified_at, verified: !!l.verified, provider: l.auth_provider || 'manual'
  };
}

function otpChannelFor(c: Record<string, string>) {
  const wanted = c.otp_channel === 'whatsapp' ? 'whatsapp' : 'email';
  if (wanted === 'whatsapp' && String(c.wa_provider || 'none') !== 'none' && c.wa_template_otp) return 'whatsapp';
  return 'email';
}
function otpTarget(c: Record<string, string>, l: Any) {
  const channel = otpChannelFor(c);
  return channel === 'whatsapp'
    ? { channel, destination: l.phone, masked: maskPhone(l.phone) }
    : { channel, destination: l.email, masked: maskEmail(l.email) };
}

// ============================================================ CERTIFICATES

async function issueCertificate(c: Record<string, string>, lead: Any, via: string) {
  const score = lead.best_score, total = lead.total_questions;
  // One certificate per participant: re-verifying refreshes the name/score but keeps the same ID.
  for (let i = 0; i < 5; i++) {
    const id = 'ZCQ' + String(new Date().getUTCFullYear()).slice(2) + '-' + randomId(6);
    try {
      const [r] = await sql`insert into certificates (id, download_key, lead_id, attempt_id, name, score, total, verified_via)
                            values (${id}, ${randomId(20)}, ${lead.id}, ${lead.latest_attempt_id}, ${lead.name}, ${score}, ${total}, ${via})
                            on conflict (lead_id) do update set name = excluded.name, score = excluded.score, total = excluded.total,
                              attempt_id = excluded.attempt_id, verified_via = excluded.verified_via, revoked = false
                            returning *`;
      return r;
    } catch (e: Any) { if (e?.code !== '23505' || i === 4) throw e; } // id collision → new id
  }
  throw new Error('unreachable');
}

function functionUrl() {
  const base = env('SUPABASE_URL').replace(/\/+$/, '');
  return env('QUEST_FUNCTION_URL') || (base + '/functions/v1/quest');
}
const REGION = 'ap-south-1'; // same region as the database (Mumbai); also set in config.js FUNCTION_REGION
function certPdfUrl(cert: Any) { return `${functionUrl()}?action=pdf&id=${cert.id}&k=${cert.download_key}&forceFunctionRegion=${REGION}`; }
function certPageUrl(c: Record<string, string>, cert: Any, withKey: boolean) {
  const base = siteUrl(c);
  return `${base}/certificate.html?id=${cert.id}${withKey ? '&k=' + cert.download_key : ''}`;
}

async function downloadPdf(p: URLSearchParams) {
  const id = String(p.get('id') || '').toUpperCase();
  const [cert] = /^ZCQ\d{2}-[A-Z0-9]{6}$/.test(id) ? await sql`select * from certificates where id = ${id}` : [];
  if (!cert || cert.download_key !== p.get('k') || cert.revoked) {
    return new Response('Certificate not found.', { status: 404, headers: { ...CORS, 'content-type': 'text/plain' } });
  }
  const c = await cfg();
  const bytes = await buildCertificatePdf(c, cert);
  sql`update certificates set downloads = downloads + 1 where id = ${cert.id}`.catch(() => {});
  const file = 'ZICA-Creative-Quest-Certificate-' + cert.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
  const inline = p.get('view') === '1';
  return new Response(bytes as Any, {
    headers: {
      ...CORS, 'content-type': 'application/pdf',
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${file}"`,
      'cache-control': 'private, max-age=300'
    }
  });
}

// ---- PDF libraries: loaded only when a certificate PDF is built (keeps every other request light) ----
type PdfLibs = { lib: typeof import('npm:pdf-lib@1.17.1'); fontkit: Any; qrcode: Any };
let pdfLibs: Promise<PdfLibs> | null = null;
function loadPdfLibs(): Promise<PdfLibs> {
  if (!pdfLibs) {
    pdfLibs = Promise.all([import('npm:pdf-lib@1.17.1'), import('npm:@pdf-lib/fontkit@1.1.1'), import('npm:qrcode-generator@1.4.4')])
      .then(([lib, fk, qr]: Any[]) => ({ lib, fontkit: fk.default ?? fk, qrcode: qr.default ?? qr }));
    pdfLibs.catch(() => { pdfLibs = null; });
  }
  return pdfLibs;
}
let P: PdfLibs['lib'];

// ---- asset loading (cached per function instance) ----
const assetCache = new Map<string, Uint8Array | null>();
async function loadAsset(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  if (assetCache.has(url)) return assetCache.get(url)!;
  let out: Uint8Array | null = null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (r.ok) out = new Uint8Array(await r.arrayBuffer());
  } catch (_) { out = null; }
  assetCache.set(url, out);
  if (!out) setTimeout(() => assetCache.delete(url), 60_000); // retry missing assets after a minute
  return out;
}
async function embedImage(doc: PDFDocument, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes || bytes.length < 8) return null;
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
  } catch (_) { /* unsupported image → skip */ }
  return null;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return P.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/**
 * A4 landscape, 842 × 595 pt. Every word on the certificate is drawn here (never baked
 * into the background art), so the name, date and ID are always exactly right.
 * Layout zones match certificate.js on the site, so the on-screen preview = the PDF.
 */
async function buildCertificatePdf(c: Record<string, string>, cert: Any): Promise<Uint8Array> {
  const libs = await loadPdfLibs();
  P = libs.lib;
  const W = 842, H = 595;
  const conf = certPublicConfig(c);
  const dark = conf.theme === 'dark';
  // ZICA Pune "viewport" palette: graphite, keyframe amber, selection orange, active cyan
  const ink = dark ? hex('#ECEEF4') : hex('#0D0E13');
  const soft = dark ? hex('#A9AEC2') : hex('#4A4F66');
  const gold = dark ? hex('#FFB547') : hex('#B85C00');
  const accent = dark ? hex('#5CE1E6') : hex('#0E8C92');

  const { StandardFonts } = P;
  const doc = await P.PDFDocument.create();
  doc.registerFontkit(libs.fontkit);
  doc.setTitle(`${conf.title} — ${cert.name}`);
  doc.setAuthor(c.institute_name || 'ZICA Pune');
  doc.setSubject('ZICA Creative Quest');
  const page = doc.addPage([W, H]);

  // Fonts: Montserrat from the site, Helvetica as an always-available fallback
  const [fx, fb, fs, fr] = await Promise.all(
    ['ExtraBold', 'Bold', 'SemiBold', 'Regular'].map((w) => loadAsset(absUrl(c, `assets/fonts/Montserrat-${w}.ttf`))));
  const safeFont = async (bytes: Uint8Array | null, fallback: (typeof StandardFonts)[keyof typeof StandardFonts]) => {
    if (bytes) { try { return await doc.embedFont(bytes, { subset: true }); } catch (_) { /* fall through */ } }
    return await doc.embedFont(fallback);
  };
  const fontX = await safeFont(fx, StandardFonts.HelveticaBold);
  const fontB = await safeFont(fb, StandardFonts.HelveticaBold);
  const fontS = await safeFont(fs, StandardFonts.Helvetica);
  const fontR = await safeFont(fr, StandardFonts.Helvetica);

  // Logos: ZICA top-left, partner logo (ZEE Learn) top-right
  const [logoBytes, logo2Bytes, bgBytes] = await Promise.all([conf.logoUrl, conf.logo2Url, conf.bgUrl].map((u) => loadAsset(absUrl(c, u))));
  const logo = await embedImage(doc, logoBytes);
  const logo2 = await embedImage(doc, logo2Bytes);

  // Background art (or the built-in design)
  const bg = await embedImage(doc, bgBytes);
  if (bg) {
    // "cover" fit: fills the page without stretching; any overflow is trimmed at the page edge
    const k = Math.max(W / bg.width, H / bg.height);
    const bw = bg.width * k, bh = bg.height * k;
    page.drawImage(bg, { x: (W - bw) / 2, y: (H - bh) / 2, width: bw, height: bh });
  }
  else drawBuiltInBackground(page, W, H, dark, !logo2);

  const center = (text: string, font: PDFFont, size: number, y: number, color: RGB, spacing = 0) => {
    const w = font.widthOfTextAtSize(text, size) + spacing * (text.length - 1);
    if (!spacing) page.drawText(text, { x: (W - w) / 2, y, size, font, color });
    else {
      let x = (W - w) / 2;
      for (const ch of text) { page.drawText(ch, { x, y, size, font, color }); x += font.widthOfTextAtSize(ch, size) + spacing; }
    }
  };

  // Logo top-left (otherwise institute name as text); partner logo top-right
  if (logo) {
    const { w, h } = fitBox(logo, 230, 72);
    page.drawImage(logo, { x: 58, y: H - 50 - h, width: w, height: h });
  } else {
    page.drawText(stripForFont(c.institute_name || 'ZICA Pune', fontB), { x: 58, y: H - 76, size: 15, font: fontB, color: ink });
  }
  if (logo2) {
    const { w, h } = fitBox(logo2, 150, 56);
    page.drawImage(logo2, { x: W - 58 - w, y: H - 50 - h, width: w, height: h });
  }

  // Title block
  center(stripForFont(conf.title || 'Certificate of Completion', fontX).toUpperCase(), fontX, 30, 430, ink, 1.2);
  center(stripForFont(conf.presented || '', fontS), fontS, 13, 392, soft);

  // Name — auto-fit to the width
  const name = stripForFont(cert.name, fontX);
  let size = 46;
  while (size > 20 && fontX.widthOfTextAtSize(name, size) > 600) size -= 1;
  center(name, fontX, size, 330, gold);
  page.drawLine({ start: { x: W / 2 - 230, y: 314 }, end: { x: W / 2 + 230, y: 314 }, thickness: 1.2, color: gold, opacity: 0.8 });

  // Body paragraph
  const lines = wrap(stripForFont(conf.body || '', fontR), fontR, 12.5, 560);
  lines.slice(0, 3).forEach((ln, i) => center(ln, fontR, 12.5, 284 - i * 18, soft));
  if (conf.showScore && cert.score != null && cert.total) {
    center(`Quest score: ${cert.score} / ${cert.total}`, fontS, 12, 284 - Math.min(3, lines.length) * 18 - 6, accent);
  }

  // Bottom-left: date + ID
  page.drawText('DATE OF ISSUE', { x: 70, y: 112, size: 8, font: fontS, color: soft });
  page.drawText(fmtDateLong(cert.issued_at), { x: 70, y: 96, size: 12, font: fontB, color: ink });
  page.drawText('CERTIFICATE ID', { x: 70, y: 76, size: 8, font: fontS, color: soft });
  page.drawText(cert.id, { x: 70, y: 61, size: 11, font: fontB, color: ink });

  // Bottom-centre: signature
  const sig = await embedImage(doc, await loadAsset(absUrl(c, conf.signatureUrl)));
  if (sig) {
    const { w, h } = fitBox(sig, 210, 62);
    page.drawImage(sig, { x: W / 2 - w / 2, y: 100, width: w, height: h }); // sits just above the line
  }
  page.drawLine({ start: { x: W / 2 - 95, y: 96 }, end: { x: W / 2 + 95, y: 96 }, thickness: 0.8, color: soft });
  center(stripForFont(conf.signatoryName || '', fontB), fontB, 12.5, 80, ink);
  center(stripForFont([conf.signatoryTitle, conf.instituteLine].filter(Boolean).join(', '), fontR), fontR, 9.5, 66, soft);

  // Bottom-right: QR to the public verification page
  const verifyUrl = certPageUrl(c, cert, false);
  if (siteUrl(c)) drawQr(libs.qrcode, page, verifyUrl, W - 70 - 66, 56, 66, dark);
  const vtxt = 'Scan to verify';
  page.drawText(vtxt, { x: W - 70 - 33 - fontS.widthOfTextAtSize(vtxt, 7.5) / 2, y: 44, size: 7.5, font: fontS, color: soft });

  return await doc.save();
}

function fitBox(img: PDFImage, maxW: number, maxH: number) {
  const r = img.width / img.height;
  let h = maxH, w = h * r;
  if (w > maxW) { w = maxW; h = w / r; }
  return { w, h };
}

function drawBuiltInBackground(page: Any, W: number, H: number, dark: boolean, rings = true) {
  const line = dark ? hex('#2B2F42') : hex('#D9DCE6');
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark ? hex('#0D0E13') : hex('#FAF8F3') });
  // Top strip: active cyan · selection orange · keyframe amber (the deck's colours)
  page.drawRectangle({ x: 0, y: H - 9, width: W * 0.34, height: 9, color: hex('#5CE1E6') });
  page.drawRectangle({ x: W * 0.34, y: H - 9, width: W * 0.38, height: 9, color: hex('#FF7A1A') });
  page.drawRectangle({ x: W * 0.72, y: H - 9, width: W * 0.28, height: 9, color: hex('#FFB547') });
  // Frames
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 57, borderColor: dark ? hex('#FFB547') : hex('#0D0E13'), borderWidth: 1.3, opacity: 0 });
  page.drawRectangle({ x: 31, y: 31, width: W - 62, height: H - 71, borderColor: dark ? hex('#2B2F42') : hex('#E0A458'), borderWidth: 0.6, opacity: 0 });
  // Viewport corner: faint floor grid lines + orbit rings (top right)
  if (rings) { // (the partner logo sits in this corner when there is one)
    for (let i = 0; i < 6; i++) {
      page.drawLine({ start: { x: W - 210 + i * 30, y: H - 40 }, end: { x: W - 40, y: H - 210 + i * 30 }, thickness: 0.4, color: line, opacity: 0.9 });
    }
    page.drawCircle({ x: W - 96, y: H - 104, size: 44, borderColor: hex('#5CE1E6'), borderWidth: 1, opacity: 0, borderOpacity: 0.55 });
    page.drawCircle({ x: W - 96, y: H - 104, size: 28, borderColor: hex('#FF7A1A'), borderWidth: 1, opacity: 0, borderOpacity: 0.55 });
  }
  // Bottom: an animation timeline with keyframe diamonds
  const ty = 40;
  page.drawLine({ start: { x: 220, y: ty }, end: { x: W - 220, y: ty }, thickness: 0.8, color: line });
  for (let i = 0; i <= 12; i++) {
    const x = 220 + i * ((W - 440) / 12);
    page.drawLine({ start: { x, y: ty - 3 }, end: { x, y: ty + 3 }, thickness: 0.6, color: line });
  }
  [0, 3, 7, 12].forEach((k) => {
    const x = 220 + k * ((W - 440) / 12);
    page.drawRectangle({ x: x - 3, y: ty - 3, width: 6, height: 6, rotate: P.degrees(45), color: hex('#FFB547') });
  });
}

function drawQr(qrcode: Any, page: Any, text: string, x: number, y: number, size: number, dark: boolean) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const pad = 4;
  page.drawRectangle({ x: x - pad, y: y - pad, width: size + pad * 2, height: size + pad * 2, color: hex('#FFFFFF'), borderColor: dark ? hex('#FFB547') : hex('#D9DCE6'), borderWidth: 0.6 });
  const m = size / n;
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) {
    if (qr.isDark(r, col)) page.drawRectangle({ x: x + col * m, y: y + size - (r + 1) * m, width: m + 0.05, height: m + 0.05, color: hex('#0D0E13') });
  }
}

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const t = line ? line + ' ' + word : word;
    if (font.widthOfTextAtSize(t, size) <= max) line = t;
    else { if (line) out.push(line); line = word; }
  }
  if (line) out.push(line);
  return out;
}

/** Drop or swap any character the font can't draw, so PDF generation can never fail on text. */
const SWAP: Record<string, string> = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '·': '-', '…': '...' };
function stripForFont(s: string, font: PDFFont) {
  let out = '';
  for (const ch of String(s || '')) {
    if (canDraw(font, ch)) out += ch;
    else if (SWAP[ch] && canDraw(font, SWAP[ch])) out += SWAP[ch];
  }
  return out;
}
function canDraw(font: PDFFont, ch: string) {
  try {
    font.encodeText(ch);
    // Custom (embedded) fonts don't throw for missing glyphs; check the glyph exists instead.
    const f: Any = (font as Any).embedder?.font;
    if (f && typeof f.hasGlyphForCodePoint === 'function') return f.hasGlyphForCodePoint(ch.codePointAt(0));
    return true;
  } catch (_) { return false; }
}

// ============================================================ VALIDATION

function cleanName(v: unknown) {
  return String(v || '').replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Certificate-safe name: Latin letters (incl. accents), space . ' -  · 2–60 chars · tidy capitals. */
function certificateName(v: unknown) {
  let n = cleanName(v).replace(/[‘’`]/g, "'");
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$/.test(n)) return '';
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(n)) return '';
  // Only fix capitals when the whole name was typed in one case ("riya sharma" / "RIYA SHARMA")
  if (n === n.toLowerCase() || n === n.toUpperCase()) {
    n = n.toLowerCase().replace(/(^|[\s'-])([a-zà-öø-ÿ])/g, (_m, p, ch) => p + ch.toUpperCase());
  }
  return n;
}

function normalizeEmail(raw: unknown) {
  const e = String(raw || '').trim().toLowerCase();
  if (e.length > 254) return '';
  return /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e) && !e.includes('..') ? e : '';
}

/** Indian mobile only: strip spaces, dashes, brackets and a leading +91 / 91 / 0;
 *  then exactly 10 digits starting 6, 7, 8 or 9. Stored as +91XXXXXXXXXX. */
const PHONE_ERROR = 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.';
function normalizePhone(raw: unknown) {
  let d = String(raw || '').trim().replace(/[\s\-().]/g, '');
  if (d.startsWith('+91')) d = d.slice(3);
  else if (d.startsWith('0091')) d = d.slice(4);
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? '+91' + d : '';
}

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com', '10minutemail.com', 'temp-mail.org',
  'tempmail.com', 'tempmail.net', 'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc',
  'mintemail.com', 'throwawaymail.com', 'fakeinbox.com', 'mailnesia.com', 'mohmal.com', 'emailondeck.com',
  'tempinbox.com', 'spamgourmet.com', 'mailcatch.com', 'moakt.com', 'tempr.email', 'discard.email', 'burnermail.io',
  'example.com', 'example.org', 'test.com'
]);

/** 'ok' | 'disposable' | 'no_mail_server' | 'unchecked' (lookup failed → don't block) */
async function checkEmailDomain(email: string) {
  const domain = email.split('@')[1] || '';
  if (DISPOSABLE.has(domain)) return 'disposable';
  if (['gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'rediffmail.com', 'proton.me', 'protonmail.com'].includes(domain)) return 'ok';
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(2500)
    });
    if (!r.ok) return 'unchecked';
    const j = await r.json();
    if (j.Status === 3) return 'no_mail_server'; // NXDOMAIN — domain doesn't exist
    if (Array.isArray(j.Answer) && j.Answer.some((a: Any) => a.type === 15)) return 'ok';
    // No MX: mail can still go to the A record, so only block when there's no A record either
    const a = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(2500)
    }).then((x) => x.json()).catch(() => null);
    if (a && Array.isArray(a.Answer) && a.Answer.length) return 'ok';
    return a ? 'no_mail_server' : 'unchecked';
  } catch (_) { return 'unchecked'; }
}

// ============================================================ MESSAGING

async function logMessage(leadId: string, channel: string, category: string, provider: string, to: string, status: string, ref = '', info = '') {
  await sql`insert into message_log (lead_id, channel, category, provider, to_masked, status, provider_ref, info)
            values (${leadId}, ${channel}, ${category}, ${provider}, ${to}, ${status}, ${ref}, ${info.slice(0, 400)})`;
}

/** EMAIL — Brevo transactional API (active as soon as BREVO_API_KEY + email_from_address are set). */
async function sendEmail(lead: Any, category: string, subject: string, html: string) {
  const c = await cfg();
  const key = env('BREVO_API_KEY');
  if (!key || !c.email_from_address) {
    await logMessage(lead.id, 'email', category, 'none', maskEmail(lead.email), 'SKIPPED', '', !key ? 'BREVO_API_KEY not set' : 'email_from_address not set');
    return { ok: false, info: 'email not configured' };
  }
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: c.email_from_name || 'ZICA Pune', email: c.email_from_address },
        to: [{ email: lead.email, name: lead.name || undefined }],
        replyTo: c.email_reply_to ? { email: c.email_reply_to } : undefined,
        subject, htmlContent: html, tags: ['creative-quest', category]
      }),
      signal: AbortSignal.timeout(10000)
    });
    const body = await r.text();
    let ref = '';
    try { ref = JSON.parse(body).messageId || ''; } catch (_) { /* ignore */ }
    await logMessage(lead.id, 'email', category, 'brevo', maskEmail(lead.email), r.ok ? 'ACCEPTED' : 'FAILED', ref, r.ok ? 'HTTP ' + r.status : 'HTTP ' + r.status + ' ' + body);
    return { ok: r.ok, info: 'HTTP ' + r.status };
  } catch (e) {
    await logMessage(lead.id, 'email', category, 'brevo', maskEmail(lead.email), 'FAILED', '', String(e));
    return { ok: false, info: String(e) };
  }
}

/* -------------------------------------------------------------------------
 * WHATSAPP — DORMANT. Nothing here runs while settings.wa_provider = 'none'.
 *
 * To switch on later:
 *   1. Settings: wa_provider = 'brevo' or 'webhook'
 *                wa_template_otp = your approved AUTHENTICATION template (name or numeric Brevo id)
 *                wa_template_certificate = your approved UTILITY template
 *                otp_channel = 'whatsapp'   (OTP moves from email to WhatsApp; email stays as fallback)
 *   2. Secrets:  WA_API_KEY, WA_SENDER (and WA_ENDPOINT for 'webhook')
 *   3. Run one test, then read message_log.
 *
 * 'brevo'   → Brevo WhatsApp API (listed under Brevo's Professional plan — confirm with Brevo).
 *             Brevo personalises templates from CONTACT attributes, not per-message params:
 *             check with Brevo how to pass the OTP code before relying on it for OTPs.
 * 'webhook' → POSTs JSON to WA_ENDPOINT, for Indian BSPs (AiSensy / Interakt / Gupshup / WATI)
 *             or a Make / n8n / Pabbly scenario that maps it to the provider:
 *             { to, template, language, params:{ code? name? link? }, category, sender, source }
 * ----------------------------------------------------------------------- */
async function sendWhatsApp(c: Record<string, string>, lead: Any, category: string, template: string, params: Record<string, string>) {
  const provider = String(c.wa_provider || 'none').toLowerCase();
  if (provider === 'none' || !template) {
    await logMessage(lead.id, 'whatsapp', category, provider, maskPhone(lead.phone), 'SKIPPED', '', 'WhatsApp is switched off');
    return { ok: false, info: 'off' };
  }
  try {
    let r: Response;
    if (provider === 'brevo') {
      const templateId = parseInt(template, 10);
      if (isNaN(templateId)) throw new Error('Brevo needs a numeric template id');
      r = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
        method: 'POST',
        headers: { 'api-key': env('WA_API_KEY') || env('BREVO_API_KEY'), 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ senderNumber: env('WA_SENDER').replace(/\D/g, ''), contactNumbers: [lead.phone.replace(/\D/g, '')], templateId }),
        signal: AbortSignal.timeout(10000)
      });
    } else if (provider === 'webhook') {
      if (!/^https:\/\//.test(env('WA_ENDPOINT'))) throw new Error('WA_ENDPOINT secret not set');
      r = await fetch(env('WA_ENDPOINT'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(env('WA_API_KEY') ? { authorization: 'Bearer ' + env('WA_API_KEY') } : {}) },
        body: JSON.stringify({ to: lead.phone, template, language: 'en', params, category: category === 'otp' ? 'authentication' : 'utility', sender: env('WA_SENDER'), source: 'zica-creative-quest' }),
        signal: AbortSignal.timeout(10000)
      });
    } else {
      throw new Error('Unknown wa_provider: ' + provider);
    }
    const body = await r.text();
    let ref = '';
    try { const j = JSON.parse(body); ref = j.messageId || j.message_id || j.id || j.messages?.[0]?.id || ''; } catch (_) { /* ignore */ }
    await logMessage(lead.id, 'whatsapp', category, provider, maskPhone(lead.phone), r.ok ? 'ACCEPTED' : 'FAILED', String(ref), 'HTTP ' + r.status + (r.ok ? '' : ' ' + body));
    return { ok: r.ok, info: 'HTTP ' + r.status };
  } catch (e) {
    await logMessage(lead.id, 'whatsapp', category, provider, maskPhone(lead.phone), 'FAILED', '', String(e));
    return { ok: false, info: String(e) };
  }
}

/* -------------------------------------------------------------------------
 * SMS — DORMANT (settings.sms_provider = 'none'). In India every SMS needs DLT
 * registration (entity, sender ID, template) before any provider will deliver it.
 * When ready, mirror sendWhatsApp() above:
 *
 * async function sendSms(lead, text) {
 *   const r = await fetch(env('SMS_ENDPOINT'), { method: 'POST',
 *     headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env('SMS_API_KEY') },
 *     body: JSON.stringify({ to: lead.phone, sender: env('SMS_SENDER'), text }) });
 *   await logMessage(lead.id, 'sms', 'otp', 'webhook', maskPhone(lead.phone), r.ok ? 'ACCEPTED' : 'FAILED');
 *   return { ok: r.ok, info: 'HTTP ' + r.status };
 * }
 * ----------------------------------------------------------------------- */

// ---- delivery webhooks ----
async function handleWebhook(kind: string, url: URL, req: Request) {
  if (!env('SYNC_TOKEN') || url.searchParams.get('token') !== env('SYNC_TOKEN')) return new Response('forbidden', { status: 403 });
  const body = await req.json().catch(() => ({}));
  const events = Array.isArray(body) ? body : [body];
  for (const ev of events) {
    const ref = String(ev['message-id'] || ev.messageId || ev.message_id || ev.id || '');
    const status = String(ev.event || ev.status || '').toLowerCase();
    if (!ref || !status) continue;
    const [m] = await sql`update message_log set delivery_status = ${status} where provider_ref = ${ref} returning lead_id, channel`;
    if (!m?.lead_id) continue;
    if (kind === 'email' && m.channel === 'email') {
      if (/hard_?bounce|invalid|blocked/.test(status)) await sql`update leads set email_status = 'Bounced' where id = ${m.lead_id}`;
      else if (status === 'delivered') await sql`update leads set email_status = case when email_verified_at is null then 'Delivered' else email_status end where id = ${m.lead_id}`;
    }
    if (kind === 'whatsapp' && m.channel === 'whatsapp') {
      // "Delivered" proves the number is on WhatsApp — NOT who owns it. Only a matching OTP proves that.
      if (/deliver|read/.test(status)) await sql`update leads set phone_status = case when phone_verified_at is null then 'On WhatsApp (delivered)' else phone_status end where id = ${m.lead_id}`;
      else if (/fail|undeliver|reject|error/.test(status)) await sql`update leads set phone_status = 'WhatsApp not delivered' where id = ${m.lead_id}`;
    }
  }
  return new Response('ok', { headers: CORS });
}

// ============================================================ EMAIL TEMPLATES

function emailShell(c: Record<string, string>, inner: string) {
  const logo = absUrl(c, c.logo_url);
  const brand = logo
    ? `<img src="${logo}" alt="${esc(c.institute_name || 'ZICA Pune')}" height="34" style="display:block;height:34px">`
    : `<strong style="font-size:17px;letter-spacing:-.01em;color:#ECEEF4">ZICA <span style="color:#FF7A1A">Pune</span></strong>`;
  return `<!doctype html><html><body style="margin:0;background:#0D0E13;font-family:'Bricolage Grotesque',Segoe UI,Arial,sans-serif;color:#ECEEF4">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0E13;padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#15171F;border:1px solid #2B2F42;border-radius:18px;overflow:hidden">
  <tr><td style="height:5px;background:#FF7A1A;background:linear-gradient(90deg,#5CE1E6 0 34%,#FF7A1A 34% 72%,#FFB547 72%)"></td></tr>
  <tr><td style="padding:26px 28px 6px">${brand}</td></tr>
  <tr><td style="padding:10px 28px 28px;font-size:15px;line-height:1.6;color:#C9CDDB">${inner}</td></tr>
  <tr><td style="padding:14px 28px 22px;border-top:1px solid #2B2F42;font-size:12px;color:#8D93A8">${esc(c.contact_line || 'ZICA Pune, Kothrud')} · You're receiving this because you took the ZICA Creative Quest.</td></tr>
  </table></td></tr></table></body></html>`;
}
function emailOtpHtml(c: Record<string, string>, name: string, code: string) {
  return emailShell(c, `<p style="margin:0 0 6px;font-size:19px;font-weight:700;color:#ECEEF4">Hi ${esc(first(name))},</p>
  <p style="margin:0 0 18px">Here's your code to unlock your ZICA Creative Quest certificate:</p>
  <p style="margin:0 0 18px;font-family:'JetBrains Mono',Consolas,monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:#FFB547">${code}</p>
  <p style="margin:0;color:#8D93A8;font-size:13px">It expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`);
}
function emailCertHtml(c: Record<string, string>, name: string, pageUrl: string, pdfUrl: string, id: string) {
  return emailShell(c, `<p style="margin:0 0 6px;font-size:21px;font-weight:800;color:#ECEEF4">Congratulations, ${esc(first(name))}! 🎉</p>
  <p style="margin:0 0 20px">Your ZICA Creative Quest certificate is ready.</p>
  <p style="margin:0 0 14px"><a href="${pdfUrl}" style="display:inline-block;padding:14px 26px;border-radius:12px;background:#FFB547;color:#0D0E13;font-weight:800;text-decoration:none">Download certificate (PDF)</a></p>
  <p style="margin:0 0 18px;font-size:13px"><a href="${pageUrl}" style="color:#5CE1E6">View or share online</a> · ID ${id}</p>
  <p style="margin:0;color:#8D93A8;font-size:13px">Keep creating — the ZICA Pune team.</p>`);
}

// ============================================================ SMALL HELPERS

function clampInt(v: unknown, min: number, max: number, d: number) {
  const n = parseInt(String(v), 10);
  return isNaN(n) ? d : Math.min(max, Math.max(min, n));
}
function token(v: unknown, max: number) { return String(v || '').replace(/[^\w.\-]/g, '_').slice(0, max); }
function httpsOnly(u: unknown) { const s = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : ''; }
function esc(s: unknown) { return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!)); }
function first(n: string) { return String(n || '').split(' ')[0] || 'there'; }
function randomId(n: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
async function hashCode(leadId: string, code: string) {
  const data = new TextEncoder().encode(env('OTP_PEPPER', 'change-me') + '|' + leadId + '|' + code);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), (b) => b.toString(16).padStart(2, '0')).join('');
}
function maskEmail(e: string) {
  const [u, d] = String(e || '').split('@');
  if (!d) return '';
  return (u.length <= 2 ? u[0] + '•' : u.slice(0, 2) + '•'.repeat(Math.min(6, u.length - 2))) + '@' + d;
}
function maskPhone(p: string) { p = String(p || ''); return p.length > 7 ? p.slice(0, 3) + ' •••• ' + p.slice(-3) : p; }
function ymd() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: '2-digit', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return g('year') + g('month') + g('day');
}
function ist(d: unknown) {
  if (!d) return '';
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(d as string));
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
}
function fmtDateLong(d: unknown) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d as string));
}
