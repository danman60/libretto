# Poster Generation & Faster Audio Research

## Poster Generation — AI Image APIs

### FLUX 1.1 Pro (RECOMMENDED)
- **API**: BFL direct (`api.bfl.ai`) or via fal.ai
- **Speed**: 3-5 seconds
- **Cost**: $0.04/image
- **Portrait**: 2:3, 3:4, 9:16 aspect ratios
- **Strategy**: Generate dramatic background art, overlay show title/tagline with our own CSS/HTML text rendering (better typography control than AI text)
- **Prompt pattern**: `"Dramatic Broadway theatrical poster artwork for a [genre] show. Setting: [setting]. Mood: [mood]. Style: dramatic theatrical poster art, spotlight lighting, rich colors, cinematic composition, portrait orientation, no text"`

### GPT Image 1 (OpenAI)
- **Speed**: 30-60 seconds (too slow for primary)
- **Cost**: $0.04 (medium) / $0.17 (high)
- **Best text rendering** of any model — could bake title directly into image
- Use as premium/optional tier only

### DALL-E 3 (OpenAI)
- **Speed**: 10-20 seconds
- **Cost**: $0.08 (standard portrait) / $0.12 (HD portrait)
- Being phased out by GPT Image 1

### Ideogram
- **Speed**: 20-30 seconds (turbo: 10-15s)
- **Cost**: $0.025-0.04/image
- Best-in-class typography but slow

### Stability AI (Stable Image Core)
- **Speed**: 5-8 seconds
- **Cost**: $0.03/image
- Decent but Flux outperforms at similar price

### Midjourney
- **No official API** — not usable programmatically

---

## Faster Audio Generation

### Quick Win: KIE Webhook (TODAY)
- KIE already supports `callBackUrl` with 3 stages: text/first/complete
- Currently polling every 10s — switching to webhook = instant notification
- Zero code migration cost, just add a webhook endpoint
- Docs: https://docs.kie.ai/suno-api/generate-music-callbacks

### sunoapi.org
- Claims 20-30s (vs KIE's 60-90s)
- Same Suno V5 model
- $0.04-0.05/credit
- Webhook support
- Worth testing as KIE replacement

### Self-hosted suno-api (gcui-art/suno-api)
- ~30s generation (native Suno speed)
- Uses your Suno subscription credits
- Cookie auth (fragile), CAPTCHA solving needed
- Against Suno TOS — risk of ban

### ACE-Step 1.5 (Replicate)
- **14 seconds**, $0.014/song
- Good but not Suno-tier for theatre vocals
- Could work as fast preview/draft

### Other
- Udio v1.5: 1-3min, no official API
- Stable Audio 2.5: Fast but no vocals
- MusicGen (Meta): Fast but no vocals

---

## Recommended Implementation Plan

### Phase 1: FLUX Poster (decouple art from audio)
1. Add FLUX API client (`lib/flux.ts`)
2. Fire poster generation in parallel with audio (from orchestrator or frontend)
3. Poster arrives in ~5s → animate reveal
4. Audio arrives later → song plays
5. **Result**: "Painting the poster..." wait drops from 60-90s to 5s

### Phase 2: KIE Webhook (eliminate polling)
1. Create `/api/kie-webhook` endpoint
2. Pass it as `callBackUrl` in KIE generation requests
3. Webhook updates track status + cover art on completion
4. **Result**: Instant notification vs up to 10s polling delay

### Phase 3: Evaluate sunoapi.org (faster Suno)
1. Test sunoapi.org for speed claims (20-30s)
2. If faster than KIE, swap provider
3. **Result**: Potential 30-60s faster audio

---

*Research date: 2026-02-24*
