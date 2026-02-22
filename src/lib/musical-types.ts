import type { MusicalType, SongRole } from './types';

export interface SongRoleConfig {
  role: SongRole;
  label: string;
  act: 1 | 2;
  description: string;
  style_hints: string;
  lyrics_guidance: string;
}

export interface MusicalTypeConfig {
  id: MusicalType;
  label: string;
  tagline: string;
  icon: string; // emoji for the card
  description: string;
  style_overview: string;
  song_structure: SongRoleConfig[];
  enrichment_hints: string;
}

export const MUSICAL_TYPES: MusicalTypeConfig[] = [
  {
    id: 'classic-broadway',
    label: 'Classic Broadway',
    tagline: 'The golden age, reimagined',
    icon: '🎭',
    description: 'Lush orchestrations, soaring ballads, and show-stopping ensemble numbers in the tradition of Rodgers & Hammerstein.',
    style_overview: 'orchestral, broadway, theatrical, lush strings, big band, show tune',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'Establishes the world, introduces the ensemble, sets the tone',
        style_hints: 'upbeat, orchestral, ensemble, broadway overture feel, theatrical, bright',
        lyrics_guidance: 'Introduce the setting and main characters. Ensemble voice — "we" perspective. Paint the world vividly.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The protagonist reveals their deepest desire',
        style_hints: 'solo ballad, building, hopeful, soaring melody, strings, piano',
        lyrics_guidance: 'First person, deeply personal. Start intimate, build to a powerful declaration. The hook IS the want.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'Conflict erupts — duet or ensemble clash',
        style_hints: 'dramatic, duet, tension building, minor key, percussive, intense',
        lyrics_guidance: 'Two opposing voices or a solo against the world. Sharp, clipped phrasing. Build to a breaking point.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Reset and reframe after intermission',
        style_hints: 'mid-tempo, reflective, then building, ensemble, new energy',
        lyrics_guidance: 'Show the aftermath. Something has changed. Quieter start, then momentum builds toward resolution.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The emotional climax — the showstopper',
        style_hints: 'powerful ballad, emotionally devastating, building to crescendo, full orchestra',
        lyrics_guidance: 'The protagonist\'s darkest or most transformative moment. Raw, vulnerable, then triumphant. This is THE song.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Resolution and curtain call',
        style_hints: 'anthemic, uplifting, reprise elements, full ensemble, major key, cathartic',
        lyrics_guidance: 'Reprise the most powerful themes. Resolution of the main conflict. Leave the audience breathless.',
      },
    ],
    enrichment_hints: 'Think Wicked, Les Mis, Dear Evan Hansen. Grand emotional arcs, clear protagonist journey.',
  },
  {
    id: 'rock-opera',
    label: 'Rock Opera',
    tagline: 'Turn it up to eleven',
    icon: '🎸',
    description: 'Electric guitars, raw power, and anthemic rebellion in the spirit of Rent, Spring Awakening, and American Idiot.',
    style_overview: 'rock, electric guitar, drums, raw, powerful, alternative rock, grunge-tinged',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'A blast of energy that grabs you by the collar',
        style_hints: 'punk rock, fast tempo, electric guitar, drums, raw energy, garage rock',
        lyrics_guidance: 'Manifesto energy. Short, punchy lines. Establish the rebellion or world. "We" or defiant "I".',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The protagonist\'s raw, unfiltered desire',
        style_hints: 'acoustic to electric build, alt-rock ballad, emotional, building intensity',
        lyrics_guidance: 'Start stripped-back (acoustic). Build to electric explosion. The want is urgent, not polite.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'The clash — screaming guitars and dueling voices',
        style_hints: 'heavy rock, aggressive, dueling guitars, intense drums, minor key, powerful',
        lyrics_guidance: 'Rapid-fire exchanges. Angry, raw. Short lines that hit like punches. Build to a scream.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The morning after — quieter, damaged',
        style_hints: 'acoustic, stripped-back, melancholy, building slowly, indie rock',
        lyrics_guidance: 'Vulnerability. The armor is off. Acoustic guitar and voice. Let the pain breathe.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The anthem that brings the house down',
        style_hints: 'power ballad, epic build, arena rock, soaring vocals, full band, anthem',
        lyrics_guidance: 'Start quiet, end HUGE. This is the anthem. Singable chorus. "We will not be forgotten."',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Resolution through noise and silence',
        style_hints: 'epic rock, building to climax then quiet resolve, cathartic, bittersweet',
        lyrics_guidance: 'Reprise the opening riff or I Want melody. Resolve through acceptance. End with power or silence.',
      },
    ],
    enrichment_hints: 'Think Rent, Spring Awakening, Hedwig. Counter-culture, raw emotion, fighting the system.',
  },
  {
    id: 'jukebox',
    label: 'Jukebox Musical',
    tagline: 'Hits you already love, story you don\'t expect',
    icon: '🎵',
    description: 'Catchy, genre-spanning pop hits woven into a narrative — like Mamma Mia meets your imagination.',
    style_overview: 'pop, catchy, hook-driven, radio-friendly, danceable, upbeat',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'An instant earworm that sets the vibe',
        style_hints: 'upbeat pop, catchy hook, danceable, fun, bright production, 80s/90s pop feel',
        lyrics_guidance: 'Pure pop energy. Instant hook. Establish the world through rhythm and joy. Danceable.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'A pop ballad that defines the dream',
        style_hints: 'pop ballad, emotional, piano-driven, building, heartfelt, radio-ready',
        lyrics_guidance: 'Think pop power ballad. Simple, universal lyrics. The chorus IS the dream.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'An uptempo clash with attitude',
        style_hints: 'uptempo pop-rock, sass, attitude, rhythmic, synth accents, driving beat',
        lyrics_guidance: 'Sassy, sharp. Think "You Oughta Know" energy. Rhythmic verses, explosive chorus.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The party after the storm',
        style_hints: 'dance pop, groove, feel-good, funky bass, handclaps, celebration',
        lyrics_guidance: 'Defiant joy. Dancing through the pain. Group energy. "We\'re still here."',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The emotional gut-punch disguised as a pop song',
        style_hints: 'emotional pop, building, intimate to epic, strings over pop production, powerful',
        lyrics_guidance: 'The ballad that makes everyone cry. Simple words, devastating delivery. Universal heartbreak/hope.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'The megamix — all themes collide in joy',
        style_hints: 'uptempo pop, celebration, anthemic, full production, joyful, singalong',
        lyrics_guidance: 'Callback to earlier songs. Pure celebration. Everyone sings. The audience should want to dance.',
      },
    ],
    enrichment_hints: 'Think Mamma Mia, Moulin Rouge, & Juliet. Fun first, feelings second. Earworms everywhere.',
  },
  {
    id: 'disney-style',
    label: 'Disney-Style',
    tagline: 'Magic, wonder, and a villain song',
    icon: '✨',
    description: 'Sweeping melodies, magical worlds, and the timeless journey from innocence to courage.',
    style_overview: 'disney, orchestral pop, magical, whimsical, sweeping melody, animated musical feel',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'A storybook opening that paints the world',
        style_hints: 'whimsical, orchestral, storytelling, magical, warm, narrator voice, fairy tale',
        lyrics_guidance: 'Narrator or ensemble introduces the world. "Once upon a time" energy. Vivid world-painting.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The hero dreams of something more',
        style_hints: 'soaring ballad, hopeful, building, orchestral pop, disney princess energy, magical',
        lyrics_guidance: 'THE defining Disney moment. "Part of Your World", "Let It Go". Pure yearning. Build to soaring chorus.',
      },
      {
        role: 'confrontation',
        label: 'The Villain Song',
        act: 1,
        description: 'The antagonist\'s delicious, scene-stealing number',
        style_hints: 'theatrical, dark, jazzy undertones, dramatic, villain energy, minor key, show-stopping',
        lyrics_guidance: 'Charismatic evil. Witty, menacing, fun. The villain explains their plan with flair. Seductive and dangerous.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The hero finds unexpected allies or strength',
        style_hints: 'warm, ensemble, mid-tempo, heartfelt, friendship theme, acoustic warmth',
        lyrics_guidance: 'Found family. Teamwork. "You\'ve Got a Friend in Me" energy. Warm and genuine.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The hero discovers their true power',
        style_hints: 'epic, transformative, building from quiet to massive, full orchestra, triumphant, magical',
        lyrics_guidance: 'The transformation moment. From doubt to certainty. Reprise the I Want melody but now they HAVE it.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Happily ever after — with depth',
        style_hints: 'warm, uplifting, reprise, full ensemble, major key, bittersweet joy, magical resolution',
        lyrics_guidance: 'Resolution of all threads. Reprise key melodies. Earned happiness. "The end" energy.',
      },
    ],
    enrichment_hints: 'Think Frozen, Moana, Encanto. Clear hero journey, magical elements, memorable villain.',
  },
  {
    id: 'hip-hop-musical',
    label: 'Hip-Hop Musical',
    tagline: 'Bars, beats, and breaking barriers',
    icon: '🎤',
    description: 'Sharp lyrics, inventive wordplay, and the rhythm of revolution — in the spirit of Hamilton and In The Heights.',
    style_overview: 'hip-hop, rap, rhythmic, trap beats, 808s, spoken word, R&B hooks',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'A rapid-fire introduction that drops you into the world',
        style_hints: 'fast rap, rhythmic, energetic, trap beat, 808s, storytelling flow',
        lyrics_guidance: 'Dense storytelling. Fast flow establishing who, what, where. Internal rhymes. World-building through bars.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The dream, spoken in rhythm',
        style_hints: 'hip-hop ballad, R&B hook, emotional rap verses, melodic, piano and 808s',
        lyrics_guidance: 'Rap verses (personal, specific) with sung R&B chorus (universal want). Vulnerability in the bars.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'A rap battle or lyrical showdown',
        style_hints: 'aggressive rap, battle rap energy, hard-hitting beat, intense, competitive',
        lyrics_guidance: 'Call and response. Sharp wordplay. Each verse raises the stakes. End with a devastating bar.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Reflection and reinvention',
        style_hints: 'lo-fi hip-hop, introspective, jazz samples, mellow, thoughtful, spoken word elements',
        lyrics_guidance: 'Slower, reflective. Looking back. Jazz-influenced. Spoken word moments between verses.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The most powerful verse they\'ll ever spit',
        style_hints: 'epic hip-hop, building, orchestra meets 808s, powerful, emotional, anthem rap',
        lyrics_guidance: 'Everything on the line. Most technically impressive AND emotionally devastating verse. Sung hook = catharsis.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Legacy — what you leave behind',
        style_hints: 'triumphant hip-hop, full production, ensemble rap, uplifting, legacy anthem',
        lyrics_guidance: 'Legacy theme. Ensemble voices. Callback to opening. "Who tells your story." Powerful, earned ending.',
      },
    ],
    enrichment_hints: 'Think Hamilton, In The Heights. Wordplay matters. Cultural specificity. Every bar counts.',
  },
  {
    id: 'romantic-musical',
    label: 'Romantic Musical',
    tagline: 'A love story in six songs',
    icon: '💫',
    description: 'Intimate, achingly beautiful — the joy and heartbreak of love, from first spark to lasting flame.',
    style_overview: 'romantic, intimate, acoustic, piano, gentle strings, indie folk, warm',
    song_structure: [
      {
        role: 'opening-number',
        label: 'Opening Number',
        act: 1,
        description: 'The world before love — ordinary life',
        style_hints: 'indie folk, acoustic guitar, gentle, slice-of-life, warm, storytelling',
        lyrics_guidance: 'Paint the ordinary world before everything changes. Gentle observation. "This is my life" energy.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The ache of wanting to be known',
        style_hints: 'intimate piano ballad, vulnerable, building gently, strings enter, aching beauty',
        lyrics_guidance: 'Not just wanting love — wanting to be truly seen. Intimate, specific details. Quiet devastation.',
      },
      {
        role: 'confrontation',
        label: 'The Fight',
        act: 1,
        description: 'When love gets complicated',
        style_hints: 'building tension, minor key, duet energy, strings and piano, emotional crescendo',
        lyrics_guidance: 'The misunderstanding or betrayal. Two perspectives. Overlapping voices. "I thought you understood."',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Alone with the absence',
        style_hints: 'sparse, solo piano, melancholy, beautiful, lonely, rainy-day feeling',
        lyrics_guidance: 'The empty apartment. The cold side of the bed. Specific sensory details of missing someone.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The grand gesture — or the letting go',
        style_hints: 'emotional climax, building from whisper to full orchestra, heartbreaking beauty, cathartic',
        lyrics_guidance: 'Either the reunion or the acceptance. Raw, honest. "I choose you" or "I release you." Devastating either way.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'What love leaves behind',
        style_hints: 'gentle, warm, acoustic with subtle strings, bittersweet, hopeful, intimate',
        lyrics_guidance: 'Resolution. Whether together or apart, love changed them. Quiet, earned peace. Reprise the I Want melody.',
      },
    ],
    enrichment_hints: 'Think The Last Five Years, Once, La La Land. Specificity over spectacle. Every lyric is a love letter.',
  },
];

/** Get config for a musical type by ID */
export function getMusicalTypeConfig(id: MusicalType): MusicalTypeConfig {
  const config = MUSICAL_TYPES.find(t => t.id === id);
  if (!config) throw new Error(`Unknown musical type: ${id}`);
  return config;
}

/** Get song roles for a musical type, ordered by act and position */
export function getSongRoles(id: MusicalType): SongRoleConfig[] {
  return getMusicalTypeConfig(id).song_structure;
}
