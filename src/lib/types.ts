// ===== Database Types =====

export interface Project {
  id: string;
  session_token: string;
  status: ProjectStatus;
  version: number;
  allow_real_names: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus =
  | 'intake'
  | 'processing'
  | 'moments_in_progress'
  | 'generating_meta'
  | 'generating_music'
  | 'complete'
  | 'failed';

export interface StoryIntake {
  id: string;
  project_id: string;
  step: IntakeStep;
  content: TurningPointsContent | InnerWorldContent | ScenesContent | MomentContent;
  created_at: string;
}

export type IntakeStep = 'turning_points' | 'inner_world' | 'scenes' | 'moment_1' | 'moment_2' | 'moment_3';

export interface TurningPointsContent {
  text: string;
}

export interface InnerWorldContent {
  text: string;
}

export interface Scene {
  location: string;
  who_was_present: string;
  what_changed: string;
  dominant_emotion: Emotion;
}

export interface ScenesContent {
  scenes: Scene[];
}

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

// ===== V2: Moment Types =====

export type NarrativeRole = 'origin' | 'turning_point' | 'resolution';

export interface MomentContent {
  story: string;
  emotion: Emotion;
}

export interface MomentFormState {
  story: string;
  emotion: Emotion | null;
}

export const MOMENT_ROLES: { index: number; role: NarrativeRole; label: string; prompt: string; subtitle: string }[] = [
  { index: 1, role: 'origin', label: 'Where it all began', prompt: 'Where it all began', subtitle: 'The roots of your story — the people, places, and feelings that set everything in motion.' },
  { index: 2, role: 'turning_point', label: 'The moment everything shifted', prompt: 'The moment everything shifted', subtitle: 'The event, realization, or encounter that changed your direction forever.' },
  { index: 3, role: 'resolution', label: 'Where your story lands', prompt: 'Where your story lands', subtitle: 'Where you are now — who you\'ve become, what you carry, and what you hope for.' },
];

// ===== V1 Legacy Types =====

export interface MusicPreferences {
  id: string;
  project_id: string;
  genres: string[];
  artists: string[];
  favorite_songs: string[];
  vocal_mode: 'vocals' | 'instrumental' | 'mixed';
  energy: 'calm' | 'mid' | 'dynamic' | 'mixed';
  era: 'classic' | 'modern' | 'mixed';
  allow_real_names: boolean;
  created_at: string;
}

export interface GeneratedContent {
  id: string;
  project_id: string;
  content_type: 'lifemap' | 'biography';
  content: LifeMap | BiographyContent;
  llm_model: string | null;
  prompt_used: string | null;
  created_at: string;
}

export interface BiographyContent {
  markdown: string;
}

export interface LifeMapChapter {
  title: string;
  summary: string;
  emotional_state: string;
  timeframe: string;
}

export interface LifeMap {
  chapters: LifeMapChapter[];
  emotional_arc: {
    start: string;
    midpoint: string;
    resolution: string;
  };
  themes: string[];
  motifs: string[];
  sensory_elements: string[];
  lyrical_phrases: string[];
  tone_profile: string;
}

export type TrackStatus =
  | 'pending'
  | 'generating_lyrics'
  | 'lyrics_done'
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
}

export interface Album {
  id: string;
  project_id: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  biography_markdown: string | null;
  share_slug: string | null;
  created_at: string;
}

// ===== Form State Types =====

export interface IntakeFormState {
  turningPoints: string;
  innerWorld: string;
  scenes: Scene[];
}

export interface MusicPreferencesForm {
  genres: string[];
  artists: string[];
  favoriteSongs: string[];
  vocalMode: 'vocals' | 'instrumental' | 'mixed';
  energy: 'calm' | 'mid' | 'dynamic' | 'mixed';
  era: 'classic' | 'modern' | 'mixed';
  allowRealNames: boolean;
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
}

// ===== Generation Types =====

export const NARRATIVE_ROLES_V1: { role: NarrativeRole | 'disruption' | 'reflection'; label: string; description: string }[] = [
  { role: 'origin', label: 'Origin', description: 'Where it all began' },
  { role: 'disruption', label: 'Disruption', description: 'The conflict or challenge' },
  { role: 'reflection', label: 'Reflection', description: 'The inner world' },
  { role: 'turning_point', label: 'Turning Point', description: 'The shift' },
  { role: 'resolution', label: 'Resolution', description: 'Where you are now' },
];

export const GENRES = [
  'Pop', 'Rock', 'Indie', 'Folk', 'R&B',
  'Hip-Hop', 'Electronic', 'Country', 'Jazz', 'Classical',
] as const;

export const EMOTIONS: Emotion[] = [
  'joy', 'grief', 'anger', 'hope', 'fear',
  'love', 'surprise', 'nostalgia', 'pride', 'relief',
];
