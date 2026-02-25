// ===== Musical Types =====

export type MusicalType =
  | 'classic-broadway'
  | 'rock-opera'
  | 'jukebox'
  | 'disney-style'
  | 'hip-hop-musical'
  | 'romantic-musical';

export type SongRole =
  | 'opening-number'
  | 'i-want-song'
  | 'confrontation'
  | 'act-ii-opening'
  | 'eleven-oclock'
  | 'finale';

// ===== Database Types =====

export type ProjectStatus =
  | 'intake'
  | 'enriching'
  | 'choosing'
  | 'generating_music'
  | 'complete'
  | 'failed';

export interface PosterOption {
  url: string;
  label: string;
}

export interface Project {
  id: string;
  session_token: string;
  status: ProjectStatus;
  version: number;
  musical_type: MusicalType | null;
  idea: string | null;
  backstory: string | null;
  poster_options: PosterOption[] | null;
  // Legacy fields (kept for backward compat)
  allow_real_names: boolean;
  music_profile: MusicProfile | null;
  recipient_name: string | null;
  gift_message: string | null;
  is_gift: boolean;
  created_at: string;
  updated_at: string;
}

export interface MusicProfile {
  genres: string[];
  era: string;
  artist_reference?: string;
}

export type TrackStatus =
  | 'pending'
  | 'generating_lyrics'
  | 'lyrics_done'
  | 'lyrics_complete'
  | 'generating_audio'
  | 'complete'
  | 'failed';

export interface Track {
  id: string;
  project_id: string;
  track_number: number;
  moment_index: number | null;
  title: string;
  narrative_role: NarrativeRole;
  song_role: SongRole | null;
  lyrics: string | null;
  style_prompt: string | null;
  suno_task_id: string | null;
  audio_url: string | null;
  audio_storage_path: string | null;
  cover_image_url: string | null;
  duration: number | null;
  status: TrackStatus;
  retry_count: number;
  created_at: string;
  updated_at: string;
  // Generation stats
  suno_id: string | null;
  suno_model: string | null;
  suno_tags: string | null;
  suno_created_at: string | null;
  // Alternate variant ("the cut song")
  alt_audio_url: string | null;
  alt_cover_image_url: string | null;
  alt_duration: number | null;
  alt_suno_id: string | null;
}

export interface Album {
  id: string;
  project_id: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  biography_markdown: string | null;
  playbill_content: PlaybillContent | null;
  share_slug: string | null;
  title_alternatives: { title: string; tagline: string }[] | null;
  created_at: string;
}

// ===== Playbill Content =====

export interface PlaybillContent {
  synopsis: string;
  setting: string;
  characters: PlaybillCharacter[];
  acts: PlaybillAct[];
}

export interface PlaybillCharacter {
  name: string;
  description: string;
}

export interface PlaybillAct {
  name: string; // "Act I" or "Act II"
  songs: PlaybillSong[];
}

export interface PlaybillSong {
  number: number;
  title: string;
  song_role: SongRole;
}

// ===== Enrichment (DeepSeek output) =====

export interface ShowConcept {
  title_options: { title: string; tagline: string }[];
  recommended_title: number;
  setting: string;
  synopsis: string;
  characters: { name: string; description: string; arc: string }[];
  emotional_arc: {
    act_i: string;
    intermission_turn: string;
    act_ii: string;
  };
  themes: string[];
  tone: string;
}

// ===== API Response Types =====

export interface StatusResponse {
  project: Project;
  tracks: Track[];
  album: Album | null;
}

export interface AlbumPageData {
  album: Album;
  tracks: Track[];
  musicalType: MusicalType | null;
  // Legacy compat
  isGift: boolean;
  recipientName: string | null;
  giftMessage: string | null;
  dominantEmotion: Emotion | null;
}

// ===== Legacy Types (kept for old album rendering) =====

export type Emotion =
  | 'joy'
  | 'grief'
  | 'anger'
  | 'hope'
  | 'fear'
  | 'love'
  | 'surprise'
  | 'nostalgia'
  | 'pride'
  | 'relief';

export type NarrativeRole = 'origin' | 'turning_point' | 'resolution';

export interface MomentContent {
  story: string;
  emotion: Emotion;
}

export interface LifeMap {
  chapters: { title: string; summary: string; emotional_state: string; timeframe: string }[];
  emotional_arc: { start: string; midpoint: string; resolution: string };
  themes: string[];
  motifs: string[];
  sensory_elements: string[];
  lyrical_phrases: string[];
  tone_profile: string;
}

export interface GeneratedContent {
  id: string;
  project_id: string;
  content_type: 'lifemap' | 'biography';
  content: LifeMap | { markdown: string };
  llm_model: string | null;
  prompt_used: string | null;
  created_at: string;
}

// Legacy form types
export type IntakeStep = 'turning_points' | 'inner_world' | 'scenes' | 'moment_1' | 'moment_2' | 'moment_3';

export const MOMENT_ROLES: { index: number; role: NarrativeRole; label: string; prompt: string; subtitle: string }[] = [
  { index: 1, role: 'origin', label: 'Where it all began', prompt: 'Where it all began', subtitle: 'The roots of your story.' },
  { index: 2, role: 'turning_point', label: 'The moment everything shifted', prompt: 'The moment everything shifted', subtitle: 'The event that changed your direction.' },
  { index: 3, role: 'resolution', label: 'Where your story lands', prompt: 'Where your story lands', subtitle: 'Where you are now.' },
];

export const EMOTIONS: Emotion[] = [
  'joy', 'grief', 'anger', 'hope', 'fear',
  'love', 'surprise', 'nostalgia', 'pride', 'relief',
];
