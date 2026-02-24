# Libretto — Codebase Map

## Overview

**BROADWAYIFY** — a Broadway musical generator. Users pick a musical genre, describe a show idea in one sentence, and AI generates a complete 6-song Broadway musical with playbill, cast, synopsis, and playable tracks.

**Stack:** Next.js 16 + React 19 + Tailwind v4 + Supabase + DeepSeek V3 + KIE.ai (Suno)
**Deployed:** Vercel at `libretto-alpha.vercel.app`
**Repo:** `https://github.com/danman60/libretto.git` (branch: `main`)

---

## File Tree

```
src/
├── app/
│   ├── page.tsx                    # Landing — BROADWAYIFY marquee hero, spotlight effects, CTA
│   ├── create/page.tsx             # Genre picker + one-sentence idea input + theatre loading screen
│   ├── album/[slug]/page.tsx       # Album display — proscenium curtain, programme cover, playbill spread
│   ├── embed/[slug]/page.tsx       # Embeddable player widget
│   ├── gift/[slug]/page.tsx        # Gift variant page
│   ├── not-found.tsx               # 404 page
│   ├── layout.tsx                  # Root layout — Playfair/Cormorant/Oswald fonts, global wrapper
│   ├── globals.css                 # Theatre design system — curtains, playbill, gold/burgundy palette
│   ├── favicon.ico
│   └── api/
│       ├── session/route.ts        # POST — create project with musical_type + idea
│       ├── generate-track/route.ts # POST — orchestrator: enrich → playbill → track 1 lyrics → fire audio
│       ├── generate-song/route.ts  # POST — per-track worker: generate audio for tracks 2-6
│       ├── status/[projectId]/route.ts # GET — poll project + tracks + album status
│       ├── album/[slug]/route.ts   # GET — fetch album + tracks by share_slug
│       ├── album/[slug]/title/route.ts    # POST — switch album title from alternatives
│       ├── album/[slug]/comments/route.ts # GET/POST — guestbook comments
│       ├── admin/tracks/route.ts   # Admin track management
│       └── debug-kie/route.ts      # GET — KIE API diagnostic (temporary)
├── components/
│   ├── MusicalTypeSelector.tsx     # 6-genre grid picker (classic broadway, rock opera, etc.)
│   ├── PlaybillView.tsx            # Two-page playbill spread (synopsis, cast, musical numbers)
│   ├── CurtainLoader.tsx           # Theatre-themed loading screen with stage metaphors
│   ├── SongCard.tsx                # Song card — playbill + dark variants, generate/retry, lyrics toggle
│   ├── AlbumPlayer.tsx             # Crossfading album player with tracklist
│   ├── AudioPlayer.tsx             # HTML5 audio player with vinyl spin animation
│   ├── Guestbook.tsx               # Comments section for album pages
│   ├── SheetMusicBg.tsx            # SVG parallax background (legacy, may be unused)
│   ├── TrackCard.tsx               # Glass card with audio (legacy V2)
│   ├── MomentInput.tsx             # Story textarea + emotion picker (legacy V2)
│   └── ui/                         # shadcn/ui primitives (badge, button, card, etc.)
└── lib/
    ├── types.ts                    # All TypeScript types — MusicalType, SongRole, PlaybillContent, etc.
    ├── musical-types.ts            # 6 genre configs with song structures + style prompts
    ├── generate-show.ts            # V4 orchestrator: enrich → playbill → parallel track gen
    ├── supabase.ts                 # Supabase clients (anon + service role)
    ├── deepseek.ts                 # DeepSeek V3 API client (callDeepSeek, callDeepSeekJSON)
    ├── suno-kie.ts                 # KIE.ai music generation (submit → poll → return)
    ├── prompts.ts                  # All LLM prompt builders
    ├── sanitize.ts                 # PII sanitization (names, addresses, etc.)
    ├── mood-colors.ts              # Emotion-based color palettes (legacy, backward compat)
    ├── generate-booklet.ts         # PDF playbill generation (jsPDF)
    ├── log-generation.ts           # Generation event logging
    ├── utils.ts                    # cn() helper (clsx + tailwind-merge)
    ├── generate-track.ts           # V2 legacy per-moment generator
    ├── generate-meta.ts            # V2 legacy album meta generator
    ├── pipeline.ts                 # V1 legacy — 7-step full pipeline
    └── suno.ts                     # V1 legacy — gcui-art/suno-api interface
```

---

## User Flow (V4 — Broadway)

```
Landing (/)
  └─ "Create Your Show" → Create (/create)
       ├─ Step 1: Pick musical genre (6 options via MusicalTypeSelector)
       ├─ Step 2: Describe your show idea (one sentence, up to 500 chars)
       └─ Submit → POST /api/session + POST /api/generate-track
            └─ Theatre loading screen (CurtainLoader)
                 "Raising the curtain..." → "The orchestra is tuning..."
                 → "Rehearsing Act I..." → "Stitching the costumes..."
                 Polls GET /api/status/[projectId] every 5s
            └─ Ready → redirect to Album (/album/[slug])
                 ├─ Proscenium curtain backdrop (velvet panels + gold arch)
                 ├─ Programme cover (click to open)
                 ├─ Playbill spread (synopsis, cast, setting, musical numbers)
                 ├─ 6 tracks in Act I / Intermission / Act II structure
                 ├─ Track 1 auto-generated; tracks 2-6 generated on demand
                 ├─ Guestbook comments
                 └─ Download: ZIP + PDF playbill
```

---

## Musical Types (`lib/musical-types.ts`)

6 genres, each with style overview + 6-song structure:

- **Classic Broadway** 🎭 — orchestral, lush strings, big band
- **Rock Opera** 🎸 — electric guitars, power vocals, arena rock
- **Jukebox Musical** 🎵 — pop-influenced, feel-good, catchy hooks
- **Disney-Style** ✨ — orchestral, whimsical, soaring melodies
- **Hip-Hop Musical** 🎤 — rap, spoken word, beatbox, urban rhythms
- **Romantic Musical** 💕 — piano-led, intimate, sweeping ballads

Each defines 6 song roles:
1. **Opening Number** — establishes the world
2. **I Want Song** — protagonist reveals desire
3. **Confrontation** — conflict erupts
4. **Act II Opening** — new context after intermission
5. **Eleven O'Clock Number** — emotional climax
6. **Finale** — resolution and curtain call

---

## API Routes

- **`POST /api/session`** — Create project with `musical_type` + `idea`, return `projectId`
- **`POST /api/generate-track`** — Orchestrator: enrich idea → create playbill → generate track 1 lyrics → fire track 1 audio (background via `after()`)
- **`POST /api/generate-song`** — Per-track worker: generate lyrics + audio for tracks 2-6 (fired by frontend on demand)
- **`GET /api/status/[projectId]`** — Poll project + tracks + album status
- **`GET /api/album/[slug]`** — Fetch album + tracks by `share_slug`
- **`POST /api/album/[slug]/title`** — Switch album title from alternatives list
- **`GET/POST /api/album/[slug]/comments`** — Guestbook read/write
- **`GET /api/admin/tracks`** — Admin track management

---

## Generation Pipeline (V4 — `generate-show.ts`)

1. **Enrich** — DeepSeek expands 1-sentence idea → `ShowConcept` (title options, setting, synopsis, characters, emotional arc, themes)
2. **Create 6 track placeholders** — all tracks inserted upfront with song roles
3. **Generate playbill + album** — synopsis, cast, setting, acts → creates album record with `share_slug`
4. **Generate track 1 lyrics** — DeepSeek generates opening number lyrics
5. **Fire track 1 audio** — POST to `/api/generate-song` (KIE.ai, fire-and-forget)
6. **Tracks 2-6** — user triggers individually from the playbill after track 1 completes

**Status flow:** `intake` → `enriching` → `generating_music` → `complete` (or `failed`)
**Track statuses:** `pending` → `generating_lyrics` → `lyrics_done` → `generating_audio` → `complete` (or `failed`)

---

## Database Schema (Supabase, `libretto` schema)

**projects** — id, session_token, status, version (3), musical_type, idea, backstory (ShowConcept JSON)

**story_intake** — project_id, step, content (JSONB) — raw user input

**tracks** — project_id, track_number, song_role, title, lyrics, style_prompt, suno_task_id, audio_url, cover_image_url, duration, status, retry_count

**albums** — project_id, title, tagline, cover_image_url, biography_markdown, playbill_content (JSON), title_alternatives (JSON), share_slug

**generated_content** — project_id, content_type, content (JSONB), llm_model

---

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (RLS)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (bypasses RLS)
- `DEEPSEEK_API_KEY` — DeepSeek V3 LLM
- `KIE_API_KEY` — KIE.ai (Suno music generation)
- `KIE_CALLBACK_URL` — KIE webhook (optional, defaults to placeholder)

---

## Third-Party Integrations

- **Supabase** (`lib/supabase.ts`) — PostgreSQL database, `libretto` schema on project `netbsyvxrhrqxyzqflmd`
- **DeepSeek V3** (`lib/deepseek.ts`) — LLM for enrichment, lyrics, playbill, album titles. OpenAI-compatible API.
- **KIE.ai** (`lib/suno-kie.ts`) — Suno music generation proxy. Submit → poll every 10s → pick longest track. ~65s per generation.

**KIE.ai gotchas:**
- `callBackUrl` field required in POST body (422 without it)
- Use `customMode: true` + `style` field (not `custom`/`tags`)
- Response uses camelCase: `audioUrl`, `imageUrl`
- Returns 2 tracks per generation — pick the longest

---

## Design System — Broadway Theatre

**Palette:**
- Background: `#08070A` (theatre black)
- Primary: `#C9A84C` (Broadway gold) / `#E8C872` (light gold) / `#8A7434` (dim gold)
- Text: `#F2E8D5` (cream/spotlight white) / `#B8AD9A` (muted cream)
- Accent: `#6B1D2A` (burgundy) / `#8E2E3E` (light burgundy)
- Interior: `#1A0F1E` (velvet purple) / `#2A1F16` (stage wood)

**Fonts:** Playfair Display (headlines), Cormorant Garamond (body/prompts), Oswald (UI)

**Key CSS classes:**
- `curtain-backdrop` / `curtain-proscenium` / `curtain-panel` / `curtain-valance` — full proscenium theatre curtain
- `curtain-open` — state class: panels slide out to reveal content
- `programme-cover` / `programme-cover-frame` — theatrical poster card (5.5:8.5 ratio)
- `programme-flip-in` — 3D page-turn entrance animation
- `playbill-spread` / `playbill-page` / `playbill-spine` — two-page spread interior
- `playbill-section-header` / `playbill-intermission` — playbill typography
- `glass-card` — frosted dark card with gold border
- `marquee-title` / `marquee-border` — Broadway marquee text + animated dashed border
- `spotlight-hero` / `overture-bg` — radial gradient hero backgrounds
- `gold-text` / `gold-text-static` — shimmer and static gold gradient text
- `art-deco-divider` — gold gradient line dividers
- `stage-enter` / `stage-enter-1..6` — staggered cascade entrance animations
- `curtain-rise` — animated curtain reveal from top
- `vinyl-spinning` / `vinyl-paused` — album cover spin animation
- `generate-btn` — gold-bordered track generation button

**Pages are transparent** — `<main>` has no background; the body provides the dark theatre backdrop.

---

## Dependencies

- `next` 16.1.6 — Framework
- `react` 19.2.3 — UI
- `@supabase/supabase-js` ^2.96.0 — Database client
- `react-markdown` + `remark-gfm` ^10.1.0 — Biography/playbill rendering
- `jszip` ^3.10.1 — Album download (ZIP)
- `jspdf` ^4.2.0 — PDF playbill generation
- `lucide-react` ^0.574.0 — Icons
- `tailwindcss` ^4 — Styling
- `@tailwindcss/typography` ^0.5.19 — Markdown prose styling
- `lightningcss` ^1.31.1 — CSS optimization
- `radix-ui` ^1.4.3 — UI primitives (via shadcn)
