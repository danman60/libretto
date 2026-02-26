import type { MusicalType, SongRole, ShowConcept } from './types';
import type { MusicalTypeConfig, SongRoleConfig } from './musical-types';

/** Last MTBible version these prompts were synced to */
export const MTBIBLE_SYNC_VERSION = 'v4';

// ===== Show Enrichment =====

export function buildEnrichmentPrompt(
  idea: string,
  config: MusicalTypeConfig
): string {
  const songList = config.song_structure
    .map((s, i) => `  ${i + 1}. ${s.label} (${s.role}) — ${s.description}`)
    .join('\n');

  return `You are a Broadway musical dramaturg. A user wants to create a ${config.label} musical. Turn their short idea into a full show concept.

## Musical Type
${config.label}: ${config.description}
Style: ${config.style_overview}
Enrichment notes: ${config.enrichment_hints}

## Song Structure (6 songs)
${songList}

## The User's Idea
"${idea}"

## Your Task
Expand this idea into a rich, producible show concept. Invent compelling characters, a specific setting, and a dramatic arc that fits the ${config.label} tradition.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "title_options": [
    { "title": "Best Title", "tagline": "One-line emotional tagline" },
    { "title": "Second Option", "tagline": "Another tagline" },
    { "title": "Third Option", "tagline": "Third tagline" }
  ],
  "recommended_title": 0,
  "setting": "Where and when the show takes place (1-2 sentences)",
  "synopsis": "3-4 paragraph synopsis covering the full story arc. Include Act I and Act II beats.",
  "characters": [
    { "name": "Character Name", "description": "Who they are (1 sentence)", "arc": "How they change (1 sentence)" }
  ],
  "emotional_arc": {
    "act_i": "The emotional journey of Act I",
    "intermission_turn": "What changes at intermission",
    "act_ii": "The emotional journey of Act II"
  },
  "themes": ["theme1", "theme2", "theme3"],
  "tone": "Overall tonal description in 1-2 sentences"
}

Create 3-5 characters. Make all 3 title options distinct in tone. The synopsis should be vivid and specific — not generic.`;
}

// ===== Song Lyrics =====

export function buildSongLyricsPrompt(
  songConfig: SongRoleConfig,
  trackNumber: number,
  concept: ShowConcept,
  musicalTypeConfig: MusicalTypeConfig
): string {
  const characterList = concept.characters
    .map(c => `- ${c.name}: ${c.description} (Arc: ${c.arc})`)
    .join('\n');

  const actContext = songConfig.act === 1
    ? concept.emotional_arc.act_i
    : concept.emotional_arc.act_ii;

  return `You are a Broadway lyricist writing Song ${trackNumber} of 6 for a ${musicalTypeConfig.label} musical.

## The Show
Title: ${concept.title_options[concept.recommended_title]?.title || 'Untitled'}
Setting: ${concept.setting}
Synopsis: ${concept.synopsis}
Tone: ${concept.tone}
Themes: ${concept.themes.join(', ')}

## Characters
${characterList}

## This Song
Role: ${songConfig.label} (${songConfig.role})
Act: ${songConfig.act}
Purpose: ${songConfig.description}
Emotional context: ${actContext}

## Lyrics Guidance
${songConfig.lyrics_guidance}

## Song Structure (MANDATORY — use these EXACT section tags with performance cues)
${songConfig.suno_structure}

The chorus appears THREE times and must be IDENTICAL every time. Copy-paste it exactly.
The performance cues after the | (like "Soft, Piano" or "Belting, Full Orchestra") are for the music engine — include them in the output exactly as shown.

## Songwriting Rules (MTBible)
1. **SINGABLE:** Sustained vowels on key words. Avoid hard consonants at the ends of important lines. If it's hard to sing on that note, it's the wrong word.
2. **HOOK:** First line of the chorus = the hook. Singable, memorable, could be the song title. One single, big idea.
3. **CHARACTER VOICE:** Write in the voice of the character(s) singing. Stay in character. A street kid doesn't use elegant vocabulary. An educated character can rhyme more densely.
4. **SPECIFICITY:** "Riding on a smile and a shoeshine" not "he was a salesman." Use concrete details from this show's world — setting, character names, sensory images.
5. **DRAMATIC PROGRESSION:** Ideas in ascending order of punch. The song must END in a different emotional place than it started. Each verse raises the stakes.
6. **TRANSFORMATION:** The character or the audience's understanding must CHANGE during this song. Surface emotion and deeper truth can differ — subtext is powerful.
7. **CORRECT SCANSION:** Stress patterns of lyrics MUST match natural speech rhythm. Never misaccent a word. Read it aloud — if it sounds awkward spoken, it will sound worse sung.
8. **GENRE:** Write in the ${musicalTypeConfig.label} tradition. ${musicalTypeConfig.style_overview}.
9. **ECONOMY:** Under 280 words total. 6-10 syllables per line for ballads, 10-14 for uptempo. Let the music breathe. Less is more.
10. **EMPHASIS:** Use ALL CAPS for words that should be belted or powerfully delivered at climactic moments. Use sparingly — only 2-3 times in the whole song.

Respond with ONLY the lyrics text (with structure tags). No explanations.`;
}

// ===== Song Style =====

/** Infer vocalist gender from the protagonist's character description */
function inferVocalistGender(concept?: ShowConcept): string | null {
  if (!concept?.characters?.length) return null;
  const protagonist = concept.characters[0];
  const text = `${protagonist.name} ${protagonist.description} ${protagonist.arc}`.toLowerCase();

  const femaleSignals = (text.match(/\bshe\b|\bher\b|\bherself\b|\bwoman\b|\bgirl\b|\bmother\b|\bdaughter\b|\bsister\b|\bqueen\b|\bprincess\b|\bheroine\b|\bwife\b|\bwidow\b|\bgrandmother\b|\baunt\b|\bniece\b|\bwaitress\b|\bactress\b|\bgoddess\b/g) || []).length;
  const maleSignals = (text.match(/\bhe\b|\bhis\b|\bhimself\b|\bman\b|\bboy\b|\bfather\b|\bson\b|\bbrother\b|\bking\b|\bprince\b|\bhero\b|\bhusband\b|\bgrandfather\b|\buncle\b|\bnephew\b|\bwaiter\b|\bactor\b|\bgod\b/g) || []).length;

  if (femaleSignals > maleSignals) return 'Female Vocalist';
  if (maleSignals > femaleSignals) return 'Male Vocalist';
  return null; // ambiguous — let Suno pick
}

export function buildSongStylePrompt(
  songConfig: SongRoleConfig,
  musicalTypeConfig: MusicalTypeConfig,
  concept?: ShowConcept
): string {
  // Use Suno-optimized style tags (ordered by weight, 4-8 tags, max 3-4 instruments)
  // Italian tempo term baked in (more reliable than BPM numbers)
  const vocalistTag = inferVocalistGender(concept);
  const parts = [songConfig.suno_style, songConfig.suno_tempo];
  if (vocalistTag) parts.push(vocalistTag);
  return parts.join(', ');
}

/** Build Suno Exclude Styles string for negative prompting */
export function buildSongExcludeStyles(
  musicalTypeConfig: MusicalTypeConfig
): string {
  return musicalTypeConfig.suno_exclude;
}

// ===== Playbill Generation =====

export function buildPlaybillPrompt(
  concept: ShowConcept,
  musicalTypeConfig: MusicalTypeConfig
): string {
  const characterList = concept.characters
    .map(c => `- ${c.name}: ${c.description}`)
    .join('\n');

  const songList = musicalTypeConfig.song_structure
    .map((s, i) => `${i + 1}. ${s.label}`)
    .join('\n');

  return `You are writing the playbill program for a Broadway musical. Create a polished, audience-facing playbill.

## Show Details
Title: ${concept.title_options[concept.recommended_title]?.title || 'Untitled'}
Type: ${musicalTypeConfig.label}
Setting: ${concept.setting}
Synopsis: ${concept.synopsis}
Characters:
${characterList}

## Song Order
${songList}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "synopsis": "A 2-3 paragraph audience-facing synopsis (no spoilers for Act II). Written in present tense, theatrical style.",
  "setting": "One sentence describing the world of the show",
  "characters": [
    { "name": "Character Name", "description": "Brief, theatrical character description (how they'd appear in a playbill)" }
  ],
  "acts": [
    {
      "name": "Act I",
      "songs": [
        { "number": 1, "title": "Song Title", "song_role": "opening-number" },
        { "number": 2, "title": "Song Title", "song_role": "i-want-song" },
        { "number": 3, "title": "Song Title", "song_role": "confrontation" }
      ]
    },
    {
      "name": "Act II",
      "songs": [
        { "number": 4, "title": "Song Title", "song_role": "act-ii-opening" },
        { "number": 5, "title": "Song Title", "song_role": "eleven-oclock" },
        { "number": 6, "title": "Song Title", "song_role": "finale" }
      ]
    }
  ]
}

Give each song a real, evocative title (not just the role name). The synopsis should read like an actual Broadway playbill — enticing without spoiling.`;
}

// ===== Show Title =====

export function buildShowTitlePrompt(concept: ShowConcept): string {
  return `Based on this show concept, generate 3 title options with taglines.

Synopsis: ${concept.synopsis}
Themes: ${concept.themes.join(', ')}
Tone: ${concept.tone}
Characters: ${concept.characters.map(c => c.name).join(', ')}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "titles": [
    { "title": "Best Title Here", "tagline": "A one-line emotional tagline" },
    { "title": "Second Option", "tagline": "Another emotional tagline" },
    { "title": "Third Option", "tagline": "Yet another tagline" }
  ],
  "recommended": 0
}

Each title should be evocative, 1-4 words. Make all 3 distinct in tone.`;
}

// ===== Title Regeneration =====

export function buildTitleRegenPrompt(
  concept: ShowConcept,
  existingTitles: string[]
): string {
  return `You are a Broadway musical dramaturg. Generate 3 NEW title options for this show. They must be completely different from the existing titles.

## Show Concept
Setting: ${concept.setting}
Synopsis: ${concept.synopsis.substring(0, 300)}
Themes: ${concept.themes.join(', ')}
Tone: ${concept.tone}

## Existing Titles (DO NOT reuse these)
${existingTitles.map(t => `- "${t}"`).join('\n')}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "title_options": [
    { "title": "New Title 1", "tagline": "One-line emotional tagline" },
    { "title": "New Title 2", "tagline": "Another tagline" },
    { "title": "New Title 3", "tagline": "Third tagline" }
  ]
}

Each title should be evocative, 1-4 words, and distinct in tone from each other and the existing titles.`;
}

// ===== Legacy V2 Prompts (kept for old album backward compat) =====

import type { Emotion, LifeMap, MusicProfile, NarrativeRole } from './types';

interface TrackCharacter {
  tempo: string;
  key: string;
  arrangement: string;
  energy: string;
}

const TRACK_CHARACTERS: Record<NarrativeRole, TrackCharacter> = {
  origin: { tempo: 'slower tempo', key: 'minor key lean', arrangement: 'stripped-back, intimate arrangement', energy: 'reflective, introspective' },
  turning_point: { tempo: 'mid-to-uptempo', key: 'major key', arrangement: 'fuller arrangement, building production', energy: 'energetic, driving' },
  resolution: { tempo: 'building, anthemic tempo', key: 'major key', arrangement: 'full arrangement, soaring production', energy: 'triumphant, cathartic, powerful' },
};

export function buildMomentLyricsPrompt(
  trackNum: number, role: NarrativeRole, story: string, emotion: Emotion, profile: MusicProfile | null, allowNames: boolean
): string {
  const roleDescriptions: Record<NarrativeRole, string> = {
    origin: 'This is the ORIGIN track — where the story begins.',
    turning_point: 'This is the TURNING POINT track — the moment of upheaval.',
    resolution: 'This is the RESOLUTION track — where they are now.',
  };
  const character = TRACK_CHARACTERS[role];
  const genres = profile?.genres?.length ? profile.genres.join(', ') : 'Pop';
  const era = profile?.era || 'Timeless';
  const artistRef = profile?.artist_reference ? `\nArtist reference: ${profile.artist_reference}` : '';

  return `You are a hit songwriter crafting Track ${trackNum} of a 3-track concept album.

## Track Role
${roleDescriptions[role]}
Tempo: ${character.tempo} | Key: ${character.key} | Arrangement: ${character.arrangement}

## Their Story
"${story}"

## Emotion: ${emotion}

## Music Profile
Genre: ${genres} | Era: ${era}${artistRef}

## Structure (MANDATORY)
[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus]

Chorus must be IDENTICAL all three times. Under 280 words.
${allowNames ? 'You may use real names.' : 'Do NOT use real names.'}

Respond with ONLY the lyrics text.`;
}

export function buildMomentStylePrompt(role: NarrativeRole, emotion: Emotion, profile: MusicProfile | null): string {
  const character = TRACK_CHARACTERS[role];
  const genres = profile?.genres?.length ? profile.genres.join(', ') : 'Pop';
  const emotionMoods: Record<Emotion, string> = {
    joy: 'uplifting, bright', grief: 'melancholic, tender', anger: 'raw, powerful',
    hope: 'soaring, warm', fear: 'haunting, atmospheric', love: 'heartfelt, soulful',
    surprise: 'dynamic, unexpected', nostalgia: 'wistful, bittersweet', pride: 'triumphant, bold', relief: 'gentle, releasing',
  };
  return [genres, character.tempo, character.energy, emotionMoods[emotion], 'catchy, melodic',
    profile?.artist_reference ? `inspired by ${profile.artist_reference}` : ''].filter(Boolean).join(', ');
}

export function buildLifeMapPrompt(m1: string, m2: string, m3: string): string {
  return `Analyze these 3 life moments and produce a JSON LifeMap.

### Moment 1: Where It All Began
${m1}
### Moment 2: The Shift
${m2}
### Moment 3: Where They Are Now
${m3}

Respond with ONLY valid JSON:
{
  "chapters": [{ "title": "", "summary": "", "emotional_state": "", "timeframe": "" }],
  "emotional_arc": { "start": "", "midpoint": "", "resolution": "" },
  "themes": [], "motifs": [], "sensory_elements": [], "lyrical_phrases": [], "tone_profile": ""
}

Create 3 chapters (one per moment).`;
}

export function buildBiographyPrompt(lifeMap: LifeMap, m1: string, m2: string, m3: string): string {
  return `Write a 600-1000 word literary biography in third person based on:

LifeMap: ${JSON.stringify(lifeMap)}
Moment 1: ${m1}
Moment 2: ${m2}
Moment 3: ${m3}

Markdown format. Intimate, cinematic style. Do NOT invent facts.`;
}

export function buildAlbumTitlePrompt(lifeMap: LifeMap): string {
  return `Generate 3 album title options based on:
Themes: ${lifeMap.themes.join(', ')}
Arc: ${lifeMap.emotional_arc.start} → ${lifeMap.emotional_arc.midpoint} → ${lifeMap.emotional_arc.resolution}

Respond with ONLY valid JSON:
{ "titles": [{ "title": "", "tagline": "" }], "recommended": 0 }`;
}
