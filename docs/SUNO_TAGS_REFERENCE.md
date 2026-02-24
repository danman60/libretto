# Suno AI Music Generation Tags — Definitive Reference

> **Purpose:** Comprehensive reference for generating Broadway-style musical theatre songs via Suno (through KIE.ai API).
> **Last Updated:** 2026-02-24
> **Covers:** Suno v4, v4.5, v5

---

## 1. STYLE FIELD vs LYRICS FIELD — What Goes Where

### Style Field (Style of Music)
- **Character limit:** 200 chars (Simple Mode) / 1,000 chars (Custom Mode)
- **Purpose:** Global sonic blueprint — defines the overall SOUND of the song
- **Format:** Comma-separated descriptors, NOT square brackets
- **What belongs here:** Genre, sub-genre, mood, instrumentation, vocal style, production quality, tempo feel, era
- **v4.5+ improvement:** Now accepts conversational/narrative descriptions, not just keywords
  - Old: `"deep house, emotional, melodic"`
  - New: `"Create a melodic, emotional deep house song with organic textures and hypnotic rhythms"`

### Lyrics Field
- **Purpose:** Song text + structural metatags in `[square brackets]`
- **What belongs here:** Actual lyrics, section markers `[Verse]`, voice/performance cues `[Belting]`, sound effects `[Applause]`
- **Rule:** Keep style prompt about SOUND, lyrics prompt about LYRICS and STRUCTURE

### Exclude Styles Field (v5)
- **Purpose:** Negative prompting — what you DON'T want
- **Format:** Comma-separated terms
- **Limit:** 4-6 exclusions max; more can hollow out the arrangement
- **Examples:** `"Acoustic, Lo-fi, Muffled"` or `"no autotune, no 808s"`
- **v5 respects this better** than previous versions

---

## 2. TAG ORDERING — Yes, It Matters

**The first tag carries the greatest weight.** Suno prioritizes satisfying the first descriptor most strongly.

### Recommended Order:
1. **Primary genre** (most important sonic identity)
2. **Sub-genre or era** (narrows the sound)
3. **Mood/emotion** (emotional character)
4. **Instrumentation** (2-3 key instruments)
5. **Vocal style** (delivery method)
6. **Production quality** (polish level)

### Example for Musical Theatre:
```
Musical Theater, Broadway, Dramatic, Grand Piano, Orchestral Strings, Powerful Belting, Cinematic
```

### Quantity Rules:
- **Sweet spot: 4-8 style tags** (one per category)
- **3-5 well-chosen descriptors** outperform 10 scattered ones
- Too few = Suno guesses too freely
- Too many (10+) = conflicting signals, muddy output
- **Max 3-4 instruments** before Suno gets confused

---

## 3. STRUCTURAL METATAGS (In Lyrics Field)

### Reliable Tags (Suno consistently respects these):
| Tag | Function |
|-----|----------|
| `[Verse]` / `[Verse 1]` / `[Verse 2]` | Primary melodic/lyrical section |
| `[Chorus]` / `[Chorus x2]` | Central repeating hook |
| `[Pre-Chorus]` | Builds anticipation before chorus |
| `[Bridge]` | Contrast/transition, usually later in song |
| `[Outro]` / `[Ending]` / `[End]` | Signal song is finishing |
| `[Hook]` | Central catchy phrase |
| `[Break]` | Pause or breakdown |
| `[Instrumental]` | No vocals, music only |
| `[Interlude]` | Short musical passage between sections |
| `[Solo]` / `[Guitar Solo]` | Instrumental solo |
| `[Drop]` | Energy drop (EDM-style) |
| `[Buildup]` / `[Build]` | Rising tension toward payoff |
| `[Fade Out]` / `[Fade In]` | Volume transitions |

### Less Reliable Tags:
| Tag | Issue |
|-----|-------|
| `[Intro]` | **Notoriously unreliable.** Try "short instrumental intro" in style prompt instead |
| `[Post-Chorus]` | Sometimes ignored; merges with chorus |
| `[Movement]` | Works inconsistently |

### Advanced Structural Tags (v5):
- `[Callback: Chorus melody]` — References a previous section's melody
- `[Ascending progression]` — Builds harmonic tension
- `[Bridge modulation]` — Key change at the bridge
- `[Emotional climax]` — Peak emotional intensity
- `[Modulate up a key]` — Raises pitch (put before the section you want raised)
- `[Modulate down a key]` — Lowers pitch

### Best Practices:
- Keep lyrics to **6-12 syllables per line** for cleanest alignment
- Long lines work for rap/recitative but sound terrible in melodic songs (Suno breaks them at wrong points)
- Structure first, then add 1-3 performance cues per section max

---

## 4. MUSICAL THEATRE / BROADWAY SPECIFIC

### Working Style Tags for Broadway:
```
Musical Theater, Broadway, Dramatic, Theatrical Vocals
Musical Theater, Power Ballad, Orchestral, Emotional, Grand Piano
Broadway, Upbeat, Showstopper, Big Band, Belting
Musical Theater, Intimate Ballad, Piano, Strings, Vulnerable
Broadway, Comedic, Uptempo, Vaudeville, Playful
Musical Theater, Epic, Cinematic, Full Orchestra, Choir
```

### Genre Tags That Apply:
- `Musical Theater` / `Musical Theatre` — Primary genre tag
- `Broadway` — Works as a genre modifier
- `Opera` — For operatic/classical vocal styles
- `Cabaret` — Intimate theatrical style
- `Vaudeville` — Old-timey theatrical
- `Gospel` — For gospel-influenced theatre numbers
- `Power Ballad` — Classic broadway ballad feel
- `Ballad` — Slower emotional number
- `Cinematic` — Sweeping, film-score quality
- `Orchestral` — Full orchestra sound

### Song Type Recipes for Theatre:

**The "I Want" Song (Character establishing desire):**
```
Style: Musical Theater, Broadway, Hopeful, Building, Piano, Orchestral Strings
Structure: [Verse] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Chorus] → [Bridge | Belting] → [Chorus | Powerful]
```

**The Villain Song (Dramatic antagonist number):**
```
Style: Musical Theater, Dark, Dramatic, Minor Key, Orchestral, Powerful Vocals
Structure: [Verse | Menacing] → [Chorus | Powerful] → [Bridge | Spoken Word] → [Chorus | Belting, Triumphant]
```

**The Comedy Number (Upbeat, funny):**
```
Style: Musical Theater, Broadway, Comedic, Uptempo, Playful, Brass Section
Structure: [Verse | Playful] → [Chorus | Energetic] → [Verse 2] → [Chorus] → [Bridge | Spoken Word] → [Chorus]
```

**The Love Duet:**
```
Style: Musical Theater, Romantic Duet, Intimate, Piano, Strings, Warm
Lyrics: Use persona names or [Male Vocal] / [Female Vocal] labels per section
```

**The Act One Finale (Big ensemble closer):**
```
Style: Musical Theater, Epic, Broadway, Full Orchestra, Choir, Dramatic, Building, Powerful
Structure: [Verse] → [Build] → [Chorus] → [Bridge | Modulate up a key] → [Chorus | Belting, Full Orchestra]
```

**The Eleven O'Clock Number (Emotional climax):**
```
Style: Musical Theater, Power Ballad, Emotional, Dramatic, Orchestral, Cinematic
Structure: [Verse | Soft, Vulnerable] → [Chorus | Building] → [Bridge | Emotional climax] → [Chorus | Belting, Powerful, Full Orchestra]
```

---

## 5. VOCAL STYLE TAGS

### Gender / Character Tags:
- `[Male Vocal]` / `[Male Singer]` / `[Man]` / `[Boy]`
- `[Female Vocal]` / `[Female Singer]` / `[Woman]` / `[Girl]`
- `[Duet]` — Attempts two voices (unreliable, see duet section)
- `[Choir]` / `[Choir Vocals]`
- `[Backing Vocals]`
- `[Stacked Harmonies]`

### Vocal Technique Tags:
- `[Belting]` — Powerful, full-voice singing (Broadway staple)
- `[Falsetto]` — High, light singing
- `[Operatic]` — Classical vocal technique
- `[Crooning]` — Smooth, intimate singing
- `[Whisper]` / `[Whispered Vocals]` — Breathy, quiet
- `[Spoken Word]` / `[Narration]` / `[Spoken Verse]` — Speaking, not singing
- `[Rap]` / `[Rap Verse]` — Rhythmic spoken delivery
- `[Sprechgesang]` — Half-spoken, half-sung (German theatrical technique)
- `[Scat]` — Jazz vocal improvisation
- `[Growl]` — Rough, aggressive vocal
- `[Screaming]` — Extreme vocal
- `[Harmonies]` — Multi-part vocal harmony
- `[Melismatic]` — Multiple notes per syllable (runs/riffs)
- `[Monotone]` — Flat, single-note delivery

### Vocal Tone Tags:
- `Airy` / `Breathy` / `Crisp` / `Deep` / `Gritty` / `Smooth`
- `Raspy Vocals` / `Sultry` / `Resonant` / `Ethereal`
- `Warm` / `Bright` / `Rich`

### Vocal Range Modifiers:
- `[Low-pitched]` / `[High-pitched]` / `[Mid-range]`
- `Male Tenor` / `Female Soprano` / `Baritone` / `Alto`
- `[Chest Voice]` / `[Head Voice]`

### Vocal Effect Tags:
- `[AutoTune]` / `[No AutoTune]`
- `[Reverb]` / `[Delay]`
- `[Distorted Vocals]` / `[Filtered Vocals]`
- `[Vocoder]` / `[Telephone Effect]`
- `[Radio Filter]`

### Emotion/Performance Tags (in lyrics field):
- `[Vulnerable]` / `[Powerful]` / `[Soft]` / `[Aggressive]`
- `[Melancholic]` / `[Joyful]` / `[Sultry]` / `[Defiant]`
- `[Intimate]` / `[Triumphant]` / `[Desperate]`
- `[Angry Verse]` / `[Sad Verse]` / `[Whimsical Verse]`

### Important Notes on Vocals:
- Voice tags are **"hit and miss"** — expect to regenerate 2-5 times
- Specify register changes per section for dynamic performances
- ALL CAPS in lyrics = emphasized/shouted delivery: `"NEVER AGAIN!"` vs `"never again"`
- ALL CAPS with `!` = powerful shouts; ALL CAPS with `?` = dramatic desperation
- Using "Voices" (plural) in style prompt helps trigger multi-voice generation

---

## 6. CREATING DUETS (Critical for Musical Theatre)

### Method 1: Persona System (Most Reliable, v4.5+)
1. Generate a song with a female vocalist → save as Persona (e.g., "Rebecca")
2. Generate a song with a male vocalist → save as Persona (e.g., "Gabriel")
3. Structure lyrics with persona labels:
```
[Verse 1 - Gabriel]
I've been searching for the words to say...

[Verse 2 - Rebecca]
I've been waiting for you to begin...

[Chorus - Both]
Together we can find our way...
```

### Method 2: Voice Tags in Lyrics
```
[Verse 1]
[Male Voice]
lyrics here...

[Verse 2]
[Female Voice]
lyrics here...

[Chorus]
[Duet]
lyrics here...
```

### Method 3: Parenthetical Labels
Put one character name in parentheses:
```
JOHN:
lyrics here...

(SARAH):
lyrics here...

BOTH:
lyrics here...
```

### Duet Caveats:
- Duets are **"more of an exploit than a feature"** — expect many retries
- Suno sometimes **swaps which voice sings which part**
- Broadway and Musical Theater genres make duets more likely to work
- Add `"Duet, Male and Female Voices"` to the style field
- Generate multiple versions and pick the best one
- Budget 5-10 generations per duet song

---

## 7. TEMPO / BPM TAGS

### What Works:
- **BPM numbers in style prompt:** `"120 BPM"` or `"tempo around 100 BPM"` — provides guidance but Suno treats as approximate
- **Italian tempo terms:** Suno understands classical tempo markings
  - `Largo` (40-60 BPM) — Very slow
  - `Adagio` (60-76 BPM) — Slow, stately
  - `Andante` (76-108 BPM) — Walking pace
  - `Moderato` (108-120 BPM) — Moderate
  - `Allegro` (120-156 BPM) — Fast, lively
  - `Vivace` (156-176 BPM) — Very fast
  - `Presto` (176-200 BPM) — Extremely fast
- **Descriptive terms:** `Fast Tempo`, `Slow Tempo`, `Uptempo`, `Downtempo`, `Mid-tempo`
- **Rhythm patterns** lock tempo better than tempo words:
  - `Four-on-the-floor` — Steady dance beat
  - `Halftime` — Half-speed feel
  - `Breakbeat` — Syncopated rhythm
  - `Shuffle` / `Swing` — Swung timing
  - `Waltz` — 3/4 time (useful for theatre!)

### Suno Studio (v5):
- Manual BPM control available for precise tempo
- Fixes tempo drift issues common in older versions

### For Musical Theatre:
- Ballads: `Slow, Adagio, 70 BPM`
- Mid-tempo character songs: `Moderato, 110 BPM`
- Uptempo numbers: `Allegro, Fast Tempo, 140 BPM`
- Waltz numbers: `Waltz, 3/4 time, Moderate`
- Patter songs: `Presto, Very Fast, 180 BPM`

---

## 8. MOOD / EMOTION TAGS

### Tags That Work Well:

**High Energy / Positive:**
Uplifting, Euphoric, Joyful, Triumphant, Energetic, Playful, Anthemic, Hopeful, Celebratory, Exuberant

**Dark / Intense:**
Dark, Aggressive, Intense, Menacing, Ominous, Brooding, Sinister, Haunting, Foreboding

**Emotional / Vulnerable:**
Melancholic, Nostalgic, Vulnerable, Intimate, Bittersweet, Somber, Wistful, Heartbroken, Tender, Longing

**Dramatic / Theatrical:**
Dramatic, Epic, Cinematic, Sweeping, Powerful, Climactic, Grandiose, Majestic, Soaring

**Calm / Reflective:**
Peaceful, Dreamy, Chill, Relaxed, Serene, Meditative, Contemplative, Gentle

**Romantic:**
Romantic, Passionate, Sensual, Warm, Sweet, Loving

**Comedic / Light:**
Playful, Whimsical, Quirky, Cheeky, Satirical, Lighthearted, Silly

### Rules for Emotion Tags:
- **Compatible emotions can coexist:** `"Melancholic but hopeful"` works
- **Contradictory emotions confuse:** `"Calm aggressive"` does NOT work
- **Emotion switching per section** is powerful: sad verse → angry pre-chorus → triumphant chorus
- **Specificity beats vagueness:** `"Bittersweet nostalgia"` > `"sad"`

---

## 9. INSTRUMENTATION TAGS

### Instruments Suno Responds To Well:

**Keyboards:**
Piano, Grand Piano, Electric Piano, Rhodes, Wurlitzer, Organ, Hammond Organ, Synth, Analog Synth, Moog Synth, Synth Pad, Harpsichord, Clavinet, Mellotron, Accordion

**Strings:**
Violin, Viola, Cello, Double Bass, Orchestral Strings, String Quartet, Harp, Acoustic Guitar, Electric Guitar, Distorted Guitar, Bass Guitar, Slap Bass, Upright Bass, Ukulele, Banjo, Mandolin, Sitar, Fiddle

**Brass & Woodwinds:**
Trumpet, Trombone, French Horn, Brass Section, Saxophone, Tenor Sax, Alto Sax, Flute, Clarinet, Oboe, Harmonica, Bagpipes, Didgeridoo

**Percussion:**
Drums, Acoustic Drums, Electronic Drums, 808s, 808 Bass, Drum Machine, Brush Drums, Percussion, Timpani, Congas, Bongos, Tambourine, Handclaps, Taiko Drums, Cinematic Percussion, Shakers, Gong

**Electronic/Synth:**
Synth Bass, Lead Synth, Arpeggiated Synth, Synth Stabs, Pad, Pluck Synth, Acid Bass, Supersaw

**Orchestral Groupings:**
Orchestra, Full Orchestra, Chamber Orchestra, Orchestral Strings, Brass Stabs

### For Musical Theatre, Prioritize:
1. **Grand Piano** — The backbone of theatre music
2. **Orchestral Strings** — Emotional depth
3. **Brass Section** — Big show numbers
4. **Full Orchestra** — Act finales, eleven o'clock numbers
5. **Acoustic Guitar** — Intimate folk-theatre numbers
6. **Woodwinds (Flute, Clarinet)** — Character songs, whimsical numbers

### Instrument Rules:
- **Max 3-4 instruments per generation** — More causes confusion
- Pair instruments with genre context for best results
- Use `[instrument] arpeggios` or `[instrument] melody` for specific playing styles
- In lyrics field, you can specify per section: `[VERSE: piano arpeggios + soft bass]`

---

## 10. GENRE COMBINATION STRATEGIES

### What Works Well Together:
- **Musical Theater + Pop** — Modern Broadway feel (Hamilton, Dear Evan Hansen)
- **Musical Theater + Rock** — Rock musical feel (Rent, Spring Awakening)
- **Musical Theater + Jazz** — Classic Broadway (Chicago, Cabaret)
- **Musical Theater + Gospel** — Spiritual/community numbers
- **Musical Theater + Folk** — Story-driven, Americana theatre
- **Musical Theater + Hip Hop** — Hamilton-style
- **Musical Theater + Classical/Opera** — Phantom, Les Mis
- **Musical Theater + Funk** — High-energy comedy numbers
- **Musical Theater + R&B** — Contemporary emotional numbers
- **Musical Theater + Country** — Country-flavored musical (Oklahoma revival style)
- **Symphonic + Any genre** — Adds orchestral weight
- **Cinematic + Any genre** — Adds film-score gravity

### Genre Fusion Principles:
- **Contrasting inputs produce the most interesting results** (calm + energetic, old + modern)
- **Lead with the genre you want most** (first tag = highest weight)
- **Sub-genres outperform broad genres:** `"Midwest Emo"` > `"Rock"`
- **Era specifiers help:** `"1960s Broadway"` vs just `"Broadway"`
- **Suno v5 handles complex mashups much better** than v3/v4

---

## 11. PRODUCTION / TEXTURE TAGS

### Working Production Tags:
- `Lo-fi` / `Gritty` / `Clean` / `Raw` / `Lush` / `Sparse`
- `Tape-Saturated` / `Vinyl Hiss` / `Atmospheric` / `Punchy`
- `Warm` / `Bright` / `Polished` / `Vintage` / `Modern`
- `Minimal` / `Dense` / `Full Mix` / `Stripped Back`
- `Live Session Feel` / `Unplugged` / `Natural`
- `Wide Soundstage` / `Intimate Recording`

### Energy/Dynamics Tags:
- `[High Energy]` / `[Medium Energy]` / `[Low Energy]`
- `[Chill]` / `[Driving]` / `[Explosive]` / `[Building]`
- `[Relaxed]` / `[Frantic]` / `[Steady]`

---

## 12. SOUND EFFECT TAGS (In Lyrics Field)

### Environment:
`[Rain]`, `[Thunder]`, `[Wind]`, `[Ocean Waves]`, `[City Ambience]`, `[Fire Crackling]`, `[Birds Chirping]`, `[Forest]`

### Human/Audience:
`[Applause]`, `[Cheering]`, `[Cheers and Applause]`, `[Clapping]`, `[Audience Laughing]`, `[Crowd Sings]`, `[Crowd Yells]`

### Mechanical:
`[Phone Ringing]`, `[Static]`, `[Record Scratch]`, `[Bell Dings]`

### Musical Control:
`[Silence]`, `[Fade]`, `[Stop]`, `[Censored]`

### For Theatre:
- `[Applause]` at the end of showstoppers
- `[Crowd Sings]` for audience-participation moments
- `[Silence]` before dramatic moments

---

## 13. TAGS TO AVOID / COMMON MISTAKES

### Tags That Cause Problems:
- **`[Intro]`** — Notoriously unreliable. Use descriptive style prompt instead
- **Contradictory emotions:** `"Calm, Aggressive"` / `"Chill, High Energy"`
- **Too many instruments** (5+) — Suno loses focus
- **Long prose in style field** — Pre-v4.5, stick to comma-separated keywords
- **Vague descriptors:** `"Good music"` / `"Nice sounding"` / `"No bad sounds"` — means nothing to model
- **Artist names** — Copyright restricted; describe the style characteristics instead

### Common Mistakes:
1. **Vague prompts** — cause 70% of tracks to need 3+ regenerations
2. **Underfilling style tags** — leaving the style field sparse/empty
3. **Too many metatags per section** — 1-3 max; more creates noise
4. **Long verse lines** — Suno breaks them at wrong syllable points
5. **Sound effects in style prompt** — They go in lyrics field only
6. **Expecting literal interpretation** — Tags are guidance, not commands
7. **Not specifying structure** — Without `[Verse]`/`[Chorus]`, Suno guesses (badly)
8. **Stacking too many negatives** (5+) — Can hollow out arrangement
9. **Changing one thing while expecting everything else to stay** — Suno regenerates everything
10. **Not regenerating** — Any single generation is a lottery; plan for 3-5 attempts minimum

### What Suno CANNOT Do (Known Limitations):
- **Precise BPM control** — It approximates, it doesn't lock to exact BPM (use Studio manual BPM for precision)
- **Reliable duets** — Multi-voice is an exploit, not a feature; budget many retries
- **Consistent voice across extends** — Voice and rhythm can change when extending songs
- **Exact instrument isolation** — Cannot guarantee only specified instruments play
- **Complex polyrhythms** — Struggles with unusual time signatures beyond 3/4 and 4/4
- **Literal following of every tag** — Some tags get ignored; it's probabilistic
- **Long-form coherence** — v5 improved this (up to 8 minutes) but structure can still drift
- **Pronunciation** — Sometimes mispronounces words, especially unusual names
- **Lyric repetition** — May repeat or skip lyrics
- **Copyright-clear output** — Cannot guarantee no melodic overlap with existing songs

---

## 14. SUNO VERSION DIFFERENCES

### v4 (Legacy):
- Strict keyword-only style prompts
- 120-character style limit
- Basic metatag support
- Inconsistent tag handling

### v4.5:
- 1,000-character style field
- Conversational/narrative style prompts now work
- Better prompt following
- Persona system for duets
- Improved vocal clarity

### v5 (Current — Sept 2025):
- Superior audio quality and authentic vocals
- Tags are **more consistent** with clearer emotion parsing
- Better **section-aware editing** (in Studio)
- **Negative prompting** via Exclude Styles field works reliably
- `[Callback]` tag for referencing previous sections
- Up to **8-minute songs** with structural coherence
- **Stem export** (drums, bass, vocals, synths separately)
- **Manual BPM control** in Studio
- **Suno Studio** — built-in DAW for editing, layering, refining
- Respects exclusions like `"no autotune"` much better
- Lyric alignment cleaner at 6-12 syllables per line
- Complex genre mashups (K-pop + Opera, Gospel + Trap) work seamlessly

---

## 15. ADVANCED TRICKS FOR MUSICAL THEATRE

### Emphasis Techniques:
- **ALL CAPS for climactic moments:** `"I WILL NOT BE SILENCED!"` — triggers powerful delivery
- **ALL CAPS + `!`** = Belting/shouting
- **ALL CAPS + `?`** = Dramatic desperation
- **Repeated words for echo effect:** `"sky sky sky"` creates auto-tune-like repetition
- **Hyphenated spelling:** `"L-O-V-E"` makes AI spell out each letter
- **Hyphenated stuttering:** `"I-I-I can't"` creates vocal stutter (good for emotional breaks)

### Dynamic Section Building:
```
[Verse 1 | Soft, Intimate, Piano]
quiet lyrics here...

[Pre-Chorus | Building, Strings join]
tension building lyrics...

[Chorus | Powerful, Belting, Full Orchestra]
BIG EMOTIONAL PAYOFF LYRICS!

[Bridge | Vulnerable, Stripped Back, Piano only]
quiet reflection...

[Final Chorus | Belting, Triumphant, Modulate up a key]
EVEN BIGGER PAYOFF!
```

### Per-Section Instrumentation:
```
[VERSE] guitar arpeggios + soft bass + light percussion
[CHORUS] full band: brass stabs + gospel choir + synth pad
```

### Live Theatre Feel:
- Add `"Live, Raw, Natural"` to style prompt
- Use `[Crowd Sings]` for audience participation moments
- `[Applause]` or `[Cheers and Applause]` after showstopper numbers
- `Live Session Feel, Warm, Natural Reverb` in style field

### Recitative (Sung-Spoken Dialogue):
- Use `[Spoken Word]` or `[Sprechgesang]` tags
- Keep lyrics as short natural phrases
- Pair with `Musical Theater, Dramatic, Piano` in style
- Long lines work better for recitative than for melodic sections

### Key Changes:
- `[Modulate up a key]` before the final chorus = classic Broadway climax move
- Place the tag on its own line before the section you want modulated

---

## 16. COMPLETE STYLE PROMPT TEMPLATES FOR BROADWAY

### Template Structure:
```
[Primary Genre], [Sub-genre/Era], [Mood 1], [Mood 2], [Key Instrument 1], [Key Instrument 2], [Vocal Style], [Production Quality]
```

### Ready-to-Use Templates:

**Classic Broadway Ballad:**
```
Musical Theater, Broadway, Emotional, Sweeping, Grand Piano, Orchestral Strings, Powerful Belting, Cinematic, Warm
```

**Modern Musical Pop Number:**
```
Musical Theater, Pop, Upbeat, Hopeful, Piano, Light Percussion, Smooth Vocals, Polished, Contemporary
```

**Dramatic Villain Song:**
```
Musical Theater, Dark, Dramatic, Menacing, Minor Key, Full Orchestra, Timpani, Powerful Vocals, Cinematic
```

**Jazz-Influenced Theatre Number:**
```
Musical Theater, Jazz, Cabaret, Sultry, Saxophone, Upright Bass, Brush Drums, Smooth, Vintage
```

**Rock Musical Anthem:**
```
Musical Theater, Rock, Anthemic, Powerful, Electric Guitar, Drums, Driving, Raw, Belting
```

**Intimate Character Song:**
```
Musical Theater, Acoustic, Intimate, Vulnerable, Piano, Soft Strings, Breathy Vocals, Warm, Minimal
```

**Gospel-Influenced Ensemble:**
```
Musical Theater, Gospel, Uplifting, Powerful, Choir, Organ, Clapping, Full Voice, Building
```

**Comedic Patter Song:**
```
Musical Theater, Broadway, Comedic, Fast Tempo, Playful, Piano, Brass Section, Light, Uptempo
```

**Epic Finale:**
```
Musical Theater, Epic, Cinematic, Orchestral, Sweeping Strings, Brass Swells, Choir, Dramatic, Powerful, Building to Climax
```

**Hamilton-Style Rap Theatre:**
```
Musical Theater, Hip Hop, Broadway, Rap, Piano, Snare, Dramatic, Intense, Storytelling
```

---

## 17. REFERENCE CHEAT SHEET

### Quick Formula:
```
Style: [Genre], [Sub-genre], [Mood], [Instrument 1], [Instrument 2], [Vocal Style], [Energy]
Lyrics: [Section Tag | Performance Cue] + lyrics (6-12 syllables/line)
Exclude: [Things you don't want]
```

### Broadway Quick Tags:
| Song Type | Key Style Tags |
|-----------|---------------|
| Power Ballad | `Musical Theater, Power Ballad, Emotional, Piano, Strings, Belting` |
| Comedy | `Musical Theater, Comedic, Uptempo, Playful, Brass, Piano` |
| Villain | `Musical Theater, Dark, Dramatic, Orchestra, Menacing, Powerful` |
| Love Song | `Musical Theater, Romantic, Intimate, Piano, Strings, Warm` |
| Ensemble | `Musical Theater, Epic, Choir, Full Orchestra, Building, Powerful` |
| Opening | `Musical Theater, Energetic, Bright, Full Band, Exciting, Uplifting` |
| "I Want" | `Musical Theater, Hopeful, Building, Piano, Strings, Yearning` |
| Showstopper | `Musical Theater, Broadway, Explosive, Big Band, Belting, Triumphant` |

### Syllable Guide for Lyric Lines:
- **Ballads:** 6-8 syllables per line
- **Mid-tempo:** 8-10 syllables per line
- **Uptempo/Rap:** 10-14 syllables per line
- **Patter songs:** 12-16 syllables (but expect some misalignment)

---

## Sources & Further Reading

- [Musci.io — Complete Suno Tags Guide](https://musci.io/blog/suno-tags)
- [OpenMusicPrompt — 500+ Pro Tags](https://openmusicprompt.com/blog/suno-ai-metatags-guide)
- [HookGenius — 300+ Style Tags](https://hookgenius.app/learn/suno-style-tags-guide/)
- [Jack Righteous — Meta Tags Guide](https://jackrighteous.com/en-us/pages/suno-ai-meta-tags-guide)
- [Jack Righteous — Epic Modifier Guide](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-epic-modifier-guide)
- [Jack Righteous — Tempo Guide](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/master-tempo-in-music-comprehensive-guide-to-tempo-tags)
- [Stoke McToke — Complete Meta Tags Guide](https://stokemctoke.com/the-complete-suno-ai-meta-tags-guide/)
- [Suno Help — V4.5 Style Instructions](https://help.suno.com/en/articles/5782849)
- [Suno Help — V5 Introduction](https://help.suno.com/en/articles/8105153)
- [Suno Help — Exclude Styles](https://help.suno.com/en/articles/3161921)
- [HowToPromptSuno — Voice Tags](https://howtopromptsuno.com/making-music/voice-tags)
- [HowToPromptSuno — Instrument Tags](https://howtopromptsuno.com/making-music/instrumental-tags)
- [Cantus Ex Machina — Genre & Style List](https://cantusexmachina.com/list-of-suno-ai-genres-and-styles/)
- [Lilys.ai — Persona Duets Guide](https://lilys.ai/en/notes/suno-ai-song-20251209/suno-persona-duets)
- [Lilys.ai — Working Reddit Hacks](https://lilys.ai/en/notes/suno-ai-20260130/suno-ai-working-hacks)
- [Yeb.to — Mastering Style Tags](https://yeb.to/mastering-style-tags-in-suno-ai-2025-the-ultimate-guide-to-custom-music-generation)
- [Jack Righteous — Negative Prompting v5](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/negative-prompting-suno-v5-guide)
- [WokeWaves — 75 Genre Fusions](https://www.wokewaves.com/posts/75-genre-combinations-suno-ai)
