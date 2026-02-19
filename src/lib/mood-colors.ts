import type { Emotion } from './types';

interface MoodPalette {
  accent: string;
  bgTint: string;
  glowColor: string;
}

export const EMOTION_PALETTES: Record<Emotion, MoodPalette> = {
  joy: { accent: '#F5C542', bgTint: 'rgba(245, 197, 66, 0.06)', glowColor: 'rgba(245, 197, 66, 0.25)' },
  grief: { accent: '#7B8FA1', bgTint: 'rgba(123, 143, 161, 0.06)', glowColor: 'rgba(123, 143, 161, 0.25)' },
  anger: { accent: '#E05A47', bgTint: 'rgba(224, 90, 71, 0.06)', glowColor: 'rgba(224, 90, 71, 0.25)' },
  hope: { accent: '#8DC891', bgTint: 'rgba(141, 200, 145, 0.06)', glowColor: 'rgba(141, 200, 145, 0.25)' },
  fear: { accent: '#9B7FBD', bgTint: 'rgba(155, 127, 189, 0.06)', glowColor: 'rgba(155, 127, 189, 0.25)' },
  love: { accent: '#E88DA0', bgTint: 'rgba(232, 141, 160, 0.06)', glowColor: 'rgba(232, 141, 160, 0.25)' },
  surprise: { accent: '#F0A860', bgTint: 'rgba(240, 168, 96, 0.06)', glowColor: 'rgba(240, 168, 96, 0.25)' },
  nostalgia: { accent: '#C4A882', bgTint: 'rgba(196, 168, 130, 0.06)', glowColor: 'rgba(196, 168, 130, 0.25)' },
  pride: { accent: '#D4A843', bgTint: 'rgba(212, 168, 67, 0.06)', glowColor: 'rgba(212, 168, 67, 0.25)' },
  relief: { accent: '#7EC8C8', bgTint: 'rgba(126, 200, 200, 0.06)', glowColor: 'rgba(126, 200, 200, 0.25)' },
};
