# Libretto — KIE Generation Failure & Recovery Checklist

QA-agent checklist for the KIE music-generation reliability paths. Run with the
QA agent against a **preview/staging** deploy (not production — generation burns
real KIE credits and creates real albums). Per project rules: real browser, real
data, no unit-test frameworks.

Prereqs:
- Env set: `KIE_API_KEY`, `KIE_WEBHOOK_SECRET`, `KIE_CALLBACK_URL` (real app URL,
  NOT `webhook.site/placeholder`), `NEXT_PUBLIC_APP_URL`.
- A test account with credits to unlock track generation.

## 1. Happy path (baseline)
- [ ] Create album, generate track 1. Track reaches `complete`, audio plays.
- [ ] DB `tracks` row: `status=complete`, `audio_url` set, `suno_task_id` set,
      `suno_model` populated (expect `V5_5`/chirp-fenix on first attempt).

## 2. Webhook-missed recovery (polling fallback)
- [ ] Start a generation, then close the album tab before it completes.
- [ ] Reopen the album page after >3 min. Confirm the stale-track detector fires
      `/api/check-track` automatically and the track resolves to `complete`
      (or `failed` after the fallback chain) without a manual refresh loop.
- [ ] DB log shows event `audio_done_via_poll` (recovery via poll, webhook missed).

## 3. Model fallback chain
- [ ] Force a failure (e.g. temporarily point a track at the flaky
      `V4_5ALL`/chirp-auk-turbo model, or use a known-failing prompt).
- [ ] Confirm retries walk V5_5 → V5 → V4 (`getFallbackModel`), max 2 retries.
- [ ] DB `generation_log` shows `retry` events with ascending fallback models;
      `tracks.retry_count` increments; final state `complete` or `failed`.

## 4. Idempotency / duplicate callback (regression guard)
- [ ] After a track completes, re-POST the SAME `complete` callback payload to
      `/api/kie-webhook?...&secret=...` (KIE retries callbacks up to 3x).
- [ ] Response is `{ received: true, ignored: 'terminal' }`; DB row UNCHANGED;
      NO new KIE generation submitted (credits unchanged).

## 5. Stale (superseded) task callback (regression guard)
- [ ] While a track is mid-retry (current `suno_task_id` = T2), POST a `complete`
      or `error` callback for the OLD task id T1.
- [ ] Response is `{ received: true, ignored: 'stale_task' }`; the good T2 result
      is NOT overwritten; no extra generation fired.

## 6. Null-data "complete" (KIE failure disguised as success)
- [ ] POST a `complete` callback with `data.data = null` for a `generating_audio`
      track.
- [ ] Track enters the retry/fallback path (not marked complete); DB log shows
      `failed` with message "KIE sent complete callback with null track data".

## 7. Secret enforcement
- [ ] POST to `/api/kie-webhook` with wrong/missing `secret` → 401, no DB change.

## Notes
- Webhook handler: `src/app/api/kie-webhook/route.ts` (idempotency + staleness
  guard added 2026-05-28).
- Polling fallback: `src/app/api/check-track/route.ts`.
- Model chain: `getFallbackModel` in `src/lib/suno-kie.ts`.
