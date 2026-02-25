# Current Work — Libretto

## ✅ Done: album_feedback Migration

Migration `create_album_feedback_table` applied via MCP (2026-02-24). Table + index live.

## Just Shipped

### Feedback Widget (commit `2e29142`)
- `src/components/FeedbackWidget.tsx` — 5-point theatre-themed rating (Meh → Standing Ovation) + optional text
- `src/app/api/album/[slug]/feedback/route.ts` — POST endpoint, rate-limited (3 per 10 min)
- Wired into both musical and legacy album page layouts, between Download CTA and Guestbook

### MTBible Enrichment Map (commit `eb7738b`)
- `public/mtbible-map.html` — live at `libretto-alpha.vercel.app/mtbible-map.html`
- `MTBible.md` — cleaned source doc (no citations) at project root
- 10 sections: Commandments, Song Forms, Pipeline, Per-Genre, Energy/Tempo, Pacing, Comedy, Lyric Examples, Suno Translation Layer, Implementation Checklist
- Under active review — user adding more research to expand it

## In Progress: MTBible Enrichment Upgrade

**Goal:** Integrate BMI Lehman Engel Musical Theatre Workshop principles into the enrichment pipeline for richer lyrics + music generation.

**Key changes planned (see mtbible-map.html for full visual map):**

1. **`lib/musical-types.ts`** — Add per-genre song forms (AABA/ABAB/FREE/V-C-V-C-B-C), energy levels, tempo ranges, Suno style bases, MT principles
2. **`lib/prompts.ts`** — Inject 10 Commandments into lyrics prompt, genre-specific forms (remove hardcoded V/C/V/C/B/C), Suno translation layer for style strings
3. **`lib/types.ts`** — Extend ShowConcept with tension_pacing, song_briefs[], SongForm type
4. **`lib/suno-kie.ts`** — Accept annotated lyrics with structure metatags, BPM hints
5. **Jukebox artist research** — When user names an artist, quick lookup of their style → feed into Suno tags

**User notes on song roles:**
- I Want Song: 140+ BPM, straight eighths, driving, high energy
- Confrontation: 95-115 BPM, slower, punchier, more dynamic
- 11 O'Clock: Can be ballad OR high tempo — peak climax (energy 1.0)
- Finale: Laid back, warm landing (energy 0.6)
- Commandment #7 (correct scansion) is CRITICAL
- Commandment #1 corrected: "don't sing so fast it cannot be understood"

## Just Shipped: FLUX Poster + Overture UX

**FLUX poster generation** — LIVE
- `lib/flux.ts` — fal.ai SDK, FLUX 1.1 Pro, ~5s, $0.04/image
- Fires in parallel with playbill + lyrics after enrichment
- Poster arrives in ~5s → album page shows immediately (no more "Painting the poster...")
- Genre-specific art direction (classic = art deco, rock = neon, etc.)

**Orchestra warmup audio** — LIVE
- `lib/overture-synth.ts` — Web Audio API synthesized ambiance
- Starts on "Create My Show" click → plays during loading wait
- Crossfades into track 1 audio when ready
- Album page continues overture if track 1 not yet done

**Programme gating** — LIVE
- Album page: click programme before track 1 audio ready → "We're still rehearsing!" toast
- Track 1 auto-plays when audio arrives (crossfade from overture)
- Programme unlocks when first song is ready

**Instant song generation feedback** — LIVE
- SongCard: optimistic status update on click → progress bar appears immediately
- Per-song loading bars already show elapsed time + asymptotic progress

## Just Shipped: KIE Webhook

**`/api/kie-webhook`** — LIVE
- Receives KIE callbacks at 4 stages: `text`, `first`, `complete`, `error`
- Query params carry context: `?projectId=xxx&trackNumber=1&secret=xxx`
- On `complete`: updates track with audio_url, cover_image_url, duration → backfills album cover → maybe finalizes project
- On `error`: marks track as failed + logs
- `generate-song/route.ts` now submits to KIE and returns immediately (~5s instead of 60-90s)
- `maxDuration` dropped from 300s to 60s (only needs time for lyrics + KIE submit)
- `suno-kie.ts` → new `submitKieWithWebhook()` builds callback URL with project context
- `KIE_WEBHOOK_SECRET` env var for simple auth

**Env vars needed in Vercel:**
- `FAL_KEY` — fal.ai API key for FLUX poster
- `KIE_WEBHOOK_SECRET` — shared secret for webhook auth
- `NEXT_PUBLIC_APP_URL` — must be set to deployed URL (e.g. `https://libretto-alpha.vercel.app`)

## Queued: Evaluate sunoapi.org

**Reference:** `docs/POSTER_AND_AUDIO_RESEARCH.md`
- Claims 20-30s generation (vs KIE's 60-90s)
- Same Suno V5 model
- Worth testing as KIE replacement for speed

## Queued: Suno Profiles Implementation

**Depends on:** MTBible map finalization (once the bible is sound, implement this pass)

**Reference:** `docs/SUNO_TAGS_REFERENCE.md` — comprehensive Suno tribal knowledge (tags, metatags, limitations, v5 features)

**Problem:** Current code ignores Suno best practices:
- `buildSongStylePrompt()` naively concatenates strings — no tag ordering, no limits
- `buildSongLyricsPrompt()` hardcodes `[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus]` for ALL genres
- `style_hints` in `musical-types.ts` are DeepSeek descriptions, not Suno-optimized tags

**Build `lib/suno-profiles.ts`:**
1. **Style map** — per genre × per song role = optimized Suno style strings (first tag = primary genre, 4-8 tags max, max 3-4 instruments)
2. **Structure template map** — per genre × per song role = metatag structures with performance cues (`[Verse 1 | Soft, Piano]` → `[Chorus | Belting, Full Orchestra]`)
3. **Syllable budget** — inject into DeepSeek lyrics prompt (6-8 syl/line for ballads, 10-14 for rap)

**Refactor `buildSongStylePrompt()`** to pull from suno-profiles instead of naive concatenation.
**Refactor `buildSongLyricsPrompt()`** to use genre-specific structure templates with performance cues.

## Queued: Orchestration Ideas Per Genre

**Goal:** Each musical genre should have specific orchestration guidance that feeds into:
1. DeepSeek lyrics prompt (inform lyrical style — ballad vs. belt, sparse vs. dense)
2. Suno style tags (instrument choices, arrangement descriptors)
3. Enrichment prompt (inform dramatic arc + mood)

**Per-genre orchestration profiles to define:**
- **Classic Broadway** — Full pit orchestra, lush strings, big brass, woodwinds, show tune feel
- **Rock Musical** — Electric guitar, bass, drums, keys, raw energy, distorted guitars for confrontation
- **Pop Musical** — Synth pads, programmed drums, acoustic guitar, piano, modern production
- **Hip-Hop Musical** — 808s, trap hi-hats, sampled beats, sparse instrumentation, bass-heavy
- **Jukebox Musical** — Era-specific instrumentation (60s soul horns, 80s synths, etc.)
- **Romantic Musical** — Piano-forward, strings, acoustic guitar, gentle percussion, intimate

**Per-song-role orchestration variation:**
- Opening Number: Full ensemble, big arrangement
- I Want Song: Stripped back, builds from solo instrument to fuller
- Confrontation: Driving percussion, tension-building, staccato strings
- Act II Opening: Fresh palette, new texture, contrast with Act I
- 11 O'Clock: Peak instrumentation, everything at max
- Finale: Reprises key motifs, warm resolution, landing energy

**Implementation:** Add `orchestration_hints` to `SongRoleConfig` in `musical-types.ts`, feed into Suno style prompt.

## Queued: MTBible Layer 2+3 Integration

**Depends on:** MTBible map finalization

**Source files:**
- Layer 2: `C:\Users\Danie\Downloads\MTBIbleLayer2.txt` — "Core Universal Rules from Major Experts" (Sondheim, Hammerstein, Ashman, Schwartz, Menken, JR Brown)
- Layer 3: `C:\Users\Danie\Downloads\MTBIbleLayer3.txt` — "Executive Snapshot Alpha" (classification system, genre matrix, contradictions)

**Key principle:** Layer 1 (current MTBible.md) stays SOT. L2/L3 fill gaps and expand. Most L2/L3 material is craft rules for DeepSeek lyrics prompts, NOT Suno input.

**New sections for the map:**
- Why Characters Sing (dramatic function, Transition/Realization/Decision)
- Character Voice (Sondheim "I Feel Pretty" cautionary tale, character-constrained imagery)
- Reprises (must reframe, not repeat — Ashman Little Mermaid example)
- Theatre vs Pop (emotional transformation required, each show gets own vocabulary)
- Subtext (self-delusion songs, bold strokes, "Being Alive" complaint→prayer)
- Sondheim's Three Laws (Content Dictates Form / Less Is More / God Is in the Details)
- Opening Numbers & I Want deep dive (two types, Wicked development story)
- Song Placement Theory (Berlin's "posts", Schwartz beat boards)
- Contradictions & Nuance (rhyme tension, "move the plot" is oversimplified)

**Sections to enrich:** Commandments (#7 prosody deep dive), Pacing (density analysis), Comedy (+surprise framing), Examples (reprise canonicals)
