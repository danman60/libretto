import type { Emotion, LifeMap, MusicPreferences, NarrativeRole } from './types';

// ===== V2 Prompts (3-moment flow) =====

export function buildMomentLyricsPrompt(
  trackNum: number,
  role: NarrativeRole,
  story: string,
  emotion: Emotion,
  genres: string[],
  energy: 'calm' | 'mid' | 'dynamic',
  vocal: 'vocals' | 'instrumental' | 'mixed',
  allowNames: boolean
): string {
  const roleDescriptions: Record<NarrativeRole, string> = {
    origin: 'This is the ORIGIN track — where the story begins. Focus on roots, innocence, the world before change.',
    turning_point: 'This is the TURNING POINT track — the moment of upheaval, realization, or transformation.',
    resolution: 'This is the RESOLUTION track — where they are now, who they have become, what they carry forward.',
  };

  const vocalNote = vocal === 'instrumental'
    ? 'This track will be INSTRUMENTAL — write evocative scene-setting text instead of sung lyrics, to guide the mood.'
    : '';

  return `You are a songwriter writing lyrics for Track ${trackNum} of a 3-track concept album about someone's life.

## Track Role
${roleDescriptions[role]}

## The Person's Story for This Moment
"${story}"

## Emotional Tone
Primary emotion: ${emotion}

## Music Style
Genre: ${genres.join(', ') || 'Pop'}
Energy: ${energy}
${vocalNote}

## Instructions
- Write in first person
- Use the structure tags: [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
- Draw vivid imagery from their actual words — transform them poetically, don't copy verbatim
- Match the emotional tone of ${emotion}
- Keep lyrics concise — Suno works best with shorter, punchy lyrics (under 300 words)
- ${allowNames ? 'You may use real names if they appear in the story' : 'Do NOT use real names — use metaphors or pronouns instead'}

Respond with ONLY the lyrics text (with structure tags). No explanations.`;
}

export function buildMomentStylePrompt(
  role: NarrativeRole,
  emotion: Emotion,
  genres: string[],
  energy: 'calm' | 'mid' | 'dynamic',
  vocal: 'vocals' | 'instrumental' | 'mixed'
): string {
  const moodMap: Record<NarrativeRole, string> = {
    origin: 'nostalgic, warm, intimate',
    turning_point: 'intense, building, emotional',
    resolution: 'hopeful, peaceful, triumphant',
  };

  const emotionMoods: Record<Emotion, string> = {
    joy: 'uplifting, bright',
    grief: 'melancholic, tender',
    anger: 'raw, powerful',
    hope: 'soaring, warm',
    fear: 'haunting, atmospheric',
    love: 'intimate, heartfelt',
    surprise: 'dynamic, unexpected',
    nostalgia: 'wistful, bittersweet',
    pride: 'triumphant, bold',
    relief: 'gentle, releasing',
  };

  const parts: string[] = [];

  parts.push(genres.slice(0, 2).join(' ') || 'Pop');
  parts.push(moodMap[role]);
  parts.push(emotionMoods[emotion]);

  if (energy === 'calm') parts.push('slow tempo');
  else if (energy === 'dynamic') parts.push('energetic');
  else parts.push('mid-tempo');

  if (vocal === 'instrumental') parts.push('instrumental');

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
  return `Based on this life story analysis, generate an album title and emotional tagline.

Themes: ${lifeMap.themes.join(', ')}
Emotional arc: ${lifeMap.emotional_arc.start} → ${lifeMap.emotional_arc.midpoint} → ${lifeMap.emotional_arc.resolution}
Tone: ${lifeMap.tone_profile}
Motifs: ${lifeMap.motifs.join(', ')}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "title": "Album Title Here",
  "tagline": "A one-line emotional tagline"
}

The title should be evocative, 1-4 words. The tagline should be a poetic one-liner that captures the emotional journey.`;
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
