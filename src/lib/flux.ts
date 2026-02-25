/**
 * FLUX 1.1 Pro poster generation via fal.ai SDK.
 * Server-side only — requires FAL_KEY env var.
 */

import { fal } from '@fal-ai/client';
import type { ShowConcept, PosterOption } from './types';
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

/**
 * Build 3 compositionally distinct poster prompts.
 */
function buildVariantPrompts(
  concept: ShowConcept,
  config: MusicalTypeConfig
): { prompt: string; label: string }[] {
  const setting = concept.setting || '';
  const tone = concept.tone || '';
  const themes = concept.themes?.join(', ') || '';
  const protagonist = concept.characters?.[0];

  const genreArt: Record<string, string> = {
    'classic-broadway': 'golden age Broadway elegance, warm spotlight, velvet curtains, art deco',
    'rock-musical': 'electric energy, neon lights, gritty urban, concert poster style',
    'pop-musical': 'vibrant colors, modern pop art, dynamic, bright stage lights',
    'hip-hop-musical': 'bold street art style, graffiti elements, urban, high contrast',
    'jukebox-musical': 'retro vintage poster, nostalgic, vinyl record aesthetic, warm tones',
    'romantic-musical': 'soft romantic lighting, moonlit, dreamy watercolor feel, elegant',
  };
  const artStyle = genreArt[config.id] || 'dramatic theatrical poster art';

  const base = `${artStyle}. Mood: ${tone}. Themes: ${themes}. Style: cinematic, rich saturated colors, portrait orientation, painterly, no text, no words, no letters, no typography.`;

  return [
    {
      label: 'Wide Establishing',
      prompt: `Panoramic theatrical poster artwork. Wide establishing shot of: ${setting}. Deep perspective, environmental storytelling, sweeping vista. ${base}`,
    },
    {
      label: 'Character Portrait',
      prompt: `Dramatic close-up theatrical poster artwork. Portrait of ${protagonist ? `${protagonist.name}, ${protagonist.description}` : 'the protagonist'} in ${setting}. Dramatic lighting, intense expression, emotional depth. ${base}`,
    },
    {
      label: 'Dramatic Scene',
      prompt: `Pivotal dramatic scene theatrical poster artwork. Multiple figures on stage in ${setting}. Theatrical staging, spotlight, action and tension. ${base}`,
    },
  ];
}

/**
 * Generate 3 poster variants in parallel via FLUX 1.1 Pro.
 * Uses Promise.allSettled so partial results are OK.
 */
export async function generatePosterVariants(
  concept: ShowConcept,
  config: MusicalTypeConfig
): Promise<PosterOption[]> {
  ensureFalConfig();

  const variants = buildVariantPrompts(concept, config);
  console.log('[flux] Generating 3 poster variants...');

  const results = await Promise.allSettled(
    variants.map(async (v) => {
      const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
        input: {
          prompt: v.prompt,
          image_size: { width: 832, height: 1248 },
          num_images: 1,
          output_format: 'jpeg',
          enable_safety_checker: true,
        },
      }) as FluxResult;

      const url = result.data.images[0]?.url;
      if (!url) throw new Error('FLUX returned no image');
      return { url, label: v.label };
    })
  );

  const options: PosterOption[] = results
    .filter((r): r is PromiseFulfilledResult<PosterOption> => r.status === 'fulfilled')
    .map(r => r.value);

  console.log(`[flux] ${options.length}/3 poster variants generated`);
  return options;
}
