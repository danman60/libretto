import type { LifeMap, MusicPreferences, NarrativeRole } from './types';

export function buildLifeMapPrompt(
  turningPoints: string,
  innerWorld: string,
  scenes: { location: string; who_was_present: string; what_changed: string; dominant_emotion?: string }[]
): string {
  const scenesText = scenes
    .map(
      (s, i) =>
        `Scene ${i + 1}: Location: ${s.location}. Present: ${s.who_was_present}. What changed: ${s.what_changed}. Emotion: ${s.dominant_emotion || 'unspecified'}.`
    )
    .join('\n');

  return `You are a narrative analyst creating a structured "LifeMap" from someone's life story. Analyze the following personal narrative and produce a JSON object.

## Input

### Life Turning Points
${turningPoints}

### Inner World
${innerWorld}

### Key Scenes
${scenesText}

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

Create 3-5 chapters that cover the full arc. Extract real sensory details and phrases from their actual words. The lyrical_phrases should be evocative fragments that could work in song lyrics.`;
}

export function buildBiographyPrompt(lifeMap: LifeMap, turningPoints: string, innerWorld: string): string {
  return `You are a literary biographer writing a reflective, third-person biography based on someone's life story. Write in an intimate, cinematic style — as if narrating a documentary.

## Source Material

### LifeMap Analysis
${JSON.stringify(lifeMap, null, 2)}

### Their Words — Turning Points
${turningPoints}

### Their Words — Inner World
${innerWorld}

## Instructions

- Write 900-1500 words in markdown format
- Use third person ("they/them" — do NOT use real names unless provided)
- Structure: childhood/origin → challenges → transformation → present
- Weave in sensory details and motifs from the LifeMap
- Tone should match the tone_profile
- Include section breaks (---) between major life phases
- Make it feel like a album liner note biography — literary but accessible
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

export function buildLyricsPrompt(
  trackNumber: number,
  role: NarrativeRole,
  lifeMap: LifeMap,
  prefs: MusicPreferences
): string {
  const roleDescriptions: Record<NarrativeRole, string> = {
    origin: 'This is the ORIGIN track — where the story begins. Focus on childhood, roots, the world before everything changed.',
    disruption: 'This is the DISRUPTION track — the conflict, challenge, or loss that shattered the status quo.',
    reflection: 'This is the REFLECTION track — the inner world, introspection, questioning, and emotional processing.',
    turning_point: 'This is the TURNING POINT track — the moment of shift, realization, or breakthrough.',
    resolution: 'This is the RESOLUTION track — where they are now, what they have become, looking forward.',
  };

  // Map track to most relevant chapter
  const chapterIndex = Math.min(trackNumber - 1, lifeMap.chapters.length - 1);
  const chapter = lifeMap.chapters[chapterIndex];

  const genreContext = prefs.genres.join(', ');
  const artistContext = prefs.artists?.length ? `Artist references: ${prefs.artists.join(', ')}` : '';
  const vocalNote = prefs.vocal_mode === 'instrumental'
    ? 'This track will be INSTRUMENTAL — write evocative scene-setting text instead of lyrics, to guide the mood.'
    : '';

  return `You are a songwriter writing lyrics for Track ${trackNumber} of a 5-track concept album about someone's life.

## Track Role
${roleDescriptions[role]}

## Story Context for This Track
Chapter: "${chapter.title}"
Summary: ${chapter.summary}
Emotional state: ${chapter.emotional_state}
Timeframe: ${chapter.timeframe}

## Overall Story
Themes: ${lifeMap.themes.join(', ')}
Emotional arc: ${lifeMap.emotional_arc.start} → ${lifeMap.emotional_arc.midpoint} → ${lifeMap.emotional_arc.resolution}
Sensory elements: ${lifeMap.sensory_elements.join(', ')}
Lyrical phrases to weave in: ${lifeMap.lyrical_phrases.join(', ')}

## Music Style
Genre: ${genreContext}
Energy: ${prefs.energy}
Era: ${prefs.era}
${artistContext}
${vocalNote}

## Instructions
- Write in first person
- Use the structure tags: [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
- Draw from the sensory_elements and lyrical_phrases — transform them, don't copy verbatim
- Match the emotional state of this chapter
- Keep lyrics concise — Suno works best with shorter, punchy lyrics
- ${prefs.allow_real_names ? 'You may use real names if they appear in the story' : 'Do NOT use real names — use metaphors or pronouns instead'}

Respond with ONLY the lyrics text (with structure tags). No explanations.`;
}

export function buildStylePrompt(
  role: NarrativeRole,
  lifeMap: LifeMap,
  prefs: MusicPreferences
): string {
  const moodMap: Record<NarrativeRole, string> = {
    origin: 'nostalgic, innocent, warm',
    disruption: 'intense, raw, urgent',
    reflection: 'introspective, atmospheric, haunting',
    turning_point: 'building, triumphant, emotional',
    resolution: 'peaceful, hopeful, resolved',
  };

  const parts: string[] = [];

  // Genres
  parts.push(prefs.genres.slice(0, 2).join(' '));

  // Mood from narrative role
  parts.push(moodMap[role]);

  // Energy
  if (prefs.energy !== 'mixed') {
    parts.push(prefs.energy === 'calm' ? 'slow tempo' : prefs.energy === 'dynamic' ? 'energetic' : 'mid-tempo');
  }

  // Era
  if (prefs.era === 'classic') parts.push('vintage');
  if (prefs.era === 'modern') parts.push('modern production');

  // Vocal mode
  if (prefs.vocal_mode === 'instrumental') parts.push('instrumental');

  // Tone color from LifeMap
  if (lifeMap.tone_profile) {
    // Take first few descriptive words
    const toneWords = lifeMap.tone_profile.split(/[.,]/).map(s => s.trim()).filter(Boolean)[0];
    if (toneWords && toneWords.length < 40) parts.push(toneWords);
  }

  return parts.join(', ');
}
