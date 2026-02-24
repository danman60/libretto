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
