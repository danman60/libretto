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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — audience enters a new world. This song teaches them how to watch the show and sets the contract about what kind of show this is. Ensemble voice — "we" perspective. Paint the world with SPECIFIC sensory details, not generic descriptions. Must be understandable on first listen — audience is orienting.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The protagonist reveals their deepest desire',
        style_hints: 'solo ballad, building, hopeful, soaring melody, strings, piano',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — protagonist discovers and articulates their deepest desire. This is the show\'s engine. First person, deeply personal. Start intimate, build to a powerful declaration. The hook IS the want. Use SPECIFIC imagery from the character\'s world — not abstract yearning. The audience must fall in love with this character and root for them.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'Conflict erupts — duet or ensemble clash',
        style_hints: 'dramatic, duet, tension building, minor key, percussive, intense',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — forces collide, point of no return. Two opposing voices or a solo against the world. Sharp, clipped phrasing. Build to a breaking point. Each verse must ESCALATE — specific grievances, not vague anger. Hit emotional peaks immediately, no slow setup.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Reset and reframe after intermission',
        style_hints: 'mid-tempo, reflective, then building, ensemble, new energy',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — aftermath, the world has changed. This is a Charm Song — moment of relief. Melody is more important than lyric density. Steady beat, optimistic tone. Give the audience a breather with fresh images. Then rebuild momentum.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The emotional climax — the showstopper',
        style_hints: 'powerful ballad, emotionally devastating, building to crescendo, full orchestra',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — protagonist sees the truth. Maximum emotional intensity. Can use subtext: the character may express one thing on the surface while the audience understands something deeper (complaint that is really a prayer, denial that reveals acceptance). Raw, vulnerable, then triumphant. This is THE song. Use ALL CAPS for the climactic belt moment.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Resolution and curtain call',
        style_hints: 'anthemic, uplifting, reprise elements, full ensemble, major key, cathartic',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — earned resolution, the character has been transformed. REPRISE earlier themes — callback key phrases or hooks from the Opening Number and I Want Song, but with TRANSFORMED meaning. Same words should feel completely different because the character has changed. This is a warm landing, not another peak.',
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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — blast into the world. Manifesto energy. Short, punchy lines. Establish the rebellion or world. "We" or defiant "I". The audience must immediately understand the stakes and tone.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The protagonist\'s raw, unfiltered desire',
        style_hints: 'acoustic to electric build, alt-rock ballad, emotional, building intensity',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — raw desire articulated. Start stripped-back (acoustic). Build to electric explosion. The want is urgent, not polite. SPECIFIC — name what you want, not vague rebellion.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'The clash — screaming guitars and dueling voices',
        style_hints: 'heavy rock, aggressive, dueling guitars, intense drums, minor key, powerful',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — point of no return. Rapid-fire exchanges. Angry, raw. Each verse ESCALATES — specific grievances that build to a scream. Use ALL CAPS for the breaking point.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The morning after — quieter, damaged',
        style_hints: 'acoustic, stripped-back, melancholy, building slowly, indie rock',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — aftermath. Vulnerability. The armor is off. Acoustic guitar and voice. Let the pain breathe. Fresh images — not generic sadness.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The anthem that brings the house down',
        style_hints: 'power ballad, epic build, arena rock, soaring vocals, full band, anthem',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — everything becomes clear. Start quiet, end HUGE. Subtext: this can be a song of defiance that is really about fear, or rage that is really grief. Use ALL CAPS for the climactic anthem moment. Singable chorus.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Resolution through noise and silence',
        style_hints: 'epic rock, building to climax then quiet resolve, cathartic, bittersweet',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — earned resolution. REPRISE the opening riff or I Want melody with TRANSFORMED meaning. Callback key phrases from earlier songs. Resolve through acceptance. The same words now carry different weight. End with power or silence.',
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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — set the vibe. Pure pop energy. Instant hook. Establish the world through rhythm and joy. Danceable. Must be understandable first listen.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'A pop ballad that defines the dream',
        style_hints: 'pop ballad, emotional, piano-driven, building, heartfelt, radio-ready',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the dream crystallized. Think pop power ballad. Simple, universal lyrics but SPECIFIC to this character. The chorus IS the dream. Build from intimate to soaring.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'An uptempo clash with attitude',
        style_hints: 'uptempo pop-rock, sass, attitude, rhythmic, synth accents, driving beat',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — point of no return. Sassy, sharp. Each verse ESCALATES the conflict. Rhythmic verses, explosive chorus. Use ALL CAPS for the breaking point.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The party after the storm',
        style_hints: 'dance pop, groove, feel-good, funky bass, handclaps, celebration',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — defiant joy after the storm. Group energy. "We\'re still here." Melody-first, singable. Fresh images, not cliches.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The emotional gut-punch disguised as a pop song',
        style_hints: 'emotional pop, building, intimate to epic, strings over pop production, powerful',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — truth hits. The ballad that makes everyone cry. Simple words, devastating delivery. Subtext: what sounds like acceptance may really be letting go. Use ALL CAPS for the climactic moment.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'The megamix — all themes collide in joy',
        style_hints: 'uptempo pop, celebration, anthemic, full production, joyful, singalong',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — earned celebration. REPRISE hooks and phrases from the Opening and I Want Song with TRANSFORMED meaning. Everyone sings. Callback to earlier moments. The audience should want to dance.',
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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — storybook opening. Narrator or ensemble introduces the world. "Once upon a time" energy. Vivid, SPECIFIC world-painting with magical sensory details. Teaches audience the rules of this world.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The hero dreams of something more',
        style_hints: 'soaring ballad, hopeful, building, orchestral pop, disney princess energy, magical',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the hero discovers their desire. THE defining Disney moment. "Part of Your World", "Let It Go". Use SPECIFIC objects and details from the character\'s world to express yearning (Ariel\'s "gadgets and gizmos" = mundane items expressing extraordinary longing). Build to soaring chorus.',
      },
      {
        role: 'confrontation',
        label: 'The Villain Song',
        act: 1,
        description: 'The antagonist\'s delicious, scene-stealing number',
        style_hints: 'theatrical, dark, jazzy undertones, dramatic, villain energy, minor key, show-stopping',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — villain commits to their plan. Charismatic evil. Comedy Song rules apply: save the best joke/threat for last. Gets more menacing as it goes. Witty, seductive, dangerous. The audience should enjoy the villain.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'The hero finds unexpected allies or strength',
        style_hints: 'warm, ensemble, mid-tempo, heartfelt, friendship theme, acoustic warmth',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — aftermath, finding strength. Found family. Charm Song rules: melody-first, optimistic, audience breathes. Warm and genuine. Fresh images, not generic friendship cliches.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The hero discovers their true power',
        style_hints: 'epic, transformative, building from quiet to massive, full orchestra, triumphant, magical',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the hero sees who they truly are. The transformation moment. From doubt to certainty. REPRISE the I Want melody but now the meaning has transformed — they HAVE the thing, or they\'ve become it. Use ALL CAPS for the triumphant climax.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Happily ever after — with depth',
        style_hints: 'warm, uplifting, reprise, full ensemble, major key, bittersweet joy, magical resolution',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — earned resolution. REPRISE key phrases from the Opening and I Want Song with TRANSFORMED meaning. The same words in a new context show how far the character has come. Earned happiness, not cheap.',
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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — drop into the world. Dense storytelling. Fast flow establishing who, what, where. Internal rhymes. World-building through bars. SPECIFIC places, names, cultural details. 10-14 syllables per line.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The dream, spoken in rhythm',
        style_hints: 'hip-hop ballad, R&B hook, emotional rap verses, melodic, piano and 808s',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the dream articulated in bars. Rap verses (personal, SPECIFIC) with sung R&B chorus (universal want). Vulnerability in the bars. Must transform from setup to declaration.',
      },
      {
        role: 'confrontation',
        label: 'The Confrontation',
        act: 1,
        description: 'A rap battle or lyrical showdown',
        style_hints: 'aggressive rap, battle rap energy, hard-hitting beat, intense, competitive',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — lyrical showdown, point of no return. Call and response. Each verse ESCALATES with sharper wordplay and higher stakes. End with a devastating bar in ALL CAPS.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Reflection and reinvention',
        style_hints: 'lo-fi hip-hop, introspective, jazz samples, mellow, thoughtful, spoken word elements',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — aftermath, reflection. Slower, looking back. Jazz-influenced. Fresh images for processing change. Spoken word moments between verses.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The most powerful verse they\'ll ever spit',
        style_hints: 'epic hip-hop, building, orchestra meets 808s, powerful, emotional, anthem rap',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — everything crystallizes. Everything on the line. Most technically impressive AND emotionally devastating verse. Subtext: defiance masking grief, or rage becoming acceptance. Sung hook = catharsis. ALL CAPS for the peak.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'Legacy — what you leave behind',
        style_hints: 'triumphant hip-hop, full production, ensemble rap, uplifting, legacy anthem',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — what you leave behind. REPRISE bars and hooks from the Opening and I Want Song with TRANSFORMED meaning. Ensemble voices. Callback to opening. Same phrases, different weight. Powerful, earned ending.',
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
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — teach the audience this intimate world before love disrupts it. Paint the ordinary with specific, sensory details: the coffee cup, the rain on the window, the walk home alone. Gentle observation that ESTABLISHES the emotional baseline everything will be measured against.',
      },
      {
        role: 'i-want-song',
        label: 'I Want Song',
        act: 1,
        description: 'The ache of wanting to be known',
        style_hints: 'intimate piano ballad, vulnerable, building gently, strings enter, aching beauty',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the character discovers what they truly ache for. Not just wanting love — wanting to be SEEN. Specificity doctrine: "the way you fold the corners of your book" not "I want someone special." Quiet devastation, building vulnerability. Within 15 minutes the audience must understand the longing.',
      },
      {
        role: 'confrontation',
        label: 'The Fight',
        act: 1,
        description: 'When love gets complicated',
        style_hints: 'building tension, minor key, duet energy, strings and piano, emotional crescendo',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — the moment love is tested. ESCALATION: misunderstanding → betrayal → the thing they can\'t unsay. Two perspectives pulling apart. Subtext: what they\'re really fighting about is never the surface argument. Specific details from THEIR relationship, not generic conflict. ALL CAPS for the line that breaks everything.',
      },
      {
        role: 'act-ii-opening',
        label: 'Act II Opening',
        act: 2,
        description: 'Alone with the absence',
        style_hints: 'sparse, solo piano, melancholy, beautiful, lonely, rainy-day feeling',
        lyrics_guidance: 'DRAMATIC FUNCTION: Transition — new reality after the break. The empty apartment. The cold side of the bed. Sensory details of absence: the silence where their laugh was, the untouched mug. Musicalize the mundane — ordinary objects become devastating. Subtext: pretending to be fine while falling apart.',
      },
      {
        role: 'eleven-oclock',
        label: 'Eleven O\'Clock Number',
        act: 2,
        description: 'The grand gesture — or the letting go',
        style_hints: 'emotional climax, building from whisper to full orchestra, heartbreaking beauty, cathartic',
        lyrics_guidance: 'DRAMATIC FUNCTION: Realization — the moment of absolute clarity. Either "I choose you" or "I release you" — devastating either way. Subtext: complaint becoming prayer (wanting them back → accepting what love taught you). Raw honesty. Build from whisper to the one ALL CAPS line that shatters everything. Peak emotional climax of the show.',
      },
      {
        role: 'finale',
        label: 'Finale',
        act: 2,
        description: 'What love leaves behind',
        style_hints: 'gentle, warm, acoustic with subtle strings, bittersweet, hopeful, intimate',
        lyrics_guidance: 'DRAMATIC FUNCTION: Decision — earned resolution, love has transformed them. REPRISE key phrases from the Opening Number and I Want Song with TRANSFORMED meaning — same words, completely different weight because the character has changed. Whether together or apart, quiet earned peace. Warm landing, not another peak.',
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
