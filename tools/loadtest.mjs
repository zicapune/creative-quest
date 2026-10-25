#!/usr/bin/env node
/* =====================================================================
   ZICA CREATIVE QUEST — load test
   Simulates N students taking the full quest AT THE SAME TIME:
   start → 25 answers (incl. accidental double-taps) → finish → details
   → confirm/edit → code → certificate → PDF download → verify page.
   Then asks the server to prove nothing was lost or doubled, and deletes
   every test row (they are tagged src='loadtest' and never reach the Sheet).

   Usage:
     FUNCTION_URL=https://<ref>.supabase.co/functions/v1/quest \
     SYNC_TOKEN=<same as the Supabase secret> \
     ANON_KEY=<anon/publishable key> \
     node tools/loadtest.mjs [users=20] [--keep]
   Exit code 0 = pass, 1 = fail.
   ===================================================================== */
const URL_ = process.env.FUNCTION_URL ? process.env.FUNCTION_URL + (process.env.FUNCTION_REGION ? (process.env.FUNCTION_URL.includes('?') ? '&' : '?') + 'forceFunctionRegion=' + process.env.FUNCTION_REGION : '') : '';
const TOKEN = process.env.SYNC_TOKEN;
const ANON = process.env.ANON_KEY || '';
const USERS = Number(process.argv.find((a) => /^\d+$/.test(a)) || 20);
const KEEP = process.argv.includes('--keep');
const THINK_MS = Number(process.env.THINK_MS || 250); // pause between answers (real students: ~10 s)
if (!URL_ || !TOKEN) { console.error('Set FUNCTION_URL and SYNC_TOKEN.'); process.exit(2); }

const headers = { 'content-type': 'application/json', ...(ANON ? { apikey: ANON, authorization: 'Bearer ' + ANON } : {}) };
const lat = {};
async function call(action, body = {}, tries = 3) {
  const t0 = performance.now();
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify({ action, ...body }) });
      const j = await r.json().catch(() => ({}));
      (lat[action] = lat[action] || []).push(performance.now() - t0);
      if (!r.ok || j.error) { const e = new Error(action + ': ' + (j.error || r.status)); e.code = j.code; e.status = r.status; throw e; }
      return j;
    } catch (e) {
      if (i >= tries || (e.status && e.status < 500)) throw e;
      await sleep(400 * i);
    }
  }
}
const OUT = [];
const say = (...a) => { const line = a.join(' '); OUT.push(line); console.log(line); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms) => ms * (0.5 + Math.random());

async function student(n) {
  const log = { n, ok: false };
  const phone = '9' + String(990000000 + n).slice(-9);
  // Attempt 1 → set A; every 4th student also plays a retry (set B) like a curious student would.
  const s = await call('start', { lt: TOKEN, attemptNo: 1, device: 'mobile', src: 'loadtest' });
  if (s.questions.length < 1) throw new Error('no questions');
  let expected = 0;
  for (const q of s.questions) {
    await sleep(jitter(THINK_MS));
    const choice = (n + q.id.charCodeAt(2)) % q.options.length;
    const r = await call('answer', { attemptId: s.attemptId, qid: q.id, choice });
    if (n % 3 === 0) { // double-tap: must not change the locked answer
      const again = await call('answer', { attemptId: s.attemptId, qid: q.id, choice: (choice + 1) % q.options.length });
      if (again.chosenIndex !== choice) throw new Error('double-tap changed an answer');
    }
    if (r.correct) expected++;
  }
  const f = await call('finish', { attemptId: s.attemptId });
  if (f.score !== expected) throw new Error(`score ${f.score} != expected ${expected}`);
  const lead = await call('lead', { lt: TOKEN, attemptId: s.attemptId, name: 'load tester ' + n, email: `loadtest.${n}@gmail.com`,
    countryCode: '91', phone, marketing: n % 2 === 0, consentSource: n % 2 === 0 ? 'Pre-ticked, kept' : 'Unticked by user' });
  if (!lead.ok) throw new Error('lead rejected ' + JSON.stringify(lead.errors));
  if (n % 5 === 0) { // double-submit the same form: must not create a second lead
    const dup = await call('lead', { lt: TOKEN, attemptId: s.attemptId, name: 'load tester ' + n, email: `loadtest.${n}@gmail.com`, countryCode: '91', phone, leadKey: lead.leadKey });
    if (dup.leadId !== lead.leadId) throw new Error('duplicate lead created');
  }
  const conf = await call('confirm', { leadId: lead.leadId, leadKey: lead.leadKey, name: 'Load Tester ' + String.fromCharCode(65 + (n % 26)), email: `loadtest.${n}@gmail.com`, countryCode: '91', phone });
  if (!conf.ok) throw new Error('confirm rejected ' + JSON.stringify(conf.errors));
  const otp = await call('otp_send', { leadId: lead.leadId, leadKey: lead.leadKey });
  if (!otp.testCode) throw new Error('no test code for load-test lead');
  const verifyBody = { leadId: lead.leadId, leadKey: lead.leadKey, code: otp.testCode };
  const [v1, v2] = await Promise.all([call('otp_verify', verifyBody), n % 4 === 0 ? call('otp_verify', verifyBody).catch((e) => ({ err: e.message })) : Promise.resolve(null)]);
  if (v2 && !v2.err && v2.certificate.id !== v1.certificate.id) throw new Error('double verify made two certificates');
  const t0 = performance.now();
  const pdf = await fetch(v1.certificate.pdfUrl, { headers: ANON ? { apikey: ANON, authorization: 'Bearer ' + ANON } : {} });
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  (lat.pdf = lat.pdf || []).push(performance.now() - t0);
  if (!pdf.ok || String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('PDF failed ' + pdf.status);
  const cert = await call('cert', { id: v1.certificate.id });
  if (!cert.valid || cert.name !== 'Load Tester ' + String.fromCharCode(65 + (n % 26))) throw new Error('certificate verify mismatch');
  if (n % 4 === 0) { // retry with the second question set, then link it
    const s2 = await call('start', { lt: TOKEN, attemptNo: 2, device: 'mobile', src: 'loadtest' });
    if (s2.set === s.set && s.set) throw new Error('retry got the same question set');
    for (const q of s2.questions) await call('answer', { attemptId: s2.attemptId, qid: q.id, choice: 0 });
    await call('finish', { attemptId: s2.attemptId });
    await call('link', { attemptId: s2.attemptId, leadId: lead.leadId, leadKey: lead.leadKey });
    log.retry = true;
  }
  log.ok = true; log.score = f.score; log.cert = v1.certificate.id; log.pdfKB = Math.round(bytes.length / 1024);
  return log;
}

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))] || 0; };

(async () => {
  say(`Load test: ${USERS} students at once against ${URL_}`);
  await call('admin_purge_loadtest', { token: TOKEN }).catch(() => {});
  const t0 = performance.now();
  const results = await Promise.allSettled(Array.from({ length: USERS }, (_, i) => student(i + 1)));
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  const fails = results.filter((r) => r.status === 'rejected');
  const retries = results.filter((r) => r.status === 'fulfilled' && r.value.retry).length;

  const report = await call('admin_loadtest_report', { token: TOKEN });
  const expectAttempts = USERS + retries;
  const problems = [];
  if (fails.length) problems.push(`${fails.length} student run(s) failed: ` + fails.slice(0, 5).map((f) => f.reason.message).join(' | '));
  if (report.attempts !== expectAttempts) problems.push(`attempts ${report.attempts} != ${expectAttempts}`);
  if (report.completed !== expectAttempts) problems.push(`completed ${report.completed} != ${expectAttempts}`);
  if (report.incomplete_answers) problems.push(`${report.incomplete_answers} attempts missing answers`);
  if (report.score_mismatch) problems.push(`${report.score_mismatch} score mismatches`);
  if (report.leads !== USERS) problems.push(`leads ${report.leads} != ${USERS} (lost or duplicated)`);
  if (report.duplicate_phones) problems.push(`${report.duplicate_phones} duplicate phone numbers`);
  if (report.linked_attempts !== expectAttempts) problems.push(`linked attempts ${report.linked_attempts} != ${expectAttempts}`);
  if (report.certificates !== USERS) problems.push(`certificates ${report.certificates} != ${USERS}`);

  say(`\nFinished in ${secs}s · ${USERS - fails.length}/${USERS} students completed · ${retries} also replayed with set B`);
  say('Database check:', JSON.stringify(report));
  say('\nLatency (ms)      p50    p95    max   calls');
  for (const [k, a] of Object.entries(lat)) say(`  ${k.padEnd(14)} ${String(Math.round(pct(a, 50))).padStart(6)} ${String(Math.round(pct(a, 95))).padStart(6)} ${String(Math.round(Math.max(...a))).padStart(6)} ${String(a.length).padStart(6)}`);

  if (!KEEP) { const p = await call('admin_purge_loadtest', { token: TOKEN }); say(`\nCleaned up ${p.leads} test leads and ${p.attempts} test attempts.`); }
  if (problems.length) say('\n❌ FAIL\n- ' + problems.join('\n- '));
  else say('\n✅ PASS — no lost or duplicated submissions.');
  await call('admin_loadtest_note', { token: TOKEN, pass: !problems.length, summary: OUT.join('\n') }).catch(() => {});
  if (problems.length) process.exit(1);
})().catch((e) => { console.error('❌ Load test crashed:', e.message); process.exit(1); });
