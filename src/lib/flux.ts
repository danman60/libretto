/**
 * FLUX 1.1 Pro poster generation via fal.ai SDK.
 * Server-side only — requires FAL_KEY env var.
 */

import { fal } from '@fal-ai/client';
import type { ShowConcept } from './types';
import type { MusicalTypeConfig } from './musical-types';

let falConfigured = false;
function ensureFalConfig() {
  if (!falConfigured) {
    fal.config({ credentials: process.env.FAL_KEY });
    falConfigured = true;
  }
}

interface FluxImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FluxResult {
  data: {
    images: FluxImage[];
  };
}

/**
 * Build a FLUX prompt from the show concept.
 * Strategy: dramatic theatrical poster art, no text (we overlay title with CSS).
 */
export function buildPosterPrompt(
  concept: ShowConcept,
  config: MusicalTypeConfig
): string {
  const title = concept.title_options[concept.recommended_title ?? 0]?.title || 'Untitled';
  const setting = concept.setting || '';
  const tone = concept.tone || '';
  const themes = concept.themes?.join(', ') || '';

  // Genre-specific art direction
  const genreArt: Record<string, string> = {
    'classic-broadway': 'golden age Broadway elegance, warm spotlight, velvet curtains, art deco',
    'rock-musical': 'electric energy, neon lights, gritty urban, concert poster style',
    'pop-musical': 'vibrant colors, modern pop art, dynamic, bright stage lights',
    'hip-hop-musical': 'bold street art style, graffiti elements, urban, high contrast',
    'jukebox-musical': 'retro vintage poster, nostalgic, vinyl record aesthetic, warm tones',
    'romantic-musical': 'soft romantic lighting, moonlit, dreamy watercolor feel, elegant',
  };

  const artStyle = genreArt[config.id] || 'dramatic theatrical poster art';

  return `Dramatic Broadway theatrical poster artwork. ${artStyle}. Setting: ${setting}. Mood: ${tone}. Themes: ${themes}. Style: cinematic composition, spotlight lighting, rich saturated colors, portrait orientation, painterly, evocative, no text, no words, no letters, no typography. Inspired by classic Broadway show posters.`;
}

/**
 * Generate a show poster via FLUX 1.1 Pro.
 * Returns the image URL (persistent, no expiry on fal.ai).
 */
export async function generatePoster(
  concept: ShowConcept,
  config: MusicalTypeConfig
): Promise<string> {
  const prompt = buildPosterPrompt(concept, config);

  ensureFalConfig();

  console.log('[flux] Generating poster...');
  console.log('[flux] Prompt:', prompt.substring(0, 120) + '...');

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      image_size: { width: 832, height: 1248 }, // 2:3 portrait
      num_images: 1,
      output_format: 'jpeg',
      enable_safety_checker: true,
    },
  }) as FluxResult;

  const imageUrl = result.data.images[0]?.url;
  if (!imageUrl) {
    throw new Error('FLUX returned no image');
  }

  console.log('[flux] Poster generated:', imageUrl.substring(0, 80) + '...');
  return imageUrl;
}
