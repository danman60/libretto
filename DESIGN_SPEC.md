# Broadwayify — Design Spec (Feb 23, 2026)

## User Vision

### Overall Flow
1. **Create page** → Pick genre, enter idea, click Create
2. **Nice loading screen** → Theatrical, progress-aware, rotating messages
3. **Album page** → Single-sided musical poster/programme cover
4. **Click to open** → Programme opens to reveal interior
5. **Inside layout**: Songs on LEFT, Song list on RIGHT

### Album Page Redesign — "The Programme"

**Concept:** The album page IS a physical Broadway programme/playbill.

**Closed state (landing view):**
- Single-sided poster — like a Moulin Rouge opening night playbill
- Show title, cover art, dramatic tagline
- "Open Programme" CTA (tap/click to open)

**Open state (interior):**
- **Left side**: Cast/synopsis/playbill content (ref: Porgy and Bess 1936 layout)
- **Right side**: Song list with track numbers, titles, and play buttons
  (ref: "Shucked" Broadway playbill song listing)

### Branding References
- Moulin Rouge Opening Night Playbill (playbillstore.com) — premium, theatrical
- "Shucked" Broadway playbill song listing (Reddit) — song list layout
- George Gershwin's Porgy and Bess 1936 playbill (maxrambod.com) — vintage left-side

### Brand: "BROADWAYIFY"
- Keep existing gold/cream/velvet palette
- Steal the premium theatrical feel from Moulin Rouge programme
- Vintage programme typography from Porgy and Bess era

## Technical Issues (Current)

### /api/generate-song 405 Error
- Route file exists locally but was **never committed** (untracked)
- On Vercel, route doesn't exist → 405
- Fix: commit `src/app/api/generate-song/route.ts`

### Loading Screen (DONE — not yet deployed)
- Create page now fires generation in background
- Polls `/api/status/[projectId]` every 2.5s
- Shows: stage label, rotating messages, progress bar, elapsed timer
- Redirects to album page when share_slug available
- Error state with retry button

### Title Sizing (DONE — not yet deployed)
- Hero title now uses `clamp(2.5rem, 10vw, 8rem)` fluid sizing
- Container widened to `max-w-5xl`
- Letter-spacing reduced to `0.15em` (was `0.25em`)
