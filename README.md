# ZICA Creative Quest

A visual quiz for ZICA Pune: 25 questions per attempt (and 25 different ones on "Try again"), a certificate with the student's verified name, and every submission copied to a Google Sheet.

**Live address (QR code):** https://zicapune.github.io/creative-quest/

```
Phone ─► GitHub Pages (this repo's website)
            │  answers, scores, details, codes, certificates
            ▼
         Supabase  (database + "quest" function, Mumbai)  ──every 5 min──►  Google Sheet (Azpire Gmail)
            │
            └─► Brevo email: 6-digit code + certificate link      (WhatsApp/SMS: in the code, switched off)
```

## What's where

| Path | What |
|---|---|
| `index.html`, `certificate.html`, `assets/` | The website (look matches the ZICA Pune visit deck) |
| `assets/js/visuals.js` | 50 original animated question visuals (no image files) |
| `tools/questions.mjs` | The 50 questions — set A (first try) and set B (retry) |
| `tools/build-seed.mjs` | Rebuilds the question seed in `supabase/schema.sql` |
| `tools/loadtest.mjs` | Simulates N students at once and proves nothing was lost or doubled |
| `supabase/schema.sql` | Tables, security lock-down, settings, questions |
| `supabase/functions/quest/index.ts` | The backend (scoring, validation, codes, PDF certificates, Sheet export) |
| `google-sheets/SheetsSync.gs` | Paste into a Google Sheet; copies everything in every 5 minutes |
| `.github/workflows/deploy.yml` | Deploys database + function + website on every push |
| `website-popup/` | Optional pop-up card for the ZICA Pune website |
| `CHATGPT-IMAGE-PROMPTS.md` | Prompts for the certificate background and avatar |

## One-time setup

1. **Pages:** repo **Settings → Pages → Source: GitHub Actions**. Leave *Custom domain* empty.
2. **Supabase:** supabase.com → New project (region **Mumbai**, Free plan is fine). Then **Account (top-right) → Access Tokens → Generate new token**.
3. **GitHub secrets & variables:** repo **Settings → Secrets and variables → Actions**
   - *Secrets* tab:
     - `SUPABASE_ACCESS_TOKEN`: the token from step 2.
     - `SYNC_TOKEN`: any 32+ character password you make up.
     - `BREVO_API_KEY`: when you have it.
   - *Variables* tab:
     - `SUPABASE_PROJECT_REF`: the 20-letter id from your project URL `https://<ref>.supabase.co`.
     - `EMAIL_FROM`: the sender address you verified in Brevo.
4. **Deploy + load test:** **Actions → Deploy Creative Quest → Run workflow** (keep "Run the 20-student load test" ticked). Green ✓ = live. The load-test result is on the run's summary page.
5. **Google Sheet (Azpire Gmail):** new Sheet → **Extensions → Apps Script** → paste `google-sheets/SheetsSync.gs`. Then run these, in order:
   - `SheetsSync.gs → saveSyncSettings`. Fill `FUNCTION_URL` = `https://<ref>.supabase.co/functions/v1/quest` and `SYNC_TOKEN` inside it first.
   - `SheetsSync.gs → setupSheetsSync`
   - `SheetsSync.gs → installSyncTrigger`

Without `BREVO_API_KEY` the certificate step still works: the 6-digit code is shown on screen and the Sheet marks it *Test code (not verified)*. Add the key and re-run the workflow to switch to real emailed codes.

## Day-to-day

- **Edit questions/settings:** in the Sheet's *Questions* / *Settings* tabs, then use the menu **Creative Quest → Push Questions / Push Settings**. Live within 1 minute.
- **See submissions now:** menu **Creative Quest → Sync now** (otherwise every 5 minutes).
- **Questions per attempt:** setting `total_questions` (default 25).
- **Images:** upload to `assets/img/` with these exact names. Missing ones fall back to built-in designs.
  - `logo.png`
  - `avatar-hello.png`, `avatar-point.png`, `avatar-certificate.png`
  - `certificate-bg.jpg`
  - `signature.png`

## Reliability (tested before the 30–31 Oct 2026 visit)

`tools/loadtest.mjs` runs every student's complete journey simultaneously. The journey covers:
- 25 answers, with deliberate double-taps
- the details form, submitted twice
- name edit and code
- two simultaneous "Verify" taps
- PDF download and the verification page
- a retry with the second question set

It then checks the database. A run passes only if every attempt is complete, every score matches, there is exactly one lead and one certificate per student, and there are no duplicate phone numbers. Load-test rows are tagged and deleted, and they never reach the Sheet.

## WhatsApp / SMS (dormant)

`sendWhatsApp()` in `supabase/functions/quest/index.ts` supports `brevo` and a generic `webhook` (AiSensy, Interakt, Gupshup, WATI, or Make/n8n). It stays off while the setting `wa_provider = none`. To switch it on:
- Set `wa_provider`, `wa_template_otp`, `wa_template_certificate` and `otp_channel = whatsapp`.
- Add the secrets `WA_API_KEY`, `WA_SENDER` (and `WA_ENDPOINT` for webhook).

Only a WhatsApp code proves the number is on WhatsApp and belongs to the student. SMS is stubbed the same way; India requires DLT registration first.

## Custom domain (optional)

A `quest.zicapune.com` address only works if ZICA owns `zicapune.com` and can add a DNS record:
1. Add a CNAME `quest` → `zicapune.github.io`.
2. Set Pages → Custom domain.
3. Set the repo variable `SITE_URL`.
4. Re-run the workflow.

The QR code should keep pointing at the `github.io` address until that is done.
