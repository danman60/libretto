# Current Work — Libretto

## Session July 9–10, 2026 — production domain outage fixed + KIE pipeline verified live

### DNS outage (www.broadwayify.com dead) — ROOT-CAUSED & FIXED
- **Symptom:** `broadwayify.com` + `www` returned NXDOMAIN everywhere; app itself healthy on `libretto-alpha.vercel.app` (HTTP 200).
- **Root cause:** NameCheap registrar delegated the domain to Cloudflare NS `jack/rihana.ns.cloudflare.com` — a **stale/empty** zone (SOA only, no apex/www records). The **active** Cloudflare zone (id `65e67148…`, status `moved`) was assigned to NS `amos/aria.ns.cloudflare.com`. Registrar/zone NS mismatch → zone never served → every record NXDOMAIN.
- **Fix (two parts):**
  1. Added records to the active zone: apex `broadwayify.com` A → `216.150.1.1` + `216.150.16.1`; `www` CNAME → `cname.vercel-dns.com`; all DNS-only (grey cloud, Vercel-managed certs). Values from Vercel `/v6/domains/*/config` `recommendedIPv4`.
  2. Repointed NameCheap nameservers `jack/rihana` → `amos/aria.ns.cloudflare.com` (`domains.dns.setCustom`, `Updated:true`).
- **Verified live:** `www.broadwayify.com` → HTTP 200, title "BROADWAYIFY — Turn your idea into a Broadway musical"; apex `broadwayify.com` → 307 → www. Resolves on both 1.1.1.1 and 8.8.8.8.
- Vercel domain binding was already correct (apex+www attached to project `libretto`, verified=true, apex redirects→www). Only DNS delegation was broken.

### KIE Suno pipeline — VERIFIED WORKING END-TO-END (live tests 2026-07-10)
- Direct generation test: app's exact payload (`suno-kie.ts` shape), model `V5_5`: `/api/v1/generate` → `code:200`; status PENDING→TEXT_SUCCESS→FIRST_SUCCESS→**SUCCESS** ~72s; 2 variants (`chirp-fenix`), audio downloaded HTTP 200 `audio/mpeg` 2.59 MB.
- **Full webhook round trip** (commit `79371bf`, after secret fix below): inserted throwaway project+track (`generating_audio`, suno_task_id set) → submitted KIE with real prod callback `libretto-alpha.vercel.app/api/kie-webhook` → KIE POSTed the live webhook → track flipped to `complete` with audio_url + alt_audio_url. Test rows deleted. **Confirms KIE→prod-webhook→DB works.**
- KIE credits ~285 → ~261 (−12/generation, 2 test gens). Key `bd49471…`.

### KIE webhook shared-secret bug — FIXED (commit `79371bf`, deployed)
- **Bug:** prod `KIE_WEBHOOK_SECRET` was a bare newline (`'\n'`) and `buildWebhookUrl` interpolated it **raw** into the callback URL. A literal newline in a URL is fragile — KIE's HTTP client can strip it, so the callback arrives with an empty secret → webhook returns 401 → audio never finalizes via webhook (falls back to `check-track` poll only; likely cause of tracks stuck in `generating_audio`).
- Verified deployed webhook auth: no/empty/bogus secret → 401; only `secret=%0A` (newline) → 200. Confirmed the fragility.
- **Fix:** `buildWebhookUrl` now `encodeURIComponent((KIE_WEBHOOK_SECRET||'').trim())`; route trims both sides before compare. Rotated `KIE_WEBHOOK_SECRET` in Vercel prod to a clean 48-char hex token. Post-deploy verified: correct secret → 200, old newline → 401 (rotation proven), bogus → 401, secret+trailing-newline → 200 (trim works).

### Correction to prior note
- Commit `0b6d674` (idempotency guard) is **already pushed** — `git HEAD == origin/main`. The "NOT pushed/deployed / PENDING USER APPROVAL" note below is **stale/incorrect**; kept for history.

---

## Overnight Fleet Run (May 28, 2026) — webhook idempotency hardening

Continued KIE reliability hardening. Built + committed (commit 0b6d674), **NOT pushed/deployed** (real-users production webhook runtime change; pause-before-deploy per overnight rails).

### Shipped this run (committed, unpushed)
- **Idempotency + task-staleness guard on `/api/kie-webhook`** — webhook now:
  - ignores duplicate callbacks on already-terminal tracks → `{received,ignored:'terminal'}`
  - ignores superseded-task callbacks (task_id ≠ current `suno_task_id`) → `{ignored:'stale_task'}`
  - Closes a real bug: KIE retries callbacks 3× and model-fallback creates new task IDs, so a late/duplicate `error` callback could fire a 2nd/3rd generation (wasted KIE credits = $) or a stale `complete` could overwrite good audio.
  - Verified safe: `generate-show.ts:228-229` sets `suno_task_id` + `generating_audio` together at submit, so the first legit callback is never false-ignored. `check-track` already guards on `status='generating_audio'`.
- **`tests/agent/kie-failure-recovery-checklist.md`** — QA-agent checklist (real browser, per project no-unit-test rule): happy path, webhook-missed poll recovery, model fallback chain, idempotency, stale-task, null-data complete, secret enforcement.

### PENDING USER APPROVAL (before push/deploy of 0b6d674)
- Run `tests/agent/kie-failure-recovery-checklist.md` against a **preview** deploy (generation burns KIE credits — do NOT test on production).
- Set `KIE_CALLBACK_URL` to real app URL (still `webhook.site/placeholder` per below).
- Then push `main` (deploys to www.broadwayify.com).

---

## Prior Session: KIE Reliability Hardening (Apr 4, 2026)

Investigated why music generation was failing for users on www.broadwayify.com. Root cause: KIE V5 model (`chirp-auk-turbo`) failing 75% with error 500 + webhook silently dropping failures. Deployed full hardening stack.

## What Shipped This Session

### KIE V5_5 Upgrade + Null sunoData Fix (`08a34a0`)
- Default model V5→V5_5 (`chirp-fenix`) — fastest, most reliable
- Webhook handler now properly marks track as failed when KIE sends `complete` callback with null data
- Fixed Vercel env typo: `KIE_WEBHOOk_SECRET` → `KIE_WEBHOOK_SECRET`

### Polling Fallback + Model Fallback + Stale Recovery (`3e15d0c`)
- **`/api/check-track`** (NEW) — polls KIE directly as webhook safety net
- **Model fallback chain** — V5_5→V5→V4, up to 2 retries before marking failed
- **Album page stale detection** — auto-fires check-track if track stuck at `generating_audio` >3 min
- **`attemptRetryOrFail()`** in webhook handler — shared retry logic with model fallback

## Build Status
PASSING on Vercel (production deploy `libretto-8vuk5m193`). Local build has pre-existing missing deps (@fal-ai/client, jspdf, jszip).

## Known Issues
- `master` branch has stale divergent commit (82da01b) — irrelevant, `main` is deployed
- `KIE_CALLBACK_URL` env still `https://webhook.site/placeholder` — only legacy path
- No E2E test run after deploying fixes

## Next Steps (priority order)
1. E2E test: Create album on www.broadwayify.com, verify track 1 generates with V5_5
2. Test stale recovery: Generate → close tab → reopen → verify check-track fires
3. Test model fallback: Force a failure, confirm V5_5→V5→V4 chain
4. Install missing deps for local builds
5. Clean up master branch

## Gotchas
- Deployed branch is **`main`**, NOT `master`
- Production: `www.broadwayify.com` / `libretto-alpha.vercel.app`
- KIE key: `bd49471376b4f00b8c14b88c065886c3` (465 credits as of Apr 4)
- KIE model map: V5→chirp-crow, V5_5→chirp-fenix, V4_5ALL→chirp-auk-turbo (FLAKY)
- Supabase schema: `libretto` on CC&SS project
- Tracks 2-6 manual unlock is intentional (pricing model)

## Files Touched This Session
- `src/lib/suno-kie.ts` — model upgrade, getFallbackModel(), docs
- `src/app/api/kie-webhook/route.ts` — null handling, attemptRetryOrFail()
- `src/app/api/check-track/route.ts` — NEW polling fallback endpoint
- `src/app/album/[slug]/page.tsx` — stale track detection + auto check-track

---

## Queued Work (from prior sessions)

### MTBible Enrichment Upgrade
Integrate BMI Lehman Engel principles into enrichment pipeline. See `mtbible-map.html`.

### Suno Profiles Implementation
Build `lib/suno-profiles.ts` — per genre × per song role optimized Suno style strings.

### Orchestration Ideas Per Genre
Per-genre orchestration profiles with per-song-role variation.

### MTBible Layer 2+3 Integration
Source: `MTBIbleLayer2.txt`, `MTBIbleLayer3.txt`. L1 stays SOT.

### Evaluate sunoapi.org
Claims 20-30s generation vs KIE 60-90s. See `docs/POSTER_AND_AUDIO_RESEARCH.md`.
