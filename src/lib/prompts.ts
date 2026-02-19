import type { Emotion, LifeMap, MusicPreferences, MusicProfile, NarrativeRole } from './types';

// ===== Track Character System =====

interface TrackCharacter {
  tempo: string;
  key: string;
  arrangement: string;
  energy: string;
}

const TRACK_CHARACTERS: Record<NarrativeRole, TrackCharacter> = {
  origin: {
    tempo: 'slower tempo',
    key: 'minor key lean',
    arrangement: 'stripped-back, intimate arrangement',
    energy: 'reflective, introspective',
  },
  turning_point: {
    tempo: 'mid-to-uptempo',
    key: 'major key',
    arrangement: 'fuller arrangement, building production',
    energy: 'energetic, driving',
  },
  resolution: {
    tempo: 'building, anthemic tempo',
    key: 'major key',
    arrangement: 'full arrangement, soaring production',
    energy: 'triumphant, cathartic, powerful',
  },
};

// ===== V2 Prompts (3-moment flow with music profile) =====

export function buildMomentLyricsPrompt(
  trackNum: number,
  role: NarrativeRole,
  story: string,
  emotion: Emotion,
  profile: MusicProfile | null,
  allowNames: boolean
): string {
  const roleDescriptions: Record<NarrativeRole, string> = {
    origin: 'This is the ORIGIN track — where the story begins. Focus on roots, the world before change. Musically: slower, stripped-back, reflective.',
    turning_point: 'This is the TURNING POINT track — the moment of upheaval, realization, or transformation. Musically: mid-to-uptempo, energetic, driving.',
    resolution: 'This is the RESOLUTION track — where they are now, who they have become. Musically: building, anthemic, triumphant.',
  };

  const character = TRACK_CHARACTERS[role];
  const genres = profile?.genres?.length ? profile.genres.join(', ') : 'Pop';
  const era = profile?.era || 'Timeless';
  const artistRef = profile?.artist_reference
    ? `\nArtist reference: ${profile.artist_reference} — channel their songwriting sensibility, melodic style, and vocal energy.`
    : '';

  return `You are a hit songwriter crafting Track ${trackNum} of a 3-track concept album that IS someone's life story. Write a CATCHY, singable song — the kind that gets stuck in your head.

## Track Role & Character
${roleDescriptions[role]}
Tempo: ${character.tempo} | Key feel: ${character.key} | Arrangement: ${character.arrangement}

## Their Words — Read Them Carefully
"${story}"

## The Feeling They Named
${emotion}

## Music Profile
Genre: ${genres}
Era: ${era}${artistRef}

## Song Structure (MANDATORY)
[Verse 1]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Chorus]

The chorus appears THREE times and must be IDENTICAL every time. Copy-paste it exactly.

## Songwriting Rules

1. **HOOK:** The first line of the chorus = the hook. It should be singable, memorable, and could be the song title. Think "Someone Like You", "Shake It Off", "Lean On Me" — simple, rhythmic, emotional.
2. **POP CRAFT:** Use short words. Natural rhymes. Rhythmic phrasing with bounce. Lines should feel good in your mouth when you sing them.
3. **REPETITION:** The chorus is the emotional anchor — same words, same melody target, all three times.
4. **MIRROR THEIR LANGUAGE:** Find the most vivid phrase, image, or detail in their story and weave it into the song. If they mentioned "the kitchen light" or "that highway in August" — those images belong in the song.
5. **FIRST PERSON** — this is THEIR voice singing back to them.
6. **BE SPECIFIC, NOT GENERIC.** "The crack in the ceiling above my bed" beats "the weight of the world." Their details > your metaphors.
7. **GENRE CONSISTENCY:** Write in the style of ${era} ${genres}. Match the vocal energy and lyrical conventions of this genre.
8. **EMOTIONAL TRUTH of ${emotion}** — don't explain the emotion, embody it through word choice, rhythm, and imagery.
9. **Keep it concise** — under 280 words total. Let the music breathe.
10. ${allowNames ? 'You may use real names if they appear in the story.' : 'Do NOT use real names — use intimate pronouns or poetic substitutes ("you", "the one who", "that voice").'}

Respond with ONLY the lyrics text (with structure tags). No explanations, no preamble.`;
}

export function buildMomentStylePrompt(
  role: NarrativeRole,
  emotion: Emotion,
  profile: MusicProfile | null
): string {
  const character = TRACK_CHARACTERS[role];
  const genres = profile?.genres?.length ? profile.genres.join(', ') : 'Pop';
  const era = profile?.era || 'Timeless';

  const emotionMoods: Record<Emotion, string> = {
    joy: 'uplifting, bright',
    grief: 'melancholic, tender',
    anger: 'raw, powerful',
    hope: 'soaring, warm',
    fear: 'haunting, atmospheric',
    love: 'heartfelt, soulful',
    surprise: 'dynamic, unexpected',
    nostalgia: 'wistful, bittersweet',
    pride: 'triumphant, bold',
    relief: 'gentle, releasing',
  };

  const parts: string[] = [];

  // Era + genres
  if (era !== 'Timeless') parts.push(`${era} ${genres}`);
  else parts.push(genres);

  // Track character energy
  parts.push(character.tempo);
  parts.push(character.energy);
  parts.push(character.key);

  // Emotion mood
  parts.push(emotionMoods[emotion]);

  // Always catchy
  parts.push('catchy, melodic, hook-driven');

  // Artist reference as style hint
  if (profile?.artist_reference) {
    parts.push(`inspired by ${profile.artist_reference}`);
  }

  return parts.join(', ');
}

// ===== V2 Meta Prompts =====

export function buildLifeMapPrompt(
  moment1Story: string,
  moment2Story: string,
  moment3Story: string
): string {
  return `You are a narrative analyst creating a structured "LifeMap" from someone's life story told in three moments. Analyze the following and produce a JSON object.

## Three Moments

### Moment 1: Where It All Began
${moment1Story}

### Moment 2: The Moment Everything Shifted
${moment2Story}

### Moment 3: Where Their Story Lands
${moment3Story}

## Output Format

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "chapters": [
    { "title": "Chapter title", "summary": "2-3 sentence summary", "emotional_state": "primary emotion", "timeframe": "approximate period" }
  ],
  "emotional_arc": { "start": "emotional starting point", "midpoint": "emotional midpoint/crisis", "resolution": "emotional resolution" },
  "themes": ["theme1", "theme2", "theme3"],
  "motifs": ["recurring image or symbol 1", "recurring image or symbol 2"],
  "sensory_elements": ["vivid sensory detail from their story 1", "detail 2", "detail 3"],
  "lyrical_phrases": ["poetic phrase drawn from their words 1", "phrase 2", "phrase 3", "phrase 4"],
  "tone_profile": "Overall tonal description in 1-2 sentences"
}

Create 3 chapters (one per moment). Extract real sensory details and phrases from their actual words. The lyrical_phrases should be evocative fragments that could work in song lyrics.`;
}

export function buildBiographyPrompt(lifeMap: LifeMap, moment1: string, moment2: string, moment3: string): string {
  return `You are a literary biographer writing a reflective, third-person biography based on someone's life story told in three moments. Write in an intimate, cinematic style — as if narrating a documentary.

## Source Material

### LifeMap Analysis
${JSON.stringify(lifeMap, null, 2)}

### Their Words — Moment 1: Where It All Began
${moment1}

### Their Words — Moment 2: The Shift
${moment2}

### Their Words — Moment 3: Where They Are Now
${moment3}

## Instructions

- Write 600-1000 words in markdown format
- Use third person ("they/them" — do NOT use real names unless provided)
- Structure: origins → transformation → present
- Weave in sensory details and motifs from the LifeMap
- Tone should match the tone_profile
- Include section breaks (---) between major life phases
- Make it feel like album liner notes — literary but accessible
- Do NOT invent facts. Only elaborate on what was shared.

Respond with ONLY the markdown biography text.`;
}

export function buildAlbumTitlePrompt(lifeMap: LifeMap): string {
  return `Based on this life story analysis, generate 3 album title options with emotional taglines.

Themes: ${lifeMap.themes.join(', ')}
Emotional arc: ${lifeMap.emotional_arc.start} → ${lifeMap.emotional_arc.midpoint} → ${lifeMap.emotional_arc.resolution}
Tone: ${lifeMap.tone_profile}
Motifs: ${lifeMap.motifs.join(', ')}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "titles": [
    { "title": "Best Title Here", "tagline": "A one-line emotional tagline" },
    { "title": "Second Option", "tagline": "Another emotional tagline" },
    { "title": "Third Option", "tagline": "Yet another tagline" }
  ],
  "recommended": 0
}

Each title should be evocative, 1-4 words. Each tagline should be a poetic one-liner. The "recommended" field is the 0-based index of the best option. Make all 3 options distinct in tone — one poetic, one bold, one intimate.`;
}

// ===== V1 Legacy Prompts (kept for backward compat) =====

export function buildLyricsPrompt(
  trackNumber: number,
  role: NarrativeRole,
  lifeMap: LifeMap,
  prefs: MusicPreferences
): string {
  const roleDescriptions: Record<string, string> = {
    origin: 'This is the ORIGIN track — where the story begins.',
    turning_point: 'This is the TURNING POINT track — the moment of shift.',
    resolution: 'This is the RESOLUTION track — where they are now.',
  };

  const chapterIndex = Math.min(trackNumber - 1, lifeMap.chapters.length - 1);
  const chapter = lifeMap.chapters[chapterIndex];
  const genreContext = prefs.genres.join(', ');
  const artistContext = prefs.artists?.length ? `Artist references: ${prefs.artists.join(', ')}` : '';

  return `You are a songwriter writing lyrics for Track ${trackNumber} of a concept album about someone's life.

## Track Role
${roleDescriptions[role] || 'Track in the story arc.'}

## Story Context for This Track
Chapter: "${chapter.title}"
Summary: ${chapter.summary}
Emotional state: ${chapter.emotional_state}

## Music Style
Genre: ${genreContext}
Energy: ${prefs.energy}
${artistContext}

## Instructions
- Write in first person
- Use structure tags: [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
- Keep lyrics concise
- ${prefs.allow_real_names ? 'You may use real names' : 'Do NOT use real names'}

Respond with ONLY the lyrics text.`;
}

export function buildStylePrompt(
  role: NarrativeRole,
  lifeMap: LifeMap,
  prefs: MusicPreferences
): string {
  const moodMap: Record<string, string> = {
    origin: 'nostalgic, innocent, warm',
    turning_point: 'building, triumphant, emotional',
    resolution: 'peaceful, hopeful, resolved',
  };

  const parts: string[] = [];
  parts.push(prefs.genres.slice(0, 2).join(' '));
  parts.push(moodMap[role] || 'emotional');
  if (prefs.energy !== 'mixed') {
    parts.push(prefs.energy === 'calm' ? 'slow tempo' : prefs.energy === 'dynamic' ? 'energetic' : 'mid-tempo');
  }
  if (prefs.era === 'classic') parts.push('vintage');
  if (prefs.era === 'modern') parts.push('modern production');
  if (prefs.vocal_mode === 'instrumental') parts.push('instrumental');
  if (lifeMap.tone_profile) {
    const toneWords = lifeMap.tone_profile.split(/[.,]/).map(s => s.trim()).filter(Boolean)[0];
    if (toneWords && toneWords.length < 40) parts.push(toneWords);
  }

  return parts.join(', ');
}
