# Bible Development → Sync Workflow

## The Two Artifacts

1. **MTBible Map** (`public/mtbible-map.html`) — The verbose reference bible. Contains expert quotes, classification badges, examples, theory. Human-readable. Source of truth for ALL musical theatre craft knowledge.

2. **Code Prompts** (`lib/prompts.ts` + `lib/musical-types.ts`) — The distilled, actionable prompt injections. Machine-readable. What DeepSeek and Suno actually receive.

**The bible is ALWAYS ahead of the code.** We develop craft knowledge in the bible first, then sync relevant portions into prompts.

---

## Workflow

### Phase 1: Bible Development
- Research → analyze → add to `mtbible-map.html`
- Include expert quotes, examples, classification (A/B/C/D)
- Tag every section with pipeline target: `DEEPSEEK` / `SUNO` / `BOTH`
- Be verbose — the bible is a reference doc, not a prompt

### Phase 2: Sync to Code
- Read the bible sections tagged for the target layer
- **For DeepSeek (lyrics prompt):** Distill into 1-2 sentence rules per song role. Max 3-5 rules per song (Prompt Economy — Section 13)
- **For DeepSeek (enrichment prompt):** Add dramatic function types, pacing arc, genre-specific principles
- **For Suno (style/structure):** Translate to tags + metatag templates via `suno-profiles.ts` (future)
- Commit with message: `sync: MTBible → [target] prompts`

### Phase 3: Test & Iterate
- Generate a show, review lyrics quality
- Compare against bible principles — what landed? what didn't?
- Adjust prompt injection density (less = better, per Prompt Economy)
- Feed findings back into bible if new patterns discovered

---

## Sync Checklist

When syncing bible → code, check each:

| Bible Section | Code Target | What to Sync |
|---|---|---|
| S1: 10 Commandments | `buildSongLyricsPrompt()` | Condensed rules (3-5 per song role, not all 10) |
| S2: Dramatic Function | `lyrics_guidance` per role | Transition/Realization/Decision type |
| S7: Opening & I Want | `lyrics_guidance` for songs 1-2 | "Teach audience how to watch" / "within 15 min" |
| S9: Subtext | `lyrics_guidance` for appropriate roles | Self-delusion, complaint→prayer, bold strokes |
| S10: Reprises | `lyrics_guidance` for Finale | Feed earlier hooks into Finale prompt |
| S11: Comedy | `lyrics_guidance` when comedy applies | Game type + "save best for last" |
| S13: Prompt Economy | ALL prompts | Max 3-5 rules per song. Curate, don't dump. |
| S14: Suno Translation | `suno-profiles.ts` (future) | Style strings, structure templates, syllable budget |

---

## Key Principle

> The enrichment step is the CURATOR. It decides WHICH 3-5 principles matter for THIS show and THIS song. The bible has 50+ rules — the prompt gets 5.

**Never dump the whole bible into a prompt.** More instructions = worse output from both DeepSeek and Suno.

---

## Version History

| Date | Bible Version | Sync Target | Notes |
|---|---|---|---|
| 2026-02-24 | v4 (15 sections) | Quick sync: lyrics prompt + lyrics_guidance | First L2/L3 integration |
