# Suno API Integration — Exploration Notes

## Summary

We need music generation for Libretto (5 tracks per album). Explored multiple options. **KIE.ai is now working** (confirmed Feb 18, 2026) — generation completes in ~65s, returns 2 tracks per request.

---

## Option 1: KIE.ai Suno API Wrapper (Primary Attempt)

**Docs:** https://docs.kie.ai/suno-api/generate-music
**Status:** WORKING (confirmed Feb 18, 2026) — was broken earlier same day, came back after KIE posted service notice

### API Reference

| Item | Value |
|------|-------|
| Base URL | `https://api.kie.ai` |
| Auth | `Authorization: Bearer YOUR_API_KEY` |
| Generate | `POST /api/v1/generate` (callBackUrl **required**) |
| Poll | `GET /api/v1/generate/record-info?taskId=TASK_ID` |
| Credits | `GET /api/v1/chat/credit` |
| Docs | https://docs.kie.ai/suno-api/generate-music |
| Models | V3_5, V4, V4_5, V4_5PLUS, V4_5ALL, V5 |
| API Keys Tested | `bd49471376b4f00b8c14b88c065886c3`, `87c3ae3627946df7fcb7e65ffa731a80` |
| Credits | 77.48 (both keys map to same account) |
| HMAC Key | For webhook verification only, NOT auth |

### What We Tested

- All 6 model variants (V3_5 through V5)
- Custom mode (with lyrics) and non-custom mode (prompt only)
- Instrumental and vocal
- Real webhook.site URLs and fake callback URLs
- Two different API keys

**Result:** Every attempt failed with `GENERATE_AUDIO_FAILED` / errorCode 500 / "Internal Error."

### Gotchas Discovered

1. `callBackUrl` is **mandatory** (422 without it)
2. Model `V4_5` gets silently remapped to `V4_5ALL` on the backend
3. No way to add a credit card on Kie.ai
4. HMAC key returns 401 if used as Bearer token
5. Dashboard generation works fine — only API is broken
6. KIE posted a service notice: "experiencing technical difficulties" (as of Feb 18, 2026)

### Test Scripts

- `D:\ClaudeCode\scripts\test-kie-suno.js` — Custom mode test (V4_5, with lyrics)
- `D:\ClaudeCode\scripts\test-kie-suno2.js` — Non-custom mode test (V4)
- `D:\ClaudeCode\scripts\test-kie-models.js` — All 6 models, polls after 90s

---

## Option 2: gcui-art/suno-api (Self-Hosted Proxy)

**Repo:** https://github.com/gcui-art/suno-api
**Status:** Viable but not yet deployed

Uses cookie auth + Playwright + 2Captcha to automate suno.com directly.

| Item | Detail |
|------|--------|
| Cost | ~$13-15/mo (Suno Pro $10 + 2Captcha $3-5) |
| Capacity | ~250 songs/month on Suno Pro |
| Risk | Violates Suno ToS (cookie scraping) |
| Setup | Clone repo, set SUNO_COOKIE + TWOCAPTCHA_KEY, deploy to Vercel or local |

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/custom_generate` | Generate with lyrics + style tags |
| `GET /api/get?ids=<id>` | Poll track status |
| `GET /api/get_limit` | Check remaining credits |

---

## Option 3: ACE-Step 1.5 (Local GPU)

**Status:** Viable if we have GPU hardware

| Item | Detail |
|------|--------|
| Cost | Free (open source) |
| Requirement | 12GB+ VRAM GPU |
| Supports | Vocals + lyrics |
| Advantage | No API dependency, no ToS risk |

---

## Option 4: Other APIs (Dead Ends)

| Service | Result |
|---------|--------|
| **Apiframe** | SEO bait. Only Midjourney `/imagine` works. `/suno-generate` returns 404. |
| **PiAPI** | Shut down Suno integration entirely. |

---

## Current Code State

The Libretto codebase (`src/lib/suno.ts`) is written against the **gcui-art/suno-api** proxy interface. If KIE comes back online, we'd need a separate client since its API shape differs (callBackUrl webhook pattern vs polling).

### Decision Needed

1. **Wait for KIE** — They posted a service notice, may come back
2. **Deploy gcui-art/suno-api** — Works but ToS risk, needs Suno Pro account
3. **ACE-Step 1.5 local** — Free but needs GPU
4. **Build with mock audio first** — Ship the rest, add real music later

---

## KIE API Request Format (for reference)

```json
POST https://api.kie.ai/api/v1/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "prompt": "A song about finding hope after loss",
  "model": "V4",
  "custom": false,
  "instrumental": false,
  "callBackUrl": "https://your-webhook.com/callback"
}
```

Custom mode (with lyrics):
```json
{
  "prompt": "[Verse 1]\nLyrics here...\n[Chorus]\nMore lyrics...",
  "model": "V4",
  "custom": true,
  "instrumental": false,
  "title": "Song Title",
  "tags": "pop, emotional, mid-tempo",
  "callBackUrl": "https://your-webhook.com/callback"
}
```

Poll response:
```json
GET https://api.kie.ai/api/v1/generate/record-info?taskId=TASK_ID

{
  "data": {
    "taskId": "...",
    "status": "SUCCESS" | "GENERATE_AUDIO_FAILED",
    "response": {
      "sunoData": [
        {
          "id": "...",
          "audio_url": "https://...",
          "image_url": "https://...",
          "duration": 180.5
        }
      ]
    }
  }
}
```
